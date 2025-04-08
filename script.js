/**
 * Updates HTML with incoming metadata.
 *
 * @param {string} track - Track name
 * @param {string} game - Game name
 * @param {string} cover - URL to game image
 */
const displayMetadata = ({ track, game, cover }) => {
  document.getElementById("pagetitle").innerHTML = `♫ ${game}`;
  document.getElementById("gameInfo").innerHTML = game;
  document.getElementById("trackInfo").innerHTML = track;
  document.getElementById("cover").src = cover;
  document.getElementById("background").src = cover;
};

/**
 * Updates MediaSession with incoming metadata.
 *
 * @param {string} track - Track name
 * @param {string} game - Game name
 * @param {string} cover - URL to game image
 */
const updateMediaSession = ({ track, game, cover }) => {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track,
      artist: game,
      artwork: [
        {
          src: cover,
        },
      ],
    });
  }
};

/**
 * Determines current delay of audio stream in seconds by subtracting the
 * currentTime from the duration, defaulting to 4. isFinite is used to protect
 * against either of the numbers being infinite.
 *
 * @returns {number} Current delay amount in seconds
 */
const getDelay = () => {
  const { currentTime, duration } = document.getElementById("audio");
  const delay = isFinite(duration) ? duration - currentTime : 4;

  return delay;
};

/**
 * Sets a timeout for the next metadata fetch.
 *
 * @param {number} remaining - Time left in current track in seconds
 */
const updateTimer = ({ remaining }) => {
  setTimeout(getMetadata, (remaining + getDelay()) * 1000);
};

/**
 * Updates the page to explain the server is down.
 */
const setServerDown = () => {
  document.getElementById("gameInfo").innerHTML = "Music server is down";
  document.getElementById("trackInfo").innerHTML =
    "I'm probably doing maintenance";
  document.getElementById("cover").innerHTML = null;
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
 * Handles toggling playback when play/pause button is clicked.
 *
 * Important note:
 * "Paused" state here is actually closer to "stopped". Setting the audio.src
 * to "" ensures that when audio is resumed it gets set to the "live" stream
 * rather than the time it was paused at. This helps prevent any unusual
 * stuttering or glitchiness after unpausing.
 */
const handleTogglePlayback = () => {
  const audio = document.getElementById("audio");
  const playPause = document.getElementById("playPause");

  if (audio.paused) {
    audio.src = `https://leheny.ddns.net/vgmradio?t=${new Date().getTime()}`;
    audio.load();
    audio.play();
    playPause.src = "assets/stop.png";
  } else {
    audio.pause();
    audio.src = "";
    playPause.src = "assets/play.png";
  }
};

/**
 * Handles toggling mute when mute button is clicked.
 */
const handleToggleMute = () => {
  const audio = document.getElementById("audio");
  const muted = document.getElementById("muted");

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
 * Note: Volume is on a logarithmic scale to feel more natural.
 */
const handleChangeVolumeSlider = (e) => {
  const audio = document.getElementById("audio");

  audio.volume = e.target.value ** 2;
};

/**
 * Handles updating the volume via the number keys.
 * Note: Volume is on a logarithmic scale to feel more natural.
 *
 * @param {string} key - Key pressed from event
 */
const handleChangeVolumeKey = (key) => {
  const audio = document.getElementById("audio");
  const volume = document.getElementById("volume");
  const value = key / 10 || 1;

  audio.volume = value ** 2;
  volume.value = value;
};

/**
 * Sets handlers for everything interactable on the page. Adds event listeners
 * for keyboard events. Spacebar toggles playback, F toggles fullscreen,
 * number keys set volume.
 */
const setupControls = () => {
  const audio = document.getElementById("audio");
  const playPause = document.getElementById("playPause");
  const muted = document.getElementById("muted");
  const volume = document.getElementById("volume");

  playPause.onclick = handleTogglePlayback;
  muted.onclick = handleToggleMute;
  volume.oninput = handleChangeVolumeSlider;

  /**
   * This fixes an iOS Safari bug where the MediaSession info doesn't show up
   * correctly on the lock screen on first play.
   *
   * TODO: delve deeper and discover where the actual race condition exists.
   */
  audio.onplaying = () => {
    audio.muted = true;
    setTimeout(() => {
      audio.muted = false;
    }, 1000);
  };

  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", handleTogglePlayback);
    navigator.mediaSession.setActionHandler("pause", handleTogglePlayback);
  }

  window.addEventListener("keydown", (e) => {
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
};

/**
 * Runs init functions after window loads.
 */
window.onload = () => {
  getMetadata();
  setupControls();
};
