main();

function main() {
  /*========== Create a WebGL Context ==========*/
  const canvas = document.querySelector("#c");
  const gl = canvas.getContext("webgl");
  if (!gl) { console.log("WebGL unavailable"); return; }

  /*========== Define and Store the Geometry ==========*/
  // TODO: cube positions (36 vertices), then your assigned solid
  // TODO: colours, 4 values per vertex (console.assert the length)
  // TODO: const buffers = initBuffers(gl, positions, colors);

  /*========== Shaders ==========*/
  const vsSource = `
    // TODO: aPosition, aVertexColor, varying vColor, gl_PointSize
  `;
  const fsSource = `
    // TODO: varying vColor -> gl_FragColor
  `;
  // TODO: const program = createProgram(gl, createShader(...), createShader(...));

  /*====== Connect the attributes with the vertex shader ======*/
  // TODO: bind the right buffer before EACH vertexAttribPointer call

  /*========== Drawing ==========*/
  const state = { mode: gl.TRIANGLES, depth: true, cubeFirst: true };

  function render() {
    // TODO: clear colour + depth, depth on/off, two drawArrays calls, update #status
  }

  document.addEventListener("keydown", (event) => {
    // TODO: keys 1-6, D, S -> update state, then render()
  });

  render();
}

function createShader(gl, type, source) {
  // TODO: create, compile, check COMPILE_STATUS, return shader or null
}

function createProgram(gl, vertexShader, fragmentShader) {
  // TODO: attach, link, check LINK_STATUS, useProgram, return program
}

function initBuffers(gl, positions, colors) {
  // TODO: one position buffer, one colour buffer; return both
}
