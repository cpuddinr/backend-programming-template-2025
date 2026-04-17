const gachaRepository = require('./gacha-repository');

// ==================== USER GACHA ====================
async function findUserByUserId(userId) {
  return gachaRepository.findUserByUserId(userId);
}

async function createNewUser(userId) {
  return gachaRepository.createUser(userId);
}

async function updateUserGachaCount(userId, count, resetDate) {
  return gachaRepository.updateUserGachaCount(userId, count, resetDate);
}

// ==================== PRIZE ====================
async function getAllPrizes() {
  return gachaRepository.getAllPrizes();
}

async function getPrizeRemaining(prizeName) {
  return gachaRepository.getPrizeRemaining(prizeName);
}

async function initPrizes() {
  return gachaRepository.initPrizesIfEmpty();
}

// ==================== GACHA LOGIC ====================
async function resetDailyCounterIfNeeded(user) {
  const today = new Date().toISOString().split('T')[0];
  if (user.lastResetDate !== today) {
    await gachaRepository.updateUserGachaCount(user.userId, 0, today);
    // eslint-disable-next-line no-param-reassign
    user.gachaCountToday = 0;
    // eslint-disable-next-line no-param-reassign
    user.lastResetDate = today;
  }
  return user;
}

async function selectPrize() {
  const availablePrizes = await gachaRepository.findAllPrizesWithRemaining();

  if (availablePrizes.length === 0) {
    return null;
  }

  // Hitung total weight
  const totalWeight = availablePrizes.reduce(
    (sum, prize) => sum + prize.weight,
    0
  );

  // Random selection
  let random = Math.random() * totalWeight;
  let selectedPrize = null;

  // Cari prize yang terpilih (tanpa await di dalam loop)
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < availablePrizes.length; i++) {
    const prize = availablePrizes[i];
    if (random < prize.weight) {
      selectedPrize = prize;
      break;
    }
    random -= prize.weight;
  }

  // Kurangi kuota di luar loop
  if (selectedPrize) {
    await gachaRepository.decrementPrizeRemaining(selectedPrize.name);
    return selectedPrize.name;
  }

  return null;
}

async function performGacha(userId) {
  // 1. Validasi userId
  if (!userId) {
    throw new Error('userId diperlukan');
  }

  // 2. Dapatkan atau buat user
  let user = await gachaRepository.findUserByUserId(userId);
  if (!user) {
    user = await gachaRepository.createUser(userId);
  }

  // 3. Reset counter harian jika perlu
  user = await resetDailyCounterIfNeeded(user);

  // 4. Cek kuota harian (maks 5)
  if (user.gachaCountToday >= 5) {
    throw new Error('LIMIT_EXCEEDED');
  }

  // 5. Pilih hadiah
  const prizeWon = await selectPrize();

  // 6. Catat history
  await gachaRepository.saveHistory(userId, prizeWon, prizeWon !== null);

  // 7. Update counter user
  const newCount = user.gachaCountToday + 1;
  const today = new Date().toISOString().split('T')[0];
  await gachaRepository.updateUserGachaCount(userId, newCount, today);

  // 8. Get sisa kuota hadiah (jika menang)
  let remainingQuota = null;
  if (prizeWon) {
    remainingQuota = await gachaRepository.getPrizeRemaining(prizeWon);
  }

  return {
    isWin: prizeWon !== null,
    prize: prizeWon,
    remainingQuota,
    attemptsLeft: 5 - newCount,
  };
}

async function getUserStatus(userId) {
  let user = await gachaRepository.findUserByUserId(userId);
  if (!user) {
    return {
      userId,
      gachaCountToday: 0,
      maxPerDay: 5,
      remainingToday: 5,
    };
  }

  user = await resetDailyCounterIfNeeded(user);

  return {
    userId: user.userId,
    gachaCountToday: user.gachaCountToday,
    maxPerDay: 5,
    remainingToday: 5 - user.gachaCountToday,
  };
}

async function getUserHistory(userId, limit) {
  const historyLimit = limit || 10;
  return gachaRepository.getHistoryByUser(userId, historyLimit);
}

async function checkDailyLimit(userId) {
  let user = await gachaRepository.findUserByUserId(userId);
  if (!user) {
    return { remaining: 5, used: 0, max: 5 };
  }

  user = await resetDailyCounterIfNeeded(user);

  return {
    remaining: 5 - user.gachaCountToday,
    used: user.gachaCountToday,
    max: 5,
  };
}

async function getWinnersByPrize() {
  return gachaRepository.getWinnersWithObfuscatedNames();
}

module.exports = {
  findUserByUserId,
  createNewUser,
  updateUserGachaCount,
  getAllPrizes,
  getPrizeRemaining,
  initPrizes,
  resetDailyCounterIfNeeded,
  selectPrize,
  performGacha,
  getUserStatus,
  getUserHistory,
  checkDailyLimit,
  getWinnersByPrize,
};
