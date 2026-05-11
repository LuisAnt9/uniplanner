const cron = require("node-cron");
const Task = require("../models/Task");
const Event = require("../models/Event");
const { sendEmail, taskAlertHtml, weeklySummaryHtml } = require("./emailService");
const { sendPushToAll } = require("./pushService");

function startCronJobs() {
  // ─── 1. Alerta de tarefas vencendo em 24h — roda todo dia às 08:00 ───
  cron.schedule("0 8 * * *", async () => {
    console.log("⏰ Cron: verificando tarefas próximas do vencimento...");
    try {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const tasks = await Task.find({
        completed: false,
        dueDate: { $gte: now, $lte: in24h },
      }).populate("subject", "name");

      if (tasks.length === 0) return;

      // Email
      await sendEmail({
        subject: `🔔 ${tasks.length} tarefa(s) vencem hoje — UniPlanner`,
        html: taskAlertHtml(tasks),
      });

      // Web Push
      await sendPushToAll({
        title: "⏰ Tarefas vencendo hoje!",
        body: tasks.map((t) => t.title).join(", "),
        icon: "/icon-192.png",
        url: "/",
      });
    } catch (err) {
      console.error("❌ Cron tarefa alerta:", err.message);
    }
  });

  // ─── 2. Resumo semanal — toda segunda-feira às 07:00 ───
  cron.schedule("0 7 * * 1", async () => {
    console.log("📋 Cron: enviando resumo semanal...");
    try {
      const now = new Date();
      const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const [pending, done, upcoming] = await Promise.all([
        Task.find({ completed: false }).sort({ dueDate: 1 }),
        Task.find({ completed: true, updatedAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } }),
        Event.find({ date: { $gte: now, $lte: in7d } }).sort({ date: 1 }),
      ]);

      await sendEmail({
        subject: "📋 Seu resumo semanal — UniPlanner",
        html: weeklySummaryHtml({ pending, done, upcoming }),
      });

      await sendPushToAll({
        title: "📋 Resumo da semana pronto!",
        body: `${pending.length} tarefas pendentes · ${upcoming.length} eventos esta semana`,
        icon: "/icon-192.png",
        url: "/",
      });
    } catch (err) {
      console.error("❌ Cron resumo semanal:", err.message);
    }
  });

  // ─── 3. Notificação no dia do prazo — roda a cada hora ───
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const in1h = new Date(now.getTime() + 60 * 60 * 1000);

      const tasks = await Task.find({
        completed: false,
        dueDate: { $gte: now, $lte: in1h },
      });

      if (!tasks.length) return;

      await sendPushToAll({
        title: "🚨 Prazo em 1 hora!",
        body: tasks.map((t) => t.title).join(", "),
        icon: "/icon-192.png",
        url: "/",
      });
    } catch (err) {
      console.error("❌ Cron prazo 1h:", err.message);
    }
  });

  console.log("✅ Cron jobs iniciados (alertas diários + resumo semanal)");
}

module.exports = { startCronJobs };
