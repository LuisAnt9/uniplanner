const express = require("express");
const router = express.Router();
const { saveSubscription } = require("../services/pushService");
const { sendEmail, taskAlertHtml, weeklySummaryHtml } = require("../services/emailService");
const { sendPushToAll } = require("../services/pushService");
const Task = require("../models/Task");
const Event = require("../models/Event");

// Retorna a chave pública VAPID para o frontend usar
router.get("/vapid-public-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

// Salva a subscription de push do navegador
router.post("/subscribe", async (req, res) => {
  try {
    await saveSubscription(req.body);
    res.json({ success: true, message: "Subscription salva" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Configura o email do destinatário
router.post("/config-email", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: "Email obrigatório" });
  process.env.EMAIL_TO = email;
  res.json({ success: true, message: `Email configurado: ${email}` });
});

// Testa o envio de email imediatamente
router.post("/test-email", async (req, res) => {
  try {
    const tasks = await Task.find({ completed: false }).sort({ dueDate: 1 }).limit(5);
    await sendEmail({
      subject: "🧪 Teste de Email — UniPlanner",
      html: taskAlertHtml(tasks.length ? tasks : [{ title: "Tarefa de teste", dueDate: new Date(), difficulty: 3 }]),
    });
    res.json({ success: true, message: "Email de teste enviado!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Testa o resumo semanal imediatamente
router.post("/test-weekly", async (req, res) => {
  try {
    const now = new Date();
    const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const [pending, done, upcoming] = await Promise.all([
      Task.find({ completed: false }).sort({ dueDate: 1 }),
      Task.find({ completed: true }),
      Event.find({ date: { $gte: now, $lte: in7d } }),
    ]);
    await sendEmail({
      subject: "🧪 Teste Resumo Semanal — UniPlanner",
      html: weeklySummaryHtml({ pending, done, upcoming }),
    });
    res.json({ success: true, message: "Resumo semanal de teste enviado!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Testa push notification
router.post("/test-push", async (req, res) => {
  try {
    await sendPushToAll({
      title: "🧪 Teste UniPlanner",
      body: "Notificações funcionando!",
      icon: "/icon-192.png",
      url: "/",
    });
    res.json({ success: true, message: "Push enviado!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
