const Log = require("../models/Log");

function detectDevice(userAgent) {
  if (!userAgent) return "desconhecido";
  if (/mobile|android|iphone|ipad/i.test(userAgent)) return "mobile";
  return "desktop";
}

async function log(req, { action, category, details = {}, userId = null, userName = "Visitante", userEmail = "" }) {
  try {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.connection?.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";
    const device = detectDevice(userAgent);

    // Se tem usuário autenticado na requisição, usa ele
    if (req.user && !userId) {
      userId = req.user._id;
      userName = req.user.name;
      userEmail = req.user.email;
    }

    await Log.create({ userId, userName, userEmail, action, category, details, ip, userAgent, device });
  } catch (err) {
    console.error("❌ Erro ao registrar log:", err.message);
  }
}

module.exports = { log };
