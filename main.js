// @ts-nocheck
const todayLabel = document.querySelector("#todayLabel");
const footerDate = document.querySelector("#footerDate");
const greeting = document.querySelector("#greeting");
const taskList = document.querySelector("#taskList");
const completedCount = document.querySelector("#completedCount");
const toast = document.querySelector("#toast");
const modalBackdrop = document.querySelector("#modalBackdrop");
const taskInput = document.querySelector("#taskInput");
const sidebar = document.querySelector("#sidebar");
let toastTimer;

function updateCalendarLabels() {
  const now = new Date();
  const dateOptions = { weekday: "long", month: "long", day: "numeric" };
  todayLabel.textContent = now.toLocaleDateString("en-US", dateOptions);
  footerDate.textContent = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const hour = now.getHours();
  greeting.textContent = hour < 12 ? "A FRESH START, AT YOUR PACE" : hour < 17 ? "YOUR SPACE, AT YOUR PACE" : "A MOMENT TO WIND DOWN";
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function updateTaskProgress() {
  const tasks = [...taskList.querySelectorAll(".task-row")];
  const checked = tasks.filter((task) => task.querySelector("input").checked).length;
  completedCount.textContent = String(checked);
  const ring = document.querySelector(".focus-ring");
  const percentage = tasks.length ? (checked / tasks.length) * 100 : 0;
  ring.style.background = `conic-gradient(#866bb1 0 ${percentage}%, #e6e0ef ${percentage}% 100%)`;
  ring.setAttribute("aria-label", `${checked} of ${tasks.length} tasks completed`);
  tasks.forEach((task) => task.classList.toggle("completed", task.querySelector("input").checked));
}

function openTaskModal() {
  modalBackdrop.hidden = false;
  taskInput.value = "";
  window.setTimeout(() => taskInput.focus(), 0);
}

function closeTaskModal() {
  modalBackdrop.hidden = true;
}

function addTask() {
  const title = taskInput.value.trim();
  if (!title) {
    taskInput.focus();
    taskInput.setAttribute("aria-invalid", "true");
    return;
  }
  taskInput.removeAttribute("aria-invalid");
  const row = document.createElement("label");
  row.className = "task-row";
  row.innerHTML = `<input type="checkbox" /><span class="task-check"></span><span class="task-copy"><strong></strong><small><span class="task-dot dot-lilac"></span>Personal</small></span><span class="task-time">Anytime</span>`;
  row.querySelector(".task-copy strong").textContent = title;
  taskList.append(row);
  closeTaskModal();
  updateTaskProgress();
  row.scrollIntoView({ behavior: "smooth", block: "nearest" });
  showToast("Task added to your day");
}

function renderWeekChart(weekOffset = 0) {
  const chart = document.querySelector("#weekChart");
  const base = new Date();
  const mondayOffset = (base.getDay() + 6) % 7;
  base.setDate(base.getDate() - mondayOffset + weekOffset * 7);
  const minutes = [52, 98, 72, 132, 82, 36, 18];
  const shortDays = ["M", "T", "W", "T", "F", "S", "S"];
  chart.replaceChildren();
  for (let index = 0; index < 7; index += 1) {
    const dayDate = new Date(base);
    dayDate.setDate(base.getDate() + index);
    const column = document.createElement("div");
    const isToday = weekOffset === 0 && dayDate.toDateString() === new Date().toDateString();
    column.className = `chart-day${isToday ? " today-label" : ""}`;
    const bar = document.createElement("i");
    bar.className = `chart-column${isToday ? " today" : ""}`;
    bar.style.setProperty("--height", `${Math.max(9, (minutes[index] / 150) * 79)}px`);
    bar.setAttribute("title", `${Math.round(minutes[index] / 60 * 10) / 10} focused hours`);
    const label = document.createElement("span");
    label.textContent = shortDays[index];
    column.append(bar, label);
    chart.append(column);
  }
}

taskList.addEventListener("change", (event) => {
  if (event.target instanceof HTMLInputElement) updateTaskProgress();
});
document.querySelector("#newTask").addEventListener("click", openTaskModal);
document.querySelector("#addTaskInline").addEventListener("click", openTaskModal);
document.querySelector("#modalSave").addEventListener("click", addTask);
document.querySelector("#modalCancel").addEventListener("click", closeTaskModal);
document.querySelector("#modalClose").addEventListener("click", closeTaskModal);
taskInput.addEventListener("input", () => taskInput.removeAttribute("aria-invalid"));
taskInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") addTask();
});
modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) closeTaskModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeTaskModal();
    sidebar.classList.remove("open");
    document.querySelector("#menuToggle").setAttribute("aria-expanded", "false");
  }
});
document.querySelector("#menuToggle").addEventListener("click", (event) => {
  const opened = sidebar.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(opened));
  event.currentTarget.setAttribute("aria-label", opened ? "Close navigation" : "Open navigation");
});
document.querySelectorAll(".sidebar .nav-item").forEach((link) => link.addEventListener("click", () => {
  sidebar.classList.remove("open");
  document.querySelector("#menuToggle").setAttribute("aria-expanded", "false");
}));
document.querySelector("#notifications").addEventListener("click", () => showToast("You're all caught up âœ¦"));
document.querySelector("#profileButton").addEventListener("click", () => showToast("You're using the free plan"));
document.querySelector("#viewTasks").addEventListener("click", () => document.querySelector("#tasks").scrollIntoView({ behavior: "smooth" }));
document.querySelector("#allProjects").addEventListener("click", () => showToast("You're viewing all 4 projects"));
document.querySelector("#weekBack").addEventListener("click", () => {
  const offset = Number(document.querySelector("#weekChart").dataset.offset || 0) - 1;
  document.querySelector("#weekChart").dataset.offset = String(offset);
  renderWeekChart(offset);
});
document.querySelector("#weekForward").addEventListener("click", () => {
  const offset = Math.min(4, Number(document.querySelector("#weekChart").dataset.offset || 0) + 1);
  document.querySelector("#weekChart").dataset.offset = String(offset);
  renderWeekChart(offset);
});
document.querySelector("#addProject").addEventListener("click", () => showToast("Your next idea is just around the corner"));
document.querySelector("#newProject").addEventListener("click", () => showToast("A new project is ready when you are"));
document.querySelectorAll(".more-button").forEach((button) => button.addEventListener("click", () => showToast("Project options are coming soon")));

updateCalendarLabels();
renderWeekChart();
updateTaskProgress();
