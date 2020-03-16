const lt3Figure = document.querySelector("d-figure.lt3");
let lt3;

lt3Figure.addEventListener("ready", function() {
  console.log('lt3 ready');
  let [gl, programs] = utils.initGL(
    '#lt3', 
    [['shaders/layertransition_vertex.glsl', 
    'shaders/layertransition_fragment.glsl']]
  );

  let urls = utils.getLayerTransitionURL('test');

  lt3 = new LayerTransitionRenderer(gl, programs[0], {
    nlayer: urls.length/2,
    layerNames: [
    'Conv', 'MaxPool', 'ReLU',
    'Conv', 'MaxPool', 'ReLU',
    'Linear', 'ReLU',
    'Linear', 'ReLU',
    'Softmax'],
    nepoch: 100,
    npoint: 1000,
    pointSize: 6.0,
    normalizeView: true,
    isOnScreen:true
  });

  const S=4, L=6; //small, large
  lt3.overlay = new LayerTransitionOverlay(lt3, {
      landmarkSizes: [L,S,S,L,S,S,L,S,L,S,L,L],
    });
  
  lt3 = utils.loadDataToRenderer(urls, lt3);

  window.addEventListener('resize', ()=>{
      // sm0.resize();
      // sm0.overlay.resize();
  });


  utils.addDatasetListener(function (){
    if (!lt3.isOnScreen){
      return;
    }
    lt3.pause();
    lt3.overlay.pause();

    var urls = utils.getLayerTransitionURL('test');

    lt3.nlayer = urls.length/2;

    lt3.dataObj.norms = undefined;
    lt3.dataObj.dataTensor = [];
    lt3.dataObj.views = [];
    lt3 = utils.loadDataToRenderer(urls, lt3);


    lt3.overlay.initLegend();

    if(utils.getDataset()=='cifar10'){
      lt3.layerNames = [
      'Conv', 'ReLU', 'MaxPool',
      'Conv', 'ReLU', 'MaxPool',
      'Linear', 'ReLU',
      'Linear', 'ReLU',
      'Linear',
      'Softmax'
      ];
      lt3.overlay.landmarkSizes = [L,S,S,L,S,S,L,S,L,S,L,L,L];
    }else{
      lt3.layerNames = [
      'Conv', 'MaxPool', 'ReLU',
      'Conv', 'MaxPool', 'ReLU',
      'Linear', 'ReLU',
      'Linear', 'ReLU',
      'Softmax'
      ];
      lt3.overlay.landmarkSizes = [L,S,S,L,S,S,L,S,L,S,L,L];
    }
    lt3.overlay.redrawLayerSlider();

    
  });

});

lt3Figure.addEventListener("onscreen", function() {
  console.log('lt3 onscreen');
  if(lt3 && lt3.isDataReady && lt3.play){
    lt3.play();
    lt3.overlay.play();
    lt3.isOnScreen = true;
  }
});

lt3Figure.addEventListener("offscreen", function() {
  console.log('lt3 offscreen');
  if(lt3 && lt3.pause){
    lt3.pause();
    lt3.overlay.pause();
    lt3.isOnScreen = false;
  }
});