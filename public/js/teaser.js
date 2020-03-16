const teaserFigure = document.querySelector("d-figure.teaser");
var teaser;

teaserFigure.addEventListener("ready", function() {
  console.log('teaserFigure ready');
  var epochs = d3.range(0,100,1);
  var urls = utils.getTeaserDataURL();

  var [gl, programs] = utils.initGL(
    '#teaser', 
    [['shaders/teaser_vertex.glsl', 'shaders/teaser_fragment.glsl']]
  );

  var kwargs = {
    epochs: epochs, 
    shouldAutoNextEpoch: true
  };
  teaser = new TeaserRenderer(gl, programs[0], kwargs);
  allViews.push(teaser);
  
  teaser.overlay.fullScreenButton.style('top', '18px');
  teaser.overlay.epochSlider.style('top', 'calc(100% - 28px)');
  teaser.overlay.playButton.style('top', ' calc(100% - 34px)');
  teaser.overlay.grandtourButton.style('top', ' calc(100% - 34px)');

  // teaser.overlay.fullScreenButton.remove();
  teaser.overlay.modeOption.remove();
  teaser.overlay.datasetOption.remove();
  teaser.overlay.zoomSliderDiv.remove();
  // teaser.overlay.grandtourButton.remove();
  
  teaser = utils.loadDataToRenderer(urls, teaser);

  utils.addDatasetListener(function(){
    // var urls = utils.getTeaserDataURL();
    
    // teaser = utils.loadDataToRenderer(urls, teaser);
    // teaser.overlay.initLegend(utils.baseColors.slice(0,10), utils.getLabelNames());
    // teaser.overlay.resize();

    // if(utils.getDataset() == 'cifar10'){
    //   teaser.setColorFactor(0.0);
    // }else{
    //   teaser.setColorFactor(utils.COLOR_FACTOR);
    // }
  });
  
  window.addEventListener('resize', ()=>{
    // teaser.overlay.resize();
    teaser.setFullScreen(teaser.isFullScreen);
  });

});

teaserFigure.addEventListener("onscreen", function() {
  console.log('teaser onscreen');
  if(teaser && teaser.play){
    teaser.shouldRender = true;
    teaser.play();
  }
  for(let view of allViews){
    if(view !== teaser && view.pause){
      view.pause();
    }
  }
});

teaserFigure.addEventListener("offscreen", function() {
  if(teaser && teaser.pause){
    teaser.pause();
  }
});    
