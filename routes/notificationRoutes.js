const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { saveSubscription } = require("../services/pushService");
const { sendEmail, taskAlertHtml, weeklySummaryHtml } = require("../services/emailService");
const { sendPushToAll, sendAlertsToAllUsers, sendWeeklySummaryToAllUsers } = require("../services/cronJobs");
const { sendAlertsToAllUsers: alertUsers, sendWeeklySummaryToAllUsers: weeklyUsers } = require("../services/cronJobs");
const Task = require("../models/Task");
const Event = require("../models/Event");
const User = require("../models/User");

// Chave pública VAPID para o frontend
router.get("/vapid-public-key", (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

// Salva subscription de push
router.post("/subscribe", async (req, res) => {
  try {
    await saveSubscription(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Salva email de notificação do usuário logado
router.post("/config-email", requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email obrigatório" });

    await User.findByIdAndUpdate(req.user._id, { notifEmail: email, notifEnabled: true });
    res.json({ success: true, message: `Email configurado: ${email}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Ativa/desativa notificações do usuário
router.post("/toggle", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.notifEnabled = !user.notifEnabled;
    await user.save();
    res.json({ success: true, notifEnabled: user.notifEnabled });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Retorna config de notificação do usuário logado
router.get("/config", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("notifEmail notifEnabled");
    res.json({ success: true, notifEmail: user.notifEmail, notifEnabled: user.notifEnabled });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Testa email para o usuário logado
router.post("/test-email", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const emailDest = user.notifEmail || user.email;

    if (!emailDest) return res.status(400).json({ success: false, error: "Configure seu email de notificação primeiro" });

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    let tasks = await Task.find({ user: req.user._id, completed: false, dueDate: { $gte: now, $lte: in24h } });

    // Se não tiver tarefas vencendo, pega as 3 mais próximas para demo
    if (!tasks.length) {
      tasks = await Task.find({ user: req.user._id, completed: false }).sort({ dueDate: 1 }).limit(3);
    }

    await sendEmail({
      to: emailDest,
      subject: "🧪 Teste de Email — UniPlanner",
      html: taskAlertHtml(tasks.length ? tasks : [{ title: "Tarefa de exemplo", dueDate: new Date(), difficulty: 2 }]),
    });

    res.json({ success: true, message: `Email enviado para ${emailDest}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Testa resumo semanal para o usuário logado
router.post("/test-weekly", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const emailDest = user.notifEmail || user.email;

    if (!emailDest) return res.status(400).json({ success: false, error: "Configure seu email primeiro" });

    const now = new Date();
    const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const [pending, done, upcoming] = await Promise.all([
      Task.find({ user: req.user._id, completed: false }).sort({ dueDate: 1 }),
      Task.find({ user: req.user._id, completed: true }),
      Event.find({ user: req.user._id, date: { $gte: now, $lte: in7d } }),
    ]);

    await sendEmail({
      to: emailDest,
      subject: "🧪 Teste Resumo Semanal — UniPlanner",
      html: weeklySummaryHtml({ pending, done, upcoming, userName: user.name }),
    });

    res.json({ success: true, message: `Resumo enviado para ${emailDest}` });
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
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
