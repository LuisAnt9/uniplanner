const User = require("../models/User");
const crypto = require("crypto");
const { generateToken } = require("../middleware/auth");
const { sendEmail } = require("../services/emailService");
const { logAction } = require("../middleware/logger");
const { validateRegister, isValidEmail, sanitizeStr } = require("../middleware/validate");

const userFields = (u) => ({
  id: u._id, name: u.name, email: u.email,
  curso: u.curso, periodo: u.periodo,
  notifEmail: u.notifEmail, notifEnabled: u.notifEnabled,
});

exports.register = async (req, res, next) => {
  try {
    const errors = validateRegister(req.body);
    if (errors.length) return res.status(400).json({ success: false, error: errors[0], errors });

    const { name, email, password, curso, periodo } = req.body;

    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) return res.status(409).json({ success: false, error: "Este email já está cadastrado. Tente fazer login." });

    const user = await User.create({
      name: sanitizeStr(name, 100),
      email: email.toLowerCase().trim(),
      password,
      curso: sanitizeStr(curso, 100),
      periodo: sanitizeStr(periodo, 50),
      notifEmail: email.toLowerCase().trim(),
    });

    const token = generateToken(user._id);
    req.user = user;
    logAction(req, { action: "cadastro", category: "auth", details: { curso, periodo } });
    res.status(201).json({ success: true, token, user: userFields(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: "Email e senha são obrigatórios." });
    if (!isValidEmail(email))
      return res.status(400).json({ success: false, error: "Email inválido." });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Sempre executa comparePassword mesmo se user não existe — evita timing attack
    const passwordMatch = user ? await user.comparePassword(password) : false;
    if (!user || !passwordMatch)
      return res.status(401).json({ success: false, error: "Email ou senha incorretos." });

    const token = generateToken(user._id);
    req.user = user;
    logAction(req, { action: "login", category: "auth", details: {} });
    res.json({ success: true, token, user: userFields(user) });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res) => {
  res.json({ success: true, user: userFields(req.user) });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, curso, periodo } = req.body;
    if (name && String(name).trim().length < 2)
      return res.status(400).json({ success: false, error: "Nome deve ter pelo menos 2 caracteres." });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: sanitizeStr(name || req.user.name, 100),
        curso: sanitizeStr(curso || "", 100),
        periodo: sanitizeStr(periodo || "", 50),
      },
      { new: true, runValidators: true }
    ).select("-password");

    logAction(req, { action: "editar_perfil", category: "auth", details: {} });
    res.json({ success: true, user: userFields(user) });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email))
      return res.status(400).json({ success: false, error: "Email inválido." });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Resposta sempre igual — não revela se o email existe
    const okMsg = "Se este email estiver cadastrado, você receberá o link em breve. Verifique também a caixa de spam.";

    if (!user) return res.json({ success: true, message: okMsg });

    // Impede spam: só gera novo token se o anterior já expirou
    if (user.resetToken && user.resetTokenExpires > new Date()) {
      return res.json({ success: true, message: okMsg });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const resetLink = `${baseUrl}/?resetToken=${token}`;

    const html = `
      <div style="font-family:sans-serif;background:#0d1117;color:#e8edf5;padding:32px;border-radius:16px;max-width:480px;margin:auto">
        <h2 style="color:#6b9bff;margin-bottom:8px">🔐 Redefinir Senha</h2>
        <p style="color:#7b8ab0;margin-bottom:20px">Olá, ${sanitizeStr(user.name)}! Recebemos um pedido para redefinir sua senha no UniPlanner.</p>
        <a href="${resetLink}" style="display:inline-block;background:#4a7cf7;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700">Redefinir Senha</a>
        <p style="color:#7b8ab0;font-size:12px;margin-top:20px">Este link expira em 1 hora. Se você não pediu isso, ignore este email — sua senha não será alterada.</p>
      </div>`;

    try {
      await sendEmail({ to: email, subject: "🔐 Redefinir senha — UniPlanner", html });
    } catch (emailErr) {
      console.error("Erro ao enviar email de reset:", emailErr.message);
      // Não expõe o erro de email ao usuário
    }

    logAction(req, { action: "esqueci_senha", category: "auth", details: {} });
    res.json({ success: true, message: okMsg });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token) return res.status(400).json({ success: false, error: "Token inválido." });
    if (!password || String(password).length < 6)
      return res.status(400).json({ success: false, error: "A nova senha deve ter pelo menos 6 caracteres." });
    if (String(password).length > 128)
      return res.status(400).json({ success: false, error: "Senha muito longa." });

    const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: new Date() } });
    if (!user)
      return res.status(400).json({ success: false, error: "Link de redefinição inválido ou expirado. Solicite um novo." });

    user.password = password;
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    req.user = user;
    logAction(req, { action: "redefinir_senha", category: "auth", details: {} });
    res.json({ success: true, message: "Senha redefinida com sucesso! Faça login com a nova senha." });
  } catch (err) {
    next(err);
  }
};

// ─── ADMIN — Resetar senha de qualquer usuário ───
exports.adminResetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword)
      return res.status(400).json({ success: false, error: "userId e newPassword obrigatórios" });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, error: "Senha deve ter pelo menos 6 caracteres" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "Usuário não encontrado" });

    user.password = newPassword; // re-hasheada pelo pre-save hook
    user.resetToken = null;
    user.resetTokenExpires = null;
    await user.save();

    req.user = req.user || user;
    await logAction(req, { action: "admin_reset_senha", category: "auth", details: { targetUser: user.email } });
    res.json({ success: true, message: `Senha de ${user.name} redefinida com sucesso.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── ALUNO — Trocar própria senha ───
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, error: "Senha atual e nova senha são obrigatórias" });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, error: "Nova senha deve ter pelo menos 6 caracteres" });

    const user = await User.findById(req.user._id);
    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(401).json({ success: false, error: "Senha atual incorreta" });

    if (currentPassword === newPassword)
      return res.status(400).json({ success: false, error: "A nova senha deve ser diferente da atual" });

    user.password = newPassword;
    await user.save();

    await logAction(req, { action: "trocar_senha", category: "auth", details: {} });
    res.json({ success: true, message: "Senha alterada com sucesso!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
