const cron = require("node-cron");
const Task = require("../models/Task");
const Event = require("../models/Event");
const User = require("../models/User");
const { sendEmail, taskAlertHtml, weeklySummaryHtml } = require("./emailService");
const { sendPushToAll } = require("./pushService");

// Envia alertas de prazo para cada usuário individualmente
async function sendAlertsToAllUsers() {
  const users = await User.find({ notifEnabled: true });

  for (const user of users) {
    const emailDest = user.notifEmail || user.email;
    if (!emailDest) continue;

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await Task.find({
      user: user._id,
      completed: false,
      dueDate: { $gte: now, $lte: in24h },
    }).populate("subject", "name");

    if (!tasks.length) continue;

    await sendEmail({
      to: emailDest,
      subject: `🔔 ${tasks.length} tarefa(s) vencem hoje — UniPlanner`,
      html: taskAlertHtml(tasks),
    });

    console.log(`📧 Alerta enviado para ${emailDest} (${tasks.length} tarefas)`);
  }
}

// Envia resumo semanal para cada usuário
async function sendWeeklySummaryToAllUsers() {
  const users = await User.find({ notifEnabled: true });

  for (const user of users) {
    const emailDest = user.notifEmail || user.email;
    if (!emailDest) continue;

    const now = new Date();
    const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [pending, done, upcoming] = await Promise.all([
      Task.find({ user: user._id, completed: false }).sort({ dueDate: 1 }),
      Task.find({ user: user._id, completed: true, updatedAt: { $gte: since7d } }),
      Event.find({ user: user._id, date: { $gte: now, $lte: in7d } }).sort({ date: 1 }),
    ]);

    await sendEmail({
      to: emailDest,
      subject: `📋 Seu resumo semanal — UniPlanner`,
      html: weeklySummaryHtml({ pending, done, upcoming, userName: user.name }),
    });

    console.log(`📋 Resumo semanal enviado para ${emailDest}`);
  }
}

function startCronJobs() {
  // Alerta diário às 08:00
  cron.schedule("0 8 * * *", async () => {
    console.log("⏰ Cron: verificando tarefas próximas do vencimento...");
    try {
      await sendAlertsToAllUsers();
      await sendPushToAll({
        title: "⏰ Tarefas vencendo hoje!",
        body: "Você tem tarefas com prazo nas próximas 24h.",
        icon: "/icon-192.png",
        url: "/",
      });
    } catch (err) {
      console.error("❌ Cron alerta diário:", err.message);
    }
  });

  // Resumo semanal toda segunda às 07:00
  cron.schedule("0 7 * * 1", async () => {
    console.log("📋 Cron: enviando resumo semanal...");
    try {
      await sendWeeklySummaryToAllUsers();
      await sendPushToAll({
        title: "📋 Resumo da semana pronto!",
        body: "Veja suas tarefas e eventos da semana.",
        icon: "/icon-192.png",
        url: "/",
      });
    } catch (err) {
      console.error("❌ Cron resumo semanal:", err.message);
    }
  });

  // Push quando tarefa vence em 1h
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const in1h = new Date(now.getTime() + 60 * 60 * 1000);
      const tasks = await Task.find({ completed: false, dueDate: { $gte: now, $lte: in1h } });
      if (!tasks.length) return;
      await sendPushToAll({
        title: "🚨 Prazo em 1 hora!",
        body: tasks.map(t => t.title).join(", "),
        icon: "/icon-192.png",
        url: "/",
      });
    } catch (err) {
      console.error("❌ Cron prazo 1h:", err.message);
    }
  });

  console.log("✅ Cron jobs iniciados (alertas diários + resumo semanal)");
}

module.exports = { startCronJobs, sendAlertsToAllUsers, sendWeeklySummaryToAllUsers };
