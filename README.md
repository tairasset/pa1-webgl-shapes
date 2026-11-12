# 3D Shapes in WebGL

A browser graphics coursework project by Tair Asset. It renders a cube and a square frustum with WebGL, using vertex colors to create gradients on selected faces.

## Preview locally

Run this command from the repository root and open [the local preview](http://localhost:8765/) in a browser with WebGL support.

```sh
python -m http.server 8765
```

The page uses plain HTML, JavaScript, and GLSL. There are no npm dependencies.

## Controls

| Key | Action |
| --- | --- |
| 1 | Triangles, the default filled view |
| 2 | Line loop |
| 3 | Independent line segments |
| 4 | Line strip |
| 5 | Points at vertices |
| 6 | Triangle strip |
| D | Toggle depth testing |
| S | Switch which shape is drawn first |

The on-screen label shows the active drawing mode, depth test, and draw order. Toggle depth testing and switch the draw order to see how overlapping surfaces change.
