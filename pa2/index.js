"use strict";

// Variant 242458: square frustum; T=14s; cube axis (1,1,1);
// vertical orbit around x; eye (0,2.5,7); initial FOV 45 degrees.
main();

function main() {
  const canvas = document.querySelector("#c");
  const status = document.querySelector("#status");
  if (typeof mat4 === "undefined") {
    status.textContent = "242458 | glMatrix failed to load; check Internet connection";
    return;
  }
  const gl = canvas.getContext("webgl");
  if (!gl) {
    status.textContent = "242458 | WebGL unavailable";
    return;
  }
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.12, 0.12, 0.14, 1);

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    const aspect = canvas.width / canvas.height;
    // Projection and animated drawing will be added in later stages.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    status.textContent = `242458 | PA2 setup | aspect ${aspect.toFixed(3)} | DPR ${dpr}`;
  }
  window.addEventListener("resize", resize);
  resize();
}
