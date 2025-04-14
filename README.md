# VGM Radio

Hosted at [leheny.ddns.net](http://leheny.ddns.net/)

![image](https://github.com/user-attachments/assets/76fab797-4ff4-40dc-9db4-5d92fe47793b)

## Background

My friends and I used to stream our game sessions to Twitch, where copyrighted music is forbidden. We realized that we all really like chill video game music, and I started streaming my personal library over Discord while streaming it all to Twitch. At the time that I switched over from Windows to Linux, Discord screensharing was not working with audio. After failing to create a consistent solution to this problem, I decided I wanted more of an online radio type situation. Now at any point any one of us can stream the music and we can all hear the same songs at the same time with a consistent user experience.

## Features

- Over 2000 tracks from over 200 games (plus some non-VGM extras) and constantly updating
- Virtually 24/7 uptime
- Lightweight frontend that runs on anything
- Integration with device media controls
- Consistent volume via [mp3gain](https://mp3gain.sourceforge.net/)

## Frontend

The frontend plays Icecast's audio broadcast and periodically fetches metadata from Liquidsoap's harbor. Game, track, and cover art are all displayed to accompany the music. When the song changes, the page immediately updates to reflect the change. Use of Javascript's [MediaSession](https://developer.mozilla.org/en-US/docs/Web/API/MediaSession) allows operating system play/pause controls to integrate with the site.

### Keyboard shortcuts

| Key      | Action            |
| -------- | ----------------- |
| Spacebar | Toggle play/pause |
| F        | Toggle fullscreen |
| M        | Toggle mute       |
| 0-9      | Adjust volume     |

## Backend

Backend is running [Liquidsoap](https://www.liquidsoap.info/) over [Icecast](https://icecast.org/) using [this config](https://github.com/lleheny0/nixos-config/blob/main/modules/server/dotfiles/vgm-stream.liq). Liquidsoap shuffles and plays the entire library of songs, outputting to Icecast. Icecast then broadcasts this audio to the internet. Liquidsoap's harbor is an HTTP server that is configured to pull the current song's metadata and massage it into the simple form expected by the frontend.
