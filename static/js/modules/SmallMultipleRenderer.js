function SmallMultipleRenderer(gl, program, kwargs) {
  // default arguments
  this.setKwargs = function(kwargs) {
    if (kwargs.epochs === undefined) {
      kwargs.epochs = [2, 5, 10, 20, 50, 99];
    }
    if (kwargs.methods === undefined) {
      kwargs.methods = ['pca', 'tnse', 'umap'];
    }
    utils.walkObject(kwargs, (k) => {
      this[k] = kwargs[k];
    });
    this.nrow = kwargs.methods.length;
    this.ncol = kwargs.epochs.length;
  };
  this.setKwargs(kwargs);


  this.gl = gl;
  this.program = program;
  
  this.dataObj = {dataTensor: {}};
  this.mode = 'point';
  this.colorFactor = utils.COLOR_FACTOR;
  this.isFullScreen = false;

  this.initData = function(buffer, url) {
    if (url.includes('labels.bin')) {
      this.dataObj.labels = Array.from(new Int8Array(buffer));
    } else {
      let embeddingMethod = url.split('/');
      embeddingMethod = embeddingMethod[embeddingMethod.length-1];
      embeddingMethod = embeddingMethod.split('.')[0];

      let arr = new Float32Array(buffer);
      let nepoch = 100;
      let npoint = 1000;
      let ndim = arr.length/(nepoch*npoint);
      this.dataObj[embeddingMethod] = utils.reshape(
        arr, [nepoch, npoint, ndim]);
    }

    this.isDataReady = true;
    for (let k of this.methods) {
      if (this.dataObj[k] === undefined) {
        this.isDataReady = false;
        break;
      }
    }

    this.isDataReady = this.isDataReady && this.dataObj.labels !== undefined;

    if ( this.isDataReady) {
      this.dataObj.npoint = 1000;
      this.dataObj.nepoch = 100;
      if (this.dataObj.alphas === undefined) {
        // when first init
        this.dataObj.alphas = d3.range(this.dataObj.npoint).map((_)=>255);
      } else {
        // when changing dataset causes this init
        this.overlay.clearAllBrushes();
        this.overlay.onSelectLegend(d3.range(10));
      }
      this.initGL(this.dataObj);
      this.resizeCanvas();
      this.render();
    }

    if (this.isDataReady && this.isPlaying===undefined) {
      // renderer.isPlaying===undefined indicates the renderer on init
      // otherwise it is reloading other dataset
      this.isPlaying = true;
      // this.play();
      this.overlay.init();
    }
  };

  this.resizeCanvas = function() {
    let width = parseFloat(d3.select(this.gl.canvas).attr('width'));
    let height = width / this.ncol * this.nrow;
    gl.canvas.height = height;
    utils.resizeCanvas(gl.canvas);
  };

  this.initGL = function(dataObj) {
    let gl = this.gl;
    let program = this.program;
    this.resizeCanvas();
    
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

    this.textureCoordBuffer = gl.createBuffer();
    this.textureCoordLoc = gl.getAttribLocation(program, 'a_textureCoord');
    
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
    
    let texture = utils.loadTexture(
      gl, utils.getTextureURL());
    this.samplerLoc = gl.getUniformLocation(program, 'uSampler');
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(this.samplerLoc, 0);


    this.modeLoc = gl.getUniformLocation( program, 'mode' );
    this.setMode(this.mode);

    this.colorFactorLoc = gl.getUniformLocation(program, 'colorFactor');
    this.setColorFactor(this.colorFactor);
  };


  this.setMode = function(mode='point') {
    this.mode = mode;
    if (mode === 'point') {
      gl.uniform1i(this.modeLoc, 0);
    } else if (mode === 'image') {
      gl.uniform1i(this.modeLoc, 1);
    }
  };

  this.setColorFactor = function(f) {
    this.colorFactor = f;
    this.gl.uniform1f(this.colorFactorLoc, f);
  };


  this.resize = function() {
    this.resizeCanvas();
    this.render();
  };
  

  this.render = function() {
    let dataObj = this.dataObj;
    let labels = this.dataObj.labels;
    let gl = this.gl;
    let gt = this.gt;
    let program = this.program;
    
    let colorBuffer = this.colorBuffer;
    let positionBuffer = this.positionBuffer;
    let colorLoc = this.colorLoc;
    let positionLoc = this.positionLoc;

    let width = gl.canvas.width;
    let height = gl.canvas.height;
    let sideLength = Math.min(width / this.ncol, height / this.nrow);
    let colors = labels.map((d)=>utils.baseColors[d]);
    colors = colors.map((c, i)=>[c[0], c[1], c[2], dataObj.alphas[i]]);
    if (this.mode == 'image') {
      colors = utils.color2rect(colors, dataObj.npoint, dataObj.ndim);
    }
    dataObj.colors = colors;

    gl.clearColor( ...utils.CLEAR_COLOR_SMALL_MULTIPLE, 1.0 );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    dataObj.points = {};
      for (let i=0; i<this.nrow; i++) {
      let dataTensor = dataObj[this.methods[i]];
      dataObj.points[this.methods[i]] = {};
      // let dmax;
      let isDmaxConsistent = false;
      // if (this.methods[i].includes('manual') 
      //     || this.methods[i].includes('random')
      //     || this.methods[i].includes('pca')) {
      //   // dmax = 1.25 * math.max(math.abs(dataTensor[dataTensor.length-1]));
      //   // isDmaxConsistent = true;
      //   isDmaxConsistent = false;
      // } else {
      //   isDmaxConsistent = false;
      // }

      for (let j=0; j<this.ncol; j++) {

        let points = dataTensor[this.epochs[j]];
        if (!isDmaxConsistent) {
          let min = math.min(points, 0);
          let max = math.max(points, 0);
          points = points.map((row)=>row.map((d, j)=>{
            d = (d-min[j])/(max[j]-min[j])*2-1;
            d /= 1.20;
            return d;
          }));
        } else {
          points = points.map((row)=>row.map((d)=>d/dmax));
        }
        dataObj.points[this.methods[i]][this.epochs[j]] = points;

        let dpr = window.devicePixelRatio;
        let margin = 5;
        gl.viewport( 
          j*(sideLength)+margin*dpr, (this.nrow-(i+1))*sideLength+margin*dpr, 
          sideLength-2*margin*dpr, sideLength-2*margin*dpr
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLoc);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(flatten(colors)),
                      gl.STATIC_DRAW);
        gl.vertexAttribPointer( colorLoc, 4, gl.UNSIGNED_BYTE, true, 0, 0);
        gl.enableVertexAttribArray( colorLoc );
        
        let c0 = colors.map((c, i)=>[c[0], c[1], c[2], 20]);
        gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(flatten(c0)),
                      gl.STATIC_DRAW);
        if (this.mode === 'point') {
          gl.drawArrays(gl.POINTS, 0, dataObj.npoint);
        } else {
          gl.drawArrays(gl.TRIANGLES, 0, dataObj.npoint*6);
        }

        let c1 = colors.map((c, i)=>{
          return [
            c[0], c[1], c[2], 
            this.mode === 'point' ?
              dataObj.alphas[i] : dataObj.alphas[Math.floor(i/6)]];
        });    
        gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(flatten(c1)),
                      gl.STATIC_DRAW);
        if (this.mode === 'point') {
          gl.drawArrays( gl.POINTS, 0, dataObj.npoint );
        } else {
          gl.drawArrays( gl.TRIANGLES, 0, dataObj.npoint*6 );
        }
      }
    }
  };

  this.play = this.render;
  this.pause = ()=>{};
}
