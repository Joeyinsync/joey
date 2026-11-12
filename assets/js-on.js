/* Marks the page as scripted before first paint, so reveal-on-scroll styles
   only hide content when the script that reveals it will actually run. */
document.documentElement.classList.add("js");
