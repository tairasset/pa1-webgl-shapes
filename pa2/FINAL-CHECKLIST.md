# PA2 packaging checklist

Student: Tair Asset, AIB-2401, 242458.

This package is incomplete: demo.mp4/demo.webm and the independent
Chrome/Firefox run are still missing. Do not submit the draft ZIP as final.

## Completed

- index.html and index.js: WebGL 1.0, glMatrix 2.8.1, separate model/view/projection matrices.
- Personal variant, keyboard controls, status label and FPS display.
- English writeup.pdf: E1–E6, 16 evidence figures, development log, 1,153 words.
- Real E5 CPU 4× and hidden-tab tests in native Edge.
- Numerical/behavioural checks pass: DPR resize, dt clamp, pause/resume,
  reset, FOV limits, orthographic controls, orbit radius/plane and 42-second depth sampling.
- Git history already includes at least five meaningful commits on two days.

The numerical tests use synthetic timestamps and a mocked WebGL context;
they do not substitute for a real Chrome/Firefox rendering and console check.

## Remaining browser check

1. Serve this folder locally and open it in current Chrome or Firefox.
2. Check rendering, pause/resume, O, + and =, -, arrows, R and window resize.
3. Verify the status label and browser console. Record the browser/version
   and actual result; do not label the existing Edge tests as Chrome tests.

When serving the repository root, open /pa2/. When serving the extracted
ZIP folder, open / directly. Internet is needed for the glMatrix CDN script.

## Demo recording plan (approximately 26 seconds)

Use a real browser screen recording with the canvas and status label visible.
Start from reset time. Preserve one continuous take:

| Recording time | Action |
| --- | --- |
| 0–14.5 s | Let the solid complete one full 14-second orbit |
| 15 s | P: pause; show the frozen pose |
| 16 s | O: switch to orthographic |
| 17 s | O: return to perspective |
| 18 s | +: show FOV increasing |
| 19 s | -: show FOV decreasing |
| 20 s | Left arrow: rotate camera |
| 21 s | Right arrow: rotate camera back |
| 22 s | P: resume |
| 24 s | R: reset |
| 26 s | Stop the recording |

Save as demo.mp4 or demo.webm here. Review that it is 20–30 seconds long,
shows a full orbit before the controls, and keeps student ID visible.

## Final packaging

Commit the real video and the verified browser result, then push pa2.
Create PA2_242458_Asset.zip from the committed pa2 folder, with index.html,
index.js, README.md, writeup.pdf and demo.mp4/demo.webm at ZIP root.
Check that the ZIP bytes match the last commit before the deadline.
Paste the repository link in the Moodle submission text:
https://github.com/tairasset/pa1-webgl-shapes/tree/pa2/pa2

No video or successful Chrome/Firefox run is claimed by this checklist.
