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
    -0.90,  0.40,  0.5
  ];
  // TODO: colours, 4 values per vertex (console.assert the length)
  const buffers = initBuffers(gl, positions);
  if (!buffers) return;

  /*========== Shaders ==========*/
  const vsSource = `
    attribute vec4 aPosition;

    void main() {
      gl_Position = aPosition;
    }
  `;
  const fsSource = `
    precision mediump float;

    void main() {
      gl_FragColor = vec4(0.95, 0.45, 0.25, 1.0);
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

function initBuffers(gl, positions) {
  const position = gl.createBuffer();
  if (!position) return null;
  gl.bindBuffer(gl.ARRAY_BUFFER, position);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  return { position };
}
