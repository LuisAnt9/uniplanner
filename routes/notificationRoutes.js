const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { saveSubscription, sendPushToAll } = require("../services/pushService");

// Chave pública VAPID para o frontend
router.get("/vapid-public-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

// Salva subscription de push do navegador
router.post("/subscribe", async (req, res) => {
  try {
    await saveSubscription(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Testa push
router.post("/test-push", async (req, res) => {
  try {
    await sendPushToAll({
      title: "🧪 Teste UniPlanner",
      body: "Notificações push funcionando!",
      icon: "/icon-192.png",
      url: "/",
    });
    res.json({ success: true, message: "Push enviado!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
