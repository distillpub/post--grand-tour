attribute vec4 a_position;
attribute vec4 a_color;
attribute vec2 a_textureCoord;

uniform float theta;
uniform mat4 modelViewMatrix;
uniform float point_size;

uniform float canvasWidth;
uniform float canvasHeight;

varying vec4 v_color;
varying highp vec2 v_textureCoord;


void main() {
  gl_PointSize = point_size;
  gl_Position.x = (a_position.x / canvasWidth - 0.5)*2.0;
  gl_Position.y = -(a_position.y / canvasHeight - 0.5)*2.0;
  gl_Position.z = a_position.z;
  gl_Position.w = 1.0;
  
  v_color = vec4(a_color);
  v_textureCoord = a_textureCoord;
}
