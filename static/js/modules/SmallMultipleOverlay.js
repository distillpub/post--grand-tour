function SmallMultipleOverlay(renderer, dataset, responsiveLegend=true) {
  this.selectedClasses = new Set();
  this.isFullScreen = false;
  this.dataset = dataset;
  this.renderer = renderer;
  let figure = d3.select('d-figure.'+renderer.gl.canvas.id);
  this.figure = figure;


  this.init = function() {
    let canvas = renderer.gl.canvas;
    let marginTop = 30;
    let canvasWidth = canvas.clientWidth;
    let canvasHeight = canvas.clientHeight;
    // let canvasWidthPercentage = 0.8;
    // let canvasMarginPercentage = (1-canvasWidthPercentage)/2;
    // let width = canvasWidth / canvasWidthPercentage;
    // let height = canvasHeight + marginTop;
    let width = canvasWidth;
    let height = canvasHeight;


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
      .domain([0, renderer.ncol])
      .range([renderer.left, renderer.right]);
    this.sy = d3.scaleLinear()
      .domain([0, renderer.nrow])
      .range([renderer.top, renderer.bottom]);
  


    let brushesData = [];

    for (let j=0; j<renderer.epochs.length; j++) {
      let epoch = renderer.epochs[j];
      for (let i=0; i<renderer.methods.length; i++) {
        let method = renderer.methods[i];
        
        let bsx = d3.scaleLinear()
            .domain([-1, 1])
            .range([
              this.sx(j), 
              this.sx(j)+renderer.sideLength
            ]);
        let bsy = d3.scaleLinear()
            .domain([1,-1])
            .range([
              this.sy(i)+renderer.paddingTop, 
              this.sy(i)+renderer.paddingTop+renderer.sideLength
            ]);

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
        d3.select(this)
        .selectAll('.brushFrame')
        .data([0])
        .enter()
        .append('rect')
        .attr('class', 'brushFrame');

        d3.select(this)
        .selectAll('.brushFrame')
        .attr('x', d.bsx(-1))
        .attr('y', d.bsy(1))
        .attr('width', d.bsx(1)-d.bsx(-1))
        .attr('height', d.bsy(-1)-d.bsy(1))
        .attr('rx', 5)
        // .attr('stroke', '#eee')
        // .attr('stroke-width', 0.5)
        .attr('fill', '#aaa')
        .style('opacity', 0.1);

        d3.select(this).call(d.brush);
      });



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
      .attr('x', this.sx(renderer.ncol/2))
      .attr('y', (_, i)=>(this.sy(i)+renderer.paddingTop-4))
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'bottom')
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
      .attr('x', (d, i)=>this.sx(i+0.5))
      .attr('y', this.sy(renderer.nrow)+5)
      // .attr('x', this.sx(0)-0)
      // .attr('y', (_, i)=>this.sy((i+0.5)/renderer.nrow))
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'hanging')
      .text((d)=>'epoch '+d);

    this.svg.selectAll('rect.vertical_divider')
      .data(d3.range);


    this.initLegend(utils.baseColors.slice(0, 10), utils.getLabelNames(false, dataset));

    // if(this.banner){
    //   this.banner.remove();
    // }
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


  this.getDataset = function(){
    return this.dataset;
  };



  this.onMouseover = function(d,i){
    if(responsiveLegend){
      let classes = new Set(this.selectedClasses);
      if (!classes.has(i)) {
        classes.add(i);
      }
      this.onSelectLegend(classes);
    }
  };
  this.onMouseout = function(d,i){
    if(responsiveLegend){
      this.updateAlphas();
      let labelClasses = new Set(this.selectedClasses);
      this.legendMark
        .attr('opacity', (d, i)=>{
          if (labelClasses.size == 0) {
            return 1.0;
          } else {
            return labelClasses.has(i) ? 1.0:0.1;
          }
        });
      renderer.render();
    }
  };
  this.onClick = function(d,i){
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
  };

  this.initLegend = function(
    colors = utils.baseColors.slice(0, 10), 
    labels = utils.getLabelNames()
  ) {
    let width = +this.svg.attr('width');
    let marginTop = renderer.top + renderer.paddingTop;
    let padding = 8;

    let legendLeft = width - utils.smLegendLeft[this.getDataset()];
    let legendRight = width - utils.smLegendRight[this.getDataset()];
    this.legend_sx = d3.scaleLinear()
      .domain([0, 1])
      .range([legendLeft, legendRight]);

    let nlabel = utils.getLabelNames().length;
    this.legend_sy = d3.scaleLinear()
      .domain([
        -1, 
        0, 
        nlabel, 
        nlabel+1 ])
      .range([
        marginTop,
        marginTop+padding, 
        marginTop+padding+nlabel*17, 
        marginTop+padding+nlabel*17+padding ]);

    if(this.legendBox === undefined){
       this.legendBox = this.svg.selectAll('.legendBox')
        .data([0])
        .enter()
        .append('rect')
        .attr('class', 'legendBox')
        .attr('fill', 'none')
        .attr('stroke', '#c1c1c1')
        .attr('stroke-width', 1);
    }
    if (this.legendTitle == undefined && utils.legendTitle[this.getDataset()] !== undefined){
       this.legendTitleBg = this.svg.selectAll('.legendTitleBg')
        .data([0, ])
        .enter()
        .append('rect')
        .attr('class', 'legendTitleBg')
        .attr('fill', d3.rgb(...utils.CLEAR_COLOR.map(d=>d*255)));

      this.legendTitle = this.svg.selectAll('.legendTitle')
        .data([utils.legendTitle[this.getDataset()], ])
        .enter()
        .append('text')
        .attr('class', 'legendTitle')
        .attr('alignment-baseline', 'middle')
        .attr('text-anchor', 'middle')
        .text(d=>d);
    }
    this.legendMark = this.svg.selectAll('.legendMark');


    

    this.svg.selectAll('.legendMark')
      .data(colors)
      .enter()
      .append('circle')
      .attr('class', 'legendMark')
      .attr('fill', (c, i)=>d3.rgb(...c))
      .style('cursor', ()=>{
        if(responsiveLegend){
          return 'pointer';
        }else{
          return 'auto';
        }
      })
      .on('mouseover', (d, i)=>{
        this.onMouseover(d,i);
      })
      .on('mouseout', (d, i)=>{
        this.onMouseout(d,i)
      })
      .on('click', (d, i)=>{
        this.onClick(d,i);
      });
    this.legendMark = this.svg.selectAll('.legendMark');

    this.svg.selectAll('.legendText')
      .data(labels)
      .enter()
      .append('text')
      .attr('class', 'legendText')
      .attr('alignment-baseline', 'middle');

    this.legendText = this.svg.selectAll('.legendText');
    this.legendText
      .text((l)=>l)
      .on('mouseover', (d, i)=>{
        this.onMouseover(d,i);
      })
      .on('mouseout', (d, i)=>{
        this.onMouseout(d,i)
      })
      .on('click', (d, i)=>{
        this.onClick(d,i);
      });

      
    this.repositionLegends = ()=>{
      let width = this.svg.attr('width');
      let height = this.svg.attr('height');
      let r = (this.legend_sy(1)-this.legend_sy(0))/4;

      this.legendMark
        .attr('cx', this.legend_sx(0.0)+2.5*r)
        .attr('cy', (c, i)=>this.legend_sy(i+0.5))
        .attr('r', r);

      this.legendText
        .attr('x', +this.legend_sx(0.0)+2.5*r+2.5*r)
        .attr('y', (l, i)=>this.legend_sy(i+0.5));

      this.legendBox
        .attr('x', this.legend_sx.range()[0])
        .attr('y', this.legend_sy(-1))
        .attr('width', this.legend_sx.range()[1]-this.legend_sx.range()[0])
        .attr('height', this.legend_sy(utils.getLabelNames().length+1)-this.legend_sy(-1))
        .attr('rx', r);

      if (this.legendTitle !== undefined){
        this.legendTitle
          .attr('x',  this.legend_sx(0.5))
          .attr('y',  this.legend_sy(-1))
          .text(utils.legendTitle[this.getDataset()] || '');

        let rectData = this.legendTitle.node().getBBox();
        let padding = 2;
        this.legendTitleBg
          .attr('x', rectData.x-padding)
          .attr('y', rectData.y-padding)
          .attr('width', rectData.width+2*padding)
          .attr('height', rectData.height+2*padding)
          .attr('opacity', utils.legendTitle[this.getDataset()]? 1:0);
      }
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
    this.legendMark
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
