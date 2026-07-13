const Log = require("../models/Log");

function detectDevice(userAgent) {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|tablet/.test(ua)) return "mobile";
  return "desktop";
}

async function logAction(req, { action, category, details = {} }) {
  try {
    const user = req.user || null;
    const userAgent = req.headers["user-agent"] || "";
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip || "";

    await Log.create({
      userId:    user?._id || null,
      userName:  user?.name || "Visitante",
      userEmail: user?.email || "",
      action,
      category,
      details,
      ip,
      userAgent,
      device: detectDevice(userAgent),
    });
  } catch (err) {
    // Nunca deixa um erro de log quebrar a requisição
    console.error("⚠️ Erro ao registrar log:", err.message);
  }
}

module.exports = { logAction };
