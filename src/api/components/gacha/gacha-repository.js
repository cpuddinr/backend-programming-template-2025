const { UserGacha, Prize, GachaHistory } = require('../../../models');

// ==================== USER GACHA ====================
async function findUserByUserId(userId) {
  return UserGacha.findOne({ userId });
}

async function createUser(userId) {
  return UserGacha.create({ userId });
}

async function updateUserGachaCount(userId, count, resetDate) {
  return UserGacha.updateOne(
    { userId },
    { $set: { gachaCountToday: count, lastResetDate: resetDate } }
  );
}

async function getUserById(id) {
  return UserGacha.findById(id);
}

async function deleteUser(userId) {
  return UserGacha.deleteOne({ userId });
}

// ==================== PRIZE ====================
async function findAllPrizesWithRemaining() {
  return Prize.find({ remaining: { $gt: 0 } });
}

async function findPrizeByName(name) {
  return Prize.findOne({ name });
}

async function decrementPrizeRemaining(prizeName) {
  return Prize.updateOne(
    { name: prizeName, remaining: { $gt: 0 } },
    { $inc: { remaining: -1 } }
  );
}

async function getAllPrizes() {
  return Prize.find({}, 'name quota remaining weight');
}

async function getPrizeRemaining(prizeName) {
  const prize = await Prize.findOne({ name: prizeName });
  return prize ? prize.remaining : 0;
}

async function initPrizesIfEmpty() {
  const count = await Prize.countDocuments();
  if (count === 0) {
    const defaultPrizes = [
      { name: 'Emas 10 gram', quota: 1, remaining: 1, weight: 1 },
      { name: 'Smartphone X', quota: 5, remaining: 5, weight: 5 },
      { name: 'Smartwatch Y', quota: 10, remaining: 10, weight: 10 },
      { name: 'Voucher Rp100.000', quota: 100, remaining: 100, weight: 100 },
      { name: 'Pulsa Rp50.000', quota: 500, remaining: 500, weight: 500 },
    ];

    await Promise.all(defaultPrizes.map((prize) => Prize.create(prize)));
  }
}

// HISTORY
async function saveHistory(userId, prize, isWin) {
  return GachaHistory.create({ userId, prize, isWin });
}

async function getHistoryByUser(userId, limit = 10) {
  return GachaHistory.find({ userId }).sort({ timestamp: -1 }).limit(limit);
}

async function getAllHistory() {
  return GachaHistory.find({}).sort({ timestamp: -1 });
}

async function getHistoryByDateRange(startDate, endDate) {
  return GachaHistory.find({
    timestamp: { $gte: startDate, $lte: endDate },
  }).sort({ timestamp: -1 });
}

// WINNERS
async function getWinnersByPrize() {
  // Ambil semua history yang menang (isWin = true)
  const winners = await GachaHistory.find({ isWin: true }).sort({
    timestamp: -1,
  });

  // Kelompokkan berdasarkan prize
  const winnersByPrize = {};

  winners.forEach((winner) => {
    if (!winnersByPrize[winner.prize]) {
      winnersByPrize[winner.prize] = [];
    }
    winnersByPrize[winner.prize].push(winner.userId);
  });

  return winnersByPrize;
}

// Fungsi untuk menyamarkan nama
function obfuscateName(userId) {
  if (!userId || userId.length < 3) {
    return userId || '***';
  }

  const name = userId;
  const { length } = name;

  // Random: pilih metode penyamaran acak
  const methods = [
    // Method 1: J*** D**
    () => {
      const parts = name.split(' ');
      if (parts.length > 1) {
        const first = parts[0][0] + '*'.repeat(parts[0].length - 1);
        const last = parts[1][0] + '*'.repeat(parts[1].length - 1);
        return `${first} ${last}`;
      }
      return name[0] + '*'.repeat(length - 1);
    },
    // Method 2: Lebih acak
    () => {
      let result = '';
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < length; i++) {
        // 50% chance bintang, tapi huruf pertama tetap ditampilkan 70%
        if (Math.random() > 0.7 && name[i] !== ' ' && i > 0) {
          result += '*';
        } else {
          result += name[i];
        }
      }
      return result;
    },
  ];

  const selectedMethod = methods[Math.floor(Math.random() * methods.length)];
  return selectedMethod();
}

async function getWinnersWithObfuscatedNames() {
  // Ambil semua history yang menang
  const winners = await GachaHistory.find({ isWin: true }).sort({
    timestamp: -1,
  });

  // Kelompokkan berdasarkan hadiah
  const prizeMap = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const winner of winners) {
    const prizeName = winner.prize;
    if (!prizeMap[prizeName]) {
      prizeMap[prizeName] = [];
    }

    // Cek apakah userId sudah ada di daftar pemenang hadiah ini (hindari duplikat)
    const existing = prizeMap[prizeName].find(
      (w) => w.originalId === winner.userId
    );
    if (!existing) {
      prizeMap[prizeName].push({
        originalId: winner.userId,
        obfuscatedName: obfuscateName(winner.userId),
      });
    }
  }

  // Format hasil
  const result = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [prizeName, winnersList] of Object.entries(prizeMap)) {
    result.push({
      prize: prizeName,
      winners: winnersList.map((w) => w.obfuscatedName),
      totalWinners: winnersList.length,
    });
  }

  return result;
}

module.exports = {
  findUserByUserId,
  createUser,
  updateUserGachaCount,
  getUserById,
  deleteUser,
  findAllPrizesWithRemaining,
  findPrizeByName,
  decrementPrizeRemaining,
  getAllPrizes,
  getPrizeRemaining,
  initPrizesIfEmpty,
  saveHistory,
  getHistoryByUser,
  getAllHistory,
  getHistoryByDateRange,
  getWinnersByPrize,
  getWinnersWithObfuscatedNames,
};
