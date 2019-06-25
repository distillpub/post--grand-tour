precision mediump float;

uniform int mode;

uniform float colorFactor;
uniform sampler2D uSampler;

varying vec4 v_color;
varying highp vec2 v_textureCoord;


void main() {
  if(mode == 0){
    gl_FragColor = v_color;
    float dist = distance(vec2(0.5, 0.5), gl_PointCoord);
    if(dist > 0.5){
      discard;
    }
  }else{
    gl_FragColor = texture2D(uSampler, v_textureCoord);
    if(colorFactor == 0.0){ //cifar10 dataset
      gl_FragColor.rgb += v_color.rgb * colorFactor;
      gl_FragColor.a *= v_color.a;
    }else{
      gl_FragColor.rgb += v_color.rgb * colorFactor;
      gl_FragColor.a *= v_color.a;
    }
  }
}

