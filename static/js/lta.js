const ltaFigure = document.querySelector("d-figure.lta");
let lta;

ltaFigure.addEventListener("ready", function() {
  console.log('lta ready');
  let [gl, programs] = utils.initGL(
    '#lta', 
    [['shaders/layertransition_vertex.glsl', 
    'shaders/layertransition_fragment.glsl']]
  );

  let urls = utils.getAdversarialURL();
  const S=4, L=6; //small, large landmarkSizes

  lta = new LayerTransitionRenderer(gl, programs[0], {
    epochIndicatorPrefix: 'adversarial training: ', 
    hasAdversarial: true,
    imageSize: 0.1,
    nlayer: urls.length/2,
    layerNames: [
    'Conv', 'MaxPool', 'ReLU',
    'Conv', 'MaxPool', 'ReLU',
    'Linear', 'ReLU',
    'Linear', 'ReLU',
    'Softmax'],
    nepoch: 50,
    npoint: 500,
    pointSize: 6.0,
    framesBetweenEpoch: 20,
    framesForEpochTransition: 18,
    mode: 'point',
    layerIndex: 11,
    init_matrix: LTA_PRESOFTMAX_MATRIX,
    selectedClasses: new Set([0,8,10]),
    shouldPlayGrandTour: false, 
    shouldAutoNextEpoch: true,
    shouldAutoNextLayer: false,
    overlayKwargs: {
      landmarkSizes: [L,S,S,L,S,S,L,S,L,S,L,L],
      hasAdversarial: true,
    }
  });

  allViews.push(lta);

  lta = utils.loadDataToRenderer(urls, lta, ()=>{
    if(ltaFigure._onscreen){
      ltaFigure.onscreen();
    }
  });
  lta.overlay.datasetOption.remove();


  window.addEventListener('resize', ()=>{
      lta.resize();
      lta.overlay.resize();
  });


  // utils.addDatasetListener(function(){
  //   return; 
  // });

});


ltaFigure.addEventListener("onscreen", function() {
  console.log('lta onscreen');
  for(let view of allViews){
    if(view !== lta && view.pause){
      view.pause();
    }
  }

  if(lta && lta.isDataReady && lta.play){
    lta.shouldRender = true;
    lta.play();
    lta.overlay.play();
    lta.overlay.repositionAll();

    lta.overlay.onLayerSliderInput(11);
    lta.overlay.selectedClasses = new Set([0,8,10]);
    lta.overlay.onSelectLegend(lta.overlay.selectedClasses);
    lta.gt.setMatrix(LTA_PRESOFTMAX_MATRIX);
  }

});


ltaFigure.addEventListener("offscreen", function() {
  console.log('lta offscreen');
  if(lta && lta.pause){
    lta.pause();
    lta.overlay.pause();
  }
});