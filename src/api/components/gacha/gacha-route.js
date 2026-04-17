const express = require('express');

const gachaController = require('./gacha-controller');

const route = express.Router();

module.exports = (app) => {
  app.use('/gacha', route);

  route.post('/', gachaController.doGacha);

  route.get('/status/:userId', gachaController.getUserStatus);

  route.get('/prizes', gachaController.getPrizesRemaining);

  route.get('/prizes/:prizeName', gachaController.getPrizeDetail);

  route.get('/history/:userId', gachaController.getUserHistory);

  route.get('/limit/:userId', gachaController.checkDailyLimit);

  route.post('/init', gachaController.initPrizes);

  route.get('/winners', gachaController.getWinners);
};
