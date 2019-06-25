function SmallMultipleOverlay(renderer, dataset, responsiveLegend) {
  this.selectedClasses = new Set();
  this.isFullScreen = false;

  this.init = function() {
    let canvas = renderer.gl.canvas;
    let marginTop = 30;
    let canvasWidth = canvas.clientWidth;
    let canvasHeight = canvas.clientHeight;
    let canvasWidthPercentage = 0.8;
    let canvasMarginPercentage = (1-canvasWidthPercentage)/2;
    let width = canvasWidth / canvasWidthPercentage;
    let height = canvasHeight + marginTop;

    // d3.select('d-figure.'+renderer.gl.canvas.classList[0])
    // .select('svg').remove();

    d3.select(d3.select('#'+renderer.gl.canvas.id).node().parentNode).selectAll('svg')
      .data([0])
      .enter()
      .insert('svg', ':first-child')
      .attr('class', 'overlay smallmultiple');

    
    this.svg = d3.select(d3.select('#'+renderer.gl.canvas.id).node().parentNode).select('svg')
      .attr('width', width)
      .attr('height', height);
    if (this.brushFilter === undefined) {
      this.brushFilter = {};
    }

    if (this.controlOptionGroup === undefined) {
      this.controlOptionGroup = d3.select(d3.select('#'+renderer.gl.canvas.id).node().parentNode)
        .insert('div', ':first-child')
        .attr('class', 'controlOptionGroup');
    }
    

    if (this.clearBrushButton === undefined) {
      // this.clearBrushButton = this.controlOptionGroup
      //   .insert('div', ':first-child')
      //   .attr('id', 'clearBrushButton')
      //   .append('button')
      //   .text('Clear brushes')
      //   .on('click', ()=>{
      //     this.clearAllBrushes();    
      //   });


      // <i class="fas fa-sync-alt"></i>
      this.clearBrushButton = this.controlOptionGroup
        .insert('div', ':first-child')
        .append('i')
        .attr('class', 'smallmultiple-clearBrushButton tooltip fas fa-sync-alt')
        .on('mouseover', function() {
          d3.select(this).style('opacity', 1);
        })
        .on('mouseout', function() {
          d3.select(this).style('opacity', 0.7);
        })
        .on('click', ()=>{
          this.clearAllBrushes();    
          this.onSelectLegend(d3.range(10));
          this.selectedClasses = new Set();
        });

      this.clearBrushButton
        .append('span')
        .attr('class', 'tooltipText')
        .text('clear all')
    }

    if (this.fullScreenButton === undefined) {
      this.fullScreenButton = this.controlOptionGroup
        .insert('div', ':first-child')
        .append('i')
        .attr('class', 'tooltip fas fa-expand-arrows-alt smallmultiple-fullscreenButton')
        .on('mouseover', function() {
          d3.select(this).style('opacity', 1);
        })
        .on('mouseout', function() {
          d3.select(this).style('opacity', 0.7);
        })
        .on('click', ()=>{
          this.isFullScreen = !this.isFullScreen;
          d3.select(renderer.overlay.svg.node().parentElement)
            .classed('fullscreen', this.isFullScreen);
          renderer.resize();
          this.resize();
          this.clearAllBrushes();
        });
      this.fullScreenButton
        .append('span')
        .attr('class', 'tooltipText')
        .text('fullscreen')
    }


    this.sx = d3.scaleLinear()
      .domain([0, 1])
      .range([canvasMarginPercentage*width, (1-canvasMarginPercentage)*width]);
    this.sy = d3.scaleLinear()
      .domain([0, 1])
      .range([marginTop, marginTop + canvasHeight]);

    this.ax = d3.axisBottom(this.sx)
      .tickValues(d3.range(renderer.ncol+1).map((i) => i/renderer.ncol))
      .tickSize(-canvasHeight);

    this.ay = d3.axisLeft(this.sy)
      .tickValues(d3.range(renderer.nrow+1).map((i) => i/renderer.nrow))
      .tickSize(-canvasWidth);

    
    let brushesData = [];

    for (let j=0; j<renderer.epochs.length; j++) {
      let epoch = renderer.epochs[j];
      for (let i=0; i<renderer.methods.length; i++) {
        let method = renderer.methods[i];
        
        let bsx = d3.scaleLinear()
            .domain([-1, 1])
            .range([this.sx(j/renderer.ncol), this.sx((j+1)/renderer.ncol)]);
        let bsy = d3.scaleLinear()
            .domain([-1, 1])
            .range([this.sy((i+1)/renderer.nrow), this.sy((i)/renderer.nrow)]);
        let brush = d3.brush()
            .extent([[bsx(-1), bsy(1)], [bsx(1), bsy(-1)]])
            .on('brush', (d)=>{
              let selection = d3.event.selection;
              if (selection !== null) {
                let extent = [[0, 0], [0, 0]];
                extent[0][0] = bsx.invert(selection[0][0]);
                extent[0][1] = bsy.invert(selection[0][1]);
                extent[1][0] = bsx.invert(selection[1][0]);
                extent[1][1] = bsy.invert(selection[1][1]);

                let selected = renderer.dataObj.points[d.method][d.epoch]
                    .map((coord, i)=>{
                      return (coord[0] >= extent[0][0]
                              && coord[0] <= extent[1][0]
                              && coord[1] >= extent[1][1]
                              && coord[1] <= extent[0][1]);
                    });
                
                if (this.brushFilter[d.method] === undefined) {
                  this.brushFilter[d.method] = {};
                }
                this.brushFilter[d.method][d.epoch] = selected;
                
                this.updateAlphas();
                renderer.render();
              }
            })
            .on('end', (d)=>{
              if (d3.event.selection === null) {
                if (this.brushFilter !== undefined 
                    && this.brushFilter[d.method] !== undefined
                    && this.brushFilter[d.method][d.epoch] !== undefined) {
                  delete this.brushFilter[d.method][d.epoch];
                }
                this.updateAlphas();
                renderer.render();
              }
            });

        brushesData.push({method, epoch, bsx, bsy, brush});
      } 
    }

    this.svg.selectAll('.brush')
      .data(brushesData)
      .enter()
      .append('g')
      .attr('class', 'brush');

    this.svg.selectAll('.brush')
      .each(function(d) {
        d3.select(this).call(d.brush);
      });


    this.svg.selectAll('.axisBottom')
      .data([0])
      .enter()
      .append('g')
      .attr('class', 'axisBottom');
    this.axisBottom = this.svg.selectAll('.axisBottom');
    this.axisBottom
      .attr('transform', 'translate(0,'+this.sy(1)+')')
      .call(this.ax);


    this.svg.selectAll('.axisLeft')
      .data([0])
      .enter()
      .append('g')
      .attr('class', 'axisLeft');
    this.axisLeft = this.svg.selectAll('.axisLeft');
    this.axisLeft
      .attr('transform', 'translate('+this.sx(0)+',0)')
      .call(this.ay);

    this.svg.selectAll('.tick>line, .domain')
      .attr('stroke-width', 7)
      .attr('stroke', 'white');
    this.axisBottom.selectAll('.tick>line')
      .attr('stroke-width', 1.5);


    this.svg.selectAll('.axisLeft text, .axisBottom text').remove();


    this.svg.selectAll('text.method')
      .data(renderer.methods)
      .enter()
      .append('text')
      .attr('class', 'method');

    this.svg.selectAll('text.method')
      .data(renderer.methods)
      .exit()
      .remove();

    this.methodText = this.svg.selectAll('text.method');
    this.methodText
      .attr('x', this.sx(0)-0)
      .attr('y', (_, i)=>this.sy((i+0.5)/renderer.nrow))
      .attr('text-anchor', 'end')
      .text((d)=>d);


    this.svg.selectAll('text.epoch')
      .data(renderer.epochs)
      .enter()
      .append('text')
      .attr('class', 'epoch');

    this.svg.selectAll('text.epoch')
      .data(renderer.epochs)
      .exit()
      .remove();

    this.epochText = this.svg.selectAll('text.epoch');
    this.epochText
      .attr('x', (d, i)=>this.sx((i+0.5)/renderer.ncol))
      .attr('y', this.sy(0)-5)
      // .attr('x', this.sx(0)-0)
      // .attr('y', (_, i)=>this.sy((i+0.5)/renderer.nrow))
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .text((d)=>'epoch '+d);

    this.svg.selectAll('rect.vertical_divider')
      .data(d3.range);


    this.canvasMarginPercentage = canvasMarginPercentage;
    this.initLegend(utils.baseColors.slice(0, 10), utils.getLabelNames(false, dataset));
  };

  let that = this;
  this.clearAllBrushes = function() {
    that.svg.selectAll('.brush')
      .filter((d)=>{
        return d!==undefined 
          && d.method!==undefined 
          && this.brushFilter[d.method] !== undefined
          && this.brushFilter[d.method][d.epoch] !== undefined;
      })
      .each(function(d) {
        delete that.brushFilter[d.method][d.epoch];
        d3.select(this).call(d.brush.move, null);
      });   
  };


  this.initLegend = function(colors=utils.baseColors.slice(0, 10), labels=utils.getLabelNames()) {
    this.legend_sx = d3.scaleLinear()
      .domain([0, 1])
      .range([this.sx(1)+5, this.sx(1+this.canvasMarginPercentage)]);

    this.legend_sy = d3.scaleLinear()
      .domain([0, 1])
      .range([this.sy(0)+5, Math.min(this.sy(1), this.sy(0)+400)]);

    this.svg.selectAll('.legendRect')
      .data(colors)
      .enter()
      .append('rect')
      .attr('class', 'legendRect')
      .attr('fill', (c, i)=>d3.rgb(...c))
      .style('cursor', ()=>{
        if(responsiveLegend){
          return 'pointer';
        }else{
          return 'auto';
        }
      })
      .on('mouseover', (_, i)=>{
        if(responsiveLegend){
          let classes = new Set(this.selectedClasses);
          if (!classes.has(i)) {
            classes.add(i);
          }
          this.onSelectLegend(classes);
        }
      })
      .on('mouseout', (_, i)=>{
        if(responsiveLegend){
          this.updateAlphas();
          let labelClasses = new Set(this.selectedClasses);
          this.legendRect
            .attr('opacity', (d, i)=>{
              if (labelClasses.size == 0) {
                return 1.0;
              } else {
                return labelClasses.has(i) ? 1.0:0.1;
              }
            });
          renderer.render();
        }
      })
      .on('click', (_, i)=>{
        if(responsiveLegend){
          if (this.selectedClasses.has(i)) {
            this.selectedClasses.delete(i);
          } else {
            this.selectedClasses.add(i);
          }
          this.onSelectLegend(this.selectedClasses);
          if (this.selectedClasses.size == renderer.dataObj.ndim) {
            this.selectedClasses = new Set();
          }
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
      .attr('text-anchor', 'middle')
      .text((l)=>l)
      .style('pointer-events', 'none');

    this.repositionLegends = ()=>{
      let width = this.svg.attr('width');
      let height = this.svg.attr('height');
      this.legendRect
        .attr('x', this.legend_sx(0))
        .attr('y', (c, i)=>this.legend_sy(i/10))
        .attr('width', (this.legend_sy(1)-this.legend_sy(0))/10 )
        .attr('height', (this.legend_sy(1)-this.legend_sy(0))/10 );

      this.legendText
        .attr('x', this.legend_sx(0) +
              (this.legend_sy(1)-this.legend_sy(0))/10/2 )
        .attr('y', (l, i)=>this.legend_sy((i+0.5)/10));
    };
    this.repositionLegends();
  };


  this.onSelectLegend = function(labelClasses) {
    if (typeof(labelClasses) === 'number') {
      labelClasses = [labelClasses];
    }
    labelClasses = new Set(labelClasses);

    for (let i=0; i<renderer.dataObj.npoint; i++) {
      if (labelClasses.has(renderer.dataObj.labels[i])) {
        renderer.dataObj.alphas[i] = 255;
      } else {
        renderer.dataObj.alphas[i] = 0;
      }
    }
    // this.updateAlphas();
    this.legendRect
      .attr('opacity', (d, j)=>{
        if (!labelClasses.has(j)) {
          return 0.1;
        } else {
          return 1.0;
        }
      });
    renderer.render();
  };


  this.resize = function() {
    this.init();
    this.repositionLegends();
  };

  this.updateAlphas = function() {
    for (let i=0; i<renderer.dataObj.npoint; i++) {
      renderer.dataObj.alphas[i] = 255;
      utils.walkObject(this.brushFilter, (method) => {
        utils.walkObject(this.brushFilter[method], (epoch) => {
          if (this.brushFilter[method][epoch][i] === false) {
            renderer.dataObj.alphas[i] = 0;
          }
        });
      });
      if (this.selectedClasses.size !== 0 &&
          !this.selectedClasses.has(renderer.dataObj.labels[i])) {
        renderer.dataObj.alphas[i] = 0;
      }
    }
  };
}
