# PA1 — 3D Shapes in WebGL

Student ID: **242458**

The last digit (8) assigns a square frustum. The second-to-last digit (5) gives an up-left depth offset of **(-0.15, +0.15)**. The page draws a cube on the left and the frustum on the right using WebGL 1.0.

## Run

From this folder, start a local server:

```text
python -m http.server 8765
```

Then open `http://localhost:8765/` in Chrome or Firefox. VS Code Live Server is another option. Opening `index.html` directly as a file is not the intended test method.

## Keys

| Key | Action |
| --- | --- |
| 1 | TRIANGLES (default) |
| 2 | LINE_LOOP |
| 3 | LINES |
| 4 | LINE_STRIP |
| 5 | POINTS |
| 6 | TRIANGLE_STRIP |
| D | Toggle depth testing |
| S | Swap drawing order of the cube and frustum |

The label at the top left shows the student ID, drawing mode, depth setting, and drawing order. No external libraries are needed.
