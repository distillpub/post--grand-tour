const lt2Figure = document.querySelector("d-figure.lt2");
let lt2;

lt2Figure.addEventListener("ready", function() {
  console.log('lt2 ready');
  let [gl, programs] = utils.initGL(
    '#lt2', 
    [['shaders/layertransition_vertex.glsl', 
    'shaders/layertransition_fragment.glsl']]
  );

  let init_dataset = 'fashion-mnist';
  let urls = utils.getLayerTransitionURL(init_dataset, 'test');

  let kwargs = {
    shouldPlayGrandTour: false, 
    shouldAutoNextEpoch: false,
    shouldAutoNextLayer: true,
    nlayer: urls.length/2,
    isOnScreen: true,

    init_dataset: init_dataset,
    layerIndex: 5,
    init_matrix: EARLY_SEPARATION_MATRIX_LAYER5,
    // selectedClasses: new Set([5,7,9]),

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
  };
  lt2 = new LayerTransitionRenderer(gl, programs[0], kwargs);
  lt2.datasetName = init_dataset;
  const S=4, L=6; //small, large landmarkSizes
  lt2.overlay = new LayerTransitionOverlay(lt2, {
      landmarkSizes: [L,S,S,L,S,S,L,S,L,S,L,L],
  });
  lt2 = utils.loadDataToRenderer(urls, lt2, ()=>{lt2Figure.onscreen()});
  lt2.datasetName = init_dataset;

  allViews.push(lt2);

  window.addEventListener('resize', ()=>{
      // sm0.resize();
      // sm0.overlay.resize();
  });


  lt2.onDatasetChange = function(dataset = utils.getDataset()){

    lt2.pause();
    lt2.overlay.pause();

    var urls = utils.getLayerTransitionURL(dataset, 'test');
    lt2.nlayer = urls.length/2;
    lt2.dataObj.norms = undefined;
    lt2.colorRect = undefined;
    lt2.dataObj.dataTensor = [];
    lt2.dataObj.views = [];
    lt2 = utils.loadDataToRenderer(urls, lt2, ()=>{
      lt2.overlay.initLegend();
      lt2.overlay.selectedClasses = new Set();
      lt2.overlay.onSelectLegend(d3.range(10));

      if(dataset=='cifar10'){
        lt2.layerNames = [
        'Conv', 'ReLU', 'MaxPool',
        'Conv', 'ReLU', 'MaxPool',
        'Linear', 'ReLU',
        'Linear', 'ReLU',
        'Linear',
        'Softmax'
        ];
        lt2.overlay.landmarkSizes = [L,S,S,L,S,S,L,S,L,S,L,L,L];
      }else{
        lt2.layerNames = [
        'Conv', 'MaxPool', 'ReLU',
        'Conv', 'MaxPool', 'ReLU',
        'Linear', 'ReLU',
        'Linear', 'ReLU',
        'Softmax'
        ];
        lt2.overlay.landmarkSizes = [L,S,S,L,S,S,L,S,L,S,L,L];
      }
      lt2.overlay.redrawLayerSlider();
      lt2.datasetName = dataset;
      lt2.shouldRecalculateColorRect = true;
    
    });


  };


  utils.addDatasetListener(function(){
    if(lt2.isOnScreen){
      lt2.onDatasetChange();
    }
  });

});



lt2Figure.addEventListener("onscreen", function() {
  console.log('lt2 onscreen');
  for(let view of allViews){
    if(view !== lt2 && view.pause){
      view.pause();
    }
  }
  
  if(lt2 && lt2.isDataReady && lt2.play){
    lt2.isOnScreen = true;
    if(lt2.datasetName !== 'fashion-mnist'){
      // lt2.onDatasetChange('fashion-mnist');
      lt2.shouldRender = true;
      lt2.play();
      lt2.overlay.play();
      lt2.overlay.selectedClasses = new Set();
      lt2.overlay.onSelectLegend(d3.range(10));
    }else{
      lt2.shouldRender = true;
      lt2.play();
      lt2.overlay.play();
      lt2.overlay.onLayerSliderInput(5);
      lt2.overlay.selectedClasses = new Set([5,7,9]);
      lt2.overlay.onSelectLegend(lt2.overlay.selectedClasses);
      lt2.gt.setMatrix(EARLY_SEPARATION_MATRIX_LAYER5);
      lt2.overlay.layerPlayButton.on('click')();
    }
    
  }

});



lt2Figure.addEventListener("offscreen", function() {
  console.log('lt2 offscreen');
  if(lt2 && lt2.pause){
    lt2.pause();
    if(lt2.overlay){
      lt2.overlay.pause();
    }
    lt2.isOnScreen = false;
  }
});