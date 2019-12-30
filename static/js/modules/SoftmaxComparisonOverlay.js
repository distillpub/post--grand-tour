function SoftmaxComparisonOverlay(renderer, [xOffsetLeft, xOffsetRight]) {
  let canvas = renderer.gl.canvas;
  let width = canvas.clientWidth;
  let height = canvas.clientHeight;
  this.selectedClasses = new Set();

  this.xOffsetLeft = xOffsetLeft;
  this.xOffsetRight = xOffsetRight;
  this.renderer = renderer;

  let figure = d3.select('d-figure.'+renderer.gl.canvas.id);
  let that = this;

  this.zoomSlider = figure
    .insert('input', ':first-child')
    .attr('type', 'range')
    .attr('class', 'slider zoomSlider')
    .attr('min', 0.2)
    .attr('max', 2.0)
    .attr('value', this.renderer.viewFactor)
    .attr('step', 0.01)
    .on('input', function() {
      let value = d3.select(this).property('value');
      renderer.scaleFactor = +value;
    });

  this.epochSlider = figure
    .insert('input', ':first-child')
    .attr('type', 'range')
    .attr('class', 'slider epochSlider')
    .attr('min', renderer.epochs[0])
    .attr('max', renderer.epochs[renderer.epochs.length-1])
    .attr('value', utils.MIN_EPOCH)
    .on('input', function() {
      let value = d3.select(this).property('value');
      renderer.shouldAutoNextEpoch = false;
      renderer.setEpochIndex(parseInt(value));
      // renderer.render(0);
      that.playButton.attr('class', 'tooltip play-button fa fa-play');
      that.playButton.select('span').text('Play training');
    });

  //special treatment when showing only one peoch
  if(renderer.epochs.length <= 1){
    this.epochSlider.style('display', 'none');
  }


  this.playButton = figure
    .insert('i', ':first-child')
    .attr('class', 'play-button tooltip fa ' + (renderer.shouldAutoNextEpoch?'fa-pause':'fa-play'));

  this.playButton
    .on('mouseover', function() {
      d3.select(this).style('opacity', 1);
    })
    .on('mouseout', function() {
      d3.select(this).style('opacity', 0.7);
    })
    .on('click', ()=>{
      renderer.shouldAutoNextEpoch = !renderer.shouldAutoNextEpoch;
      if (renderer.shouldAutoNextEpoch) {
        this.playButton.attr('class', 'tooltip play-button fa fa-pause');
        this.playButton.select('span')
        .text('Pause training');
      } else {
        this.playButton.attr('class', 'tooltip play-button fa fa-play');
        this.playButton.select('span')
        .text('Play training');
      }
    });

  this.playButton.append('span')
  .attr('class', 'tooltipText')
  .text('Pause training');

  if(renderer.epochs.length <= 1){
    this.playButton.style('display', 'none');
  }


  this.fullScreenButton = figure
    .insert('i', ':first-child')
    .attr('class', 'tooltip teaser-fullscreenButton fas fa-expand-arrows-alt')
    .on('mouseover', function() {
      d3.select(this).style('opacity', 0.7);
    })
    .on('mouseout', function() {
      if(renderer.isFullScreen){
        d3.select(this).style('opacity', 0.7);
      }else{
        d3.select(this).style('opacity', 0.3);
      }
    })
    .on('click', function(){
      renderer.setFullScreen(!renderer.isFullScreen);
      that.resize();

      if(renderer.isFullScreen){
        d3.select(this).style('opacity', 0.7);
      }else{
        d3.select(this).style('opacity', 0.3);
      }
    });

  this.fullScreenButton.append('span')
    .attr('class', 'tooltipTextBottom')
    .text('Toggle fullscreen');

  this.grandtourButton = figure
    .insert('i', ':first-child')
    .attr('class', 'teaser-grandtourButton tooltip fas fa-globe-americas')
    .attr('width', 32)
    .attr('height', 32)
    .style('opacity', renderer.shouldPlayGrandTour?0.7:0.3)
    .on('mouseover', function() {
      d3.select(this).style('opacity', 0.7);
    })
    .on('mouseout', function() {
      if (renderer.shouldPlayGrandTour) {
        d3.select(this).style('opacity', 0.7);
      }else{
        d3.select(this).style('opacity', 0.3);
      }
    });

  this.grandtourButton.append('span')
    .attr('class', 'tooltipText')
    .text('Pause Grand Tour');

  this.grandtourButton
    .on('click', function() {
      renderer.shouldPlayGrandTour = !renderer.shouldPlayGrandTour;
      // let figureNode = d3.select(this).node()
      // .parentNode.parentNode.parentNode;
      if (renderer.shouldPlayGrandTour) {
        d3.select(this).select('span')
        .text('Pause Grand Tour');
        d3.select(this).style('opacity', 0.7);
      } else {
        d3.select(this).select('span')
        .text('Play Grand Tour');
        d3.select(this).style('opacity', 0.3);
      }
    });


  this.svg = figure
    .insert('svg', ':first-child')
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height)
    .on('dblclick', function() {
      // renderer.shouldPlayGrandTour = !renderer.shouldPlayGrandTour;
    })
    .on('mousemove', ()=>{
      if (renderer.shouldRender == false){
        renderer.shouldRender = true;
        renderer.play();
      }
    });

  this.trainingText = this.svg.append('text')
    .attr('x', (width-50)/2 + this.xOffsetLeft)
    .attr('y', 30)
    .style('text-anchor', 'middle')
    .style('alignment-baseline', 'middle')
    .text('Training');

  this.testingText = this.svg.append('text')
    .attr('x', (width-50)/2 + this.xOffsetRight)
    .attr('y', 30)
    .style('text-anchor', 'middle')
    .style('alignment-baseline', 'middle')
    .text('Testing');


  this.epochIndicator = this.svg.append('text')
    .attr('id', 'epochIndicator')
    .attr('text-anchor', 'middle')
    .text('training');
  
  
  this.controlOptionGroup = figure
    .insert('div', ':first-child');

  this.modeOption = this.controlOptionGroup
    .insert('div', ':first-child')
    .attr('class', 'form-group modeOption');

  this.modeOption.append('label')
    // .attr('for', 'modeOption')
    .text('Instances as: ');

  let select = this.modeOption.append('select')
      .attr('id', 'modeOption')
      .on('change', function() {
        let mode = d3.select(this).property('value');
        renderer.setMode(mode);
        that.updateArchorRadius(mode);
      });

  select.selectAll('option')
    .data(['point', 'image'])
    .enter()
    .append('option')
    .text((d)=>d);

  

  function clamp(min, max, v) {
    if (v>max){
      return max;
    }else if(v<min){
      return min;
    }else{
      return v;
    }
  }
  
  this.updateArchorRadius = function(mode) {
    if (mode == 'point') {
      this.archorRadius = clamp(4, 8, Math.min(width, height)/50);
    } else {
      this.archorRadius = clamp(4, 10, Math.min(width, height)/30);
    }
    
    this.svg.selectAll('.anchor-left').attr('r', this.archorRadius);
    this.svg.selectAll('.anchor-right').attr('r', this.archorRadius);
  };


  this.resize = function() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    this.svg.attr('width', width);
    this.svg.attr('height', height);

    this.legend_sx = d3.scaleLinear()
      .domain([0, 1])
      .range([width-120, width-20]);
    this.lengend_sy = d3.scaleLinear()
      .domain([0, 1])
      .range([height/2-120, height/2+120]);

    this.updateArchorRadius(renderer.mode);
    this.repositionAll();
  };


  this.repositionAll = function() {
    let width = this.svg.attr('width');
    let height = this.svg.attr('height');

    let sliderLeft = parseFloat(this.epochSlider.style('left'));
    let sliderWidth = parseFloat(this.epochSlider.style('width'));
    let sliderMiddle = sliderLeft+sliderWidth/2;
    
    this.epochIndicator
      .attr('x', sliderMiddle)
      .attr('y', height-40);

    if(renderer.epochs.length <= 1){
      this.epochIndicator
        .attr('x', width/2-10)
        .attr('y', height-20);
    }

    this.legendRect
      .attr('x', this.legend_sx(0))
      .attr('y', (c, i)=>this.lengend_sy(i/10))
      .attr('width', (this.lengend_sy(1)-this.lengend_sy(0))/10 )
      .attr('height', (this.lengend_sy(1)-this.lengend_sy(0))/10);

    this.legendText
      .attr('x', this.legend_sx(0.3))
      .attr('y', (l, i)=>this.lengend_sy((i+0.5)/10));


    this.trainingText
      .attr('x', (width-50)/2 + this.xOffsetLeft);
    this.testingText
      .attr('x', (width-50)/2 + this.xOffsetRight);

  };


  this.init = function() {
    this.initLegend(
      utils.baseColors.slice(0, 10), 
      utils.getLabelNames(adversarial=false, renderer.init_dataset || utils.getDataset())
    );
    this.resize();
    this.initAxisHandle();
  };


  this.initAxisHandle = function() {
    this.svg.sc = d3.interpolateGreys;
    this.drawAxes();
  };


  this.drawAxes = function() {
    let svg = this.svg;
    let ndim = renderer.dataObj.ndim || 10;
    let coordinates = math.zeros(ndim, 2)._data;

    svg.selectAll('.anchor-left')
      .data(coordinates)
      .enter()
      .append('circle')
      .attr('class', 'anchor-left')
      .attr('opacity', 0.2);

    svg.selectAll('.anchor-right')
      .data(coordinates)
      .enter()
      .append('circle')
      .attr('class', 'anchor-right')
      .attr('opacity', 0.2);

    let anchorLeft = svg.selectAll('.anchor-left')
        .attr('r', this.archorRadius)
        .attr('fill', (_, i)=>d3.rgb(...utils.baseColors[i]).darker())
        .attr('stroke', (_, i)=>'white')
        .style('cursor', 'pointer');

    let anchorRight = svg.selectAll('.anchor-right')
        .attr('r', this.archorRadius)
        .attr('fill', (_, i)=>d3.rgb(...utils.baseColors[i]).darker())
        .attr('stroke', (_, i)=>'white')
        .style('cursor', 'pointer');

    svg.anchorLeft = anchorLeft;
    svg.anchorRight = anchorRight;


    svg.drag = d3.drag()
      .on('start', function() {
        renderer.shouldPlayGrandTourPrev = renderer.shouldPlayGrandTour;
        renderer.shouldPlayGrandTour = false;
      })
      .on('drag', (d, i)=>{
        let dx = renderer.sx.invert(d3.event.dx)-renderer.sx.invert(0);
        let dy = renderer.sy.invert(d3.event.dy)-renderer.sy.invert(0);
        let x = renderer.sx.invert(d3.event.x);
        let y = renderer.sy.invert(d3.event.y);
        let matrix = renderer.gt.getMatrix();

        matrix[i][0] += dx;
        matrix[i][1] += dy;
        // matrix[i][0] = x;
        // matrix[i][1] = y;
        matrix = utils.orthogonalize(matrix, i);
      
        renderer.gt.setMatrix(matrix);
        
        this.redrawAxis();
        // renderer.render(0);
      })
      .on('end', function() {
        renderer.shouldPlayGrandTour = renderer.shouldPlayGrandTourPrev;
        renderer.shouldPlayGrandTourPrev = null;
      });

    anchorLeft
      .on('mouseover', (_, i)=>{
        renderer.gt.STEPSIZE_PREV = renderer.gt.STEPSIZE;
        renderer.gt.STEPSIZE = renderer.gt.STEPSIZE * 0.2;
      })
      .on('mouseout', (_, i)=>{
        renderer.gt.STEPSIZE = renderer.gt.STEPSIZE_PREV;
        delete renderer.gt.STEPSIZE_PREV;
      })
      .call(svg.drag);

    anchorRight
      .on('mouseover', (_, i)=>{
        renderer.gt.STEPSIZE_PREV = renderer.gt.STEPSIZE;
        renderer.gt.STEPSIZE = renderer.gt.STEPSIZE * 0.2;
      })
      .on('mouseout', (_, i)=>{
        renderer.gt.STEPSIZE = renderer.gt.STEPSIZE_PREV;
        delete renderer.gt.STEPSIZE_PREV;
      })
      .call(svg.drag);


  };


  this.redrawAxis = ()=>{
    let svg = this.svg;

    if(renderer.gt !== undefined){
      let handlePos = renderer.gt.project(math.eye(renderer.dataObj.ndim)._data);

      this.svg.anchorLeft
        .attr('cx', (_, i) => renderer.sx(handlePos[i][0]) + this.xOffsetLeft)
        .attr('cy', (_, i) => renderer.sy(handlePos[i][1]));
      this.svg.anchorRight
        .attr('cx', (_, i) => renderer.sx(handlePos[i][0]) + this.xOffsetRight)
        .attr('cy', (_, i) => renderer.sy(handlePos[i][1]));
    }
    

    // svg.anchors.filter((_,j)=>renderer.gt.fixedAxes[j].isFixed)
    // .attr('fill', 'red')
    // .attr('opacity', 0.5);

    // svg.anchors.filter((_,j)=>!renderer.gt.fixedAxes[j].isFixed)
    // .attr('fill', 'black')
    // .attr('opacity', 0.1);
  };


  this.initLegend = function(colors, labels) {
    this.legend_sx = d3.scaleLinear()
      .domain([0, 1])
      .range([this.svg.attr('width')-120, this.svg.attr('width')-20]);

    this.lengend_sy = d3.scaleLinear()
      .domain([0, 1])
      .range([20, this.svg.attr('height')-50]);

    this.svg.selectAll('.legendRect')
      .data(colors)
      .enter()
      .append('rect')
      .attr('class', 'legendRect')
      .attr('fill', (c, i)=>'rgb('+c+')')
      .on('mouseover', (_, i)=>{
        let classes = new Set(this.selectedClasses);
        if (!classes.has(i)) {
          classes.add(i);
        }
        this.onSelectLegend(classes);
      })
      .on('mouseout', ()=>this.restoreAlpha())
      .on('click', (_, i)=>{
        if (this.selectedClasses.has(i)) {
          this.selectedClasses.delete(i);
        } else {
          this.selectedClasses.add(i);
        }
        this.onSelectLegend(this.selectedClasses);
        if (this.selectedClasses.size == renderer.dataObj.ndim) {
          this.selectedClasses = new Set();
        }
      });
    this.legendRect = this.svg.selectAll('.legendRect');
    this.svg.selectAll('.legendText')
      .data(labels)
      .enter()
      .append('text')
      .attr('class', 'legendText');

    this.legendText = this.svg.selectAll('.legendText')
      .attr('alignment-baseline', 'middle')
      .attr('fill', '#333')
      .text((l)=>l)
      .on('mouseover', (_, i)=>{
        let classes = new Set(this.selectedClasses);
        if (!classes.has(i)) {
          classes.add(i);
        }
        this.onSelectLegend(classes);
      })
      .on('mouseout', ()=>this.restoreAlpha())
      .on('click', (_, i)=>{
        if (this.selectedClasses.has(i)) {
          this.selectedClasses.delete(i);
        } else {
          this.selectedClasses.add(i);
        }
        this.onSelectLegend(this.selectedClasses);
        if (this.selectedClasses.size == renderer.dataObj.ndim) {
          this.selectedClasses = new Set();
        }
      });
  };


  this.onSelectLegend = function(labelClasses) {
    if (typeof(labelClasses) === 'number') {
      labelClasses = [labelClasses];
    }
    labelClasses = new Set(labelClasses);

    for (let i=0; i<renderer.dataObj.npoint; i++) {
      for (let mode of ['train', 'test']){
        if (labelClasses.has(renderer.dataObj[mode].labels[i])) {
          renderer.dataObj[mode].alphas[i] = 255;
        } else {
          renderer.dataObj[mode].alphas[i] = 0;
        }
      }
      
    }
    this.svg.selectAll('rect')
      .attr('opacity', (d, j)=>{
        if (!labelClasses.has(j)) {
          return 0.1;
        } else {
          return 1.0;
        }
      });
    // renderer.render(0);
  };


  this.restoreAlpha = function() {
    let labelClasses = new Set(this.selectedClasses);

    for (let mode of ['train', 'test']){
      if (labelClasses.size == 0) {
        for (let i=0; i<renderer.dataObj.npoint; i++) {
          renderer.dataObj[mode].alphas[i] = 255;
        }
      } else {
        for (let i=0; i<renderer.dataObj.npoint; i++) {
          if (labelClasses.has(renderer.dataObj[mode].labels[i])) {
            renderer.dataObj[mode].alphas[i] = 255;
          } else {
            renderer.dataObj[mode].alphas[i] = 0;
          }
        }
      }
    }
    

    this.svg.selectAll('rect')
      .attr('opacity', (d, i)=>{
        if (labelClasses.size == 0) {
          return 1.0;
        } else {
          return labelClasses.has(i) ? 1.0:0.1;
        }
      });
  };
}
