const nngtFigure = document.querySelector("d-figure.nngt");
var nngt;

nngtFigure.addEventListener("ready", function() {
  console.log('nngtFigure ready');
  var epochs = d3.range(0,100,1);
  let fixed_dataset = 'mnist';
  var urls = utils.getTeaserDataURL(fixed_dataset);
  var [gl, programs] = utils.initGL(
    '#nngt', 
    [['shaders/teaser_vertex.glsl', 'shaders/teaser_fragment.glsl']]
  );


  var kwargs = {
    epochs,
    init_matrix: DIGIT17_MATRIX,
    shouldPlayGrandTour: false,
    shouldAutoNextEpoch: true, 
    fixed_dataset,
    overlayKwargs: {
      // fixed_dataset,
    }
  };
  nngt = new TeaserRenderer(gl, programs[0], kwargs);
  nngt.overlay.datasetOption.remove();

  allViews.push(nngt);
  nngt = utils.loadDataToRenderer(urls, nngt);

  utils.addDatasetListener(function(){
    // nngt.pause();
    // // nngt.dataObj.dataTensor = null;
    // // nngt.dataObj.labels = null;
    
    // var urls = utils.getTeaserDataURL(utils.getDataset());
    // nngt = utils.loadDataToRenderer(urls, nngt);
    // nngt.overlay.initLegend(utils.baseColors.slice(0,10), utils.getLabelNames());
    // if(utils.getDataset() == 'cifar10'){
    //   nngt.setColorFactor(0.0);
    // }else{
    //   nngt.setColorFactor(utils.COLOR_FACTOR);
    // }
    // nngt.shouldRecalculateColorRect = true;
    // 
  });
  
  window.addEventListener('resize', ()=>{
    nngt.overlay.resize();
    nngt.setFullScreen(nngt.isFullScreen);
  });
});

nngtFigure.addEventListener("onscreen", function() {
  console.log('nngt onscreen');
  if(nngt && nngt.play){
    nngt.shouldRender = true;
    nngt.play();
    if(nngt.init_matrix !== undefined){
      nngt.gt.setMatrix(nngt.init_matrix);
      nngt.setEpochIndex(12);
    }
  }
  for(let view of allViews){
    if(view !== nngt && view.pause){
      view.pause();
    }
  }
});

nngtFigure.addEventListener("offscreen", function() {
  console.log('nngt offscreen');
  if(nngt && nngt.pause){
    nngt.pause();
  }
});