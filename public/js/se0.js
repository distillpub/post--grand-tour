let id = 'nngt-single-epoch-0';
const seFigure0 = document.querySelector(`d-figure.${id}`);
var se0;

seFigure0.addEventListener("ready", function() {
  console.log(id + ' ready');
  var epochs = d3.range(100);
  var urls = utils.getTeaserDataURL();
  var [gl, programs] = utils.initGL(
    `#${id}`, 
    [['shaders/teaser_vertex.glsl', 'shaders/teaser_fragment.glsl']]
  );
  var kwargs = {
    epochs, 
    shouldAutoNextEpoch:false, 
    epochIndex:5,
  };
  se0 = new TeaserRenderer(gl, programs[0], kwargs);
  allViews.push(se0);
  // se0.overlay = new TeaserOverlay(se0);
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
  if(se0 && se0.pause){
    se0.pause();
  }
});