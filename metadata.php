<?php
  $metadata = shell_exec('mpc -f %file%');
  $lines = explode("\n", $metadata);

  if (count($lines) != 4) {
    echo json_encode(array(
      "error" => "Music server is down",
    ));
    return;
  }

  $data = explode("/", $lines[0]);
  $game = $data[0];
  $track = explode(".mp3", $data[1])[0];

  $cover = shell_exec('cat /home/luke/music/"' . $game . '"/cover.txt');

  $times = explode("/", explode(" ", $lines[1])[4]);
  $time1 = explode(":", $times[0]);
  $time1minutes = $time1[0];
  $time1seconds = $time1[1];
  $time1total = $time1minutes * 60 + $time1seconds;
  $time2 = explode(":", $times[1]);
  $time2minutes = $time2[0];
  $time2seconds = $time2[1];
  $time2total = $time2minutes * 60 + $time2seconds;
  $remainingTime = $time2total - $time1total;

  $trackWithTime = $track . " (" . $times[1] . ")";

  echo json_encode(array(
    "game" => $game,
    "track" => $trackWithTime,
    "cover" => $cover,
    "remainingTime" => $remainingTime,
    "trackLength" => $time2total,
  ));
?>
