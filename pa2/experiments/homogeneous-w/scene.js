"use strict";
const matrix = mat4.create();
mat4.translate(matrix, matrix, [2,3,4]);
const direction = vec4.transformMat4(vec4.create(), [1,0,0,0], matrix);
const position = vec4.transformMat4(vec4.create(), [1,0,0,1], matrix);
const rotation = mat4.create();
mat4.rotate(rotation, rotation, Math.PI / 2, [0,1,0]);
const rotated = vec4.transformMat4(vec4.create(), [1,0,0,1], rotation);
console.log('E2 axis [0,1,0], 90 degrees, input [1,0,0,1]:',JSON.stringify(Array.from(rotated)));
console.log('E2 input [1,0,0,0], translation [2,3,4]:',JSON.stringify(Array.from(direction)));
console.log('E2 input [1,0,0,1], translation [2,3,4]:',JSON.stringify(Array.from(position)));
document.querySelector('#output').textContent = 'Axis [0,1,0], 90 degrees:\n[1,0,0,1] -> ['+Array.from(rotated).map(x=>Math.abs(x)<1e-6?0:x).join(', ')+']\n\nTranslation: [2,3,4]\n[1,0,0,0] -> ['+Array.from(direction).join(', ')+']\n[1,0,0,1] -> ['+Array.from(position).join(', ')+']';

