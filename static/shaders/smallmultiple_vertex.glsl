attribute vec4 a_position;
attribute vec4 a_color;

uniform float point_size;
varying vec4 v_color;


void main() {
  gl_PointSize = point_size;
  gl_Position.xyz = a_position.xyz;
  gl_Position.w = 1.0;
  v_color = vec4(a_color);


}