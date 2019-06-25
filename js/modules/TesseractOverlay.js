function TesseractOverlay(renderer) {
  let canvas = renderer.gl.canvas;
  let width = canvas.clientWidth;
  let height = canvas.clientHeight;
  this.svg = d3.select('d-figure.'+renderer.gl.canvas.id)
    .insert('svg', ':first-child')
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height);

  this.init = function() {
    this.initLegend(utils.baseColors.slice(0, 10), utils.getLabelNames());
    this.resize();
    this.initAxisHandle();
  };

  this.initAxisHandle = function() {
    this.svg.sc = d3.interpolateGreys;
    this.drawAxes();
  };
}
