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
  const S=4, L=6; //small, large landmarkSizes

  let kwargs = {
    shouldPlayGrandTour: false, 
    shouldAutoNextEpoch: false,
    shouldAutoNextLayer: true,
    nlayer: urls.length/2,
    isOnScreen: true,

    init_dataset: init_dataset,
    layerIndex: 5,
    init_matrix: EARLY_SEPARATION_MATRIX_LAYER5,
    layer0_matrix: EARLY_SEPARATION_MATRIX_LAYER0,
    // selectedClasses: new Set([5,7,9]),

    framesBetweenEpoch: 25,
    framesForEpochTransition: 20,

    layerNames: [
    'Conv', 'MaxPool', 'ReLU',
    'Conv', 'MaxPool', 'ReLU',
    'Linear', 'ReLU',
    'Linear', 'ReLU',
    'Softmax'],
    nepoch: 50,
    npoint: 500,
    pointSize: 6.0,
    overlayKwargs: {
      landmarkSizes: [L,S,S,L,S,S,L,S,L,S,L,L],
    }
  };
  lt2 = new LayerTransitionRenderer(gl, programs[0], kwargs);
  
  lt2 = utils.loadDataToRenderer(urls, lt2, ()=>{
    if(lt2Figure._onscreen){
      lt2Figure.onscreen();
    }
  });

  allViews.push(lt2);

  window.addEventListener('resize', ()=>{
      lt2.resize();
      lt2.overlay.resize();
  });


  lt2.onDatasetChange = function(dataset){
    dataset = dataset || utils.getDataset();
    lt2.dataset = dataset;
    
    lt2.pause();
    lt2.overlay.pause();

    var urls = utils.getLayerTransitionURL(dataset, 'test');
    lt2.nlayer = urls.length/2;

    if(dataset !== 'cifar10'){ //layer out of bound when cifar10->other_dataset
      let layer = Math.min(Math.floor(lt2.layerIndex), lt2.nlayer-1);
      this.layerIndexPrev = layer;
      lt2.overlay.onLayerSliderInput(layer);
    }
    lt2.dataObj.norms = undefined;
    lt2.colorRect = undefined;
    lt2.dataObj.dataTensor = [];
    lt2.dataObj.views = [];
    lt2 = utils.loadDataToRenderer(urls, lt2, ()=>{
      lt2.overlay.initLegend(
        utils.baseColors.slice(0, 10), 
        utils.getLabelNames(false, dataset)
      );
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
      // lt2.overlay.redrawLayerSlider();
      lt2.overlay.repositionAll();
      lt2.shouldRecalculateColorRect = true;
    });

    lt2.overlay.datasetSelection.selectAll('option')
    .property('selected', d=>{
      return d.value == dataset;
    });

  };


  utils.addDatasetListener(function(){
    if(lt2Figure._onscreen){
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
    if(lt2.dataset !== 'fashion-mnist'){
      // lt2.onDatasetChange('fashion-mnist');
      lt2.shouldRender = true;
      lt2.play();
      lt2.overlay.play();
      lt2.overlay.selectedClasses = new Set();
      lt2.overlay.onSelectLegend(d3.range(10));
    }else{
      console.log('lt2, dataset Fashion-MNIST');
      lt2.shouldRender = true;
      lt2.overlay.isViewManipulated = false;
      
      lt2.play();
      lt2.overlay.play();
      lt2.overlay.onLayerSliderInput(0);
      lt2.overlay.selectedClasses = new Set([5,7,9]);
      lt2.overlay.onSelectLegend(lt2.overlay.selectedClasses);
      lt2.gt.setMatrix(EARLY_SEPARATION_MATRIX_LAYER0);
      lt2.overlay.onLayerSliderInput(5);

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
  }
});