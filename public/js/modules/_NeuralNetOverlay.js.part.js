 let drawImage = (struct, x, assignedWidth, imageIndex) => {
      let width = assignedWidth*0.6;
      let height = width/struct.size[0] * struct.size[1];
      x = x+assignedWidth*0.2;
      let y = sy(0.5)-height/2;
      let data = [{width, height, x, y}];

      if (struct.name == 'argmax') {
        this.svg.selectAll('#text_'+struct.name)
          .data([0])
          .enter()
          .append('text')
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
          .data(data)
          .enter()
          .append('image')
          .attr('id', 'image_'+struct.name);
        this.svg.selectAll('#clip_'+struct.name)
          .data(data)
          .enter()
          .append('clipPath')
          .attr('id', 'clip_'+struct.name);

        let img = this.svg.select('#image_'+struct.name);
        let clipPath = this.svg.select('#clip_'+struct.name);
        let url = this.getImageUrl(utils.getDataset(), struct.name);

        clipPath.append('rect')
        .attr('x', d=>d.x)
        .attr('y', d=>d.y)
        .attr('width', d=>d.width)
        .attr('height', d=>d.height);

        img.attr('x', d=>d.x - imageIndex * d.width)
          .attr('y', d=>d.y)
          .attr('width', d=>d.width * 45)
          .attr('xlink:href', url)
          .attr('clip-path', d=>`url(#clip_${struct.name})`);

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
    };// end of drawImage


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
    };//end of drawLayer



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
        // TODO
        this.svg.select('#image_'+struct.name)
        .attr('x', d=>d.x - imageIndex * d.width)
        .attr('y', d=>d.y - (struct.name=='input' ? 0:this.epochIndex * d.height))
        .attr('width', d=>d.width * 45);

        // this.svg.select('#image_'+struct.name)
        //   .attr('xlink:href', url);
      }
    }
  }
};