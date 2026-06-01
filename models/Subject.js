const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name:     { type: String, required: true, trim: true },
  teacher:  { type: String, default: "" },
  schedule: { type: String, default: "" },
  color:    { type: String, default: "#6366f1" },
});

module.exports = mongoose.model("Subject", subjectSchema);
