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
From an extracted ZIP, serve the extracted folder and open `http://localhost:8765/`.
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

## Progress — stage 12 (approximately 95%; final browser steps blocked)

The WebGL scene now includes geometry, model transformations, perspective and
orthographic projections, animation, keyboard controls and the FPS display.

The label shows student ID, projection, FOV, simulated time and FPS.
FPS uses actual timestamp intervals over each measurement window of at least
one second, independently of simulated time and the dt clamp. Pausing freezes
the scene time, while rendering and FPS measurement continue.

## Verification

- DPR-aware resize and projection aspect.
- dt clamp, pause/resume, reset, FOV limits and projection controls.
- Camera rotation preserves its height and distance from the target.
- Numerical sampling over 42 seconds verifies orbit radius/plane and near/far safety.
- Near 0.1 / far 20 contain the sampled view-space vertex depths, approximately 4.63–10.23.
- Browser interaction checks: rendering and controls, with no console errors.

E1–E6 experiment copies, evidence and draft explanations
are in `experiments/`. Serve the repository locally and open the experiment
subfolders to reproduce them. The main scene code is unchanged by these copies.
E3 measures perspective/orthographic edge lengths at a fixed pose. E4 shows
near-plane clipping and the effect of using aspect=1 in a wide window.
E6 verifies the 120° diagonal-axis rotation and manually divides clip coordinates
by w. E5 records a five-second baseline dt sample and a 14.017-second orbit.
E5 now also records a 14.0002-second orbit with real DevTools CPU 4× slowdown
in native Edge and a 5.1263-second real tab switch without the dt clamp.
The independent Chrome/Firefox check is still pending. Edge results are
identified as such in `experiments/E5.md`; no Chrome/Firefox run is claimed.
writeup.pdf now includes E1–E6, 16 evidence figures and the development log:
10 pages, 1,153 words including captions and page footers. The demo video and
final submission ZIP are still pending. At least five meaningful commits across two real calendar days
are required; the current PA2 history already meets that minimum.

The current archive is explicitly named `PA2_242458_Asset_DRAFT.zip` because
the video and Chrome/Firefox check are missing. See `FINAL-CHECKLIST.md` for
the exact remaining checks, 26-second recording plan and final ZIP procedure.
The numerical checks pass; they do not replace a browser rendering test.
