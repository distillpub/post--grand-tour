precision mediump float;
uniform bool isDrawingLines;
// varying vec4 color;

void main() {
  gl_FragColor = vec4(0.0, 0.0, 0.5, 1.0);

  if(!isDrawingLines){
    float dist = distance(vec2(0.5, 0.5), gl_PointCoord);
    if(dist > 0.5){
      discard;
    }
  }
}