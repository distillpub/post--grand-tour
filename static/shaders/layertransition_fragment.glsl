precision mediump float;

uniform int mode;

uniform float colorFactor;
uniform sampler2D uSampler;
uniform bool isDrawingAxis;

varying vec4 v_color;
varying float depth;
varying vec2 v_textureCoord;


void main() {
  if (mode == 0) { //drawing data points as dots

    gl_FragColor = v_color;
    if (!isDrawingAxis) {
      float dist = distance(vec2(0.5, 0.5), gl_PointCoord);
      
      float eps = 0.05;
      float a = - 1.0 / (2.0*eps);
      float b = 0.5 + 1.0/(4.0*eps);
      float f = a*dist + b;
      float g = smoothstep(0.0, 1.0, f);
      gl_FragColor.a = v_color.a * colorFactor * g;

      // float depth_thresh = 0.5;
      // if(depth < depth_thresh){
      //   gl_FragColor.a *= (depth*1.0/depth_thresh)*(depth*1.0/depth_thresh);
      // }

      float feather = clamp(0.0, gl_FragColor.a, 10.0 * (0.5 - dist));
      vec3 outline_color = mix(vec3(0.0, 0.0, 0.0), gl_FragColor.rgb, 0.9);
      gl_FragColor.rgb = mix
        (outline_color,
         gl_FragColor.rgb,
         smoothstep(0.0, 1.0, (0.5 - dist) * 5.0));

    }
  }else{ //drawing data points as images

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

