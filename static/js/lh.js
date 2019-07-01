const lhFigure = document.querySelector("d-figure.lh");
let lh = new LossHistoryRenderer(lhFigure, [utils.no_cors_host+'data/loss/mnist/lossHistory.bin']);
// let lh = new TrainingHistoryRenderer(lhFigure, ['data/loss/mnist/lossHistoryByClass.bin']);

lhFigure.addEventListener("ready", function() {

});