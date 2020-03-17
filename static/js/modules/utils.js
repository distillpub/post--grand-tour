d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

let utils = {};

// for deployment
// utils.no_cors_host = 'data-no-cors/';
// utils.cors_host = '//cors-hdc.cs.arizona.edu/~mwli/cors/distill-gt-data/';

// for local debugging (with data stored in data/):
utils.no_cors_host = 'data-no-cors/';
// utils.cors_host = ''; 

// utils.CLEAR_COLOR = [.97, .97, .97];
// utils.CLEAR_COLOR = [250/255,250/255,250/255];
// utils.CLEAR_COLOR = [254/255,254/255,254/255];
// utils.CLEAR_COLOR_SMALL_MULTIPLE = [.95, .95, .95];

utils.CLEAR_COLOR = [1,1,1];
utils.CLEAR_COLOR_SMALL_MULTIPLE = [1,1,1];
utils.MIN_EPOCH = 0;
utils.MAX_EPOCH = 99;
utils.COLOR_FACTOR = 0.9;
utils.dataset = 'mnist';
utils.datasetListener = [];
utils.pointAlpha = 255 * 0.1;

//legend of teaser, grand tour plots
utils.legendLeft = {
  'mnist':55,
  'fashion-mnist':95,
  'cifar10':95,
  'mnist-adversarial': 95
};
utils.legendRight = {
  'mnist':2,
  'fashion-mnist':2,
  'cifar10':2,
  'mnist-adversarial': 2
};

//legend of small multiple
utils.smLegendLeft = {
  'mnist':45,
  'fashion-mnist':85,
  'cifar10':85,
  'mnist-adversarial': 85
};
utils.smLegendRight = {
  'mnist':2,
  'fashion-mnist':2,
  'cifar10':2,
  'mnist-adversarial': 2
};

utils.legendTitle = {
  'mnist': 'Digit',
  'fashion-mnist': undefined,
  'cifar10': undefined,
  'mnist-adversarial': 'Digit',
};

//for softmax grandtour
utils.buttonOffsetY = {
  'default': 245,
  'adversarial': 265,
};

//for small multiples & softmax grandtour
utils.buttonColors = {
  'on': '#B3C5F4',
  'off': '#f3f3f3',
}




utils.mixScale = function(s0,s1,progress, func){
  let range0 = s0.range();
  let range1 = s1.range();

  let domain0 = s0.domain();
  let domain1 = s1.domain();
  progress = Math.max(progress, 0);
  progress = Math.min(progress, 1);
  progress = func(progress);

  return d3.scaleLinear()
  .domain(utils.mix(domain0, domain1, progress))
  .range(utils.mix(range0, range1, progress));
};

utils.data2canvas = function(points, sx, sy, sz){
  points = points.map(row=>{
    return [sx(row[0]), sy(row[1]), sz(row[2])];
  });
  return points;
};


utils.updateScale_span = function(points, canvas, sx, sy, sz, 
  scaleFactor=1.0,
  marginRight=undefined,
  marginBottom=undefined, 
  marginLeft=undefined,
  marginTop=undefined){

  if (marginTop === undefined){
    marginTop = 22;
  }
  if (marginBottom === undefined){
    marginBottom = 65;
  }
  if (marginLeft === undefined){
    marginLeft = 32;
  }
  if (marginRight === undefined){
    marginRight = d3.max(Object.values(utils.legendLeft)) + 15;
  }

  let vmin = math.min(points, 0);
  let vmax = math.max(points, 0);
  let xDataRange = vmax[0]-vmin[0];
  let yDataRange = vmax[1]-vmin[1];
  
  let yMiddle = ((canvas.clientHeight-marginBottom) + marginTop ) /2;
  let yRadius0 = ((canvas.clientHeight-marginBottom) - marginTop ) /2;

  let xMiddle = ((canvas.clientWidth-marginRight) + marginLeft)/2;
  let xRadius0 = ((canvas.clientWidth-marginRight) - marginLeft)/2;

  let xRadius = Math.min(xRadius0, yRadius0 / yDataRange * xDataRange);
  let yRadius = Math.min(yRadius0, xRadius0 / xDataRange * yDataRange);

  xRadius *= scaleFactor;
  yRadius *= scaleFactor;

  sy.domain([vmin[1], vmax[1]])
  .range([yMiddle+yRadius, yMiddle-yRadius]);

  sx.domain([vmin[0], vmax[0]])
  .range([xMiddle-xRadius, xMiddle+xRadius]);

  sz.domain([vmin[2], vmax[2]])
  .range([0,1]);

};


utils.updateScale_center = function(points, canvas, sx, sy, sz, 
  scaleFactor=1.0,
  marginRight=undefined,
  marginBottom=undefined, 
  marginLeft=undefined,
  marginTop=undefined
  ){

  if (marginTop === undefined){
    marginTop = 22;
  }
  if (marginBottom === undefined){
    marginBottom = 65;
  }
  if (marginLeft === undefined){
    marginLeft = 32;
  }
  if (marginRight === undefined){
    marginRight = d3.max(Object.values(utils.legendLeft)) + 15;
  }

  let vmax = math.max(math.abs(points), 0);
  let vmin = numeric.neg(vmax);

  let xDataRange = 2*vmax[0];
  let yDataRange = 2*vmax[1];

  let yMiddle = ((canvas.clientHeight-marginBottom) + marginTop ) /2;
  let yRadius0 = ((canvas.clientHeight-marginBottom) - marginTop ) /2;

  let xMiddle = ((canvas.clientWidth-marginRight) + marginLeft)/2;
  let xRadius0 = ((canvas.clientWidth-marginRight) - marginLeft)/2;

  let xRadius = Math.min(xRadius0, yRadius0 / yDataRange * xDataRange);
  let yRadius = Math.min(yRadius0, xRadius0 / xDataRange * yDataRange);

  xRadius *= scaleFactor;
  yRadius *= scaleFactor;

  sx.domain([vmin[0], vmax[0]])
  .range([xMiddle-xRadius, xMiddle+xRadius]);

  sy.domain([vmin[1], vmax[1]])
  .range([yMiddle+yRadius, yMiddle-yRadius]);

  sz.domain([vmin[2], vmax[2]])
  .range([0,1]);
};


utils.toDataURL = function(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    var reader = new FileReader();
    reader.onloadend = function() {
      callback(reader.result);
    }
    reader.readAsDataURL(xhr.response);
  };
  xhr.open('GET', url);
  xhr.responseType = 'blob';
  xhr.send();
}



utils.embed = function(matrix, canvas){
  for(let i=0; i<matrix.length; i++){
    for(let j=0; j<matrix[0].length; j++){
      canvas[i][j] = matrix[i][j];
    }
  }
  return canvas;
}



// huh: https://eslint.org/docs/rules/guard-for-in
utils.walkObject = function(obj, f) {
  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      f(key);
    }
  }
};


utils.scaleRows = function(matrix, isRowSelected, beta1, beta0){
  let selectedCount = numeric.sum(isRowSelected);
  let res = matrix.map((row,i)=>{
    row = row.slice();
    if(isRowSelected[i]){
      row = numeric.mul(row, beta1/selectedCount);
    }else{
      row = numeric.mul(row, beta0/(matrix.length-selectedCount));
    }
    return row;
  });
  return res;
};


utils.getNet = function(name) {
  let net;
  if (name == 'cifar10') {
    net = [
      {type: 'data', name: 'input', size: [32, 32], img_dimension: [1440, 32]},

      {type: 'function', name: 'conv1',
       blocks: ['conv_5x5(3->10)', 'ReLU', 'maxpool_2x2']},
      {type: 'data', name: 'conv1', size: [28, 70], img_dimension: [1260, 7000]},

      {type: 'function', name: 'conv2',
       blocks: ['conv_5x5(10->20)', 'ReLU', 'maxpool_2x2']},
      {type: 'data', name: 'conv2', size: [20, 25], img_dimension: [900, 2500]},

      {type: 'function', name: 'fc1',
       // blocks: ['flatten', 'linear(500->120)', 'ReLU', 'dropout(0.1)']},
       blocks: ['linear(500->120)', 'ReLU']},
      {type: 'data', name: 'fc1', size: [10, 12], img_dimension: [450, 1200]},

      {type: 'function', name: 'fc2',
       // blocks: ['linear(120->84)', 'ReLU', 'dropout(0.5)']},
       blocks: ['linear(120->84)', 'ReLU']},
      {type: 'data', name: 'fc2', size: [7, 12], img_dimension: [315, 1200]},

      {type: 'function', name: 'fc3',
       blocks: ['linear(84->10)']},
      {type: 'data', name: 'fc3', size: [2, 5], img_dimension: [90, 500]},

      {type: 'function', name: 'softmax', blocks: ['softmax']},
      {type: 'data', name: 'softmax', size: [2, 5], img_dimension: [90, 500]},

      {type: 'function', name: 'argmax', blocks: ['argmax']},
      {type: 'data', name: 'argmax', size: [1, 1], img_dimension: [0, 0]},
    ];
  } else {
    net = [
      {type: 'data', name: 'input', size: [28, 28], img_dimension: [1260, 28]},

      {type: 'function', name: 'conv1',
       blocks: ['conv_5x5(1->10)', 'maxpool_2x2', 'ReLU']},
      {type: 'data', name: 'conv1', size: [24, 60], img_dimension: [1080, 6000]},

      {type: 'function', name: 'conv2',
       // blocks: ['conv_5x5(10->20)', 'dropout2d(0.5)', 'maxpool_2x2', 'ReLU']},
       blocks: ['conv_5x5(10->20)', 'maxpool_2x2', 'ReLU']},
      {type: 'data', name: 'conv2', size: [16, 20], img_dimension: [720, 2000]},

      {type: 'function', name: 'fc1',
       // blocks: ['flatten', 'linear(320->50)', 'ReLU', 'dropout(0.2)']},
       blocks: ['linear(320->50)', 'ReLU']},
      {type: 'data', name: 'fc1', size: [5, 10], img_dimension: [225, 1000]},

      {type: 'function', name: 'fc2', blocks: ['linear(50->10)', 'ReLU']},
      {type: 'data', name: 'fc2', size: [2, 5], img_dimension: [90, 500]},

      {type: 'function', name: 'softmax', blocks: ['softmax']},
      {type: 'data', name: 'softmax', size: [2, 5], img_dimension: [90, 500]},

      {type: 'function', name: 'argmax', blocks: ['argmax']},
      {type: 'data', name: 'argmax', size: [1, 1], img_dimension: [0, 0]},
    ];
  }
  return net;
};


utils.setDataset = function(datasetName, callback0) {
    this.dataset = datasetName;
    for (let callback of utils.datasetListener) {
      callback(datasetName);
    }
    if (callback0 !== undefined){
      callback0();
    }
  // }
};


utils.getDataset = function() {
  return this.dataset;
};


utils.addDatasetListener = function(callback) {
  utils.datasetListener.push(callback);
};


utils.clearDatasetListener = function() {
  for (let i=0; i<utils.datasetListener.length; i++) {
    utils.datasetListener.pop();
  }
};


utils.getLabelNames = function(adversarial=false, dataset=undefined) {
  if (dataset === undefined){
    dataset = utils.getDataset();
  }
  let res;
  if (dataset == 'mnist') {
    res = d3.range(10).map((i)=>''+i); 
  } else if (dataset == 'fashion-mnist') {
    res = ['T-shirt/top', 'Trouser', 'Pullover', 'Dress', 'Coat',
            'Sandal', 'Shirt', 'Sneaker', 'Bag', 'Ankle boot'];
  } else if (dataset == 'cifar10') {
    res = ['Airplane', 'Automobile', 'Bird', 'Cat', 'Deer',
            'Dog', 'Frog', 'Horse', 'Ship', 'Truck'];
  } else {
    throw new Error('Unrecognized dataset ' + dataset);
  }
  if (adversarial){
    res.push('adversarial');
  }
  return res;
};


utils.getTeaserDataURL = function(dataset=utils.getDataset(), datasetType='test') {
  return [
    utils.no_cors_host+'data/softmax/'+dataset+'/softmax-'+datasetType+'.bin',
    utils.no_cors_host+'data/softmax/'+dataset+'/labels-'+datasetType+'.bin'
  ];
};

utils.getTextureURL = function(dataset=utils.getDataset(), datasetType='test') {
  return utils.no_cors_host+'data/softmax/'+dataset+'/input-'+datasetType+'.png';
};

utils.getAdversarialTextureURL = function(dataset='mnist') {
  return utils.no_cors_host+'data/adversarial/'+dataset+'/input.png';
};

utils.getLayerTransitionTextureURL = function(dataset='mnist') {
  return utils.no_cors_host+'data/layer-transition-test/'+dataset+'/input.png';
};

utils.getSmallMultipleDataURL = function(methods, dataset) {
  if(dataset === undefined){
    dataset = utils.getDataset();
  }
  let urls = methods.map(d =>
    utils.no_cors_host+'data/comparison/'+dataset+'/'+d+'.bin'
  );
  urls.push(utils.no_cors_host+'data/comparison/'+dataset+'/labels.bin');
  return urls;
};


utils.getLayerTransitionURL = function(dataset=utils.getDataset(), datasetType='test'){
  let ds, views;
  if (dataset=='cifar10'){
    ds = d3.range(13); //num of layers
    views = d3.range(12); //num of view alignment matrices
  }else{
    ds = d3.range(12);
    views = d3.range(11);
  }

  let urls = ds.map(i=>utils.no_cors_host+'data/layer-transition-' + datasetType + '/'+dataset+'/d'+i+'.bin')
    .concat( views.map(i=>utils.no_cors_host+'data/layer-transition-' + datasetType + '/'+dataset+'/view'+i+'.bin') );
  urls.push(utils.no_cors_host+'data/layer-transition-' + datasetType + '/'+dataset+'/labels.bin');
  return urls;
}


utils.getAdversarialURL = function(dataset='mnist') { //only has mnist for now
  let ds = d3.range(12);
  let views = d3.range(11);
  let urls = ds.map(i=>utils.no_cors_host+'data/adversarial/'+dataset+'/d'+i+'.bin')
    .concat( views.map(i=>utils.no_cors_host+'data/adversarial/'+dataset+'/view'+i+'.bin') );
    urls.push(utils.no_cors_host+'data/adversarial/'+dataset+'/labels.bin');
  return urls;
};



utils.initGL = function(canvasid, shaderPathPairs) {
  let canvas = document.getElementById(canvasid.slice(1));
  let gl = canvas.getContext('webgl', {premultipliedAlpha: false} );
  let programs = [];
  for (let i=0; i<shaderPathPairs.length; i++) {
    programs.push(initShaders(
      gl, shaderPathPairs[i][0], shaderPathPairs[i][1]));
  }
  return [gl, programs];
};


utils.loadDataWithCallback = function(urls, callback) {
  for (let i=0; i<urls.length; i++) {
    utils.loadDataBin(urls[i], (buffer, url)=>{
      callback(buffer, url, i, urls.length);
    });
  }
};


function bannerAnimation(renderer){
  let banner = renderer.overlay.banner;
  let bannerText = renderer.overlay.bannerText;
  function repeat(){
    bannerText
      .text('Loading')
      .transition()
      .duration(500)
      .text('Loading.')
      .transition()
      .duration(500)
      .text('Loading..')
      .transition()
      .duration(500)
      .text('Loading...')
      .on('end', repeat);
  }
  repeat();
}


function createBanner(renderer){
  let overlay = renderer.overlay;
  if(overlay.figure){
    overlay.banner = overlay.figure.selectAll('.banner')
      .data([0])
      .enter()
      .append('div')
      .attr('class', 'banner')
    overlay.banner = overlay.figure.selectAll('.banner');
    overlay.bannerText = overlay.banner
      .selectAll('.bannerText')
      .data([0])
      .enter()
      .append('p')
      .attr('class', 'bannerText');
    overlay.bannerText = overlay.banner.selectAll('.bannerText');
  }
}

utils.loadDataToRenderer = function(urls, renderer, onReadyCallback) {
  if(renderer.overlay){
    createBanner(renderer);
    bannerAnimation(renderer);
  }

  for (let i=0; i<urls.length; i++) {
    utils.loadDataBin(urls[i], (buffer, url)=>{
      renderer.initData(buffer, url, i, urls.length, onReadyCallback);
    });
  }
  return renderer;
};


utils.reshape = function(array, shape) {
  let res = [];
  if (shape.length == 2) {
    for (let row=0; row<shape[0]; row++) {
      res.push([]);
      for (let col=0; col<shape[1]; col++) {
        res[res.length-1].push(array[shape[1] * row + col]);
      }
    }
  } else {
    let blocksize = math.prod(shape.slice(1));
    for (let i=0; i<shape[0]; i++) {
      res.push(
        utils.reshape(array.slice(i*blocksize, (i+1)*blocksize), shape.slice(1))
      );
    }
  }
  return res;
};


utils.cacheAll = function(urls){
  for(let url of urls){
    utils.loadDataBin(url, ()=>{});
  }
};


utils.cache = {};
utils.loadDataBin = function(url, callback) {
  if(url in utils.cache){
    callback(utils.cache[url], url);
  }else{
    let xhr = new window.XMLHttpRequest();
    let ready = false;
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 
          && xhr.status === 200
          && ready !== true) {
        if (xhr.responseType === 'arraybuffer') {
          utils.cache[url] = xhr.response;
          callback(xhr.response, url);
        } else if (xhr.mozResponseArrayBuffer !== null) {
          utils.cache[url] = xhr.mozResponseArrayBuffer;
          callback(xhr.mozResponseArrayBuffer, url);
        } else if (xhr.responseText !== null) {
          let data = String(xhr.responseText);
          let ary = new Array(data.length);
          for (let j = 0; j<data.length; j++) {
            ary[j] = data.charCodeAt(j) & 0xff;
          }
          let uint8ay = new Uint8Array(ary);
          utils.cache[url] = uint8ay.buffer;
          callback(uint8ay.buffer, url);
        }
        ready = true;
      }
    };
    xhr.open('GET', url, true);
    xhr.responseType='arraybuffer';
    xhr.send();
    }
};


utils.loadDataCsv = function(fns, renderer) {
  let promises = fns.map((fn) => d3.text(fn));
  Promise.all(promises).then(function(dataRaw) {
    renderer.initData(dataRaw);
    renderer.play();
  });
};


utils.resizeCanvas = function(canvas) {
  let DPR = window.devicePixelRatio;

  let displayWidth = DPR*canvas.clientWidth;
  let displayHeight = DPR*canvas.clientHeight;
  // Check if the canvas is not the same size.
  if (canvas.width != displayWidth ||
      canvas.height != displayHeight) {
    // Make the canvas the same size
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
  canvas.style.width = canvas.clientWidth;
  canvas.style.height = canvas.clientHeight;
};

// utils.baseColors = [
//   [166,206,227], [31,120,180],  [178,223,138],
//   [51,160,44],   [251,154,153], [227,26,28],
//   [253,191,111], [255,127,0],   [202,178,214],
//   [106,61,154],  [255,255,153], [177,89,40]
// ];

utils.baseColorsHex = d3.schemeCategory10;
utils.baseColorsHex.push('#444444');
utils.baseColorsHex.push('#444444');

function hexToRgb(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ];
}

// utils.baseColors = [
//   '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728',
//   '#9467bd', '#8c564b', '#e377c2', '#7f7f7f',
//   '#bcbd22', '#17becf'
// ];

utils.baseColors = utils.baseColorsHex.map((d)=>(hexToRgb(d)));

utils.bgColors = numeric.add( numeric.mul(utils.baseColors, 0.6), 0.95*255*0.4);


utils.createAxisPoints = function(ndim) {
  let res = math.eye(ndim)._data;
  for (let i=ndim-1; i>=0; i--) {
    res.splice(i, 0, math.zeros(ndim)._data);
  }
  return res;
};


utils.createAxisColors = function(ndim) {
  let res = d3.range(ndim*2).map(
    (d, i) => utils.baseColors[Math.floor(i/2) % utils.baseColors.length]
  );
  return res;
};


utils.linearInterpolate = function(data1, data2, p) {
  // let res = math.zeros(data1.length, data1[0].length)._data;
  // for (let i=0; i<data1.length; i++) {
  //   for (let j=0; j<data1[0].length; j++) {
  //     res[i][j] = data1[i][j]*(1-p) + data2[i][j]*(p);
  //   }
  // }
  let a = math.multiply(data1, 1-p);
  let b = math.multiply(data2, p);
  let res = math.add(a,b);
  return res;
};

utils.mix = function(data1, data2, p) {
  return utils.linearInterpolate(data1, data2, p);
};


utils.orthogonalize = function(matrix, priorityRowIndex=0) {
  // make row vectors in matrix pairwise orthogonal;
  
  function proj(u, v) {
    return numeric.mul(numeric.dot(u, v)/numeric.dot(u, u), u);
  }

  function normalize(v, unitlength=1) {
    if (numeric.norm2(v) <= 0) {
      return v;
    } else {
      return numeric.div(v, numeric.norm2(v)/unitlength);
    }
  }

  // Gram–Schmidt orthogonalization
  let priorityRow = matrix[priorityRowIndex];
  let firstRow = matrix[0];
  matrix[0] = priorityRow;
  matrix[priorityRowIndex] = firstRow;

  matrix[0] = normalize(matrix[0]);
  for (let i=1; i<matrix.length; i++) {
    for (let j=0; j<i; j++) {
        matrix[i] = numeric.sub(matrix[i], proj(matrix[j], matrix[i]));
    }
    matrix[i] = normalize(matrix[i]);
  }
  let tempRow = matrix[0];
  matrix[0] = matrix[priorityRowIndex];
  matrix[priorityRowIndex] = tempRow;
  return matrix;
};


utils.point2rect = function(points, npoint, sideLength, yUp=false) {
  let res = [];

  //points
  for (let i=0; i<npoint; i++) {
    let x = points[i][0];
    let y = points[i][1];
    let z = points[i][2];

    let ul, ur, ll, lr;

    if (yUp){
      ul = [x-sideLength/2, y+sideLength/2, z]; // upper left
      ur = [x+sideLength/2, y+sideLength/2, z]; // upper right
      ll = [x-sideLength/2, y-sideLength/2, z]; // lower left
      lr = [x+sideLength/2, y-sideLength/2, z]; // lower right
    }else{
      // points in canvas coordinate (so downward means y-coord increase)
      ul = [x-sideLength/2, y-sideLength/2, z]; // upper left
      ur = [x+sideLength/2, y-sideLength/2, z]; // upper right
      ll = [x-sideLength/2, y+sideLength/2, z]; // lower left
      lr = [x+sideLength/2, y+sideLength/2, z]; // lower right
    }
    res.push(ur, ul, ll, ur, ll, lr);
  }

  //axis
  for (let i=npoint; i<points.length; i++) {
    res.push(points[i]);
  }
  return res;
};


utils.color2rect = function(colors, npoint, ndim) {
  let pointColors = colors.slice(0, npoint)
      .map((c)=>[c, c, c, c, c, c])
      .reduce((a, b)=>a.concat(b), []);
  let axisColors = colors.slice(npoint, npoint+2*ndim);
  return pointColors.concat(axisColors);
};


utils.getTextureCoord = function(i, 
  nRow=10, nCol=100,
  isAdversarial=false, epoch=99, nepoch=100) {
  let nRow0 = nRow;
  let npoint;
  if(isAdversarial){
    npoint = nRow * nCol;
    nRow = nRow + nepoch;
  }


  let ul, ur, ll, lr;
  let numPerRow = nCol;
  let numPerCol = nRow;
  let dx = 1/numPerRow;
  let dy = 1/numPerCol;
  if(isAdversarial && i>=npoint-89){// hardcoded: last 89 are adversarial examples
    ul = [dx * ((i-(npoint-89))%numPerRow), dy*Math.floor(nRow0+epoch)];
  }else{
    ul = [dx * (i%numPerRow), dy*Math.floor(i/numPerRow)];
  }
  ur = ul.slice();
  ur[0] += dx;
  ll = ul.slice();
  ll[1] += dy;
  lr = ul.slice();
  lr[0] += dx;
  lr[1] += dy;

  return [ur, ul, ll, ur, ll, lr];
};


utils.loadTexture = function(gl, url) {
  function isPowerOf2(x) {
    return x & (x-1) == 0;
  }

  let texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  let level = 0;
  let internalFormat = gl.RGBA;
  let width = 1;
  let height = 1;
  let border = 0;
  let srcFormat = gl.RGBA;
  let srcType = gl.UNSIGNED_BYTE;
  let pixel = new Uint8Array([0, 0, 255, 255]);

  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border,
                srcFormat, srcType, pixel);

  let image = new Image();
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }
  };
  image.src = url;
  return texture;
};

utils.setTeaser = function(renderer, datasetname, epochIndex, classes, 
                           shouldAutoNextEpoch=true, timeout=0, callback=undefined) {
  utils.setDataset(datasetname, ()=>{
    renderer.setEpochIndex(epochIndex);
    if(classes.length > 0){
      renderer.overlay.selectedClasses = new Set(classes);
      renderer.overlay.onSelectLegend(classes);
    }else{
      renderer.overlay.selectedClasses = new Set();
      renderer.overlay.restoreAlpha();
    }
    
    renderer.shouldAutoNextEpoch=shouldAutoNextEpoch;
    d3.select(renderer.overlay.svg.node().parentElement)
    .select('.play-button')
    .attr('class', ()=>{
      if (renderer.shouldAutoNextEpoch) {
        return 'tooltip play-button fa fa-pause';
      } else {
        return 'tooltip play-button fa fa-play';
      }
    })
    if(callback){
      callback();
    }
  });
  // setTimeout(()=>{
    
  // }, timeout);
};


// utils.matrixExp = function(matrix, niter=10){
//   let e = math.eye(matrix.length)._data;
//   let running_power = matrix.map(row=>row.slice());
//   for (let k=1; k<niter; k++){
//     e = numeric.add(e, 
//       numeric.div(running_power, math.factorial(k)) );
//     running_power = numeric.dot(running_power, matrix);
//   }
//   return e;
// };

// utils.matrixLog = function(matrix, niter=30){
//   // work when matrix ~~ eye
//   let mSubEye = numeric.sub(matrix, math.eye(matrix.length)._data);

//   let running_power = mSubEye.map(row=>row.slice());
//   let res = math.zeros(matrix.length, matrix.length)._data;
//   for (let k=1; k<niter; k++){
//     res = numeric.add(res, numeric.div( running_power, Math.pow(-1, k+1) * k ) );
//     running_power = numeric.dot(running_power, mSubEye);
//   }
//   return res;
// };

