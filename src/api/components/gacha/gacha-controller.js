const gachaService = require('./gacha-service');
const { errorResponder, errorTypes } = require('../../../core/errors');

async function doGacha(request, response, next) {
  try {
    const { userId } = request.body;

    if (!userId) {
      throw errorResponder(errorTypes.VALIDATION_ERROR, 'UserId is required');
    }

    const result = await gachaService.performGacha(userId);

    if (result.isWin) {
      return response.status(200).json({
        success: true,
        message: 'Selamat! Anda memenangkan hadiah!',
        prize: result.prize,
        remainingQuota: result.remainingQuota,
        attemptsLeft: result.attemptsLeft,
      });
    }

    return response.status(200).json({
      success: true,
      message: 'Maaf, Anda tidak memenangkan hadiah apapun.',
      prize: null,
      attemptsLeft: result.attemptsLeft,
    });
  } catch (error) {
    if (error.message === 'LIMIT_EXCEEDED') {
      return next(
        errorResponder(
          errorTypes.TOO_MANY_REQUESTS,
          'Anda telah mencapai batas maksimal gacha hari ini (5 kali)'
        )
      );
    }
    return next(error);
  }
}

async function getUserStatus(request, response, next) {
  try {
    const { userId } = request.params;

    if (!userId) {
      throw errorResponder(errorTypes.VALIDATION_ERROR, 'UserId is required');
    }

    const status = await gachaService.getUserStatus(userId);

    return response.status(200).json(status);
  } catch (error) {
    return next(error);
  }
}

async function getPrizesRemaining(request, response, next) {
  try {
    const prizes = await gachaService.getAllPrizes();

    return response.status(200).json(prizes);
  } catch (error) {
    return next(error);
  }
}

async function getUserHistory(request, response, next) {
  try {
    const { userId } = request.params;
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10;

    if (!userId) {
      throw errorResponder(errorTypes.VALIDATION_ERROR, 'UserId is required');
    }

    const history = await gachaService.getUserHistory(userId, limit);

    return response.status(200).json({
      userId,
      history,
      count: history.length,
    });
  } catch (error) {
    return next(error);
  }
}

async function checkDailyLimit(request, response, next) {
  try {
    const { userId } = request.params;

    if (!userId) {
      throw errorResponder(errorTypes.VALIDATION_ERROR, 'UserId is required');
    }

    const limit = await gachaService.checkDailyLimit(userId);

    return response.status(200).json(limit);
  } catch (error) {
    return next(error);
  }
}

async function initPrizes(request, response, next) {
  try {
    await gachaService.initPrizes();

    return response.status(200).json({
      success: true,
      message: 'Hadiah berhasil diinisialisasi',
    });
  } catch (error) {
    return next(error);
  }
}

async function getPrizeDetail(request, response, next) {
  try {
    const { prizeName } = request.params;

    if (!prizeName) {
      throw errorResponder(
        errorTypes.VALIDATION_ERROR,
        'Prize name is required'
      );
    }

    const remaining = await gachaService.getPrizeRemaining(prizeName);
    const allPrizes = await gachaService.getAllPrizes();
    const prize = allPrizes.find((p) => p.name === prizeName);

    if (!prize) {
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'Prize not found');
    }

    return response.status(200).json({
      name: prize.name,
      quota: prize.quota,
      remaining,
      weight: prize.weight,
    });
  } catch (error) {
    return next(error);
  }
}

async function getWinners(request, response, next) {
  try {
    const winners = await gachaService.getWinnersByPrize();
    return response.status(200).json({
      success: true,
      data: winners,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  doGacha,
  getUserStatus,
  getPrizesRemaining,
  getUserHistory,
  checkDailyLimit,
  initPrizes,
  getPrizeDetail,
  getWinners,
};
