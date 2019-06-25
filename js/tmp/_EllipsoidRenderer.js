function TeaserRenderer(gl, program, kwargs) {
  this.CLEAR_COLOR = [.95, .95, .95];// [0.9,0.9,0.9];
  this.gl = gl;
  this.program = program;
  utils.walkObject(kwargs, (k) => {
    this[k] = kwargs[k];
  });

  this.dataObj = {};
  this.isDataReady = false;
  this.initData = function(buffer, url) {
    if (url.includes('labels.bin')) {
      this.dataObj.labels = Array.from(new Int8Array(buffer));
    } else {
      this.dataObj.dataTensor = utils.reshape(new Float32Array(buffer),
                                              [100, 1000, 10]);
    }

    // let dataObj = {dataTensor, labels, dmax, ndim, npoint, nepoch, alphas};

    if (this.dataObj.dataTensor && this.dataObj.labels) {
      this.isDataReady = true;
      let dataTensor = this.dataObj.dataTensor;
      this.dataObj.trajectoryLength = 5;
      this.dataObj.dmax = 1.05*math.max(
        math.abs(dataTensor[dataTensor.length-1]));
      this.dataObj.ndim = dataTensor[0][0].length;
      this.dataObj.npoint = dataTensor[0].length;
      this.dataObj.nepoch = dataTensor.length;
      this.dataObj.alphas = d3.range(
        this.dataObj.npoint + 2*this.dataObj.npoint).map((_) => 255);

      this.epochIndex = 0;
      this.initGL(this.dataObj);
    }
  };


  this.initGL = function(dataObj) {
    let gl = this.gl;
    let program = this.program;
    // init
    utils.resizeCanvas(gl.canvas);

    gl.viewport( 0, 0, gl.canvas.width, gl.canvas.height );
    gl.clearColor( ...this.CLEAR_COLOR, 1.0 );

    // gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    this.colorBuffer = gl.createBuffer();
    this.colorLoc = gl.getAttribLocation( program, 'a_color' );

    this.positionBuffer = gl.createBuffer();
    this.positionLoc = gl.getAttribLocation( program, 'a_position' );

    let gt = new GrandTour(dataObj.ndim);
    this.gt = gt;
  };


  this.shouldPlay = true;
  this.shouldAutoNextEpoch = true;
  this.t = 1e4;
  this.s = 0;

  let thisRenderer = this;
  this.play = function() {
    thisRenderer.shouldPlay = true;
    console.log('playing');
    setTimeout( function() {
      if (thisRenderer.shouldPlay || thisRenderer.shouldAutoNextEpoch) {
        if (thisRenderer.shouldPlay) {
          thisRenderer.t += 1;
        }
        if (thisRenderer.shouldAutoNextEpoch) {
          thisRenderer.s += 1;
          if (thisRenderer.epochIndex !== thisRenderer.dataObj.nepoch-1) {
            if (thisRenderer.s % 6 == 0) {
              thisRenderer.nextEpoch();
            }
          } else {
            if (thisRenderer.s % 60 == 0) {
              thisRenderer.nextEpoch();
            }
          }

          if (thisRenderer.epochIndex == thisRenderer.dataObj.nepoch-1) {
            d3.select('#trainingIndicator')
              .text('Trained '
                    + thisRenderer.epochs[thisRenderer.epochIndex] 
                    + '/' 
                    + thisRenderer.epochs[thisRenderer.dataObj.nepoch-1] 
                   );
          } else {
            d3.select('#trainingIndicator')
              .text('Epoch: ' 
                    + thisRenderer.epochs[thisRenderer.epochIndex] 
                    + '/' 
                    + thisRenderer.epochs[thisRenderer.dataObj.nepoch-1]
                   );
          }
        }
        thisRenderer.render();
        requestAnimFrame(thisRenderer.play);
      }
    }, 1000/60); 
  };


  this.pause = function() {
    thisRenderer.shouldPlay = false;
    console.log('paused');
  };


  // this.preprocessData = function(data_raw){
  //     let dataTensor = data_raw.slice(0, data_raw.length-1)
  //     .map(data => d3.dsvFormat(',').parseRows(data));

  //     let labels = d3.dsvFormat(',').parseRows(data_raw[data_raw.length-1]);

  //     dataTensor = dataTensor.map(data=>{
  //       return data.map(row=>row.map(d=>+d));
  //     });

  //     labels = labels.map(function(row){
  //       return +row[0];
  //     });

  //     let dmax = 1.05*math.max(math.abs(dataTensor[dataTensor.length-1]));
  //     let ndim = dataTensor[0][0].length;
  //     let npoint = dataTensor[0].length;
  //     let nepoch = dataTensor.length;
  //     let alphas = d3.range(npoint + 2*ndim).map(_=>255);

  //     this.epochIndex = 0;

  //     let dataObj = {dataTensor, labels, dmax, ndim, npoint, nepoch, alphas};
  //     return dataObj;
  //   };


  this.setEpochIndex = function(i) {
    this.epochIndex = i;
  };


  this.nextEpoch = function() {
    if (this.epochIndex < this.dataObj.nepoch-1) {
      this.epochIndex +=1;
    } else {
      this.epochIndex = 0;
    }
  };


  this.prevEpoch = function() {
    if (this.epochIndex > 0) {
      this.epochIndex -=1;
    } else {
      this.epochIndex = this.dataObj.nepoch-1;
    }
  };
  

  this.render = function() {
    let dataObj = this.dataObj;
    let data = this.dataObj.dataTensor[this.epochIndex];
    let labels = this.dataObj.labels;
    let gl = this.gl;
    let gt = this.gt;
    let program = this.program;
    
    data = data.concat(utils.createAxisPoints(dataObj.ndim));

    let points = gt.project(data, this.t);
    points = points.map((row)=>row.map((d)=>d/dataObj.dmax));
    dataObj.points = points;

    let colors = labels.map((d)=>utils.baseColors[d]);
    colors = colors.concat(utils.createAxisColors(dataObj.ndim));

    colors = colors.map((c, i)=>[c[0], c[1], c[2], dataObj.alphas[i]]);

    dataObj.colors = colors;

    let colorBuffer = this.colorBuffer;
    let positionBuffer = this.positionBuffer;
    let colorLoc = this.colorLoc;
    let positionLoc = this.positionLoc;

    gl.viewport( 
      (gl.canvas.width-gl.canvas.height)/2, 0, 
      gl.canvas.height, gl.canvas.height 
    );
    gl.clearColor( ...this.CLEAR_COLOR, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    gl.vertexAttribPointer( positionLoc, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( positionLoc );

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(flatten(colors)),
                  gl.STATIC_DRAW);
    gl.vertexAttribPointer( colorLoc, 4, gl.UNSIGNED_BYTE, true, 0, 0 );
    gl.enableVertexAttribArray( colorLoc );
    

    gl.drawArrays( gl.POINTS, 0, dataObj.npoint );
    gl.drawArrays( gl.LINES, dataObj.npoint, dataObj.ndim*2 );
    return;
  };
}
