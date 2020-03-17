function NeuralNetOverlay(svgid) {

  //for functions that do both d3.select(this).xxx and that.method()
  let that = this; 
  
  this.svg = d3.select(svgid);
  let width = this.svg.node().getBoundingClientRect().width;
  let height = this.svg.node().getBoundingClientRect().height;
  this.svg.attr('width', width);
  this.svg.style('background', 'rgb('+utils.CLEAR_COLOR.map(
    (d) => parseInt(d*255))+')');
  this.svg.attr('image-rendering', 'pixelated');
  this.epochIndex = 0;
  this.imageIndex = 0;
  this.shouldAutoNextEpoch = true;
  this.shouldAutoReplay = true;
  this.cache = {};

  this.isFirst = true;

  window.addEventListener('resize', ()=>{
    let width = this.svg.node().getBoundingClientRect().width;
    let height = this.svg.node().getBoundingClientRect().height;
    this.svg.attr('width', width);
    this.drawStructure(this.net, this.exampleRightBound);
    this.repositionSlider();
  });


  this.slider = d3.select(this.svg.node().parentNode)
    .insert('input', ':first-child')
    .attr('type', 'range')
    .attr('class', 'slider epochSlider')
    .attr('min', utils.MIN_EPOCH)
    .attr('max', utils.MAX_EPOCH)
    .attr('value', utils.MIN_EPOCH)
    .on('input', function() {
      that.shouldAutoNextEpoch = false;
      let value = d3.select(this).property('value');
      that.setEpochIndex(parseInt(value));
      that.playButton.attr('class', that.shouldAutoNextEpoch ? 'play-button fa fa-pause':'play-button fa fa-play');
    });


  this.playButton = d3.select(this.svg.node().parentNode)
    .insert('p', ':first-child')
    .attr('class', this.shouldAutoNextEpoch?'play-button fa fa-pause':'play-button fa fa-play');
  this.playButton 
    .on('mouseover', function() {
      d3.select(this).style('opacity', 1);
    })
    .on('mouseout', function() {
      d3.select(this).style('opacity', 0.7);
    })
    .on('click', ()=>{
      this.shouldAutoNextEpoch = !this.shouldAutoNextEpoch;
      if (this.shouldAutoNextEpoch) {
        this.playButton.attr('class', 'play-button fa fa-pause');
      } else {
        this.playButton.attr('class', 'play-button fa fa-play');
      }
    });


  this.drawExamples = function() {
    let dataset = utils.getDataset();
    let imgSize = dataset=='cifar10'? 32:28;

    let nrows = 15;
    let ncols = 3;
    let imageWidth = 28;
    let imageHeight = 28;
    let url = utils.no_cors_host+'data/examples/' + dataset + '/input.png';
    let data = [];
    for (let i=0; i<nrows; i++) {
      for (let j=0; j<ncols; j++) {
        data.push({
          i: i,
          j: j,
          src: url,
        });
      }
    }
    // let margin = 10;
    let sy = d3.scaleLinear()
        .domain([0, nrows])
        .range([0, this.svg.attr('height')]);
    let sx = sy;

    this.svg.selectAll('#exampleContainer')
      .data([0])
      .enter()
      .append('g')
      .attr('id', 'exampleContainer');

    this.svg.select('#exampleContainer')
      .attr('transform', '');

    this.svg.select('#exampleContainer')
      .selectAll('.example')
      .data(data)
      .enter()
      .append('image')
      .attr('class', 'example');

    let clippaths = this.svg.select('#exampleContainer')
      .selectAll('.clippath')
      .data(data)
      .enter()
      .append('clipPath')
      .attr('class', 'clippath')
      .attr('id', d=>'clip_'+d.i+'_'+d.j);
    clippaths.each(function(d){
      d3.select(this).append('rect')
      .attr('x', d=>sx(d.j))
      .attr('y', d=>sx(d.i))
      .attr('width', sx(1)-sx(0)+0.5)
      .attr('height', sy(1)-sy(0)+0.5)
    })

    let highlight = (i, j, color)=>{
      this.svg.selectAll('#highlightBox')
        .data([0])
        .enter()
        .append('rect')
        .attr('id', 'highlightBox')
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2);

      this.svg.select('#highlightBox')
        .attr('x', sx(j))
        .attr('y', sy(i))
        .attr('width', sx(1)-sx(0))
        .attr('height', sx(1)-sx(0));
    };

    d3.selectAll('.example')
      .attr('x', (d) => -(sx(d.i*ncols)))
      .attr('y', (d) => sy(d.i))
      .attr('height', sy(1)-sy(0))
      .attr('width', (sy(1)-sy(0))*45)
      .attr('xlink:href', (d) => d.src)
      .attr('clip-path', d=>`url(#clip_${d.i}_${d.j})`)
      .on('mouseover', (d) => {
        let index = d.i*ncols+d.j;
        highlight(d.i, d.j, 'orange');
        this.updateImage(index);
      });
    return sx(ncols);
  };

  this.getImageUrl = function(dataset, moduleName) {
      return utils.no_cors_host+'data/examples/'+dataset+'/'+moduleName+'.png';
  };


  this.updateImage = function(imageIndex) {
    this.imageIndex = imageIndex;
    this.drawStructure(this.net, this.exampleRightBound);
  };


  let drawLegend = ()=>{
    let legendData = [
      {'text':'linear', 'color': getColor('linear')},
      {'text':'component-wise', 'color': getColor('ReLU')},
      {'text':'other', 'color': getColor('maxpool')},
    ];

    let sx = d3.scaleLinear()
      .domain([0, 1, 2])
      .range([
        +this.svg.attr('width')-100, 
        +this.svg.attr('width')-70, 
        +this.svg.attr('width')-10
      ]);
    let sy = d3.scaleLinear()
      .domain([0, legendData.length])
      .range([10, 10+legendData.length*20]);
    
    this.svg.selectAll('.legendRect')
    .data(legendData)
    .enter()
    .append('rect')
    .attr('class', 'legendRect')

    this.svg.selectAll('.legendRect')
    .attr('x', sx(1))
    .attr('y', (d,i)=>sy(i))
    .attr('width', sx(2)-sx(1))
    .attr('height', (sy(1)-sy(0))*0.75)
    .attr('fill', d=>d.color);

    this.svg.selectAll('.legendText')
    .data(legendData)
    .enter()
    .append('text')
    .attr('class', 'legendText');

    this.svg.selectAll('.legendText')
    .attr('x', sx(1)-5)
    .attr('y', (d,i)=>sy(i+0.75/2))
    .text(d=>d.text)
    .attr('text-anchor', 'end')
    .attr('alignment-baseline', 'central');

    this.svg.selectAll('.legendText,.legendRect')
    .on('mouseover', (d)=>{
      let legendType = d.text;
      let layerType = layerText => {
        if (legendType == 'linear'){
          return !layerText.includes('linear') 
          && !layerText.includes('conv');
        }else if(legendType == 'component-wise'){
          return !layerText.includes('ReLU') 
        }else if(legendType == 'other'){
          return !layerText.includes('softmax')
          && !layerText.includes('argmax')
          && !layerText.includes('maxpool')
        }else{
          return false;
        }
      };

      this.svg.selectAll('.layerRect')
      .filter(layerType)
      .attr('opacity', 0);

      this.svg.selectAll('.layerText')
      .filter(layerType)
      .attr('opacity', 0.5);

    })
    .on('mouseout', ()=>{
      this.svg.selectAll('.layerRect')
      .attr('opacity', 1);
      this.svg.selectAll('.layerText')
      .attr('opacity', 1);
      // .attr('fill', text=>getColor(text));
    });
  };//end of drawLegend



  let drawActivations = (net)=>{
    let w = this.svg.attr('width');
    let data = net.filter(d=>d.type=='data' && d.name !== 'argmax');

    this.svg.selectAll('.activation')
    .data(data)
    .enter()
    .append('image')
    .attr('class', 'activation');
    
    this.svg.selectAll('.clip')
    .data(data)
    .enter()
    .append('clipPath')
    .attr('class', 'clip')
    .attr('id', d=>'clip_'+d.name);

    this.svg.selectAll('.clip')
    .each(function(d){
      d3.select(this)
      .selectAll('rect')
      .data([d])
      .enter()
      .append('rect');

      d3.select(this)
      .selectAll('rect')
      .attr('x', d=>d.x)
      .attr('y', d=>d.y-d.height/2)
      .attr('width', d=>d.width)
      .attr('height', d=>d.height);
    })
    

    this.svg.selectAll('.activation')
    .attr('x', d=>d.x-this.imageIndex * d.width)
    .attr('y', d=>d.y-d.height/2 - (d.name=='input'?0:this.epochIndex * d.height))
    .attr('width', d=>d.width*45)
    .attr('height', d=>d.width*45 / d.img_width * d.img_height)
    .attr('clip-path', d =>`url(#clip_${d.name})`);

    if(this.isFirst){
      this.svg.selectAll('.activation')
      .attr('xlink:href', d=>this.getImageUrl(utils.getDataset(), d.name))
      this.isFirst = false;
    }

    this.svg.selectAll('.activation')
    .each(d=>{
      if(d.name == 'softmax'
        || (utils.getDataset() == 'mnist' && d.name == 'fc2')
        || (utils.getDataset() == 'fashion-mnist' && d.name == 'fc2')
        || (utils.getDataset() == 'cifar10' && d.name == 'fc3') ){

        let sx = d3.scaleLinear().domain([0,2]).range([d.x, d.x+d.width]);
        let sy = d3.scaleLinear().domain([0,5]).range([d.y-d.height/2, d.y+d.height/2]);

        this.svg.selectAll('.'+d.name+'-dim-text')
        .data(utils.getLabelNames())
        .enter()
        .append('text')
        .attr('class', d.name+'-dim-text');

        classIndices = this.svg.selectAll('.'+d.name+'-dim-text')
        .data(utils.getLabelNames())
        .attr('x', (d,i)=>sx(i%2+0.5))
        .attr('y', (d,i)=>sy(Math.floor(i/2)+0.5))
        .style('fill', '#a9a9a9')
        .style('font-size', 8)
        .style('text-anchor', 'middle')
        .style('alignment-baseline', 'middle')
        .text(d=>d);
        // .text(d=>(+this.svg.attr('width') > 1000) ? d:'');

        let title = utils.legendTitle[utils.getDataset()];
        this.svg.selectAll(`.${d.name}-classTitle`)
        .data([title,])
        .enter()
        .append('text')
        .attr('class', `${d.name}-classTitle`)
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold');

        this.svg.selectAll(`.${d.name}-classTitle`)
        .data([title,])
        .attr('x', sx(1.0))
        .attr('y', sy(0)-5)
        .text(d=>d);
        // .text(d=>(+this.svg.attr('width') > 1000) ? d:'');



      }
    })

    this.svg.selectAll('#prediction')
    .data([net[net.length-1],])
    .enter()
    .append('text')
    .attr('id', 'prediction')
    .attr('text-anchor', 'start')
    .attr('alignment-baseline', 'middle');

    if(this.pred !== undefined){
      this.svg.select('#prediction')
      .attr('x', +this.svg.select('#pipeline').attr('x2') + 3)
      .attr('y', d=>d.y)
      .text('pred: ' + utils.getLabelNames()[this.pred[this.imageIndex][this.epochIndex]])
      .append('tspan')
      .attr('x', this.svg.select('#prediction').attr('x'))
      .attr('dy', '1.2em')
      .text('(truth: '+utils.getLabelNames()[this.labels[this.imageIndex]]+')');
    }

  };


  let getColor = function(text) {
    let baseColors = {
      'conv': '#a6cee3',
      'linear': '#a6cee3',
      'ReLU': '#ffffb3',
      'maxpool': '#b2df8a',
      'softmax': '#b2df8a',
      'argmax': '#b2df8a',

      'dropout': '#80b1d3',
      'flatten': '#fff',
      'default': '#f55',
    };

    for (let k in baseColors){
      if(text.includes(k)){
        return baseColors[k];
      }
    }
    return baseColors['default'];
  };


  let drawLayers = (net)=>{
    let data = net.filter(d=>d.type=='function');

    let g = this.svg.selectAll('.layer')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'layer');
    g = this.svg.selectAll('.layer');

    g.each(function(d){
      let rect = d3.select(this).selectAll('.layerRect')
      .data(d.blocks)
      .enter()
      .append('rect')
      .attr('class', 'layerRect');
      rect = d3.select(this).selectAll('.layerRect');

      let text = d3.select(this).selectAll('.layerText')
      .data(d.blocks)
      .enter()
      .append('text')
      .attr('class', 'layerText');
      text = d3.select(this).selectAll('.layerText');

      rect
      .attr('x', (_,i)=>d.x + d.width * i)
      .attr('y', d.y - d.height/2)
      .attr('width', d.width)
      .attr('height', d.height)
      .attr('fill', t=>getColor(t));

      text
      .attr('x', (_,i)=>d.x + d.width * i + d.width/2)
      .attr('y', d.y)
      .attr('transform', (_,i)=>`rotate(-90 ${d.x+d.width/2 + d.width*i} ${d.y})`)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .text(text=>text);
    });
    
  };


  this.drawStructure = function(net, start) {
    let marginLeft = 10;
    let marginRight = 40;
    let sx = d3.scaleLinear()
        .domain([0, 1]).range([+start+marginLeft, +this.svg.attr('width')-marginRight]);
    let sy = d3.scaleLinear()
        .domain([0, 1]).range([0, +this.svg.attr('height')]);
    let width_total = sx.range()[1] - sx.range()[0];

    let data_activation = net.filter(d=>d.type == 'data');
    let data_layer = net.filter(d=>d.type == 'function');

    // let gap = Math.max(+this.svg.attr('width') / 40, 10);
    // let width_layer = 18;
    // let layer_count = data_layer.reduce((a,b)=>a+b.blocks.length, 0);
    // let width_activation = 1/data_activation.length 
       // * (width_total - (net.length-1) * gap - width_layer * layer_count);
    
    let layer_count = data_layer.reduce((a,b)=>a+b.blocks.length, 0);
    let activation_count = data_activation.length;
    let gap_count = net.length-1;
    let step_size = width_total / (layer_count*0.5 + activation_count*2 + gap_count*0.5);
    
    let gap = step_size * 0.5;
    let width_layer = step_size * 0.5;
    let width_activation = step_size * 2;

    let x = sx(0);
    net.forEach((d,i)=>{
      d.index = i;
      if(d.type=='data'){
        d.width = width_activation;
        d.height = width_activation / d.size[0] * d.size[1];
        d.x = x;
        d.y = sy(0.5);
        x += gap + d.width;
        d.img_width = d.img_dimension[0];
        d.img_height = d.img_dimension[1];
      }else{
        d.width = width_layer;
        d.height = 100;
        d.x = x;
        d.y = sy(0.5);
        x += gap + d.width * d.blocks.length;
      }
    });
   
    //draw a horizontal line
    this.svg.selectAll('#pipeline')
      .data([0])
      .enter()
      .append('line')
      .attr('id', 'pipeline');
    this.svg.select('#pipeline')
      .attr('x1', sx(0)+width_activation/2)
      .attr('x2', sx(1.0)-width_activation)
      .attr('y1', sy(0.5))
      .attr('y2', sy(0.5))
      .attr('stroke', '#999')
      .attr('stroke-width', 2);

    drawActivations(net);
    drawLayers(net);
    drawLegend();
  };


  this.loadPred = function() {
    let promises = [
      d3.text(utils.no_cors_host+'data/examples/'+utils.getDataset()+'/pred.csv'),
      d3.text(utils.no_cors_host+'data/examples/'+utils.getDataset()+'/labels.csv')
    ];
    Promise.all(promises)
      .then((textList) => {
        this.pred = d3.dsvFormat(',').parseRows(textList[0]);
        this.pred = this.pred.map(function(row) {
          return row.map((d) => +d);
        });

        this.labels = d3.dsvFormat(',').parseRows(textList[1]);
        this.labels = this.labels.map(function(row) {
          return +row[0];
        });
        this.updateImage(this.imageIndex);
      });
  };


  this.setEpochIndex = function(epochIndex) {
    this.epochIndex = epochIndex;
    this.updateImage(this.imageIndex);
    this.drawEpochIndicator(this.epochIndex);
  };


  this.drawEpochIndicator = (i)=>{
    if (this.epochIndicator === undefined || this.epochIndicator === null) {
      //init
      this.epochIndicator = this.svg.append('text')
        .attr('id', 'epochIndicator')
        .attr('x', width/2)
        .attr('y', height-40)
        .attr('text-anchor', 'middle')
    }

    this.epochIndicator
    .attr('x', parseFloat(this.slider.style('left')) + parseFloat(this.slider.style('width')) / 2)
    .text('epoch: '+i+'/99');

  };


  this.init = function() {
    this.isFirst = true;
    this.svg.html('');
    this.epochIndicator = null;

    this.net = utils.getNet(utils.getDataset());
    this.loadPred();
    this.exampleRightBound = this.drawExamples();
    this.drawStructure(this.net, this.exampleRightBound);
    this.repositionSlider();
    
    if (this.intervalHandle !== undefined) {
      clearInterval(this.intervalHandle);
      delete this.intervalHandle;
    }
  };

  this.repositionSlider = function(){
    this.slider
    .style('left', `${+this.exampleRightBound+64}px`)
    .style('width', `${+this.svg.attr('width')-this.exampleRightBound-130}px`);

    this.playButton
    .style('left', `${parseFloat(this.slider.style('left')) - 30}px`);

    this.drawEpochIndicator(this.epochIndex);

  };


  this.render = function(){
    if (this.shouldAutoNextEpoch) {
      if (this.epochIndex == utils.MAX_EPOCH) {
        if (this.shouldAutoReplay) {
          this.setEpochIndex(utils.MIN_EPOCH);
        }
      } else {
        this.setEpochIndex(this.epochIndex+1);
      }
      this.slider.property('value', this.epochIndex);
    }
  };

  this.t = 0;
  this.play = function(t) {
    if(t-this.t > 100){
      this.render();
      this.t = t;
    }
    
    this.animId = requestAnimationFrame(this.play.bind(this));
  };

  this.pause = function() {
    console.log('nn2 paused');
    if(this.animId){
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.shouldAutoNextEpoch = false;
  };

  this.init();
  this.play();
}
