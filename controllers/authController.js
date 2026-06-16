const User = require("../models/User");
const { generateToken } = require("../middleware/auth");
const { sendEmail, passwordResetHtml } = require("../services/emailService");
const crypto = require("crypto");

exports.register = async (req, res) => {
  try {
    const { name, email, password, curso, periodo } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, error: "Nome, email e senha são obrigatórios" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, error: "Email já cadastrado" });

    const user = await User.create({ name, email, password, curso, periodo, notifEmail: email });
    const token = generateToken(user._id);
    res.status(201).json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, curso: user.curso, periodo: user.periodo, notifEmail: user.notifEmail, notifEnabled: user.notifEnabled },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: "Email e senha obrigatórios" });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, error: "Email ou senha incorretos" });

    const token = generateToken(user._id);
    res.json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, curso: user.curso, periodo: user.periodo, notifEmail: user.notifEmail, notifEnabled: user.notifEnabled },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.me = async (req, res) => {
  const u = req.user;
  res.json({ success: true, user: { id: u._id, name: u.name, email: u.email, curso: u.curso, periodo: u.periodo, notifEmail: u.notifEmail, notifEnabled: u.notifEnabled } });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, curso, periodo } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id, { name, curso, periodo }, { new: true }
    ).select("-password");
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, curso: user.curso, periodo: user.periodo, notifEmail: user.notifEmail, notifEnabled: user.notifEnabled } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, error: "Email é obrigatório" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, error: "Email não encontrado" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hora

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: email,
      subject: "Recuperação de Senha - UniPlanner",
      html: passwordResetHtml({ userName: user.name, resetLink }),
    });

    res.json({ success: true, message: "Email de recuperação enviado" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
