module.exports = (mongoose) => {
  const schema = mongoose.Schema({
    userId: { type: String, required: true },
    prize: { type: String, default: null },
    isWin: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  });
  return mongoose.model('GachaHistory', schema);
};
