const cron = require("node-cron");
const Task = require("../models/Task");
const { sendPushToAll } = require("./pushService");

function startCronJobs() {
  // Alerta diário às 08:00 — push para tarefas vencendo em 24h
  cron.schedule("0 8 * * *", async () => {
    try {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tasks = await Task.find({ completed: false, dueDate: { $gte: now, $lte: in24h } });
      if (!tasks.length) return;
      await sendPushToAll({
        title: "⏰ Tarefas vencendo hoje!",
        body: `${tasks.length} tarefa(s) com prazo nas próximas 24h.`,
        icon: "/icon-192.png",
        url: "/",
      });
      console.log(`🔔 Push diário enviado — ${tasks.length} tarefas vencendo`);
    } catch (err) {
      console.error("❌ Cron alerta diário:", err.message);
    }
  });

  // Alerta 1h antes do prazo
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

  console.log("✅ Cron jobs iniciados (alertas push diários + 1h antes)");
}

module.exports = { startCronJobs };
