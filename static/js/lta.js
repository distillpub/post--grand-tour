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

  lta = new LayerTransitionRenderer(gl, programs[0], {
    epochIndicatorPrefix: 'adversarial training: ', 
    hasAdversarial: true,
    imageSize: 0.08,
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
    normalizeView: true,
    framesBetweenEpoch: 20,
    framesForEpochTransition: 18,

    mode: 'point',
    layerIndex: 11,
    init_matrix: LTA_PRESOFTMAX_MATRIX,
    selectedClasses: new Set([0,8,10]),
    shouldPlayGrandTour: false, 
    shouldAutoNextEpoch: true,
    shouldAutoNextLayer: false,
  });

  allViews.push(lta);

  const S=4, L=6; //small, large
  lta.overlay = new LayerTransitionOverlay(lta, {
      landmarkSizes: [L,S,S,L,S,S,L,S,L,S,L,L],
      hasAdversarial: true,
    });
  
  lta = utils.loadDataToRenderer(urls, lta, ()=>{ltaFigure.onscreen()});

  window.addEventListener('resize', ()=>{
      // sm0.resize();
      // sm0.overlay.resize();
  });


  utils.addDatasetListener(function(){
    return; //currently only have mnist
    // var urls = [xxx];
    // if (utils.getDataset()=='cifar10'){
    //   //cifar10 has one more layer
    //   urls.push('data/adversarial/'+utils.getDataset()+'/view11.bin');
    //   urls.push('data/adversarial/'+utils.getDataset()+'/d12.bin');
    // }

    // lta.nlayer = urls.length/2;
    // lta = utils.loadDataToRenderer(urls, lta);
    // lta.dataObj.norms = undefined;

    // lta.overlay.initLegend();

    // if(utils.getDataset()=='cifar10'){
    //   lta.layerNames = [
    //   'Conv', 'ReLU', 'MaxPool',
    //   'Conv', 'ReLU', 'MaxPool',
    //   'Linear', 'ReLU',
    //   'Linear', 'ReLU',
    //   'Linear',
    //   'Softmax'
    //   ];
    //   lta.overlay.landmarkSizes = [L,S,S,L,S,S,L,S,L,S,L,L,L];
    // }else{
    //   lta.layerNames = [
    //   'Conv', 'MaxPool', 'ReLU',
    //   'Conv', 'MaxPool', 'ReLU',
    //   'Linear', 'ReLU',
    //   'Linear', 'ReLU',
    //   'Softmax'
    //   ];
    //   lta.overlay.landmarkSizes = [L,S,S,L,S,S,L,S,L,S,L,L];
    // }
    // lta.overlay.redrawLayerSlider();


    // // teaser.overlay.resize();
    // // if(utils.getDataset() == 'cifar10'){
    // //   teaser.setColorFactor(0.0);
    // // }else{
    // //   teaser.setColorFactor(utils.COLOR_FACTOR);
    // // }
  });

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