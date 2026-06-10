const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:      { type: String, required: true, minlength: 6 },
  curso:         { type: String, default: "" },
  periodo:       { type: String, default: "" },
  notifEmail:    { type: String, default: "" },      // email para receber notificações
  notifEnabled:  { type: Boolean, default: true },   // se quer receber notificações
  resetToken:    { type: String },                   // token para recuperação de senha
  resetTokenExpiry: { type: Date },                   // expiração do token de recuperação
  createdAt:     { type: Date, default: Date.now },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);
