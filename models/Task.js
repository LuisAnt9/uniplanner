const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title:       { type: String, required: [true, "Título é obrigatório."], trim: true, maxlength: [200, "Título muito longo."] },
  description: { type: String, default: "", maxlength: [1000, "Descrição muito longa."] },
  dueDate:     { type: Date, required: [true, "Data de entrega é obrigatória."] },
  difficulty:  { type: Number, min: [1, "Dificuldade mínima é 1."], max: [5, "Dificuldade máxima é 5."], default: 1 },
  subject:     { type: mongoose.Schema.Types.ObjectId, ref: "Subject", default: null },
  completed:   { type: Boolean, default: false },
}, { timestamps: true }); // Adiciona createdAt e updatedAt automaticamente

taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, completed: 1 });

module.exports = mongoose.model("Task", taskSchema);
