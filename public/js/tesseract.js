const tesseractFigure = document.querySelector("d-figure.tesseract");
var tesseract;
tesseractFigure.addEventListener("ready", function() {
  console.log('tesseractFigure ready');
  var [gl, programs] = utils.initGL(
    '#tesseract', 
    [['shaders/tesseract_vertex.glsl', 'shaders/tesseract_fragment.glsl']]
  );
  tesseract = new TesseractRenderer(gl, programs[0]);
  // allViews.push(tesseract);
  tesseract.init();
});

tesseractFigure.addEventListener("onscreen", function() {
  console.log('onscreen');
  if(tesseract && tesseract.play){
    tesseract.play();
  }
  for(let view of allViews){
    if(view !== tesseract && view.pause){
      view.pause();
    }
  }
});


tesseractFigure.addEventListener("offscreen", function() {
  console.log('offscreen');
  if(tesseract && tesseract.pause){
    tesseract.pause();
  }
});


window.addEventListener('resize', ()=>{
  tesseract.resize();
});