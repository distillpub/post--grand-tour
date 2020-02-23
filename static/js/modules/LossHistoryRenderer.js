class LossHistoryRenderer{
    constructor(figure, urls){
        this.urls = urls;
        this.figure = figure;
        this.svg = d3.select(this.figure).select('svg');

        utils.loadDataWithCallback(urls, this.init.bind(this));
    }

    init(buffer, url, i, length){
        this.initData(buffer, url, i, length);
        this.onWindowResize();//plot
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    onWindowResize(){
        this.width = this.svg.node().clientWidth;
        this.height = this.svg.node().clientHeight;
        this.resize();
        this.plot();
    }

    resize(){
        let marginLeft = 40;
        let marginBottom = 40;
        let marginRight = 5;
        let marginTop = 5;
        this.sx = d3.scaleLinear()
        .domain([0,100])
        .range([marginLeft, this.width-marginRight]);

        this.sy = d3.scaleLog()
        .domain([this.dataExtent[0], this.dataExtent[1]*1.2])
        .range([this.height-marginBottom, marginTop]);
    }
    

    initData(buffer, url, i, length){
        let dataExtent = [0,0];
        if (url.includes('lossHistory.bin')) {
            this.data = Array.from(new Float32Array(buffer));
            this.dataExtent = d3.extent(this.data);
            this.data = numeric.transpose(utils.reshape(this.data, [100,1]));
            this.sc = d3.scaleOrdinal()
            .domain([0])
            .range(['#3182bd']);
        }else if (url.includes('lossHistoryByClass.bin')) {
            this.data = Array.from(new Float32Array(buffer));
            this.dataExtent = d3.extent(this.data);
            this.data = numeric.transpose(utils.reshape(this.data, [100,10]));
            this.sc = d3.scaleOrdinal()
            .domain(d3.range(10))
            .range(utils.baseColorsHex.slice(0,10));
        }
    }


    plot(){

        this.bgRect = this.svg.selectAll('.bgRect')
        .data([0])
        .enter()
        .append('rect')
        .attr('class', 'bgRect');
        this.bgRect = this.svg.selectAll('.bgRect')
        .attr('x', this.sx.range()[0])
        .attr('y', this.sy.range()[1])
        .attr('width', Math.abs(this.sx.range()[1] - this.sx.range()[0]))
        .attr('height', Math.abs(this.sy.range()[1] - this.sy.range()[0])+2)
        .attr('fill', 'white');
        // .attr('fill', '#eee');


        let ax = d3.axisBottom(this.sx).tickValues([0,14,21,50,75,99]);
        let ay = d3.axisLeft(this.sy)
        .tickFormat(d=>{
            if(d > 1 
                || Math.round(Math.log10(d)) == Math.log10(d) //1, 0.1, 0.01, etc
                || Math.round(Math.log10(d*2)) == Math.log10(d*2) //0.5, 0.05, etc
                ){
                return d3.format(".2~f")(d);
            }else{
                return '';
            }
        });

        

        let gx = this.svg.selectAll('.x-axis')
        .data([0])
        .enter()
        .append('g')
        .attr('class', 'x-axis');
        gx = this.svg.selectAll('.x-axis')
        .attr('transform', `translate(0, ${this.sy.range()[0]})`)
        .call(ax);
        let gy = this.svg.selectAll('.y-axis')
        .data([0])
        .enter()
        .append('g')
        .attr('class', 'y-axis');
        gy = this.svg.selectAll('.y-axis')
        .attr('transform', `translate(${this.sx.range()[0]}, 0)`)
        .call(ay);

        let grid_x = this.svg.selectAll('.x-grid')
        .data([0])
        .enter()
        .append('g')
        .attr('class', 'x-grid');
        grid_x = this.svg.selectAll('.x-grid')
        .attr('transform', `translate(0, ${this.sy.range()[0]})`)
        .call(ax
            .tickSize(-(Math.abs(this.sy.range()[1] - this.sy.range()[0])))
            .tickFormat(''));
        let grid_y = this.svg.selectAll('.y-grid')
        .data([0])
        .enter()
        .append('g')
        .attr('class', 'y-grid');
        grid_y = this.svg.selectAll('.y-grid')
        .attr('transform', `translate(${this.sx.range()[0]}, 0)`)
        .call(
            ay
            .tickSize(-(Math.abs(this.sx.range()[1] - this.sx.range()[0])))
            .tickFormat('')
        );

        let xlabel = this.svg.selectAll('.x-label')
        .data([0])
        .enter()
        .append('text')
        .attr('class', 'x-label');
        xlabel = this.svg.selectAll('.x-label')
        .attr('x', this.sx(50))
        .attr('y', this.sy.range()[0]+35)
        .attr('text-anchor', 'middle')
        .text('Training Epoch');

        let ylabel = this.svg.selectAll('.y-label')
        .data([0])
        .enter()
        .append('text')
        .attr('class', 'y-label');
        let ylabel_x = this.sx(0)-30;
        let ylabel_y = (this.sy.range()[0]+this.sy.range()[1])/2 + 18;
        ylabel = this.svg.selectAll('.y-label')
        .attr('x', ylabel_x)
        .attr('y', ylabel_y)
        .attr('text-anchor', 'middle')
        .attr('transform', `rotate(-90, ${ylabel_x}, ${ylabel_y})`)
        .text('Loss');


        


        let lineObj = d3.line()
        .x((d,i)=>{ return this.sx(i); })
        .y((d)=>{ return this.sy(d); });

        let paths = this.svg.selectAll('path.lineplot')
        .data(this.data)
        .enter()
        .append('path')
        .attr('class', 'lineplot');
        paths = this.svg.selectAll('path.lineplot')
        .attr('fill', 'none')
        .attr('stroke', (d,i)=>this.sc(i))
        .attr('stroke-width', 1.5)
        // .attr('stroke-linecap', 'round')
        // .attr('stroke-dasharray', '4,1.5')
        .attr('d', lineObj);

    }
}