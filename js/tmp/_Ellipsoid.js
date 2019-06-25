function cov(x) {
  let mean = math.mean(x, 0);
  let n = x.length;
  let y = x.map((row)=>row.map((d, i)=>(d-mean[i])/n));
  let res = math.multiply(math.transpose(y), y);
  return res;
}


function Ellipsoid(data) {
  this.centroid = math.mean(data, 0);
  this.covariance = cov(data);
  let svd = numeric.svd(this.covariance);
  this.u = svd.U;
  this.s = svd.S;
  this.data = math.transpose(
    math.multiply(this.u, math.diag(this.s.map((d)=>Math.sqrt(d)))) // add mean
  );

  this.gt = new GrandTour(this.covariance.length);


  this.getData = function(t) {
    let gt = this.gt;
    let data = math.multiply(this.data, gt.getMatrix(t));

    return res;
  };
}
