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

const getDelay = () => {
  const { currentTime, duration } = document.getElementById("audio");
  const delay = Math.ceil(duration - currentTime);

  return isFinite(delay) ? delay : 4;
};

const updateTimer = ({ remainingTime }) =>
  setTimeout(getMetadata, (remainingTime + getDelay()) * 1000);

const getMetadata = () => {
  const xmlhttp = new XMLHttpRequest();

  xmlhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      const data = JSON.parse(this.responseText);

      if (!data.error) {
        displayMetadata(data);
        updateMediaSession(data);
        updateTimer(data);
      } else {
        document.getElementById("gameInfo").innerHTML = "Music server is down";
        document.getElementById("trackInfo").innerHTML =
          "I'm probably updating the library";
      }
    }
  };
  xmlhttp.open("GET", "metadata.php", true);
  xmlhttp.send();
};

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

const handleChangeVolume = (audio) => (e) => {
  audio.volume = e.target.value * e.target.value;
};

const setupControls = () => {
  const audio = document.getElementById("audio");
  const playPause = document.getElementById("playPause");
  const muted = document.getElementById("muted");
  const volume = document.getElementById("volume");

  playPause.onclick = handleTogglePlayback(audio);
  muted.onclick = handleToggleMute(audio);
  volume.oninput = handleChangeVolume(audio);

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

  window.addEventListener("keydown", function (e) {
    if (e.key === " ") {
      handleTogglePlayback(audio)();
    }
    if (e.key === "f") {
      console.log(document.fullscreenEnabled);
      document.fullscreenElement === null
        ? document.documentElement.requestFullscreen()
        : document.exitFullscreen();
    }
  });
};

window.onload = () => {
  getMetadata();
  setupControls();
};
