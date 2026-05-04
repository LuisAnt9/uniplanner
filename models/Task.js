const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  dueDate: { type: Date, required: true },
  difficulty: { type: Number, min: 1, max: 5, default: 1 },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", default: null },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Task", taskSchema);
