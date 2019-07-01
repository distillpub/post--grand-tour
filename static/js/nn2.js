const nn2Figure = document.querySelector("d-figure.nn2");
  
//TODO image loading for firefox   
var nn2;
nn2Figure.addEventListener("ready", function() {
  console.log('nn2Figure ready');
  nn2 = new NeuralNetOverlay('#nn2');
  // allViews.push(nn2);
  utils.addDatasetListener(function(){
    nn2.init();
  });
});


nn2Figure.addEventListener("onscreen", function() {
  console.log('nn2 onscreen');
  for(let view of allViews){
    if(view !== nn2 && view.pause){
      view.pause();
    }
  }
  if(nn2 && nn2.play){
    nn2.shouldAutoNextEpoch = true;
    nn2.play();
    console.log('nn2 play');
  }
  
});


nn2Figure.addEventListener("offscreen", function() {
  console.log('nn2 offscreen');
  if(nn2 && nn2.pause){
    nn2.pause();
  }
});