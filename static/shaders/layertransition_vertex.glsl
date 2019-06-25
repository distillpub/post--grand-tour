precision mediump float;

attribute vec4 a_position;
attribute vec4 a_color;
attribute vec2 a_textureCoord;

uniform float theta;
uniform mat4 modelViewMatrix;
uniform float point_size;

varying vec4 v_color;
varying vec2 v_textureCoord;
varying float depth;


void main() {
  gl_Position.xyz = a_position.xyz;
  gl_Position.w = 1.0;

  depth = a_position.z;
  gl_PointSize = point_size;

  v_color = vec4(a_color);
  v_textureCoord = a_textureCoord;
}
