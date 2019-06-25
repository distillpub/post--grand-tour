const dm1Figure = document.querySelector("d-figure.nngt-dm1");
var dm1;

dm1Figure.addEventListener("ready", function() {
  console.log('nngt-dm1 ready');
  var epochs = [99,];
  var urls = utils.getTeaserDataURL();
  var [gl, programs] = utils.initGL(
    '#nngt-dm1', 
    [['shaders/teaser_vertex.glsl', 'shaders/teaser_fragment.glsl']]
  );
  var kwargs = { epochs, shouldAutoNextEpoch:false };
  dm1 = new TeaserRenderer(gl, programs[0], kwargs);
  allViews.push(dm1);
  dm1.overlay = new TeaserOverlay(dm1);
  dm1.overlay.epochIndicator.remove();
  dm1 = utils.loadDataToRenderer(urls, dm1);

  utils.addDatasetListener(function(){
    dm1.pause();
    dm1.dataObj.dataTensor = null;
    dm1.dataObj.labels = null;

    var urls = utils.getTeaserDataURL();
    dm1 = utils.loadDataToRenderer(urls, dm1);
    dm1.overlay.initLegend(
      utils.baseColors.slice(0,10), utils.getLabelNames());
    if(utils.getDataset() == 'cifar10'){
      dm1.setColorFactor(0.0);
    }else{
      dm1.setColorFactor(utils.COLOR_FACTOR);
    }
  });
  
  window.addEventListener('resize', ()=>{
    dm1.overlay.resize();
    dm1.setFullScreen(dm1.isFullScreen);
  });
});

dm1Figure.addEventListener("onscreen", function() {
  console.log('dm1 onscreen');
  if(dm1 && dm1.play){
    dm1.shouldRender = true;
    dm1.play();
  }
  for(let view of allViews){
    if(view !== dm1 && view.pause){
      view.pause();
    }
  }
});

dm1Figure.addEventListener("offscreen", function() {
  console.log('dm1 offscreen');
  if(dm1 && dm1.pause){
    dm1.pause();
  }
});