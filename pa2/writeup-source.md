# PA2 — Matrix Transformations and Perspective

Tair Asset · AIB-2401 · Student ID 242458

Text source for writeup.pdf; the PDF embeds the experiment screenshots.
The independent Chrome/Firefox check and demo video remain pending.

## E1 — Order of transformations

Prediction: the solid uses M = Rx(2πt/14) · T(0,2.5,0) · Ry(2t) · S(s),
where s = 0.65 + 0.15 sin(2πt/3). Swapping the orbit rotation and translation
should remove the orbit. Swapping translation and self-spin should have no
effect for this particular variant.

Result: the baseline centre at t=3.5 is approximately (0,0,2.5). The first
swap fixes it at (0,2.5,0). The second swap matches the baseline; numerical
comparison over 4,201 poses from 0 to 42 s found zero matrix difference.
Evidence: baseline.png, swap-orbit-translation.png, swap-translation-self.png
and console-output.txt in experiments/.

Explanation: glMatrix right-multiplies, so the last operation acts first on
the vertex. Rx·T rotates the translated centre around the origin, while T·Rx
does not. Translation parallel to y commutes with rotation about y, which
explains the unchanged second swap. This is a special case, not a general
claim that transformations commute.

## E2 — Three statements in Chapter 4

Prediction: the axis argument, clip-volume rules and homogeneous-coordinate
calculation should distinguish the three statements.

Result: an argument [0,1,0] specifies the y-axis, despite the chapter's X-axis
comment. Frustum clipping differs from face culling. Translating by (2,3,4)
leaves [1,0,0,0] unchanged but maps [1,0,0,1] to [3,3,4,1]. Evidence:
homogeneous-w.png and console-output.txt.

Explanation: clipping cuts primitives against the viewing volume, potentially
creating intersections; face culling rejects faces based on orientation.
Homogeneous w weights translation: w=0 represents a direction, while w=1
represents a point. After perspective projection, clip xyz is divided by clip
w. This use of w is distinct from a quaternion's fourth component.

## E3 — Perspective versus orthographic

Prediction: at identical paused t=0, the nearer cube edge should appear longer
in perspective; parallel equal edges should match in orthographic projection.

Result: at 1280×720 and FOV 45°, near/far projected edge lengths are
116.65/104.41 CSS pixels, ratio 1.1172, in perspective; they are
110.11/110.11 pixels, ratio 1.0000, in orthographic projection. Evidence:
projection-perspective.png, projection-orthographic.png and E3-E4-output.txt.
Measurements use endpoint projection through the actual P·V·M matrices;
the hidden far edge has a cyan guide. These are not independent raster-ruler
measurements.

Explanation: perspective divides by depth-dependent clip w. Orthographic
w remains 1. The PA1 depth-offset trick resembles parallel projection,
closer to orthographic than perspective, because depth adds a fixed screen
offset without distance-dependent shrinking; it is an oblique approximation.

## E4 — Near, far and aspect

Prediction: near=0.1 and far=20 should contain the scene; near=5.2 should cut
the orbiting solid. Hard-coding aspect=1 should stretch a wide viewport.

Result: the near-cut screenshot shows intersected faces at t=3.5, while the
reference retains them. Aspect=1 is correct at 720×720 but stretches the
1440×720 view horizontally compared with aspect=2. Evidence: near-reference.png,
near-cut.png, aspect-square.png, aspect-wide-one.png and aspect-wide-correct.png.

Explanation: the eye is √55.25 ≈ 7.433 units from the origin. All vertices
lie within radius 2.5+0.8√3/2 ≈ 3.193, giving conservative eye-distance and
positive view-depth bounds of approximately 4.24–10.63. Thus 0.1 and 20
bracket every pose. Numerical sampling gives tighter depths around
4.63–10.23, but sampling alone is not a continuous proof. Clipping uses
view-axis depth. At width/height=2, aspect=1 doubles horizontal dimensions.

## E5 — Frame-rate independence

Prediction: accumulating dt should preserve the 14-second orbit while gaps
remain below the 0.1-second clamp. Without the clamp, returning from a hidden
tab should advance the pose abruptly.

Result: the baseline five-second sample contains 293 intervals, mean
0.0170648464 s, maximum 0.0999 s, and an orbit of 14.0167 s. In native Edge
with DevTools CPU 4× enabled, 291 intervals over 5.000002 s give mean
0.0171821375 s and maximum 0.05 s; the orbit takes 14.000202 s.
After a timed tab switch without the clamp, actual hiding lasts 5.1263 s;
the first resumed dt is 5.1334 s, advancing t from 88.6986 to 93.8320.
Evidence: timing-baseline.png, timing-cpu4.png, timing-cpu4-results.png,
timing-unclamped-return5.png and timing-unclamped-console.png.

Explanation: each orbit overshoot is smaller than its final frame interval.
CPU slowdown need not reduce refresh rate: this small scene still runs near
60 FPS. Gaps exceeding 0.1 s lose elapsed time under the clamp. The unclamped
return includes the hidden interval in one dt. The five-second timer has
native-input overhead, explaining the measured 5.1263 s. CPU throttling was
restored afterward. These are Edge observations; no Chrome/Firefox test is
claimed.

## E6 — One vertex by hand

Prediction: t=(2π/3)/1.2=1.745329252 s produces 120° about (1,1,1)/√3.
Rodrigues' formula simplifies to M(x,y,z,w)=(z,x,y,w), so
v=(0.5,0.5,−0.5,1) maps to (−0.5,0.5,0.5,1).

Result: vec4.transformMat4 matches that world coordinate. Console clip
coordinates are (−0.6789975762, 0.7307890654, 6.6612720490, 6.7939953804).
Dividing xyz by 6.7939953804 gives NDC
(−0.0999408357, 0.1075639627, 0.9804646126). Evidence: vertex-by-hand.png
and E6-output.txt.

Explanation: the shader applies model, view and projection in that order.
The final clip w, rather than the original vertex w=1, is the divisor.
glMatrix prints column-major entries; tiny residuals near zero are rounding.

## Development log

The FPS counter initially counted the first timestamp without a frame interval.
Comparing counted frames with timestamp intervals exposed the mismatch.
Commit 390cba5 excludes the initial timestamp and measures windows of at least one second.
Commit 0207e75 adds real CPU-throttling and hidden-tab evidence for E5.
