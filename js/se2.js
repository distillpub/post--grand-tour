function onButtonClick2(d, buttons, shouldTurnOffOthers=true){
  d.isOn = !d.isOn;
  if(d.isOn){
    if(shouldTurnOffOthers){
      // turn off other buttons
      buttons.filter(e=>e!=d)
      .each(d=>d.isOn=false)
      .style('background', '#eee');
    }

    d3.select(this).style('background', '#2196F3');
    d.action.turnOn();
  }else{
    d3.select(this).style('background', '#eee');
    d.action.turnOff();
  }
}


function annotate2(renderer){
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
      text:'Highlight shoes', isOn: true, 
      action: {
        turnOn: ()=>{
          se2.gt.setMatrix(SSA_MATRIX);
          overlay.selectedClasses = new Set([5,7,9]);
          overlay.onSelectLegend(overlay.selectedClasses);
        },
        turnOff: ()=>{
          overlay.onSelectLegend(d3.range(10));
          overlay.selectedClasses = new Set();
        },
      },
    },
    {
      text:'Highlight shirts', isOn: false, 
      action: {
        turnOn: ()=>{
          se2.gt.setMatrix(PCS_MATRIX);
          overlay.selectedClasses = new Set([0,2,4,6]);
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
  .append('button');
  buttons = overlay.annotationGroup.selectAll('button')
  .style('height', '33px');

  let buttonHeight = parseFloat(buttons.style('height'));
  let sy = d3.scaleLinear().domain([0,2]).range([0,buttonHeight*data.length*1.1]);
  
  buttons.data(data)
  .style('position', 'absolute')
  .style('top', (d,i)=>`calc(40% + ${sy(i)}px`)
  .style('left', (d,i)=>'calc(100% + 10px)')
  .style('width', '120px')
  .style('background', d=> d.isOn?'#2196F3':'#eee')
  .text(d=>d.text)
  .on('click', function(d){
    onButtonClick2.bind(this)(d, buttons);
  });
}




//====================================================

const seFigure2 = document.querySelector("d-figure.nngt-single-epoch-2");
var se2;

seFigure2.addEventListener("ready", function() {
  var epochs = [99,];
  let fixed_dataset = 'fashion-mnist';
  var urls = utils.getTeaserDataURL(fixed_dataset);
  var [gl, programs] = utils.initGL(
    '#nngt-single-epoch-2', 
    [['shaders/teaser_vertex.glsl', 'shaders/teaser_fragment.glsl']]
  );

  se2 = new TeaserRenderer(gl, programs[0], {
    epochs, 
    shouldAutoNextEpoch:false, 
    shouldPlayGrandTour: false,
    init_matrix: SSA_MATRIX,
    mode: 'image',
    fixed_dataset,
  });

  se2.overlay = new TeaserOverlay(se2, {
    fixed_dataset,
    annotate: annotate2,
  });

  se2.overlay.epochIndicator.remove();
  se2 = utils.loadDataToRenderer(urls, se2);
  
  allViews.push(se2);

  window.addEventListener('resize', ()=>{
    se2.overlay.resize();
    se2.setFullScreen(se2.isFullScreen);
  });
});

seFigure2.addEventListener("onscreen", function() {
  if(se2 && se2.play){
    se2.shouldRender = true;
    se2.play();
    if(se2.init_matrix !== undefined && se2.gt !== undefined){
      se2.gt.setMatrix(se2.init_matrix);
      se2.overlay.selectedClasses = new Set([5,7,9]);
      se2.overlay.onSelectLegend(se2.overlay.selectedClasses);
    }
  }
  for(let view of allViews){
    if(view !== se2 && view.pause){
      view.pause();
    }
  }
});

seFigure2.addEventListener("offscreen", function() {
  if(se2 && se2.pause){
    se2.pause();
  }
});