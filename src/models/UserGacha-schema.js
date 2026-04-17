module.exports = (mongoose) => {
  const schema = mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    gachaCountToday: { type: Number, default: 0 },
    lastResetDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
  });
  return mongoose.model('UserGacha', schema);
};
