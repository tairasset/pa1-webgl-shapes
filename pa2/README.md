# PA2 — Matrix Transformations and Perspective

Tair Asset, AIB-2401. Student ID: **242458**.

## Personal variant

| Parameter | Rule | Value |
| --- | --- | --- |
| Solid | Last digit 8, reused from PA1 | Square frustum |
| Orbit period | 6 + 8 | 14 seconds |
| Cube spin axis | 5 mod 3 = 2 | Normalised (1, 1, 1) |
| Orbit plane | 4 mod 3 = 1 | Vertical, around x |
| Camera | 2 mod 2 = 0 | Eye (0, 2.5, 7), FOV 45° |

Fixed: cube 1.2 rad/s; orbit radius 2.5; self-spin 2 rad/s around y;
scale 0.65 + 0.15 sin(2πt/3); target (0,0,0), up (0,1,0).

## Run

From the repository root, run `python -m http.server 8765`.
Open `http://localhost:8765/pa2/` in Chrome or Firefox.
Internet is required to load glMatrix 2.8.1 from cdnjs.

## Controls

| Key | Action |
| --- | --- |
| P | Pause/resume at the same pose |
| O | Toggle perspective/orthographic |
| + or = | Increase FOV by 5 degrees, perspective only |
| - | Decrease FOV by 5 degrees, perspective only |
| Left / Right | Rotate camera around y by 5 degrees |
| R | Reset time, camera, FOV, projection and pause state |

FOV is limited to 20–100 degrees. Orthographic half-height is
camera-target distance × tan(FOV/2); horizontal bounds include aspect ratio.

## Progress — stage 5 (approximately 50%)

Stages 1–4 provide geometry, shaders, camera and variant animation.
Stage 5 adds all keyboard controls and orthographic projection.
While paused, frame timestamps still update, so resuming does not include paused time.
The status label displays ID, projection, FOV, time and pause state.

FPS display and final verification remain for the next stage.
Experiment evidence E1–E6, writeup.pdf and the demo video remain later work.
At least five meaningful PA2 commits across two real calendar days are required.
