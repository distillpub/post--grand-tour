function GrandTour(ndim, init_matrix) {
  this.ndim = ndim;
  this.N = ndim*ndim;

  this.STEPSIZE = 0.02;


  this.angles;

  this.initThetas = function(N) {
    this.thetas = new Array(N);
    for (let i=0; i<N; i++) {
      this.thetas[i] = (Math.random()+0.5) * Math.PI;
    }
  };
  this.initThetas(this.N);


  this.setNdim = function(newNdim) {
    if(newNdim > this.ndim){
      for(let i=this.N; i<newNdim*newNdim; i++){
        this.thetas[i] = (Math.random()-0.5) * 2 * Math.PI;
      }
      this.matrix = utils.embed(this.matrix, math.eye(newNdim)._data);
    }else if(newNdim < this.ndim){
      this.matrix = this.matrix.slice(0,newNdim).map(row=>row.slice(0,newNdim));
      this.matrix = utils.orthogonalize(this.matrix);
    }
    this.ndim = newNdim;
    this.N = this.ndim * this.ndim;
    return this.matrix;
  };

  this.getMatrix = function(dt) {
    if (dt !== undefined) {
      if (this.angles === undefined) {
        // torus method
        // this.angles = this.thetas.map(theta=>0);
        // 
        // another implementation similar to torus method
        this.angles = this.thetas;
        this.matrix = math.eye(this.ndim)._data;
      } else {
        // torus method
        // this.angles = this.angles.map(
        //  (a,i) => a+dt*this.STEPSIZE*this.thetas[i]);
        //  
        // another implementation similar to torus method
        this.angles = this.thetas.map( (theta) => 
          theta * dt * this.STEPSIZE );
      }
      // torus method
      // this.matrix = math.eye(this.ndim)._data;
      let k = -1;
      for (let i=0; i<this.ndim; i++) {
        for (let j=0; j<this.ndim; j++) {
          if (i!==j && (true || i<=3 || j<=3) ) {
            k++;
            this.matrix = this.multiplyRotationMatrix(
              this.matrix, i, j, this.angles[k]);
          }
        }
      }
    }
    return this.matrix;
  };


  this.setMatrix = function(m) {
    this.matrix = numeric.clone(m);
  };


  this.getRotationMatrix = function(dim0, dim1, theta) {
    let res = math.eye(this.ndim)._data;
    res[dim0][dim0] = Math.cos(theta);
    res[dim0][dim1] = Math.sin(theta);
    res[dim1][dim0] = -Math.sin(theta);
    res[dim1][dim1] = Math.cos(theta);
    return res;
  };


  this.multiplyRotationMatrix = function(matrix, i, j, theta) {
    
    if(theta == 0){
      return matrix;
    }
    let sin = Math.sin(theta);
    let cos = Math.cos(theta);
    // var res = matrix.map(d=>d.slice());
    let columnI = matrix.map((d)=>d[i]);
    let columnJ = matrix.map((d)=>d[j]);
    for (let rowIndex=0; rowIndex<matrix.length; rowIndex++) {
      matrix[rowIndex][i] = columnI[rowIndex]*cos + columnJ[rowIndex]*(-sin);
      matrix[rowIndex][j] = columnI[rowIndex]*sin + columnJ[rowIndex]*cos;
    }
    return matrix;
  };


  this.get3dRotaionMatrix = function(t) {
    let theta = 0.0 * t;
    let cos = Math.cos(theta);
    let sin = Math.sin(theta);

    return [
      [cos, 0, sin],
      [0, 1, 0],
      [-sin, 0, cos]];
  };

  this.project = function(data, dt, view) {
    let matrix = this.getMatrix(dt);

    matrix = math.transpose(matrix);
    matrix = matrix.slice(0, 3);
    matrix = math.transpose(matrix);
    if(view!==undefined){
      matrix = math.multiply(view, matrix);
    }
    let res = math.multiply(data, matrix.slice(0,data[0].length));

    return res;
  };




  this.setNdim(this.ndim);
  this.matrix = this.getMatrix(0);
  if(init_matrix !== undefined){
    this.setMatrix(init_matrix);
  }
}
