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

## Progress — stage 3 (approximately 30%)

Stages 1–2 provide the full-window canvas, variant geometry, buffers and shaders.
Stage 3 adds a static perspective scene:

- Separate model, view and projection matrices.
- Variant camera: eye (0,2.5,7), target (0,0,0), up (0,1,0).
- Perspective FOV 45 degrees, near 0.1, far 20.
- Cube at the origin and frustum at its initial orbit position (0,2.5,0).
- Frustum initial scale 0.65; both shapes drawn separately with drawArrays.
- Projection aspect and scene updated on resize, with depth testing enabled.

This is a static starting pose. Animation, orthographic mode, controls,
experiment evidence, PDF and video will follow in later stages.
At least five meaningful PA2 commits across two real calendar days are required.
