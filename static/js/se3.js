function onButtonClick3(d, buttons, shouldTurnOffOthers=true){
  d.isOn = !d.isOn;
  if(d.isOn){
    if(shouldTurnOffOthers){
      // turn off other buttons
      buttons.filter(e=>e!=d)
      .each(d=>d.isOn=false)
      .style('background', utils.buttonColors['off']);
    }

    d3.select(this).style('background', utils.buttonColors['on']);
    d.action.turnOn();
  }else{
    d3.select(this).style('background', utils.buttonColors['off']);
    d.action.turnOff();
  }
}


function annotate3(renderer){
  let figure = d3.select(d3.select('#'+renderer.gl.canvas.id).node().parentNode);//d-figure node
  let overlay = renderer.overlay;

  overlay.annotationGroup = figure.selectAll('.annotation-group')
  .data([0])
  .enter()
  .append('div')
  .attr('class', 'annotation-group');
  overlay.annotations = {};
  overlay.annotationGroup = figure.selectAll('.annotation-group');

  let data = [
    {
      text:'Dog-cat', isOn: true, 
      action: {
        turnOn: ()=>{
          se3.gt.setMatrix(CD_MATRIX);
          overlay.selectedClasses = new Set([3,5]);
          overlay.onSelectLegend(overlay.selectedClasses);
        },
        turnOff: ()=>{
          overlay.onSelectLegend(d3.range(10));
          overlay.selectedClasses = new Set();
        },
      },
    },
    {
      text:'Airplane-ship', isOn: false, 
      action: {
        turnOn: ()=>{
          se3.gt.setMatrix(AS_MATRIX);
          overlay.selectedClasses = new Set([0,8]);
          overlay.onSelectLegend(overlay.selectedClasses);
        },
        turnOff: ()=>{
          overlay.onSelectLegend(d3.range(10));
          overlay.selectedClasses = new Set();
        },
      },
    }
  ];

  let buttons = overlay.annotationGroup.selectAll('button')
  .data(data)
  .enter()
  .append('button')
  .attr('class', 'annotation btn btn-default');

  buttons = overlay.annotationGroup.selectAll('button');

  let buttonHeight = parseFloat(buttons.style('height'));
  let sy = d3.scaleLinear().domain([0,2]).range([0,(buttonHeight*1.3)*data.length]);
  
  buttons.data(data)
  .style('position', 'absolute')
  .style('top', (d,i)=>`${utils.buttonOffsetY['default'] + sy(i)}px`)
  .style('background', d=> utils.buttonColors[d.isOn?'on':'off'])
  .style('width', (d,i)=>`${2+utils.legendLeft['fashion-mnist']-utils.legendRight['fashion-mnist']}px`)
  .style('left', (d,i)=>`calc(100% - ${utils.legendLeft['fashion-mnist']}px)`)
  .text(d=>d.text)
  .on('click', function(d){
    onButtonClick3.bind(this)(d, buttons);
  });
}




//====================================================

const seFigure3 = document.querySelector("d-figure.nngt-single-epoch-3");
var se3;

seFigure3.addEventListener("ready", function() {
  var epochs = d3.range(100);
  let fixed_dataset = 'cifar10';
  var urls = utils.getTeaserDataURL(fixed_dataset);
  var [gl, programs] = utils.initGL(
    '#nngt-single-epoch-3', 
    [['shaders/teaser_vertex.glsl', 'shaders/teaser_fragment.glsl']]
  );

  se3 = new TeaserRenderer(gl, programs[0], {
    epochs, 
    epochIndex: 99,
    shouldAutoNextEpoch:false, 
    shouldPlayGrandTour: false,
    init_matrix: CD_MATRIX,
    mode: 'point',
    fixed_dataset,
    overlayKwargs: {
      // fixed_dataset,
      annotate: annotate3,
    }
  });
  se3.overlay.datasetOption.remove();

  // se3.overlay = new TeaserOverlay(se3, );
  // se3.overlay.epochIndicator.remove();
  // 
  se3 = utils.loadDataToRenderer(urls, se3);
  se3.setColorFactor(0.0); //for CIFAR-10
  
  allViews.push(se3);

  window.addEventListener('resize', ()=>{
    se3.overlay.resize();
    se3.setFullScreen(se3.isFullScreen);
  });
});

seFigure3.addEventListener("onscreen", function() {


  if(se3 && se3.play){
    se3.shouldRender = true;
    se3.play();
    if(se3.init_matrix !== undefined && se3.gt !== undefined){
      se3.gt.setMatrix(se3.init_matrix);
      se3.overlay.selectedClasses = new Set([3,5]);
      se3.overlay.onSelectLegend(se3.overlay.selectedClasses);
    }
  }
  for(let view of allViews){
    if(view !== se3 && view.pause){
      view.pause();
    }
  }
});

seFigure3.addEventListener("offscreen", function() {
  if(se3 && se3.pause){
    se3.pause();
  }
});