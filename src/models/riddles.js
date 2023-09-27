const { default: mongoose, Collection } = require("mongoose");


const riddleSchema = new mongoose.Schema({
    text: String,
    answer: String,
  });

  const Riddles = new mongoose.model("riddle", riddleSchema);

  module.exports = Riddles;