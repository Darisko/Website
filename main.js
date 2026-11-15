// @ts-nocheck
const emptyCard = document.querySelector(".empty-card");
const projectList = document.querySelector("#projectList");
const projectItems = document.querySelector("#projectItems");
const modalScrim = document.querySelector("#modalScrim");
const projectName = document.querySelector("#projectName");
const projectForm = document.querySelector("#projectForm");
const toast = document.querySelector("#toast");
const themeToggle = document.querySelector("#themeToggle");
let toastTimer;

function updateThemeButton() {
  const isDark = document.documentElement.dataset.theme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const actionLabel = `Switch to ${nextTheme} mode`;
  themeToggle.setAttribute("aria-label", actionLabel);
  themeToggle.setAttribute("title", actionLabel);
  themeToggle.setAttribute("aria-pressed", String(isDark));
  document.querySelector('meta[name="theme-color"]').setAttribute("content", isDark ? "#19151f" : "#6750a4");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2400);
}

function readProjects() {
  try {
    const saved = JSON.parse(localStorage.getItem("daylight-projects") || "[]");
    return Array.isArray(saved) ? saved.filter((name) => typeof name === "string") : [];
  } catch {
    return [];
  }
}

function renderProjects() {
  const projects = readProjects();
  projectItems.replaceChildren();
  projects.forEach((name) => {
    const item = document.createElement("article");
    item.className = "project-item";
    const icon = document.createElement("span");
    icon.className = "project-item-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "✦";
    const title = document.createElement("strong");
    title.className = "project-item-name";
    title.textContent = name;
    item.append(icon, title);
    projectItems.append(item);
  });
  const hasProjects = projects.length > 0;
  emptyCard.hidden = hasProjects;
  projectList.hidden = !hasProjects;
}

function openDialog() {
  modalScrim.hidden = false;
  projectName.value = "";
  window.setTimeout(() => projectName.focus(), 0);
}

function closeDialog() {
  modalScrim.hidden = true;
}

document.querySelector("#createProject").addEventListener("click", openDialog);
document.querySelector("#addAnother").addEventListener("click", openDialog);
document.querySelector("#closeDialog").addEventListener("click", closeDialog);
document.querySelector("#cancelDialog").addEventListener("click", closeDialog);
themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.dataset.theme !== "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  try {
    localStorage.setItem("daylight-theme", isDark ? "dark" : "light");
  } catch {
    // Keep the selected theme for this page even if storage is unavailable.
  }
  updateThemeButton();
});
modalScrim.addEventListener("click", (event) => {
  if (event.target === modalScrim) closeDialog();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalScrim.hidden) closeDialog();
});
projectForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = projectName.value.trim();
  if (!name) {
    projectName.focus();
    return;
  }
  const projects = readProjects();
  projects.push(name);
  localStorage.setItem("daylight-projects", JSON.stringify(projects));
  renderProjects();
  closeDialog();
  showToast("Your project is ready.");
});

updateThemeButton();
renderProjects();
