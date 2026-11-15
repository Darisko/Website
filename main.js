// @ts-nocheck
const emptyCard = document.querySelector(".empty-card");
const projectList = document.querySelector("#projectList");
const projectItems = document.querySelector("#projectItems");
const modalScrim = document.querySelector("#modalScrim");
const projectName = document.querySelector("#projectName");
const projectForm = document.querySelector("#projectForm");
const toast = document.querySelector("#toast");
let toastTimer;

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

renderProjects();
