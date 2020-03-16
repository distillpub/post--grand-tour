function ConfusionMatrixRenderer(containerId) {
  containerId = containerId[0] === '#' ? containerId : ('#'+containerId);
  this.container = d3.select(containerId);
  this.container.selectAll('svg')
    .data([0])
    .enter()
    .append('svg')
    .attr('class', 'confusionMatrix')
    .style('width', '70%');
  // .style('background', d3.rgb(...utils.CLEAR_COLOR.map(d=>d*255)));

  this.svg = this.container.selectAll('svg');
  this.epoch = 99;

  let that = this;
  this.slider = this.container
    .insert('input', ':first-child')
    .attr('type', 'range')
    .attr('class', 'slider')
    .attr('min', utils.MIN_EPOCH)
    .attr('max', utils.MAX_EPOCH)
    .attr('value', utils.MAX_EPOCH)
    .on('input', function() {
      let value = +d3.select(this).property('value');
      that.epoch = value;
      that.shouldAutoNextEpoch = false;
      that.init();
    });

  this.epochIndicator = this.svg.append('text')
    .attr('text-anchor', 'middle')
    .attr('alignment-baseline', 'bottom')
    .text('Epoch');

  this.resize = function() {
    this.init();
  };


  this.playButton = this.container
    .insert('i', ':first-child')
    .attr('class', 'play-button  fa fa-play')
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

  this.updateDmax = function() {
    this.dataObj.dmax = math.max(
      this.dataObj.data.slice(25).map((matrix) => {
        return matrix.map((row, i) => {
          return row.slice(0, i).concat(row.slice(i+1));
        });
      })
    );
    this.sc = d3.scaleSequential(d3.interpolateViridis)
      .domain([0, this.dataObj.dmax]);
    // this.sc = d3.scaleLinear()
    // .domain([0, this.dataObj.dmax])
    // .range([d3.rgb(56,56,56), d3.rgb(230,230,230)]);
  };

  this.init = function() {
    this.resizeSvg();
    this.initMatrix();
    this.initLabels();
    this.initSlider();
  };

  this.initSlider = function() {
    this.slider
      .style('left', (this.svg.node().parentNode.clientWidth * 0.15 +
                      this.sx(0)) + 'px')
      .style('width', (this.sx(1)-this.sx(0))+'px')
      .style('top', (this.height-15)+'px')
      .property('value', this.epoch);

    this.epochIndicator
      .attr('x', this.sx(0.5))
      .attr('y', (this.height-20)+'px')
      .text('Epoch: ' + this.epoch + '/99');

    this.playButton
      .style('left', (this.svg.node().parentNode.clientWidth * 0.15 +
                      this.sx(0) - 50) + 'px')
      .style('top', (this.height-15-15)+'px');
  };


  this.initData = function(buffer, url) {
    console.log(url);
    this.dataObj = {};
    this.dataObj.data = utils.reshape(new Float32Array(buffer), [100, 10, 10]);
    
    this.dataObj.labels = utils.getLabelNames();
    this.isDataReady = true;
    this.updateDmax();
    this.init();
  };

  this.updateCountLabel = function(d){
    if (d !== undefined) {
      this.countLabelData = d;
    }
    if (this.countLabelData !== undefined) {
      d = this.countLabelData;
      this.countLabel
        .attr('x', this.sx((d.colIndex+0.5) / 10))
        .attr('y', this.sy((d.rowIndex+0.5) / 10))
        .attr('fill', ()=>{
          let v = this.dataObj.data[this.epoch][d.rowIndex][d.colIndex];
          v = v/this.dataObj.dmax;
          return v>=1 ? '#222':'#eee';
        })
        .text(this.dataObj.data[this.epoch][d.rowIndex][d.colIndex]);
    }
  };

  this.initMatrix = function() {
    this.svg.selectAll('.matrixRow')
      .data(this.dataObj.data[this.epoch].map((d, i) => {
        return {values: d, rowIndex: i};
      }))
      .enter()
      .append('g')
      .attr('class', 'matrixRow');
    this.rows = this.svg.selectAll('.matrixRow');
    
    this.rows.selectAll('.matrixCell')
      .data((row, j) => {
        return row.values.map((v, j) => {
          return {value: v, rowIndex: row.rowIndex, colIndex: j};
        });
      })
      .enter()
      .append('rect')
      .attr('class', 'matrixCell');

    this.cells = this.rows.selectAll('.matrixCell')
      .attr('x', (d) => this.sx(d.colIndex / 10))
      .attr('y', (d) => this.sy(d.rowIndex / 10))
      .attr('width', (this.sx(1)-this.sx(0))/10+0.4 )
      .attr('height', (this.sy(1)-this.sy(0))/10+0.4 )
      .attr('fill', (d) => {
        return this.sc(d.value);
      })
      .on('mouseover', (d)=>{
        this.countLabel
          .attr('opacity', 1);
        this.updateCountLabel(d);
      })
      .on('mouseout', ()=>{
        this.countLabel
          .attr('opacity', 0);
      });
  };

  this.setEpoch = function(epoch) {
    this.shouldAutoNextEpoch = false;
    this.epoch = epoch;
    this.init();
  };

  this.initLabels = function() {
    this.rows.selectAll('.rowLabel')
      .data(this.dataObj.labels)
      .enter()
      .append('text')
      .attr('class', 'rowLabel');

    this.rows.selectAll('.rowLabel')
      .attr('x', this.sx(0)-10)
      .attr('y', (d, i) => this.sy((i+0.5)/10))
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .text((d) => d);

    this.rows.selectAll('.colLabel')
      .data(this.dataObj.labels)
      .enter()
      .append('text')
      .attr('class', 'colLabel');

    this.rows.selectAll('.colLabel')
      .attr('x', (d, i) => this.sx((i+0.5)/10))
      .attr('y', this.sy(1)+10)
      .attr('transform', (d, i) =>
            'rotate(-90, '+this.sx((i+0.5)/10)+','+(this.sy(1)+10)+')')
      .attr('text-anchor', 'end')
      .attr('alignment-baseline', 'middle')
      .text((d) => d);

    this.svg.selectAll('.yLabel')
      .data([0])
      .enter()
      .append('text')
      .attr('class', 'yLabel');

    this.yLabel = this.svg.selectAll('.yLabel')
      .text('Truth')
      .attr('x', 10)
      .attr('y', this.sy(0.5))
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle');
    
    this.yLabel
      .attr('transform', (d, i) =>
            'rotate(-90, '+this.yLabel.attr('x')+','+this.yLabel.attr('y')+')')
      .style('font-weight', 'normal');

    this.svg.selectAll('.xLabel')
      .data([0])
      .enter()
      .append('text')
      .attr('class', 'xLabel');

    this.svg.selectAll('.xLabel')
      .text('Prediction')
      .attr('x', this.sx(0.5))
      .attr('y', this.sy(1.0)+70)
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .style('font-weight', 'normal');

    this.svg.selectAll('.countLabel')
      .data([0])
      .enter()
      .append('text')
      .attr('class', 'countLabel')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .style('pointer-events','none')
      .style('font-weight', 300);

    this.countLabel = this.svg.selectAll('.countLabel');
  };

  this.resizeSvg = function() {
    let svgWidth = Math.min(this.svg.node().clientWidth, 600);

    this.width = svgWidth;

    this.marginLeft = this.width * 0.2;
    this.marginTop = this.width * 0.0;
    this.innerWidth = this.width * 0.6;
    this.innerHeight = this.innerWidth;

    this.height = this.innerHeight * 1.4;

    this.svg.attr('width', this.width);
    this.svg.attr('height', this.height);

    this.sx = d3.scaleLinear()
      .domain([0, 1])
      .range([this.marginLeft, this.marginLeft + this.innerWidth]);

    this.sy = d3.scaleLinear()
      .domain([0, 1])
      .range([this.marginTop, this.marginTop + this.innerHeight]);
  };

  // dummy functions for utils.loadDataToRenderer
  this.play = function() {
    if (this.shouldAutoNextEpoch === undefined) {
      this.shouldAutoNextEpoch = false;
    }
    this.init();

    window.setInterval(() => {
      if (this.shouldAutoNextEpoch) {
        this.epoch = (this.epoch + 1) % 100;
        this.initMatrix();
        this.initSlider();
        this.updateCountLabel();
      }
    }, 100);
  };
  this.overlay = {};
  this.overlay.init = () => {}; 
}
