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

## Progress — stage 1 (approximately 10%)

- Full-window canvas and student ID in the title/status.
- glMatrix 2.8.1 loaded before index.js.
- WebGL context, depth testing, DPR-aware drawing buffer and viewport.
- Aspect recalculated on resize.

This stage intentionally shows a cleared canvas only. Geometry, shaders,
matrices, animation and controls follow in later stages.
The final package also needs real E1–E6 evidence, writeup.pdf, a demo video,
and at least five meaningful commits across two real calendar days.
