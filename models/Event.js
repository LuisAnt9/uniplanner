const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title:       { type: String, required: true, trim: true },
  date:        { type: Date, required: true },
  time:        { type: String, default: "" },
  type:        { type: String, enum: ["prova","trabalho","reunião","outro"], default: "outro" },
  description: { type: String, default: "" },
});

module.exports = mongoose.model("Event", eventSchema);
