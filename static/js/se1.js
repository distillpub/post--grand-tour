const seFigure1 = document.querySelector("d-figure.nngt-single-epoch-1");
var se1;

seFigure1.addEventListener("ready", function() {
  console.log('nngt-single-epoch-1 ready');
  var epochs = d3.range(100);
  var urls = utils.getTeaserDataURL();
  var [gl, programs] = utils.initGL(
    '#nngt-single-epoch-1', 
    [['shaders/teaser_vertex.glsl', 'shaders/teaser_fragment.glsl']]
  );
  var kwargs = { 
    epochs, 
    shouldAutoNextEpoch:false, 
    epochIndex: 99,
  };
  se1 = new TeaserRenderer(gl, programs[0], kwargs);
  allViews.push(se1);
  se1 = utils.loadDataToRenderer(urls, se1);

  utils.addDatasetListener(function(dataset){
    se1.pause();
    var urls = utils.getTeaserDataURL(dataset);
    se1 = utils.loadDataToRenderer(urls, se1);
    se1.overlay.initLegend(
      utils.baseColors.slice(0,10), 
      utils.getLabelNames(false, dataset)
    );
    se1.overlay.repositionAll();

    if(utils.getDataset() == 'cifar10'){
      se1.setColorFactor(0.0);
    }else{
      se1.setColorFactor(utils.COLOR_FACTOR);
    }

    se1.overlay.datasetSelection.selectAll('option')
    .property('selected', d=>{
      return d.value == dataset;
    });

  });
  
  window.addEventListener('resize', ()=>{
    se1.overlay.resize();
    se1.setFullScreen(se1.isFullScreen);
  });
});

seFigure1.addEventListener("onscreen", function() {
  console.log('se1 onscreen');
  if(se1 && se1.play){
    se1.shouldRender = true;
    se1.play();
  }
  for(let view of allViews){
    if(view !== se1 && view.pause){
      view.pause();
    }
  }
});

seFigure1.addEventListener("offscreen", function() {
  if(se1 && se1.pause){
    se1.pause();
  }
});