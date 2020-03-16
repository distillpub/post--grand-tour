function LayerTransitionRenderer(gl, program, kwargs) {
  this.animId = undefined;
  this.gl = gl;
  this.program = program;

  this.hasAdversarial = false;
  this.epochIndicatorPrefix = 'epoch: ';
  this.imageSize = 1/10;

  this.framesForEpochTransition = 10; //total #frames for transition only
  this.framesBetweenEpoch = 60; //total #frames between epoch transition (trans+pause)
  this.framesForLayerTransition = 45; //total #frames for transition only
  this.framesBetweenLayer = 90; //total #frames between layer transition (trans+pause)

  //the defaults, or overwritten by kwargs
  this.shouldPlayGrandTour = true; 
  this.shouldAutoNextEpoch = false;
  this.shouldAutoNextLayer = false;
  this.mode = 'point';
  utils.walkObject(kwargs, (k) => {
    this[k] = kwargs[k];
  });
  this.pointSize0 = this.pointSize || 6.0;
  if(this.layerIndex === undefined){
    this.layerIndex = this.nlayer-2; //the layer before softmax
  }

  this.marginLeft = 2;
  this.marginBottom = 80;
  this.marginTop = 2;

  this.scaleFactor = 0.9;

  this.dataObj = {};
  this.epochIndex = this.nepoch-1;
  this.layerIndexPrev = undefined;


  this.colorFactor = utils.COLOR_FACTOR;
  this.isFullScreen = false;
  this.isDataReady = false;

  this.dataObj.dataTensor = [];
  this.dataObj.views = [];
  this.dataObj.viewDeterminants = [];

  this.alphas = new Array(this.npoint).fill(255);
  this.isPointBrushed = new Array(this.npoint).fill(true);
  this.isClassSelected = new Array(this.npoint).fill(true);

  console.log(this.init_dataset || utils.getDataset());
  this.dataset = this.init_dataset || utils.getDataset();

  this.overlay = new LayerTransitionOverlay(this, this.overlayKwargs);

  this.frame2layer = function(frame){
    frame = frame % (this.framesBetweenLayer * (this.nlayer-1));
    let layerIndex = math.floor(frame / this.framesBetweenLayer);
    frame = frame % this.framesBetweenLayer;
    let layerProgress = Math.min(1, frame / this.framesForLayerTransition);
    let layer = layerIndex + layerProgress;
    return layer;
  }

  this.frame2epoch = function(frame){
    frame = frame % (this.framesBetweenEpoch * (this.nepoch-1));
    let epochIndex = math.floor(frame / this.framesBetweenEpoch);
    frame = frame % this.framesBetweenEpoch;
    let epochProgress = Math.min(1, frame / this.framesForEpochTransition);
    let epoch = epochIndex + epochProgress;
    return epoch;
  }


  this.layer2frame = function(layer){
    let frame = Math.floor(layer) * this.framesBetweenLayer;
    let p = layer - Math.floor(layer);
    frame += p * this.framesForLayerTransition;
    if(layer == this.nlayer-1){
      frame -= 1;
    }
    return frame;
  };


  this.epoch2frame = function(epoch){
    let frame = Math.floor(epoch) * this.framesBetweenEpoch;
    let p = epoch - Math.floor(epoch);
    frame += p * this.framesForEpochTransition;
    if(epoch == this.nepoch-1){
      frame -= 1;
    }
    return frame;
  };


  this.initData = (buffer, url, urlIndex, urlCount, onReadyCallback) => {

    let dataRegex = url.match(/\/d(\d+)\.bin/);
    let viewRegex = url.match(/\/view(\d+)\.bin/);

    if (dataRegex !== null) {
      let layerIndex = parseInt(dataRegex[1]);
      let arr = new Float32Array(buffer);
      let ndim = arr.length / (this.npoint*this.nepoch);
      
      this.dataObj.dataTensor[layerIndex] = utils.reshape(arr, 
        [this.nepoch, this.npoint, ndim]);

    }else if(viewRegex !== null){
      let viewIndex = parseInt(viewRegex[1]);
      let arr = new Float32Array(buffer);
      let ndim = Math.sqrt(arr.length);
      this.dataObj.views[viewIndex] = utils.reshape(arr, [ndim, ndim]);

      this.dataObj.viewDeterminants[viewIndex] = numeric.det(this.dataObj.views[viewIndex]);

    }else{ //labels
      let arr = new Int8Array(buffer);
      this.dataObj.labels = Array.from(arr);
    }


    this.isDataReady = true;
    for (let i=0; i<this.nlayer; i++){
      if (this.dataObj.dataTensor[i] === undefined){
        this.isDataReady = false;
        break;
      }
      if (i!==this.nlayer-1 && this.dataObj.views[i] === undefined){
        this.isDataReady = false;
        break;
      }
    }
    if(this.dataObj.labels === undefined){
      this.isDataReady = false;
    }


    if (this.isDataReady){
      this.initGL(this.dataObj);

      if (this.gt === undefined) {
        this.gt = new GrandTour(10, this.init_matrix);
      }else if(this.gt.ndim != this.ndim){
        this.gt.setNdim(this.ndim);
      }

      if(this.animId==null || this.shouldRender==false){
        this.shouldRender = true;
        this.play();
      }
    }

    if (this.isDataReady && this.hasInitOnce===undefined) {
      // renderer.hasInitOnce===undefined indicates the renderer on init
      // (otherwise it is reloading other dataset)
      this.hasInitOnce = true;
      this.overlay.init();
      this.overlay.onSelectLegend(this.selectedClasses);
    }

    if(this.isDataReady && onReadyCallback !== undefined){
      onReadyCallback();
    }

  };


  // this.setFullScreen = function(shouldSet) {
  //   this.isFullScreen = shouldSet;
  //   let canvas = this.gl.canvas;
  //   let canvasSelection = d3.select('#'+canvas.id);

  //   d3.select(canvas.parentNode)
  //     .classed('fullscreen', shouldSet);

  //   if (shouldSet) {
  //     canvasSelection
  //       .attr('width', window.innerWidth)
  //       .attr('height', window.innerHeight)
  //       .classed('fullscreen', true);
  //   } else {
  //     canvasSelection
  //       .attr('width', 1000)
  //       .attr('height', 1000)
  //       .classed('fullscreen', false);
  //   }
  //   utils.resizeCanvas(canvas);
  //   gl.viewport(0, 0, canvas.width, canvas.height);
  // };


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

    
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE, gl.ONE_MINUS_SRC_ALPHA
    );
    
    // gl.enable(gl.DEPTH_TEST);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    this.colorBuffer = gl.createBuffer();
    this.colorLoc = gl.getAttribLocation(program, 'a_color');

    this.positionBuffer = gl.createBuffer();
    this.positionLoc = gl.getAttribLocation(program, 'a_position');

    this.textureCoordBuffer = gl.createBuffer();
    this.textureCoordLoc = gl.getAttribLocation(program, 'a_textureCoord');

    this.pointSizeLoc = gl.getUniformLocation(program, 'point_size');
    


    // let textureCoords = [];
    // for (let i=0; i<this.npoint; i++) {
    //   textureCoords.push(...utils.getTextureCoord(i));
    // }
    // for (let i=0; i<this.ndim*2; i++) {
    //   textureCoords.push([0, 0]);
    // }
    // if (this.textureCoordLoc !== -1) {
    //   gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
    //   gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoords), gl.STATIC_DRAW);
    //   gl.vertexAttribPointer(this.textureCoordLoc, 2, gl.FLOAT, false, 0, 0);
    //   gl.enableVertexAttribArray(this.textureCoordLoc);
    // }
    
    let texture;
    if (this.hasAdversarial){
      texture = utils.loadTexture(
        gl, utils.getAdversarialTextureURL()
      );
    }else{
      if(this.firstInit === undefined){
        this.dataset = this.init_dataset || utils.getDataset();
        this.firstInit = false;
      }
      texture = utils.loadTexture(gl, utils.getLayerTransitionTextureURL(this.dataset));
    }
    
    this.samplerLoc = gl.getUniformLocation(program, 'uSampler');
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(this.samplerLoc, 0);



    this.isDrawingAxisLoc = gl.getUniformLocation(program, 'isDrawingAxis');

    this.modeLoc = gl.getUniformLocation(program, 'mode');
    this.setMode(this.mode);

    this.colorFactorLoc = gl.getUniformLocation(program, 'colorFactor');
    this.setColorFactor(this.colorFactor);

    
  };

  
  this.shouldRender = true;

  this.epochFrame = this.epoch2frame(this.epochIndex);
  this.layerFrame = this.layer2frame(this.layerIndex);

  this.setLayer = function(l){
    this.setLayerEpoch(l, this.epochIndex);
  };

  this.setEpoch = function(e){
    this.setLayerEpoch(this.layerIndex, e);
  };

  this.setLayerEpoch = function(l, e){
    

    e = Math.max(0,e);

    if (this.dataObj.norms === undefined){//lazy init
      this.dataObj.norms = this.dataObj.dataTensor.map((tensor, layer)=>{
        tensor = tensor[tensor.length-1]; //last epoch
        //l_2 norm
        let norms = tensor.map((d,i)=>math.norm(d));
        // l_inf norm
        // let norms = tensor.map((d,i)=>math.abs(d));
        let max = math.max(norms);
        return max;
      });
    }else{//on dataset changed
      for(let i=0; i<this.nlayer; i++){
        if (this.dataObj.norms[i] == undefined 
          && this.dataObj.dataTensor[i] !== undefined){
          let lastEpochIndex = this.dataObj.dataTensor[i].length-1;
          let tensor = this.dataObj.dataTensor[i][lastEpochIndex];
          this.dataObj.norms[i] = math.max(tensor.map((d,i)=>math.norm(d)));
        }
      }
    }


    this.layerIndex = l;
    this.epochIndex = e;

    let l0 = Math.max(Math.floor(l), 0);
    let l1 = Math.max(Math.ceil(l), 0);
    let pl = l - l0;

    let e0 = Math.max(Math.floor(e), 0);
    let e1 = Math.max(Math.ceil(e), 0);
    let pe = e - e0;

    //overlay display
    this.overlay.layerSlider.property('value', l);
    this.overlay.epochSlider.property('value', e);

    let dist0 = l - Math.floor(l);
    let dist1 = Math.ceil(l) - l;

    if(dist0 < 0.1){
      this.overlay.layerIndicator.text(Math.floor(l));
    }else if(dist1 < 0.1){
      this.overlay.layerIndicator.text(Math.ceil(l));
    }else{
      this.overlay.layerIndicator.text(
        ''+Math.floor(l)+' -> '
        + this.layerNames[Math.floor(l)]
        +' -> '+Math.ceil(l));
    }

    this.overlay.epochIndicator.text(
      this.epochIndicatorPrefix + Math.round(e) + '/' + (this.nepoch-1)
    );


  };

  


  this.play = function() {
    if(this.animId !== null){
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    if(this.shouldRender){
      let dt = 0;
      if (this.shouldPlayGrandTour 
          || this.shouldAutoNextEpoch
          || this.shouldAutoNextLayer) {
        
        if (this.shouldPlayGrandTour) {
          dt = 1/60;
        } else {
          dt = 0;
        }
        if (this.shouldAutoNextLayer){
          this.layerFrame += 1;
        }
        if (this.shouldAutoNextEpoch) {
          this.epochFrame += 1;
        }
        let layer = this.frame2layer(this.layerFrame);
        let epoch = this.frame2epoch(this.epochFrame);
        this.setLayerEpoch(layer, epoch);
      }
      
      this.render(dt);
      this.overlay.redrawCentroidHandle();
      // this.overlay.redrawAxis();
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
    if(this.animId){
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.shouldRender = false;
    console.log('paused');    
  };


  this.recalculateColorRect = function(colors, bgColors){
    this.colorRect = utils.color2rect(colors, this.npoint, this.ndim);
    this.bgColorRect = utils.color2rect(bgColors, this.npoint, this.ndim);
  };


  this.render = function(dt) {
    if(!this.shouldRender){
      return;
    }

    let dataObj = this.dataObj;
    let dataTensor = dataObj.dataTensor;

    let layer = this.layerIndex;
    let prevLayer = this.layerIndexPrev;
    let epoch = this.epochIndex;

    if(dataTensor[Math.floor(layer)] === undefined){
      return;
    }

    
    let ndim;
    if(Math.floor(layer) !== this.nlayer-1){
      if(this.dataObj.views[Math.floor(layer)]){
        ndim = this.dataObj.views[Math.floor(layer)].length;
      }else{
        return;
      }
    }else{
      if(this.dataObj.views[Math.floor(layer)-1]){
        ndim = this.dataObj.views[Math.floor(layer)-1].length;
      }else{
        return;
      }
    }

    let labels = dataObj.labels || new Array(this.npoint).fill(0);
    let gl = this.gl;
    let gt = this.gt;
    let program = this.program;
    // 
    let data0 = dataTensor[Math.floor(layer)][Math.floor(epoch)];
    this.currentData = data0; //this is a reference used in direct manipulation in overlay.js

    let points;

    this.ndim = ndim;
    gt.setNdim(ndim);

    //internal view change in grand tour
    if (Math.floor(prevLayer) < Math.floor(layer) 
      && Math.floor(layer) !== this.nlayer-1 ){
  
      for(let l=Math.floor(prevLayer)+1; l<=Math.floor(layer); l++){
        console.log('forward', 
          Math.floor(prevLayer),'->', Math.floor(layer));

        let view = dataObj.views[l];
        view = math.transpose(view);
        ndim = view.length;
        this.ndim = ndim;
        gt.setNdim(ndim);
        let matrix = this.gt.getMatrix();
        matrix = math.multiply(view, matrix);
        this.gt.setMatrix(matrix);        
      }
      
    }else if(Math.floor(prevLayer) > Math.floor(layer)
      && Math.floor(prevLayer) !== this.nlayer-1 
      ){
      console.log('backward', 
        Math.floor(layer),'<-', Math.floor(prevLayer));
      
      for(let l=Math.floor(prevLayer); l>Math.floor(layer); l--){
        if (Math.floor(prevLayer) == this.nlayer-1){
          continue;
        }else{
          let view = dataObj.views[l];
          let matrix = this.gt.getMatrix();
          let submatrix = matrix.slice(0,view.length).map(row=>row.slice(0,view[0].length));
          submatrix = math.multiply(view, submatrix);
          matrix = utils.embed(submatrix, matrix);
          this.gt.setMatrix(matrix);
        }
      }
    }

    //for lt2.js in the article only
    if(Math.floor(layer) == 0 
      && !this.overlay.isViewManipulated 
      && this.layer0_matrix !== undefined){
      this.gt.setMatrix(this.layer0_matrix);
    }


    //interpolation between layers
    let points0, points1;
    let view0;
    if(Math.floor(layer) <= this.nlayer-2){
        let data1 = dataTensor[Math.ceil(layer)][Math.floor(epoch)];
        this.currentData = data1;
        view0 = this.dataObj.views[Math.floor(layer)];
        view0 = view0.slice(0,data0[0].length);
        let points0 = gt.project(data0, dt, view0);
        let points1 = gt.project(data1, 0);
        points = utils.mix(
          points0, points1,//points1.slice(0,this.npoint),
          layer-Math.floor(layer)
        );
    }else{
      points = gt.project(data0, dt);
    }

    // interpolation between epochs
    let points_e0, points_e1;
    if(Math.floor(epoch) != Math.ceil(epoch)){
      points_e0 = points;
      if(Math.floor(layer) != Math.ceil(layer)){
        let data01 = dataTensor[Math.floor(layer)][Math.ceil(epoch)];
        let data11 = dataTensor[Math.ceil(layer)][Math.ceil(epoch)];
        let points01 = gt.project(data01, 0, view0);
        let points11 = gt.project(data11, 0);
        points_e1 = utils.mix(points01, points11, layer-Math.floor(layer));
        points = utils.mix(points_e0, points_e1, epoch-Math.floor(epoch));
      }else{
        let data01 = dataTensor[Math.floor(layer)][Math.ceil(epoch)];
        let points_e1 = gt.project(data01, 0, view0);
        points = utils.mix(points_e0, points_e1, epoch-Math.floor(epoch));
      }   
    }
    this.points = points;


    //noramlize points to webgl coordinate
    dataObj.mean = math.mean(
      points.map(row => {
        return [row[0], row[1]];
      }),
    0);

    dataObj.dmax = math.max(
      points.map(row => {
        return [
          Math.abs(row[0]-dataObj.mean[0]), 
          Math.abs(row[1]-dataObj.mean[1]), 
        ];
      })
    );

    points = points.map((row)=>{
    row[0] -= dataObj.mean[0];
    row[1] -= dataObj.mean[1];
      return numeric.div(row, dataObj.dmax/(this.scaleFactor));
    });

    this.pointsNormalized = points; //used for brush

  

    let bgColors = labels.map((d)=>utils.bgColors[d]);
    let colors = labels.map((d)=>utils.baseColors[d]);
    // colors = colors.concat(utils.createAxisColors(ndim));
    colors = colors.map((c, i)=>[c[0], c[1], c[2], 255]);
    if (this.colorRect === undefined 
      || this.shouldRecalculateColorRect){
      this.recalculateColorRect(colors, bgColors);
      this.shouldRecalculateColorRect = false;
    }

    let colorBuffer = this.colorBuffer;
    let positionBuffer = this.positionBuffer;
    let colorLoc = this.colorLoc;
    let positionLoc = this.positionLoc;

    
    this.marginRight = utils.legendLeft[this.overlay.getDataset()];
    let width =  gl.canvas.clientWidth
      - this.marginLeft 
      - this.marginRight;
    let height = gl.canvas.clientHeight
      - this.marginBottom 
      - this.marginTop;
    let dpr = window.devicePixelRatio;
    gl.viewport(
      this.marginLeft*dpr, 
      this.marginBottom*dpr, 
      width*dpr, 
      height*dpr
    );

    

    

    //sort by z
    let pointIndexPairs = points.map((p,i)=>[p,i])
    .sort((a,b)=>a[0][2]-b[0][2]);
    points = pointIndexPairs.map(d=>d[0]);
    let colors_tmp = colors.map((_,i)=>{
      if (i<pointIndexPairs.length){
        return colors[pointIndexPairs[i][1]];
      }else{
        return colors[i];
      }
    });
    colors = colors_tmp;
    let bgColors_tmp = bgColors.map((_,i)=>{
      if (i<pointIndexPairs.length){
        return bgColors[pointIndexPairs[i][1]];
      }else{
        return bgColors[i];
      }
    });
    bgColors = bgColors_tmp;





    if (this.mode == 'image') {
      let textureCoords = [];
      for (let i=0; i<this.npoint; i++) {
        textureCoords.push(
          ...utils.getTextureCoord(
            pointIndexPairs[i][1], 
            this.npoint/100, 100, 
            this.hasAdversarial, 
            Math.floor(this.epochIndex), 
            this.nepoch
          )
        );
      }
      if (this.textureCoordLoc !== -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.textureCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(textureCoords), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(this.textureCoordLoc, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.textureCoordLoc);
      }
      colors = this.colorRect.map((d,i) =>
        this.colorRect[6*pointIndexPairs[Math.floor(i/6)][1]]
      );
      bgColors = this.bgColorRect.map((d,i) =>
        this.bgColorRect[6*pointIndexPairs[Math.floor(i/6)][1]]
      );
      points = utils.point2rect(points, this.npoint, 
        this.imageSize * Math.pow(this.scaleFactor, 0.5), 
        true
      );
    }


    //fix aspect ratio
    //shrink z direction to [0,1], which fit in the viewing box z=[-1,1];
    let z = points.map(row=>row[2]);
    let zmin = math.min(z);
    let zmax = math.max(z);
    points = points.map((row)=>row.map((d,i)=>{
      if (i == 0){
        return d / (gl.canvas.width / gl.canvas.height);
      }else if(i==1){
        return d;
      }else if(i==2){
        return (d-zmin) / (zmax-zmin);
      }
    }));


    gl.clearColor(...utils.CLEAR_COLOR, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    


    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Uint8Array(flatten(colors)), gl.STATIC_DRAW);
    gl.vertexAttribPointer(colorLoc, 4, gl.UNSIGNED_BYTE, true, 0, 0);
    gl.enableVertexAttribArray(colorLoc);
    

    let c0 = bgColors.map((c, i)=>[c[0], c[1], c[2], 30]);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(flatten(c0)), gl.STATIC_DRAW);

    

    this.isPointSelected = numeric.mul(
      this.isPointBrushed, 
      this.isClassSelected
    );
      
      
    this.alphas = this.isPointSelected.map(
      (seleted,i)=>seleted ? 255:0
    );

    let alphas = this.alphas.map((_,i)=>{
      if (i<pointIndexPairs.length){
        return this.alphas[pointIndexPairs[i][1]];
      }else{
        return this.alphas[i];
      }
    });


    //draw bg
    gl.uniform1i(this.isDrawingAxisLoc, 0);
    if (this.mode === 'point') {
      this.setPointSize(this.pointSize0 * Math.sqrt(this.scaleFactor));
      gl.drawArrays(gl.POINTS, 0, this.npoint);
    } else if (this.mode === 'image') {
      gl.drawArrays(gl.TRIANGLES, 0, 6*this.npoint);
    }


    //prepare fg color
    let c1;
    if (this.mode === 'point') {
      c1 = colors.map((c, i)=>[
        c[0], c[1], c[2], alphas[i]
      ]);
    } else if (this.mode === 'image') {
      c1 = colors.map((c, i)=>[
        c[0], c[1], c[2], alphas[Math.floor(i/6)]
      ]);
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(flatten(c1)), gl.STATIC_DRAW);


    //draw fg
    if (this.mode === 'point') {
      this.setColorFactor(utils.COLOR_FACTOR);
      
      gl.uniform1i(this.isDrawingAxisLoc, 0);
      gl.drawArrays(gl.POINTS, 0, this.npoint);
      //draw axis
      // gl.uniform1i(this.isDrawingAxisLoc, 1);
      // gl.drawArrays(gl.LINES, this.npoint, ndim*2);
      
    } else {
      if(utils.getDataset() == 'cifar10' && !this.hasAdversarial){
        this.setColorFactor(0.0);
      }else{
        this.setColorFactor(utils.COLOR_FACTOR);
      }
      
      gl.uniform1i(this.isDrawingAxisLoc, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6*this.npoint);
      //draw axis
      // this.setMode('point');
      // gl.uniform1i(this.isDrawingAxisLoc, 1);
      // gl.drawArrays(gl.LINES, this.npoint*6, this.ndim*2);
      this.setMode('image');
    }
    this.layerIndexPrev = this.layerIndex;
    return;
  };//end render

  this.setFullScreen = function(shouldSet) {
    this.isFullScreen = shouldSet;
    let canvas = this.gl.canvas;
    let canvasSelection = d3.select('#'+canvas.id)
      .classed('fullscreen', shouldSet);

    d3.select(canvas.parentNode)
      .classed('fullscreen', shouldSet);

    utils.resizeCanvas(canvas);
    this.overlay.resize();
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  this.resize = function(){
    utils.resizeCanvas(this.gl.canvas);
    this.render();
    this.overlay.resize();
  };


}
