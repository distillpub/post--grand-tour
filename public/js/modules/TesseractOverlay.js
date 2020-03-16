function TesseractOverlay(renderer) {
  let canvas = renderer.gl.canvas;
  let width = canvas.clientWidth;
  let height = canvas.clientHeight;
  this.svg = d3.select('d-figure.'+renderer.gl.canvas.id)
    .insert('svg', ':first-child')
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height)
    .on('mousemove', ()=>{
      //handle unsuccessful onscreen event
      if(renderer.shouldPlay == false 
        || renderer.animId === null 
        || renderer.animId === undefined ){
        renderer.play();
      }
    });
  this.init = function() {
  };

}
