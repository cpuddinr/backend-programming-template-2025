module.exports = (mongoose) => {
  const schema = mongoose.Schema({
    name: { type: String, required: true, unique: true },
    quota: { type: Number, required: true },
    remaining: { type: Number, required: true },
    weight: { type: Number, default: 0 },
  });
  return mongoose.model('Prize', schema);
};
