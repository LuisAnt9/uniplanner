const User = require("../models/User");
const crypto = require("crypto");
const { generateToken } = require("../middleware/auth");
const { sendEmail } = require("../services/emailService");

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

// ─── ESQUECI MINHA SENHA ───

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email obrigatório" });

    const user = await User.findOne({ email });
    // Não revela se o email existe ou não, por segurança
    if (!user) return res.json({ success: true, message: "Se o email existir, um link de recuperação foi enviado." });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await user.save();

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const resetLink = `${baseUrl}/?resetToken=${token}`;

    const html = `
      <div style="font-family:sans-serif;background:#0d1117;color:#e8edf5;padding:32px;border-radius:16px;max-width:480px;margin:auto">
        <h2 style="color:#6b9bff;margin-bottom:8px">🔐 Redefinir Senha</h2>
        <p style="color:#7b8ab0;margin-bottom:20px">Olá, ${user.name}! Recebemos um pedido para redefinir sua senha no UniPlanner.</p>
        <a href="${resetLink}" style="display:inline-block;background:#4a7cf7;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700">Redefinir Senha</a>
        <p style="color:#7b8ab0;font-size:12px;margin-top:20px">Este link expira em 1 hora. Se você não pediu isso, ignore este email.</p>
      </div>`;

    try {
      await sendEmail({ to: email, subject: "🔐 Redefinir senha — UniPlanner", html });
    } catch (e) {
      console.error("Erro ao enviar email de reset:", e.message);
    }

    res.json({ success: true, message: "Se o email existir, um link de recuperação foi enviado." });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, error: "Token e nova senha são obrigatórios" });
    if (password.length < 6) return res.status(400).json({ success: false, error: "Senha deve ter pelo menos 6 caracteres" });

    const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ success: false, error: "Link inválido ou expirado" });

    user.password = password; // será re-hasheada pelo pre-save hook
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    res.json({ success: true, message: "Senha redefinida com sucesso!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
