// @ts-nocheck
const themeToggle = document.querySelector("#themeToggle");

function updateThemeButton() {
  const isDark = document.documentElement.dataset.theme === "dark";
  const actionLabel = `Switch to ${isDark ? "light" : "dark"} mode`;
  themeToggle.setAttribute("aria-label", actionLabel);
  themeToggle.setAttribute("title", actionLabel);
  themeToggle.setAttribute("aria-pressed", String(isDark));
  document.querySelector('meta[name="theme-color"]').setAttribute("content", isDark ? "#19151f" : "#6750a4");
}

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

updateThemeButton();
