# PA1 - 3D Shapes in WebGL

Tair Asset, AIB-2401

Student ID: 242458

The scene has a cube on the left and a square frustum on the right. My ID ends in 58, so the back vertices move 0.15 left and 0.15 up. That is why the top and left sides are visible. Each solid has one face with a colour gradient.

## Run

Start a local server in this folder:

```text
python -m http.server 8765
```

Then open `http://localhost:8765/`. If you use VS Code, Live Server works too.

## Keys

| Key | Action |
| --- | --- |
| 1 | TRIANGLES — filled faces (default) |
| 2 | LINE_LOOP — connected lines |
| 3 | LINES — separate line segments |
| 4 | LINE_STRIP — connected lines without closing the loop |
| 5 | POINTS — show the vertices |
| 6 | TRIANGLE_STRIP — triangles joined in a strip |
| D | Turn the depth test on or off |
| S | Draw the frustum before the cube, or the cube before the frustum |

The small label in the top-left corner shows what is currently selected.
