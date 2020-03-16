const nngt2Figure = document.querySelector("d-figure.nngt2");
let nngt2;

nngt2Figure.addEventListener("ready", function() {
  console.log('nngt2Figure ready');
  let kwargs = {
    epochs: d3.range(0,100,1),
    shouldRecalculateColorRect: {
      train:true, 
      test:true
    },
    shouldPlayGrandTour: false,
    shouldAutoNextEpoch: false,
    init_matrix: TT_MATRIX,
    init_dataset: 'cifar10',
  };

  let urls = utils.getTeaserDataURL(kwargs.init_dataset || utils.getDataset(), 'test');
  urls = urls.concat(
    utils.getTeaserDataURL(kwargs.init_dataset || utils.getDataset(), 'train')
  );

  let [gl, programs] = utils.initGL(
    '#nngt2', 
    [['shaders/teaser_vertex.glsl', 'shaders/teaser_fragment.glsl']]
  );

  nngt2 = new SoftmaxComparisonRenderer(gl, programs[0], kwargs);
  nngt2 = utils.loadDataToRenderer(urls, nngt2);

  

  allViews.push(nngt2);

  utils.addDatasetListener(function(){
    nngt2.pause();
    let dataset = utils.getDataset();
    let urls = utils.getTeaserDataURL(dataset, 'test');
    urls = urls.concat(utils.getTeaserDataURL(dataset, 'train'));
    nngt2 = utils.loadDataToRenderer(urls, nngt2);
    nngt2.overlay.initLegend(utils.baseColors.slice(0,10), utils.getLabelNames(false, dataset));
    nngt2.overlay.repositionAll();
    
    if(dataset == 'cifar10'){
      nngt2.setColorFactor(0.0);
    }else{
      nngt2.setColorFactor(utils.COLOR_FACTOR);
    }
    nngt2.shouldRecalculateColorRect = {
      train:true, 
      test:true
    };

    nngt2.overlay.datasetSelection.selectAll('option')
    .property('selected', d=>{
      return d.value == utils.getDataset();
    });
    
  });

  window.addEventListener('resize', ()=>{
    nngt2.overlay.resize();
    nngt2.setFullScreen(nngt2.isFullScreen);
  });
});

nngt2Figure.addEventListener("onscreen", function() {
  console.log('nngt2 onscreen');
  if(nngt2 && nngt2.play){
    nngt2.shouldRender = true;
    nngt2.play();
    nngt2.setEpochIndex(99);
    nngt2.overlay.repositionAll();
  }
  for(let view of allViews){
    if(view !== nngt2 && view.pause){
      view.pause();
    }
  }
});

nngt2Figure.addEventListener("offscreen", function() {
  console.log('nngt2 offscreen');
  if(nngt2 && nngt2.pause){
    nngt2.pause();
  }
});