const lhpcFigure = document.querySelector("d-figure.lh-per-class");
let lhpc = new LossHistoryRenderer(lhpcFigure, [utils.cors_host+'data/loss/mnist/lossHistoryByClass.bin']);
lhpcFigure.addEventListener("ready", function() {

});