const seFigure0 = document.querySelector("d-figure.nngt-single-epoch-0");
var se0;

seFigure0.addEventListener("ready", function() {
  console.log('nngt-single-epoch-0 ready');
  var epochs = [99,];
  var urls = utils.getTeaserDataURL();
  var [gl, programs] = utils.initGL(
    '#nngt-single-epoch-0', 
    [['shaders/teaser_vertex.glsl', 'shaders/teaser_fragment.glsl']]
  );
  var kwargs = { epochs, shouldAutoNextEpoch:false };
  se0 = new TeaserRenderer(gl, programs[0], kwargs);
  allViews.push(se0);
  se0.overlay = new TeaserOverlay(se0);
  se0.overlay.epochIndicator.remove();
  se0 = utils.loadDataToRenderer(urls, se0);

  utils.addDatasetListener(function(){
    se0.pause();

    var urls = utils.getTeaserDataURL();
    se0 = utils.loadDataToRenderer(urls, se0);
    se0.overlay.initLegend(
      utils.baseColors.slice(0,10), utils.getLabelNames());
    if(utils.getDataset() == 'cifar10'){
      se0.setColorFactor(0.0);
    }else{
      se0.setColorFactor(utils.COLOR_FACTOR);
    }
  });
  
  window.addEventListener('resize', ()=>{
    se0.overlay.resize();
    se0.setFullScreen(se0.isFullScreen);
  });
});

seFigure0.addEventListener("onscreen", function() {
  console.log('se0 onscreen');
  if(se0 && se0.play){
    se0.shouldRender = true;
    se0.play();
  }
  for(let view of allViews){
    if(view !== se0 && view.pause){
      view.pause();
    }
  }
});

seFigure0.addEventListener("offscreen", function() {
  console.log('se0 offscreen');
  if(se0 && se0.pause){
    se0.pause();
  }
});