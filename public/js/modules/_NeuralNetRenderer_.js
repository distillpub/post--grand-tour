function NeuralNetRenderer(svgid) {
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

  let that = this;
  this.slider = d3.select(this.svg.node().parentNode)
    .insert('input', ':first-child')
    .attr('type', 'range')
    .attr('class', 'slider')
    .attr('min', utils.MIN_EPOCH)
    .attr('max', utils.MAX_EPOCH)
    .attr('value', utils.MIN_EPOCH)
    .on('input', function() {
      that.shouldAutoNextEpoch = false;
      let value = d3.select(this).property('value');
      that.setEpochIndex(parseInt(value));
      that.playButton.attr('class', 'play-button fa fa-play');
    });


  this.playButton = d3.select(this.svg.node().parentNode)
    .insert('p', ':first-child')
    .attr('class', 'play-button  fa fa-pause')
    .on('mouseover', function() {
      d3.select(this).style('opacity', 1);
    })
    .on('mouseout', function() {
      d3.select(this).style('opacity', 0.7);
    })
    .on('click', function() {
      that.shouldAutoNextEpoch = !that.shouldAutoNextEpoch;
      if (that.shouldAutoNextEpoch) {
        d3.select(this).attr('class', 'play-button fa fa-pause');
      } else {
        d3.select(this).attr('class', 'play-button fa fa-play');
      }
    });


  this.drawExamples = function() {
    let nrows = 15;
    let ncols = 3;
    let imageWidth = 28;
    let imageHeight = 28;
    let folder = utils.cors_host+'data/examples/' + utils.getDataset() + '/input/';
    let data = [];
    for (let i=0; i<nrows; i++) {
      for (let j=0; j<ncols; j++) {
        data.push({
          i: i,
          j: j,
          src: folder + (i*ncols+j) + '.png'
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
      .attr('x', (d) => sx(d.j))
      .attr('y', (d) => sy(d.i))
      .attr('width', sy(1)-sy(0))
      .attr('xlink:href', (d) => d.src)
      // .attr('href', function(d){
      //   if(d.src in that.cache){
      //     d3.select(this)
      //     .attr('href', that.cache[d.src])
      //   }else{
      //     utils.toDataURL(d.src, (imageInBase64)=>{
      //       that.cache[d.src] = imageInBase64;
      //       d3.select(this)
      //       .attr('href', imageInBase64)
      //     });
      //   }
      // })
      .on('mouseover', (d) => {
        let index = d.i*ncols+d.j;
        highlight(d.i, d.j, 'orange');
        this.updateImage(index);
      });
    return sx(ncols);
  };

  this.getImageUrl = function(dataset, epochIndex, moduleName, imageIndex) {
    if (moduleName=='input') {
      return utils.cors_host+'data/examples/'+dataset+'/'+moduleName+'/'+imageIndex+'.png';
    } else {
      return utils.cors_host+'data/examples/'+dataset+'/epoch'+epochIndex+
              '/'+moduleName+'/'+imageIndex+'.png';
    }
  };


  this.updateImage = function(imageIndex) {
    this.imageIndex = imageIndex;
    for (let i=0; i<this.net.length; i++) {
      let struct = this.net[i];
      if (struct.type == 'data') {
        if (struct.name == 'argmax') {
          if (this.pred && this.labels) {
            let text = this.svg.select('#text_'+struct.name);
            
            text.text('pred: '+utils.getLabelNames()[
              this.pred[imageIndex][this.epochIndex]]);

            text.append('tspan')
              .attr('x', text.attr('x'))
              .attr('dy', '1.2em')
              .text('(truth: '+utils.getLabelNames()[this.labels[imageIndex]]+')');
          }
        } else {


          // 
          let url = this.getImageUrl(utils.getDataset(),
            this.epochIndex, struct.name, imageIndex);
          this.svg.select('#image_'+struct.name)
            .attr('xlink:href', url);

          // this.svg.select('#image_'+struct.name)
          //   .attr('href', function(d){
          //     let url = that.getImageUrl(utils.getDataset(), 
          //       that.epochIndex, struct.name, imageIndex);
          //     if(url in that.cache){
          //       d3.select(this)
          //       .attr('href', that.cache[url])
          //     }else{
          //       utils.toDataURL(url, (imageInBase64)=>{
          //         that.cache[url] = imageInBase64;
          //         d3.select(this)
          //         .attr('href', imageInBase64)
          //       });
          //     }
          //   });

        }
      }
    }
  };


  this.drawStructure = function(net, start) {
    let sx = d3.scaleLinear()
        .domain([0, 1]).range([start, +this.svg.attr('width')]);
    let sy = d3.scaleLinear()
        .domain([0, 1]).range([0, +this.svg.attr('height')]);
    let r = 5;

    this.svg.selectAll('#pipeline')
      .data([0])
      .enter()
      .append('line')
      .attr('id', 'pipeline');

    this.svg.select('#pipeline')
      .attr('x1', sx(0.07))
      .attr('x2', sx(0.83))
      .attr('y1', sy(0.5))
      .attr('y2', sy(0.5))
      .attr('stroke', '#999')
      .attr('stroke-width', 2);
    

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
      if (text.includes('conv')) {
        return baseColors['conv'];
      } else if (text.includes('ReLU')) {
        return baseColors['ReLU'];
      } else if (text.includes('dropout')) {
        return baseColors['dropout'];
      } else if (text.includes('linear')) {
        return baseColors['linear'];
      } else if (text.includes('maxpool')) {
        return baseColors['maxpool'];
      } else if (text.includes('flatten')) {
        return baseColors['flatten'];
      } else if (text.includes('softmax')) {
        return baseColors['softmax'];
      } else if (text.includes('argmax')) {
        return baseColors['argmax'];
      } else {
        return baseColors['default'];
      }
    };
    

    let drawImage = (struct, x, assignedWidth, imageIndex) => {
      let width = assignedWidth*0.6;
      let height = width/struct.size[0] * struct.size[1];
      x = x+assignedWidth*0.2;
      let y = sy(0.5)-height/2;

      if (struct.name == 'argmax') {
        this.svg.selectAll('#text_'+struct.name)
          .data([0])
          .enter()
          .append('text')
          // .attr('font-size', 12)
          .attr('id', 'text_'+struct.name);

        let text = this.svg.select('#text_'+struct.name);

        text.attr('x', x)
          .attr('y', sy(0.5))
          .attr('text-anchor', 'start')
          .attr('alignment-baseline', 'middle');

        this.svg.select('#pipeline')
          .attr('x2', x-5);
      } else {
        this.svg.selectAll('#image_'+struct.name)
          .data([0])
          .enter()
          .append('image')
          .attr('id', 'image_'+struct.name);

        let img = this.svg.select('#image_'+struct.name);
        img.attr('x', x)
          .attr('y', y)
          .attr('width', width);

        if(struct.name == 'softmax'
          || (utils.getDataset() == 'mnist' && struct.name == 'fc2')
          || (utils.getDataset() == 'fashion-mnist' && struct.name == 'fc2')
          || (utils.getDataset() == 'cifar10' && struct.name == 'fc3')
          ){
          let sx = d3.scaleLinear().domain([0,2]).range([x, x+width]);
          let sy = d3.scaleLinear().domain([0,5]).range([y, y+width/2*5]);

          this.svg.selectAll('.'+struct.name+'-dim-text')
          .data(utils.getLabelNames())
          .enter()
          .append('text')
          .attr('class', struct.name+'-dim-text');

          classIndices = this.svg.selectAll('.'+struct.name+'-dim-text')
          .data(utils.getLabelNames())
          .attr('x', (d,i)=>sx(i%2+0.5))
          .attr('y', (d,i)=>sy(Math.floor(i/2)+0.5))
          .style('font-size', 8)
          .style('text-anchor', 'middle')
          .style('alignment-baseline', 'middle')
          .text(d=>d);

        }
      }
    };


    let drawLayer = (text, x, width)=>{
      let y = sy(0.5)-100/2;
      let height = 100;

      this.svg.append('rect')
        .data([text])
        .attr('class', 'layerRect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', width)
        .attr('height', height)
        .attr('fill', text=>getColor(text));

      this.svg.append('text')
        .data([text])
        .attr('class', 'layerText')
        .attr('x', x+width/2)
        .attr('y', y+height/2)
        .attr('transform', 'rotate(-90 '+(x+width/2)+' '+(y+height/2)+')')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        // .attr('font-size', 12)
        .text(text=>text);
    };


    let startx = sx(0.00);
    let imageWidth = sx(1)/net.length*1.35;
    let blockWidth = 16;
    for (let i=0; i<net.length; i++) {
      let struct = net[i];
      if (struct.type == 'data') {
        drawImage(struct, startx, imageWidth, 0);
        startx += imageWidth;
      } else if (struct.type == 'function') {
        for (let j=0; j<struct.blocks.length; j++) {
          let block = struct.blocks[j];
          drawLayer(block, startx, blockWidth);
          startx += blockWidth;
        }
      }
    }

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
        .range([10, 10+this.svg.attr('height')/4]);
      
      this.svg.selectAll('.legendRect')
      .data(legendData)
      .enter()
      .append('rect')
      .attr('class', 'legendRect')
      .attr('x', sx(1))
      .attr('y', (d,i)=>sy(i))
      .attr('width', sx(2)-sx(1))
      .attr('height', (sy(1)-sy(0))*0.75)
      .attr('fill', d=>d.color);

      this.svg.selectAll('.legendText')
      .data(legendData)
      .enter()
      .append('text')
      .attr('class', 'legendText')
      .attr('x', sx(1)-5)
      .attr('y', (d,i)=>sy(i+0.75/2))
      .text(d=>d.text)
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'central');

      this.svg.selectAll('.legendText,.legendRect')
      .on('mouseover', (d)=>{
        let legendType = d.text;
        this.svg.selectAll('.layerRect')
        .filter(layerText => {
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
        })
        .attr('fill', text=>'#fff');
      })
      .on('mouseout', ()=>{
        this.svg.selectAll('.layerRect')
        .attr('fill', text=>getColor(text));
      });


    }
    drawLegend();
  };


  this.loadPred = function() {
    let promises = [
      d3.text(utils.cors_host+'data/examples/'+utils.getDataset()+'/pred.csv'),
      d3.text(utils.cors_host+'data/examples/'+utils.getDataset()+'/labels.csv')
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
      this.epochIndicator = this.svg.append('text')
        .attr('id', 'epochIndicator')
        .attr('x', width/2)
        .attr('y', height-40)
        .attr('text-anchor', 'middle')
        .text('epoch: '+i+'/99');
    } else {
      this.epochIndicator
        .text('epoch: '+i+'/99');
    }
  };


  this.init = function() {
    this.svg.html('');
    this.epochIndicator = null;

    this.net = utils.getNet(utils.getDataset());
    this.loadPred();
    let right = this.drawExamples();
    this.drawStructure(this.net, right);
    
    if (this.intervalHandle !== undefined) {
      clearInterval(this.intervalHandle);
    }

    
    

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
}
