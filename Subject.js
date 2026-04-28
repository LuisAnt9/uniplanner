const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  teacher: String,
  schedule: String,
  color: String
});

module.exports = mongoose.model("Subject", subjectSchema);