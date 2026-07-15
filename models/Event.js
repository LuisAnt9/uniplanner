const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title:       { type: String, required: [true, "Título é obrigatório."], trim: true, maxlength: [200, "Título muito longo."] },
  date:        { type: Date, required: [true, "Data é obrigatória."] },
  time:        { type: String, default: "", match: [/^$|^\d{2}:\d{2}$/, "Horário inválido."] },
  type:        { type: String, enum: { values: ["prova","trabalho","reunião","outro"], message: "Tipo inválido." }, default: "outro" },
  description: { type: String, default: "", maxlength: [500, "Descrição muito longa."] },
}, { timestamps: true });

eventSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model("Event", eventSchema);
