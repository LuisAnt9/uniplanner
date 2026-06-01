const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "uniplanner_secret_2024";

// Middleware obrigatório — bloqueia se não logado
const requireAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Não autenticado" });
    }
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) return res.status(401).json({ success: false, error: "Usuário não encontrado" });
    next();
  } catch {
    res.status(401).json({ success: false, error: "Token inválido ou expirado" });
  }
};

// Middleware opcional — autentica se tiver token, mas não bloqueia
const optionalAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) {
      const token = auth.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    }
  } catch {}
  next();
};

const generateToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: "30d" });

module.exports = { requireAuth, optionalAuth, generateToken };
