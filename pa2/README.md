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

## Progress — stage 4 (approximately 40%)

Stages 1–3 provide variant geometry, shaders and a perspective camera.
Stage 4 animates both shapes using simulated time and glMatrix:

- Cube stays at the origin and rotates at 1.2 rad/s about normalised (1,1,1).
- Frustum orbits at radius 2.5 in the yz plane, around x, with period 14 seconds.
- Frustum spins about its own y-axis at 2 rad/s.
- Uniform scale pulses as 0.65 + 0.15 sin(2πt/3).
- Separate cubeModelMatrix(t) and solidModelMatrix(t) functions.
- requestAnimationFrame drives the loop; timestamps converted to seconds.
- dt limited to 0.1 seconds; the first frame starts at t=0.

Solid matrix order: Rx(2πt/14) · T(0,2.5,0) · Ry(2t) · S(s(t)).
glMatrix right-multiplies; scale acts on the vertex first.

Pause, orthographic projection, FOV/camera controls, FPS display,
experiment evidence, PDF and video remain later stages.
At least five meaningful PA2 commits across two real calendar days are required.
