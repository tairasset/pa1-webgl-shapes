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

## Progress — stage 2 (approximately 20%)

- Stage 1: full-window canvas, glMatrix 2.8.1 and DPR-correct resize.
- Cube remodelled to -0.5..+0.5, without the PA1 depth offset.
- PA1 square frustum centred and uniformly fitted inside a 1-unit box.
- PA1 face colours and gradients retained.
- Both shapes stored in one shared position buffer, with separate vertex counts.
- Vertex/fragment shaders compiled and linked with error checks.
- Position/colour attributes and three matrix uniform locations set up once.

The shaders use the required projection × view × model × position expression.
Drawing and matrices will follow in the next stage, so this stage intentionally
shows only the clear colour and a geometry-ready label.
Animation, controls, experiment evidence, PDF and demo remain later stages.
At least five meaningful PA2 commits across two real calendar days are required.
