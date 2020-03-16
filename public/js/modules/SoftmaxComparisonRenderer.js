function SoftmaxComparisonRenderer(gl, program, kwargs) {
  this.gl = gl;
  this.program = program;
  utils.walkObject(kwargs, (k) => {
    this[k] = kwargs[k];
  });
  let dpr = window.devicePixelRatio;
  this.xOffsetLeft = -100;
  this.xOffsetRight = 0;

  this.sx_center = d3.scaleLinear();
  this.sy_center = d3.scaleLinear();
  this.sz_center = d3.scaleLinear();
  this.sx = this.sx_center;
  this.sy = this.sy_center;
  this.sz = this.sz_center;
  this.canvasWidth0 = gl.canvas.clientWidth;

  this.overlay = new SoftmaxComparisonOverlay(this, [this.xOffsetLeft,this.xOffsetRight]);

  this.framesPerTransition = 30;
  this.framesPerEpoch = 60;

  this.dataObj = {test:{}, train:{}};
  this.epochIndex = this.epochs[0];
  this.mode = 'point';
  this.colorFactor = utils.COLOR_FACTOR;
  this.isFullScreen = false;
  this.scaleFactor = 1.0;

  this.pointSize0 = this.pointSize || 6.0;
  this.firstInit = true;
  
  

  this.initData = function(buffer, url) {
    if (url.includes('labels')) {
      if (url.includes('-test')){
        this.dataObj.test.labels = Array.from(new Int8Array(buffer));
      }else if (url.includes('-train')){
        this.dataObj.train.labels = Array.from(new Int8Array(buffer));
      }
      
    } else { //....softmax-[test|train].bin
      let arr = new Float32Array(buffer);
      let nepoch = 100;
      let npoint = 1000;
      let ndim = arr.length/(nepoch*npoint);
      if (url.includes('-test')){
        this.dataObj.test.dataTensor = utils.reshape(arr, [nepoch, npoint, ndim]);
      }else if (url.includes('-train')){
        this.dataObj.train.dataTensor = utils.reshape(arr, [nepoch, npoint, ndim]);
      }
    }

    if (this.dataObj.train.dataTensor && this.dataObj.train.labels
      && this.dataObj.test.dataTensor && this.dataObj.test.labels) {
      this.isDataReady = true;
      let dataTensor = this.dataObj.test.dataTensor;
      this.dataObj.dmax = 1.05*math.max(math.abs(
        dataTensor[dataTensor.length-1]));
      this.dataObj.ndim = dataTensor[0][0].length;
      this.dataObj.npoint = dataTensor[0].length;
      this.dataObj.nepoch = dataTensor.length;
      for(let mode of ['train', 'test']){
        if (this.dataObj[mode].alphas === undefined) {
          this.dataObj[mode].alphas = d3.range(
            this.dataObj.npoint + 5*this.dataObj.npoint).map((_) => 255);
        } else {
          this.overlay.restoreAlpha();
        }
      }
      
      this.initGL(this.dataObj);
      this.setEpochIndex(this.epochs[this.epochs.length-1]);

      

    }



    if (this.isDataReady && this.isPlaying===undefined) {
      // renderer.isPlaying===undefined indicates the renderer on init
      // otherwise it is reloading other dataset
      this.isPlaying = true;
      this.overlay.init();
      this.play();
      this.overlay.repositionAll();
    }

    if(this.isDataReady && (this.animId==null || this.shouldRender==false)){
        this.shouldRender = true;
        this.play();
      }
  };


  this.setFullScreen = function(shouldSet) {
    this.isFullScreen = shouldSet;
    let canvas = this.gl.canvas;

    let canvasSelection = d3.select('#'+canvas.id);

    d3.select(canvas.parentNode)
      .classed('fullscreen', shouldSet);

    if (shouldSet) {
      canvasSelection
        // .attr('width', window.innerWidth)
        // .attr('height', window.innerHeight)
        .classed('fullscreen', true);
    } else {
      canvasSelection
        // .attr('width', 1000)
        // .attr('height', 1000)
        .classed('fullscreen', false);
    }
    utils.resizeCanvas(canvas);
    gl.uniform1f(this.canvasWidthLoc, canvas.clientWidth);
    gl.uniform1f(this.canvasHeightLoc, canvas.clientHeight);

  };


  this.setMode = function(mode='point') {
    this.mode = mode;
    if (mode === 'point') {
      gl.uniform1i(this.modeLoc, 0);
    } else if (mode === 'image') {
      gl.uniform1i(this.modeLoc, 1);
    }
  };


  this.initGL = function(dataObj) {
    let gl = this.gl;
    let program = this.program;
    // init
    utils.resizeCanvas(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(...utils.CLEAR_COLOR, 1.0);

    // gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE, gl.ONE_MINUS_SRC_ALPHA
    );

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    this.colorBuffer = gl.createBuffer();
    this.colorLoc = gl.getAttribLocation(program, 'a_color');

    this.positionBuffer = gl.createBuffer();
    this.positionLoc = gl.getAttribLocation(program, 'a_position');

    this.textureCoordBuffer = gl.createBuffer();
    this.textureCoordLoc = gl.getAttribLocation(program, 'a_textureCoord');

    this.pointSizeLoc = gl.getUniformLocation(program, 'point_size');
    
    let textureCoords = [];
    for (let i=0; i<dataObj.npoint; i++) {
      textureCoords.push(...utils.getTextureCoord(i));
    }
    for (let i=0; i<dataObj.ndim*2; i++) {
      textureCoords.push([0, 0]);
    }

    if (this.textureCoordLoc !== -1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoords), gl.STATIC_DRAW);
      gl.vertexAttribPointer(this.textureCoordLoc, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(this.textureCoordLoc);
    }
    
    if(this.firstInit == true){
      // if initialized
      this.dataset = this.init_dataset || utils.getDataset();
      this.firstInit = false;
    }else{
      // if second init when dataset changed
      this.dataset = utils.getDataset();
    }
    

    this.textureLeft = utils.loadTexture(gl, utils.getTextureURL(this.dataset, 'train'));
    this.textureRight = utils.loadTexture(gl, utils.getTextureURL(this.dataset, 'test'));
    this.samplerLoc = gl.getUniformLocation(program, 'uSampler');
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textureLeft);
    
    gl.uniform1i(this.samplerLoc, 0);

    this.isDrawingAxisLoc = gl.getUniformLocation(program, 'isDrawingAxis');

    this.canvasWidthLoc = gl.getUniformLocation(program, 'canvasWidth');
    this.canvasHeightLoc = gl.getUniformLocation(program, 'canvasHeight');
    gl.uniform1f(this.canvasWidthLoc, gl.canvas.clientWidth);
    gl.uniform1f(this.canvasHeightLoc, gl.canvas.clientHeight);

    this.modeLoc = gl.getUniformLocation(program, 'mode');
    this.setMode(this.mode);

    this.colorFactorLoc = gl.getUniformLocation(program, 'colorFactor');
    if(this.dataset == 'cifar10'){
      this.setColorFactor(0.0);
    }else{
      this.setColorFactor(utils.COLOR_FACTOR);
    }
    
    if (this.gt === undefined || this.gt.ndim != dataObj.ndim) {
      this.gt = new GrandTour(dataObj.ndim, this.init_matrix);
    }
  };

  if (this.shouldPlayGrandTour === undefined){
    this.shouldPlayGrandTour = true;
  }
  if (!this.hasOwnProperty('shouldAutoNextEpoch')){
    this.shouldAutoNextEpoch = true;
  }
  this.shouldRender = true;
  // this.t = 1e4;
  this.s = 0;


  this.play = function() {
    if(this.shouldRender){
      let dt = 0;
      if (this.shouldPlayGrandTour 
        || this.shouldAutoNextEpoch) {
        if (this.shouldPlayGrandTour) {
          dt = 1/60;
        } else {
          dt = 0;
        }
        if (this.shouldAutoNextEpoch) {
          this.s += 1;
          if (this.s % this.framesPerEpoch == 0) {
            this.nextEpoch();
          }
        }  
      }

      if (this.shouldRender 
        && this.dataObj.test.dataTensor !== undefined){
        this.render(dt);
        // this.overlay.redrawAxis();
      }
    }
    this.animId = requestAnimationFrame(this.play.bind(this));
   
  };

  this.setColorFactor = function(f) {
    this.colorFactor = f;
    this.gl.uniform1f(this.colorFactorLoc, f);
  };

  this.setPointSize = function(s) {
    this.pointSize = s;
    gl.uniform1f(this.pointSizeLoc, s * window.devicePixelRatio);
  };


  this.pause = function() {
    // this.shouldRender = false;
    // clearInterval(this.intervalHandle);
    // this.intervalHandle = null;
    // 
    if(this.animId){
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.shouldRender = false;
    console.log('paused');
  };


  this.setEpochIndex = (i)=>{
    this.epochIndex = i;
    this.overlay.epochSlider
      .property('value', i);

    this.overlay.svg.select('#epochIndicator')
      .text('Epoch: ' 
            + this.epochIndex
            + '/' 
            + (this.dataObj.nepoch-1)
          );
  };


  this.nextEpoch = function() {
    if (this.epochs.length == 1){
      return;
    }

    if (this.epochIndex < this.epochs.length-1) {
      this.setEpochIndex( this.epochIndex+1 );
    } else {
      this.setEpochIndex( this.epochs[0] );
    }
  };


  this.prevEpoch = function() {
    if (this.epochs.length == 1){
      return;
    }

    if (this.epochIndex > 0) {
      this.setEpochIndex(this.epochIndex-1);
    } else {
      this.setEpochIndex(this.epochs.length-1);
    }
  };
  

  this.render = function(dt) {
    
    let dataObj = this.dataObj;
    let data = this.dataObj.test.dataTensor[this.epochIndex];
    let labels = this.dataObj.test.labels;
    let gl = this.gl;
    let gt = this.gt;
    let program = this.program;
    

    let drawPoints = (mode='test', xOffset=0, yOffset=0)=>{
      let data = this.dataObj[mode].dataTensor[this.epochIndex];
      let labels = this.dataObj[mode].labels;
      let alphas = dataObj[mode].alphas;

      if(mode == 'train'){
        // gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textureLeft);
      }else if(mode == 'test'){
        // gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.textureRight);
      }
      

      data = data.concat(utils.createAxisPoints(dataObj.ndim));
      let points = gt.project(data, dt);

      if (this.epochIndex > 0 
          && (this.s%this.framesPerEpoch)<this.framesPerTransition) {
        let data0 = this.dataObj[mode].dataTensor[this.epochIndex-1];
        data0 = data0.concat(utils.createAxisPoints(dataObj.ndim));
        let points0 = gt.project(data0, dt/this.framesPerTransition);
        points = utils.mix(
          points0, points, 
          (this.s%this.framesPerEpoch)/this.framesPerTransition);
      }

      //update based on the right grand tour plot
      let marginRight = utils.legendLeft[this.overlay.getDataset()]+15
      let marginLeft = 32 + (this.gl.canvas.clientWidth-marginRight-32)/2;
      
      utils.updateScale_center(points, gl.canvas,
        this.sx_center, this.sy_center, this.sz_center, 
        this.scaleFactor,
        marginRight,
        65,//margin bottom
        marginLeft,
        38,//margin top
      );
      this.xOffsetLeft = -(this.gl.canvas.clientWidth-marginRight-marginLeft);

      this.overlay.xOffsetLeft = this.xOffsetLeft;
      this.overlay.xOffsetRight = this.xOffsetRight;

      this.sx = this.sx_center;
      this.sy = this.sy_center;
      this.sz = this.sz_center;

      points = utils.data2canvas(points, this.sx, this.sy, this.sz);


      if (this.mode == 'image') {
        points = utils.point2rect(points, dataObj.npoint, 14 * Math.sqrt(this.scaleFactor));
      }
      dataObj.points = points;

      let colors = labels.map((d)=>utils.baseColors[d]);
      let bgColors = labels.map((d)=>utils.bgColors[d]);

      colors = colors.concat(utils.createAxisColors(dataObj.ndim));
      colors = colors.map((c, i)=>[c[0], c[1], c[2], alphas[i]]);

      if (this.mode == 'image') {
        if(this.colorRect===undefined){
          this.colorRect = {};
          this.bgColorRect = {};
        }
        if(this.colorRect===undefined || this.shouldRecalculateColorRect[mode]){
          this.colorRect[mode] = utils.color2rect(colors, dataObj.npoint, dataObj.ndim);
          this.bgColorRect[mode] = utils.color2rect(bgColors, dataObj.npoint, dataObj.ndim);
          this.shouldRecalculateColorRect[mode] = false;
        }
        colors = this.colorRect[mode];
        bgColors = this.bgColorRect[mode];
      }
      dataObj.colors = colors;

      let colorBuffer = this.colorBuffer;
      let positionBuffer = this.positionBuffer;
      let colorLoc = this.colorLoc;
      let positionLoc = this.positionLoc;

      gl.viewport(
        xOffset * dpr, yOffset * dpr, 
        gl.canvas.width, gl.canvas.height 
      );

      
      
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
      gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(positionLoc);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER,
                    new Uint8Array(flatten(colors)), gl.STATIC_DRAW);
      gl.vertexAttribPointer(colorLoc, 4, gl.UNSIGNED_BYTE, true, 0, 0);
      gl.enableVertexAttribArray(colorLoc);
      
      let c0 = bgColors.map((c, i)=>[c[0], c[1], c[2], 20]);
      gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(flatten(c0)), gl.STATIC_DRAW);

      let c1;
      if (this.mode === 'point') {
        gl.uniform1i(this.isDrawingAxisLoc, 0);
        this.setPointSize(this.pointSize0 * Math.sqrt(this.scaleFactor));
        gl.drawArrays(gl.POINTS, 0, dataObj.npoint);
        c1 = colors.map((c, i)=>[c[0], c[1], c[2], alphas[i]]);
      } else {
        gl.drawArrays(gl.TRIANGLES, 0, dataObj.npoint*6);
        c1 = colors.map((c, i)=>[c[0], c[1], c[2], alphas[Math.floor(i/6)]]);
      }
      gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(flatten(c1)), gl.STATIC_DRAW);

      if (this.mode === 'point') {
        gl.uniform1i(this.isDrawingAxisLoc, 0);
        gl.drawArrays(gl.POINTS, 0, dataObj.npoint);

        gl.uniform1i(this.isDrawingAxisLoc, 1);
        gl.drawArrays(gl.LINES, dataObj.npoint, dataObj.ndim*2);
      } else {
        gl.uniform1i(this.isDrawingAxisLoc, 0);
        gl.drawArrays(gl.TRIANGLES, 0, dataObj.npoint*6);
        
        this.setMode('point');
        gl.uniform1i(this.isDrawingAxisLoc, 1);
        gl.drawArrays(gl.LINES, dataObj.npoint*6, dataObj.ndim*2);
        this.setMode('image');
      }
    }

    gl.clearColor(...utils.CLEAR_COLOR, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    for (let [mode, offset] of [['train', this.xOffsetLeft], ['test', this.xOffsetRight]]){
      drawPoints(mode, offset);
    }
    this.overlay.redrawAxis();
    
  };
}
