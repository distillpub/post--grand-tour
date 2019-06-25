attribute vec4 a_position;
// attribute vec4 a_color;
// varying vec4 color;
// uniform float theta;
// uniform mat4 modelViewMatrix;

void main() {
  gl_PointSize = 6.0;

  gl_Position.xyz = a_position.xyz / 1.0;
  gl_Position.w = 1.0;
  // gl_Position = modelViewMatrix * vPosition;

  // color = vec4(a_color);
  // color = vec4(1.0, 1.0, 1.0, 1.0);

}