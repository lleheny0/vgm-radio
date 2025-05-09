/**
 * Defines selector variables.
 */
let audio,
  background,
  cover,
  debug,
  gameInfo,
  muted,
  pageTitle,
  playStop,
  trackInfo,
  volume;

/**
 * Assigns elements to selector variables.
 */
const loadElements = () => {
  audio = document.getElementById("audio");
  background = document.getElementById("background");
  coverArt = document.getElementById("coverArt");
  debug = document.getElementById("debug");
  gameInfo = document.getElementById("gameInfo");
  muted = document.getElementById("muted");
  pageTitle = document.getElementById("pageTitle");
  playStop = document.getElementById("playStop");
  trackInfo = document.getElementById("trackInfo");
  volume = document.getElementById("volume");
};

/**
 * Updates HTML with incoming metadata.
 *
 * @param {String} track - Track name
 * @param {String} game - Game name
 * @param {String} cover - URL to game image
 */
const displayMetadata = ({ track, game, cover }) => {
  pageTitle.innerText = `♫ ${game}`;
  gameInfo.innerText = game;
  trackInfo.innerText = track;
  coverArt.innerHTML = `<img src="${cover}" />`;
  background.src = cover;
};

/**
 * Updates MediaSession with incoming metadata.
 *
 * @param {String} track - Track name
 * @param {String} game - Game name
 * @param {String} cover - URL to game image
 */
const updateMediaSession = ({ track, game, cover }) => {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track,
      artist: game,
      artwork: [{ src: cover }],
    });
  }
};

/**
 * Determines current delay of audio stream in seconds by subtracting the
 * currentTime from the duration, defaulting to 8.5 on Chrome and 4 elsewhere.
 *
 * Note:
 * On Chrome, audio buffers for a longer time before playing than on Firefox,
 * so it has a hard-coded 8.5 second delay until a better solution presents
 * itself.
 *
 * @returns {Number} Current delay amount in seconds
 */
const getDelay = () => {
  const { currentTime, buffered } = audio;
  const delay = navigator.userAgent.includes("Chrome")
    ? 8.5
    : (buffered.length && buffered.end(0) - currentTime) || 4;

  return delay;
};

/**
 * Sets a timeout for the next metadata fetch.
 *
 * @param {Number} remaining - Time left in current track in seconds
 */
const updateTimer = ({ remaining }) => {
  setTimeout(getMetadata, (remaining + getDelay()) * 1000);
};

/**
 * Updates the page to explain the server is down.
 */
const setServerDown = () => {
  gameInfo.innerText = "Music server is down";
  trackInfo.innerText = "I'm probably doing maintenance";
  coverArt.innerHTML = `<img src="./assets/fallback.png" />`;
  background.src = "./assets/fallback.png";

  handleStop();
  setTimeout(() => {
    getMetadata();
  }, 60000);
};

/**
 * Fetches metadata via Liquidsoap's harbor and sends it to the functions
 * expecting it. Updates the page with a message for the user if the request
 * returns an error.
 */
const getMetadata = () => {
  fetch("https://leheny.ddns.net/metadata")
    .then((resp) => resp.json())
    .then((data) => {
      displayMetadata(data);
      updateMediaSession(data);
      updateTimer(data);
    })
    .catch((err) => setServerDown());
};

/**
 * Handles playing the audio.
 *
 * Note:
 * Adding ?t=[current time] to the URL ensures that the stream will not load
 * a leftover cache from a previous stream.
 */
const handlePlay = () => {
  audio.src = `https://leheny.ddns.net/vgmradio?t=${new Date().getTime()}`;
  audio.load();
  audio.play();
  playStop.src = "assets/stop.png";
};

/**
 * Handles stopping the audio.
 *
 * Note:
 * Setting the audio.src to null stops the stream from continuing to buffer.
 * This prevents any glitchiness when playing again.
 */
const handleStop = () => {
  audio.pause();
  audio.src = null;
  playStop.src = "assets/play.png";
};

/**
 * Handles toggling playback when play/stop button is clicked.
 */
const handleTogglePlayback = () => {
  audio.paused ? handlePlay() : handleStop();
};

/**
 * Handles toggling mute when mute button is clicked.
 */
const handleToggleMute = () => {
  if (audio.muted) {
    audio.muted = false;
    muted.src = "assets/unmuted.png";
  } else {
    audio.muted = true;
    muted.src = "assets/muted.png";
  }
};

/**
 * Handles updating the volume via the slider.
 *
 * Note:
 * Volume is on a logarithmic scale to feel more natural.
 *
 * @param {Event} e - Event from slider value change.
 */
const handleChangeVolumeSlider = (e) => {
  audio.volume = e.target.value ** 2;
};

/**
 * Handles updating the volume via the number keys.
 *
 * Note:
 * Volume is on a logarithmic scale to feel more natural.
 *
 * @param {String} key - Key pressed from event
 */
const handleChangeVolumeKey = (key) => {
  const value = key / 10 || 1;

  audio.volume = value ** 2;
  volume.value = value;
};

/**
 * Sets handlers for user interactable controls on the page.
 */
const setupControls = () => {
  playStop.onclick = handleTogglePlayback;
  muted.onclick = handleToggleMute;
  volume.oninput = handleChangeVolumeSlider;
};

/**
 * Adds event listeners.
 */
const setupEventListeners = () => {
  window.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) return;

    switch (e.key) {
      case " ":
        handleTogglePlayback();
        break;
      case "f":
        document.fullscreenElement === null
          ? document.documentElement.requestFullscreen()
          : document.exitFullscreen();
        break;
      case "m":
        handleToggleMute();
        break;
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
      case "0":
        handleChangeVolumeKey(e.key);
        break;
    }
  });

  audio.addEventListener("pause", handleStop);
  audio.addEventListener("ended", setServerDown);

  navigator.mediaSession?.setActionHandler("play", handlePlay);
  navigator.mediaSession?.setActionHandler("pause", handleStop);
};

const debugApp = () => {
  if (new URLSearchParams(window.location.search).has("debug")) {
  }
};

/**
 * Runs init functions after window loads.
 */
window.onload = () => {
  loadElements();
  getMetadata();
  setupControls();
  setupEventListeners();
  debugApp();
};
