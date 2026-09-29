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
    -0.90,  0.40,  0.5
  ];
  const frontColor = [0.95, 0.45, 0.25, 1.0];
  const backColor = [0.25, 0.55, 0.90, 1.0];
  const topColor = [0.95, 0.75, 0.30, 1.0];
  const colors = [];
  for (let i = 0; i < 6; i++) colors.push(...frontColor);
  for (let i = 0; i < 6; i++) colors.push(...backColor);
  for (let i = 0; i < 6; i++) colors.push(...topColor);
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
    gl.drawArrays(state.mode, 0, positions.length / 3);
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
