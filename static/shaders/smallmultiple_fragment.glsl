precision mediump float;


varying vec4 v_color;

void main() {
  gl_FragColor = v_color;
  float dist = distance(vec2(0.5, 0.5), gl_PointCoord);
  if(dist > 0.5){
    discard;
  }
}

