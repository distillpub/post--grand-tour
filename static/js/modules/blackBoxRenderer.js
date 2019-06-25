let bb = d3.select('#blackBox');
let width = bb.property('width').baseVal.value;
let height = bb.property('height').baseVal.value;
let sx = d3.scaleLinear().domain([0, 1]).range([0, width]);
let sy = d3.scaleLinear().domain([0, 1]).range([0, height]);
bb.style('background-color', d3.rgb(...utils.CLEAR_COLOR.map((d)=>d*255)));

// TODO draw arrow
bb.append('rect')
  .attr('x', sx(0.4))
  .attr('y', sy(0.2))
  .attr('width', sx(0.6)-sx(0.4))
  .attr('height', sy(0.8)-sy(0.2))
  .attr('fill', '#333');

bb.append('line')
  .attr('x1', sx(0.35))
  .attr('x2', sx(0.65))
  .attr('y1', sy(0.5))
  .attr('y2', sy(0.5))
  .attr('stroke-width', 3)
  .attr('stroke', '#333');

bb.append('text')
  .attr('fill', '#eee')
  .attr('text-anchor', 'middle')
  .attr('alignment-baseline', 'middle')
  .append('tspan')
  .text('A black box')
  .attr('x', sx(0.5))
  .attr('y', sy(0.5)-4)
  .append('tspan')
  .text('digit recognizer')
  .attr('x', sx(0.5))
  .attr('y', sy(0.5)+12);


let dataset = utils.getDataset();
let url = 'data/mnist/examples/input/23.png';
let label = '"This is a 5"';

bb.append('image')
  .attr('x', sx(0.26))
  .attr('y', sy(0.5)-25)
  .attr('width', '50px')
  .attr('xlink:href', url);

bb.append('text')
  .attr('x', sx(0.66))
  .attr('y', sy(0.5))
  .attr('alignment-baseline', 'middle')
  .attr('fontsize', 14)
  .text(label);
