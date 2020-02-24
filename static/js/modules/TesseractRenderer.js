function TesseractRenderer(gl, program, kwargs) {
  this.gl = gl;
  this.program = program;

  utils.walkObject(kwargs, (k) => {
    this[k] = kwargs[k];    
  });

  this.overlay = new TesseractOverlay(this);

  this.init = function() {
    this.initData();
    this.initGL();
    this.overlay.init();
    this.render();
  };

  this.setPointSize = function(s) {
    this.pointSize = s;
    gl.uniform1f(this.pointSizeLoc, s * window.devicePixelRatio);
  };


  this.dataObj = {
    rectangle: {},
    cube: {},
    tesseract: {}
  };

  this.initData = function() {
    this.dataObj.rectangle.data = [
      [1, 1], [-1, 1],
      [-1, 1], [-1, -1],
      [-1, -1], [1, -1],
      [1, -1], [1, 1],
    ];

    this.dataObj.cube.data = [
      [1, 1, 1], [-1, 1, 1], [-1, 1, 1], [-1, -1, 1],
      [-1, -1, 1], [1, -1, 1], [1, -1, 1], [1, 1, 1],
      [1, 1, -1], [-1, 1, -1], [-1, 1, -1], [-1, -1, -1],
      [-1, -1, -1], [1, -1, -1], [1, -1, -1], [1, 1, -1],
      [1, 1, 1], [1, 1, -1], [-1, 1, 1], [-1, 1, -1],
      [-1, -1, 1], [-1, -1, -1], [1, -1, 1], [1, -1, -1],
    ];

    let basePoints = [
      [1, 1, 1, 1], [-1, 1, 1, 1],
      [-1, -1, 1, 1], [1, -1, 1, 1],
      [1, 1, -1, 1], [-1, 1, -1, 1],
      [-1, -1, -1, 1], [1, -1, -1, 1],

      [1, 1, 1, -1], [-1, 1, 1, -1],
      [-1, -1, 1, -1], [1, -1, 1, -1],
      [1, 1, -1, -1], [-1, 1, -1, -1],
      [-1, -1, -1, -1], [1, -1, -1, -1],
    ];

    let indices = [
      0, 1, 1, 2, 2, 3, 3, 0,
      4, 5, 5, 6, 6, 7, 7, 4,
      0, 4, 1, 5, 2, 6, 3, 7,

      8, 9, 9, 10, 10, 11, 11, 8,
      12, 13, 13, 14, 14, 15, 15, 12,
      8, 12, 9, 13, 10, 14, 11, 15,

      0, 8, 1, 9, 2, 10, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15
    ];
    this.dataObj.tesseract.data = indices.map((i)=>basePoints[i]);
    this.dataObj.dmax = 3;
  };


  this.initGL = function() {
    let gl = this.gl;
    let program = this.program;
    // init
    utils.resizeCanvas(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(...utils.CLEAR_COLOR, 1.0);

    // gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    this.positionBuffer = gl.createBuffer();
    this.positionLoc = gl.getAttribLocation(program, 'a_position');
    this.isDrawingLinesLoc = gl.getUniformLocation(program, 'isDrawingLines');
    this.pointSizeLoc = gl.getUniformLocation(program, 'point_size');
    this.setPointSize(3.0);

    this.gts = ([2, 3, 4]).map((d)=>new GrandTour(d));
    this.gts.forEach((gt, i)=>gt.STEPSIZE=(3-i)*0.10);
  };

  this.shouldPlay = true;
  let thisRenderer = this;

  this.play = function() {
    thisRenderer.shouldPlay = true;
    this.render();
    this.animId = window.requestAnimFrame(this.play.bind(this));
  };


  this.pause = function() {
    thisRenderer.shouldPlay = false;
    if(this.animId){
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    console.log('tesseract paused');
  };


  this.render = function() {
    console.log('tesseract rendering...')
    if (this.shouldPlay) {
      let dataObj = this.dataObj;
      let gl = this.gl;
      let gts = this.gts;
      let program = this.program;
      
      let data = [
        dataObj.rectangle.data,
        dataObj.cube.data,
        dataObj.tesseract.data
      ];

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.clearColor(...utils.CLEAR_COLOR, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      let positionBuffer = this.positionBuffer;
      let positionLoc = this.positionLoc;
      
      let npoints = [8, 24, 64];
      let side = Math.min(gl.canvas.height, gl.canvas.width/3);
      for (let i=0; i<3; i++) {
        let center = [gl.canvas.width/3*(i+1/2) +
                      (1-i)*(gl.canvas.width/12), gl.canvas.height/2];
        gl.viewport(
          center[0]-side/2, center[1]-side/2, 
          side, side
        );
        
        let points = gts[i].project(data[i], 1/60);
        points = points.map((row)=>row.map((d)=>d/dataObj.dmax));
        
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
        
        gl.vertexAttribPointer(positionLoc, i==0?2:3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLoc);

        gl.uniform1i(this.isDrawingLinesLoc, 0);
        gl.drawArrays(gl.POINTS, 0, npoints[i]);

        gl.uniform1i(this.isDrawingLinesLoc, 1);
        gl.drawArrays(gl.LINES, 0, npoints[i]);
      }
    }
  };

  this.resize = function(){
    let canvas = this.gl.canvas;
    utils.resizeCanvas(canvas);
  };

}
