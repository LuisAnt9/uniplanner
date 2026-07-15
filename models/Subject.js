const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name:     { type: String, required: [true, "Nome é obrigatório."], trim: true, maxlength: [100, "Nome muito longo."] },
  teacher:  { type: String, default: "", trim: true, maxlength: [100, "Nome do professor muito longo."] },
  schedule: { type: String, default: "", trim: true, maxlength: [100, "Horário muito longo."] },
  color:    { type: String, default: "#6366f1", match: [/^#[0-9a-fA-F]{6}$/, "Cor inválida."] },
}, { timestamps: true });

module.exports = mongoose.model("Subject", subjectSchema);
