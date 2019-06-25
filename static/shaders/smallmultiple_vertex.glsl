attribute vec4 a_position;
attribute vec4 a_color;
attribute vec2 a_textureCoord;

uniform float theta;
uniform mat4 modelViewMatrix;

varying vec4 v_color;
varying highp vec2 v_textureCoord;


void main() {
  gl_PointSize = 5.0;
  gl_Position.xyz = a_position.xyz;
  gl_Position.w = 1.0;
  
  v_color = vec4(a_color);
  v_textureCoord = a_textureCoord;


}