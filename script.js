/**
 * Updates HTML with incoming metadata
 *
 * @param {Object} metadata - Updated metadata
 * @param {string} metadata.track - Track name
 * @param {string} metadata.game - Game name
 * @param {string} metadata.cover - URL to game image
 */
const displayMetadata = ({ track, game, cover }) => {
  document.getElementById("pagetitle").innerHTML = `♫ ${game}`;
  document.getElementById("gameInfo").innerHTML = game;
  document.getElementById("trackInfo").innerHTML = track;
  document.getElementById("cover").innerHTML = cover
    ? `<img src="${cover}" />`
    : null;
  document.getElementById("background").innerHTML = cover
    ? `<img src="${cover}" />`
    : null;
};

/**
 * Updates MediaSession with incoming metadata
 *
 * @param {Object} metadata - Updated metadata
 * @param {string} metadata.track - Track name
 * @param {string} metadata.game - Game name
 * @param {string} metadata.cover - URL to game image
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
  const delay = Math.ceil(duration - currentTime);

  return isFinite(delay) ? delay : 4;
};

/**
 * Sets a timeout for the next metadata fetch
 *
 * @param {Object} metadata - Updated metadata
 * @param {number} metadata.remainingTime - Time left in current track in
 * seconds
 */
const updateTimer = ({ remainingTime }) => {
  setTimeout(getMetadata, (remainingTime + getDelay()) * 1000);
};

const updateProgressBar = ({ remainingTime, trackLength }) => {
  if (remainingTime + getDelay() - 1 > 0) {
    document.getElementById("progressBar").style.width = `${Math.min(
      ((trackLength - remainingTime - getDelay()) / trackLength) * 100,
      100
    )}vw`;
    setTimeout(() => {
      updateProgressBar({ remainingTime: remainingTime - 1, trackLength });
    }, 1000);
  }
};

/**
 * Updates the page to explain the server is down.
 */
const setServerDown = () => {
  document.getElementById("gameInfo").innerHTML = "Music server is down";
  document.getElementById("trackInfo").innerHTML =
    "I'm probably updating the library";
};

/**
 * Fetches metadata via PHP script and sends it to the functions expecting it.
 * Updates the page with a message for the user if the request returns an
 * error.
 */
const getMetadata = () => {
  const xmlhttp = new XMLHttpRequest();

  xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      try {
        const data = JSON.parse(this.responseText);
        if (!data.error) {
          displayMetadata(data);
          updateMediaSession(data);
          updateTimer(data);
        } else {
          setServerDown();
        }
      } catch {
        setServerDown();
      }
    } else {
      setServerDown();
    }
  };
  xmlhttp.open("GET", "metadata.php", true);
  xmlhttp.send();
};

/**
 * Creates and returns a toggle playback handler
 *
 * Important note:
 * "Paused" state here is actually closer to "stopped". Setting the audio.src
 * to "" ensures that when audio is resumed it gets set to the "live" stream
 * rather than the time it was paused at. This helps prevent any unusual
 * stuttering or glitchiness after unpausing.
 *
 * @param {HTMLElement} audio - HTML audio player
 * @returns {function} Sets playback handlers
 */
const handleTogglePlayback = (audio) => () => {
  const playPause = document.getElementById("playPause");

  if (audio.paused) {
    audio.src = `http://leheny.ddns.net:8000/gamemusic?t=${new Date().getTime()}`;
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
 * Creates and returns a mute/unmute handler
 *
 * @param {HTMLElement} audio - HTML audio player
 * @returns {function} Sets mute handlers
 */
const handleToggleMute = (audio) => () => {
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
 * Creates and returns a volume change handler
 *
 * @param {HTMLElement} audio - HTML audio player
 * @returns {function} Sets volume handlers
 */
const handleChangeVolume = (audio) => (e) => {
  audio.volume = e.target.value * e.target.value;
};

/**
 * Sets handlers for everything interactable on the page. Adds event listeners
 * for keyboard events. Spacebar toggles playback, F toggles fullscreen.
 */
const setupControls = () => {
  const audio = document.getElementById("audio");
  const playPause = document.getElementById("playPause");
  const muted = document.getElementById("muted");
  const volume = document.getElementById("volume");

  playPause.onclick = handleTogglePlayback(audio);
  muted.onclick = handleToggleMute(audio);
  volume.oninput = handleChangeVolume(audio);

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
    navigator.mediaSession.setActionHandler(
      "play",
      handleTogglePlayback(audio)
    );
    navigator.mediaSession.setActionHandler(
      "pause",
      handleTogglePlayback(audio)
    );
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === " ") {
      handleTogglePlayback(audio)();
    }
    if (e.key === "f") {
      document.fullscreenElement === null
        ? document.documentElement.requestFullscreen()
        : document.exitFullscreen();
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
