"use strict";
const STUDENT_ID = "242458";
const ORBIT_PERIOD = 14;
const ORBIT_RADIUS = 2.5;
const CAMERA_EYE = [0, 2.5, 7];
const INITIAL_FOV = 45;
const NEAR = 0.1;
const FAR = 20;
const CUBE_AXIS = [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)];

function cubeModelMatrix(t) {
  const model = mat4.create();
  mat4.rotate(model, model, 1.2 * t, CUBE_AXIS);
  return model;
}

function solidModelMatrix(t) {
  const model = mat4.create();
  // Right multiplication: S acts first, then self-spin, translation, orbit.
  mat4.rotate(model, model, 2 * Math.PI * t / ORBIT_PERIOD, [1, 0, 0]);
  mat4.translate(model, model, [0, ORBIT_RADIUS, 0]);
  mat4.rotate(model, model, 2 * t, [0, 1, 0]);
  const s = 0.65 + 0.15 * Math.sin(2 * Math.PI * t / 3);
  mat4.scale(model, model, [s, s, s]);
  return model;
}

main();
function main() {
  const canvas = document.querySelector("#c");
  const status = document.querySelector("#status");
  if (typeof mat4 === "undefined") { status.textContent = "glMatrix could not load. Check your Internet connection."; return; }
  const gl = canvas.getContext("webgl");
  if (!gl) { status.textContent = "WebGL unavailable"; return; }
  const positions = [];
  function quad(a, b, c, d) { positions.push(...a, ...b, ...c, ...a, ...c, ...d); }
  quad([-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5]);
  quad([-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]);
  quad([-.5,.5,-.5],[.5,.5,-.5],[.5,.5,.5],[-.5,.5,.5]);
  quad([-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]);
  quad([.5,-.5,-.5],[.5,-.5,.5],[.5,.5,.5],[.5,.5,-.5]);
  quad([-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]);
  const cubeCount = positions.length / 3;
  const frustum = [
    // Large square base on the floor.
    0.20, -0.30, -0.50,
    0.80, -0.30, -0.50,
    0.80, -0.30,  0.10,

    0.20, -0.30, -0.50,
    0.80, -0.30,  0.10,
    0.20, -0.30,  0.10,

    // Smaller square top.
    0.35,  0.25, -0.35,
    0.65,  0.25, -0.35,
    0.65,  0.25, -0.05,

    0.35,  0.25, -0.35,
    0.65,  0.25, -0.05,
    0.35,  0.25, -0.05,

    // Front trapezoid.
    0.20, -0.30, -0.50,
    0.80, -0.30, -0.50,
    0.65,  0.25, -0.35,

    0.20, -0.30, -0.50,
    0.65,  0.25, -0.35,
    0.35,  0.25, -0.35,

    // Left trapezoid.
    0.20, -0.30, -0.50,
    0.35,  0.25, -0.35,
    0.35,  0.25, -0.05,

    0.20, -0.30, -0.50,
    0.35,  0.25, -0.05,
    0.20, -0.30,  0.10,

    // Back trapezoid.
    0.80, -0.30,  0.10,
    0.20, -0.30,  0.10,
    0.35,  0.25, -0.05,

    0.80, -0.30,  0.10,
    0.35,  0.25, -0.05,
    0.65,  0.25, -0.05,

    // Right trapezoid.
    0.80, -0.30, -0.50,
    0.80, -0.30,  0.10,
    0.65,  0.25, -0.05,

    0.80, -0.30, -0.50,
    0.65,  0.25, -0.05,
    0.65,  0.25, -0.35
  ];

  // PA1 dimensions: centre (0.5,-0.025,-0.2); largest extent 0.6.
  // Uniform normalisation preserves proportions and leaves margin in a 1-unit box.
  for (let i = 0; i < frustum.length; i += 3) {
    positions.push((frustum[i] - 0.5) / 0.75,
      (frustum[i + 1] + 0.025) / 0.75, (frustum[i + 2] + 0.2) / 0.75);
  }
  const frustumCount = frustum.length / 3;
  const frontColor = [0.95, 0.45, 0.25, 1.0];
  const backColor = [0.25, 0.55, 0.90, 1.0];
  const topColor = [0.95, 0.75, 0.30, 1.0];
  const leftFrontBottom = [0.34, 0.25, 0.65, 1.0];
  const leftBackBottom = [0.48, 0.40, 0.78, 1.0];
  const leftBackTop = [0.70, 0.62, 0.90, 1.0];
  const leftFrontTop = [0.56, 0.47, 0.77, 1.0];
  const rightColor = [0.35, 0.75, 0.70, 1.0];
  const bottomColor = [0.40, 0.60, 0.35, 1.0];
  const frustumBaseColor = [0.20, 0.50, 0.55, 1.0];
  const frustumTopColor = [0.45, 0.80, 0.50, 1.0];
  const frustumFrontBottomLeft = [0.55, 0.22, 0.30, 1.0];
  const frustumFrontBottomRight = [0.85, 0.34, 0.24, 1.0];
  const frustumFrontTopRight = [0.885, 0.585, 0.365, 1.0];
  const frustumFrontTopLeft = [0.735, 0.525, 0.395, 1.0];
  const frustumLeftColor = [0.55, 0.45, 0.85, 1.0];
  const frustumBackColor = [0.30, 0.45, 0.80, 1.0];
  const frustumRightColor = [0.82, 0.68, 0.30, 1.0];
  const colors = [];
  for (let i = 0; i < 6; i++) colors.push(...frontColor);
  for (let i = 0; i < 6; i++) colors.push(...backColor);
  for (let i = 0; i < 6; i++) colors.push(...topColor);
  for (const color of [
    leftFrontBottom, leftBackBottom, leftBackTop,
    leftFrontBottom, leftBackTop, leftFrontTop
  ]) colors.push(...color);
  for (let i = 0; i < 6; i++) colors.push(...rightColor);
  for (let i = 0; i < 6; i++) colors.push(...bottomColor);
  for (let i = 0; i < 6; i++) colors.push(...frustumBaseColor);
  for (let i = 0; i < 6; i++) colors.push(...frustumTopColor);
  for (const color of [
    frustumFrontBottomLeft, frustumFrontBottomRight, frustumFrontTopRight,
    frustumFrontBottomLeft, frustumFrontTopRight, frustumFrontTopLeft
  ]) colors.push(...color);
  for (let i = 0; i < 6; i++) colors.push(...frustumLeftColor);
  for (let i = 0; i < 6; i++) colors.push(...frustumBackColor);
  for (let i = 0; i < 6; i++) colors.push(...frustumRightColor);

  console.assert(colors.length === positions.length / 3 * 4, "Colour count mismatch");
  const buffers = initBuffers(gl, positions, colors);
  if (!buffers) return;
  const vsSource = `
    attribute vec4 aPosition;
    attribute vec4 aVertexColor;
    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying lowp vec4 vColor;
    void main() {
      gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aPosition;
      vColor = aVertexColor;
    }
  `;
  const fsSource = `
    precision mediump float;
    varying lowp vec4 vColor;
    void main() { gl_FragColor = vColor; }
  `;
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vertexShader || !fragmentShader) return;
  const program = createProgram(gl, vertexShader, fragmentShader);
  if (!program) return;
  gl.useProgram(program);
  const positionLocation = gl.getAttribLocation(program, "aPosition");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLocation);
  const colorLocation = gl.getAttribLocation(program, "aVertexColor");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLocation);
  const uModel = gl.getUniformLocation(program, "uModelMatrix");
  const uView = gl.getUniformLocation(program, "uViewMatrix");
  const uProjection = gl.getUniformLocation(program, "uProjectionMatrix");
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0.12, 0.12, 0.14, 1);

  const view = mat4.create();
  const projection = mat4.create();
  mat4.lookAt(view, [0, 2.5, 7], [0, 0, 0], [0, 1, 0]);
  gl.uniformMatrix4fv(uView, false, view);
  let t = 0;
  let then = null;
  function render(nowMs) {
    const now = nowMs * 0.001;
    const dt = then === null ? 0 : Math.min(now - then, 0.1);
    then = now;
    t += dt;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(uModel, false, cubeModelMatrix(t));
    gl.drawArrays(gl.TRIANGLES, 0, cubeCount);
    gl.uniformMatrix4fv(uModel, false, solidModelMatrix(t));
    gl.drawArrays(gl.TRIANGLES, cubeCount, frustumCount);
    status.textContent = '242458 | Perspective | FOV 45° | t ' + t.toFixed(1) + ' s';
    requestAnimationFrame(render);
  }
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    const aspect = canvas.width / canvas.height;
    mat4.perspective(projection, 45 * Math.PI / 180, aspect, 0.1, 20);
    gl.uniformMatrix4fv(uProjection, false, projection);

  }
  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(render);
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function initBuffers(gl, positions, colors) {
  const position = gl.createBuffer();
  const color = gl.createBuffer();
  if (!position || !color) return null;
  gl.bindBuffer(gl.ARRAY_BUFFER, position);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, color);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  return { position, color };
}
