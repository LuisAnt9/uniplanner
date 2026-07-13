const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  // Quem fez
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  userName:  { type: String, default: "Visitante" },
  userEmail: { type: String, default: "" },

  // O que fez
  action:    { type: String, required: true },  // ex: "criar_tarefa", "login", "exportar_calendario"
  category:  { type: String, required: true },  // ex: "tarefa", "auth", "evento"
  details:   { type: mongoose.Schema.Types.Mixed, default: {} }, // dados extras

  // Quando e onde
  createdAt: { type: Date, default: Date.now },
  ip:        { type: String, default: "" },
  userAgent: { type: String, default: "" },
  device:    { type: String, default: "" }, // "mobile" | "desktop"
});

// Index para buscas rápidas
logSchema.index({ createdAt: -1 });
logSchema.index({ userId: 1 });
logSchema.index({ action: 1 });

module.exports = mongoose.model("Log", logSchema);
