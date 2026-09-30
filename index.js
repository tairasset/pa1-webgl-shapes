main();

function main() {
  /*========== Create a WebGL Context ==========*/
  const canvas = document.querySelector("#c");
  const gl = canvas.getContext("webgl");
  if (!gl) { console.log("WebGL unavailable"); return; }

  /*========== Define and Store the Geometry ==========*/
  // Front face of the cube: two triangles.
  const positions = [
    -0.75, -0.25, -0.5,
    -0.25, -0.25, -0.5,
    -0.25,  0.25, -0.5,

    -0.75, -0.25, -0.5,
    -0.25,  0.25, -0.5,
    -0.75,  0.25, -0.5,

    // Back face: shifted 0.15 left and 0.15 up.
    -0.90, -0.10,  0.5,
    -0.40, -0.10,  0.5,
    -0.40,  0.40,  0.5,

    -0.90, -0.10,  0.5,
    -0.40,  0.40,  0.5,
    -0.90,  0.40,  0.5,

    // Top face: connects the front and back top edges.
    -0.75,  0.25, -0.5,
    -0.25,  0.25, -0.5,
    -0.40,  0.40,  0.5,

    -0.75,  0.25, -0.5,
    -0.40,  0.40,  0.5,
    -0.90,  0.40,  0.5,

    // Left face: connects the front and back left edges.
    -0.75, -0.25, -0.5,
    -0.90, -0.10,  0.5,
    -0.90,  0.40,  0.5,

    -0.75, -0.25, -0.5,
    -0.90,  0.40,  0.5,
    -0.75,  0.25, -0.5,

    // Right face: connects the front and back right edges.
    -0.25, -0.25, -0.5,
    -0.40, -0.10,  0.5,
    -0.40,  0.40,  0.5,

    -0.25, -0.25, -0.5,
    -0.40,  0.40,  0.5,
    -0.25,  0.25, -0.5,

    // Bottom face: connects the front and back bottom edges.
    -0.75, -0.25, -0.5,
    -0.25, -0.25, -0.5,
    -0.40, -0.10,  0.5,

    -0.75, -0.25, -0.5,
    -0.40, -0.10,  0.5,
    -0.90, -0.10,  0.5
  ];
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
  for (let i = 0; i < frustum.length; i += 3) {
    const x = frustum[i];
    const y = frustum[i + 1];
    const z = frustum[i + 2];
    positions.push(x - 0.15 * (z + 0.5), y + 0.15 * (z + 0.5), z);
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
  const frustumFrontColor = [0.87, 0.48, 0.28, 1.0];
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
  for (let i = 0; i < 6; i++) colors.push(...frustumFrontColor);
  for (let i = 0; i < 6; i++) colors.push(...frustumLeftColor);
  for (let i = 0; i < 6; i++) colors.push(...frustumBackColor);
  for (let i = 0; i < 6; i++) colors.push(...frustumRightColor);
  console.assert(colors.length === (positions.length / 3) * 4);
  const buffers = initBuffers(gl, positions, colors);
  if (!buffers) return;

  /*========== Shaders ==========*/
  const vsSource = `
    attribute vec4 aPosition;
    attribute vec4 aVertexColor;
    varying lowp vec4 vColor;

    void main() {
      gl_Position = aPosition;
      vColor = aVertexColor;
    }
  `;
  const fsSource = `
    precision mediump float;
    varying lowp vec4 vColor;

    void main() {
      gl_FragColor = vColor;
    }
  `;
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vertexShader || !fragmentShader) return;
  const program = createProgram(gl, vertexShader, fragmentShader);
  if (!program) return;
  gl.useProgram(program);

  /*====== Connect the attributes with the vertex shader ======*/
  const positionLocation = gl.getAttribLocation(program, "aPosition");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(positionLocation);

  const colorLocation = gl.getAttribLocation(program, "aVertexColor");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(colorLocation);

  /*========== Drawing ==========*/
  const state = { mode: gl.TRIANGLES, depth: true, cubeFirst: true };

  function render() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.12, 0.12, 0.14, 1.0);
    if (state.depth) gl.enable(gl.DEPTH_TEST);
    else gl.disable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(state.mode, 0, cubeCount);
    gl.drawArrays(state.mode, cubeCount, frustumCount);
    document.querySelector("#status").textContent = "242458 | TRIANGLES | depth ON";
  }

  document.addEventListener("keydown", (event) => {
    // TODO: keys 1-6, D, S -> update state, then render()
  });

  render();
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
