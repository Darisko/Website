// Typing `movie` in the homepage console opens a one-time, tab-scoped page.
const MOVIE_PASS_KEY = "darisko.movie-screening-pass";
const isMoviePage = document.body.dataset.secretPage === "movie";

if (isMoviePage) {
  let hasPass = false;
  try {
    hasPass = sessionStorage.getItem(MOVIE_PASS_KEY) === "granted";
    sessionStorage.removeItem(MOVIE_PASS_KEY);
  } catch {
    hasPass = false;
  }

  if (!hasPass) {
    window.location.replace(new URL("index.html", window.location.href));
  }
} else {
  Object.defineProperty(window, "movie", {
    configurable: false,
    enumerable: false,
    get() {
      try {
        sessionStorage.setItem(MOVIE_PASS_KEY, "granted");
        window.location.assign(new URL("movie.html", window.location.href));
        return "Opening the secret screening…";
      } catch {
        return "The secret screening needs session storage enabled.";
      }
    },
  });

  console.info(
    "%cDARISKO%c Type movie and press Enter to open the secret screening.",
    "color:#c8afff;font-weight:800;letter-spacing:2px",
    "color:#aaa3b4;font-weight:400;letter-spacing:normal",
  );
}
