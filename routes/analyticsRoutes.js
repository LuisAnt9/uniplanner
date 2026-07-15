const express = require("express");
const router = express.Router();
const Log = require("../models/Log");
const User = require("../models/User");
const Task = require("../models/Task");
const Event = require("../models/Event");
const Subject = require("../models/Subject");
const { requireAuth } = require("../middleware/auth");

// Middleware simples de admin — só você (primeiro usuário ou email específico)
const requireAdmin = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: "Não autorizado" });
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && req.user.email !== adminEmail) {
    return res.status(403).json({ success: false, error: "Acesso restrito ao administrador" });
  }
  next();
};

// Resumo geral
router.get("/summary", requireAuth, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, newUsersToday, newUsers7d, newUsers30d,
      totalTasks, totalEvents, totalSubjects,
      totalLogs, logsToday, logs7d,
      mobileUsers, desktopUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: last7 } }),
      User.countDocuments({ createdAt: { $gte: last30 } }),
      Task.countDocuments(),
      Event.countDocuments(),
      Subject.countDocuments(),
      Log.countDocuments(),
      Log.countDocuments({ createdAt: { $gte: today } }),
      Log.countDocuments({ createdAt: { $gte: last7 } }),
      Log.countDocuments({ device: "mobile" }),
      Log.countDocuments({ device: "desktop" }),
    ]);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, today: newUsersToday, last7d: newUsers7d, last30d: newUsers30d },
        content: { tasks: totalTasks, events: totalEvents, subjects: totalSubjects },
        activity: { total: totalLogs, today: logsToday, last7d: logs7d },
        devices: { mobile: mobileUsers, desktop: desktopUsers },
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Ações mais usadas
router.get("/top-actions", requireAuth, requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await Log.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: "$action", count: { $sum: 1 }, category: { $first: "$category" } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Atividade por dia (últimos 30 dias)
router.get("/activity-by-day", requireAuth, requireAdmin, async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await Log.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: "$userId" },
        }
      },
      { $sort: { _id: 1 } },
    ]);

    const formatted = result.map(r => ({
      date: r._id,
      actions: r.count,
      users: r.uniqueUsers.filter(Boolean).length,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Lista de usuários com atividade
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    const enriched = await Promise.all(users.map(async (u) => {
      const [actions, lastLog, tasks, subjects] = await Promise.all([
        Log.countDocuments({ userId: u._id }),
        Log.findOne({ userId: u._id }).sort({ createdAt: -1 }).select("createdAt action"),
        Task.countDocuments({ user: u._id }),
        Subject.countDocuments({ user: u._id }),
      ]);
      return {
        id: u._id,
        name: u.name,
        email: u.email,
        curso: u.curso,
        periodo: u.periodo,
        createdAt: u.createdAt,
        actions,
        tasks,
        subjects,
        lastSeen: lastLog?.createdAt || null,
        lastAction: lastLog?.action || null,
      };
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Logs recentes
router.get("/logs", requireAuth, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const action = req.query.action;
    const userId = req.query.userId;

    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;

    const [logs, total] = await Promise.all([
      Log.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Log.countDocuments(filter),
    ]);

    res.json({ success: true, data: logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Horários de pico
router.get("/peak-hours", requireAuth, requireAdmin, async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await Log.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $hour: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: result.find(r => r._id === i)?.count || 0,
    }));

    res.json({ success: true, data: hours });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

// ─── EXPORTAR CSV ───
router.get("/export-logs", requireAuth, requireAdmin, async (req, res) => {
  try {
    const Log = require("../models/Log");
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const logs = await Log.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(5000);

    const ACTION_LABELS = {
      login:'Login', cadastro:'Cadastro', criar_tarefa:'Criar Tarefa',
      editar_tarefa:'Editar Tarefa', concluir_tarefa:'Concluir Tarefa', deletar_tarefa:'Deletar Tarefa',
      criar_materia:'Criar Matéria', editar_materia:'Editar Matéria', deletar_materia:'Deletar Matéria',
      criar_evento:'Criar Evento', editar_evento:'Editar Evento', deletar_evento:'Deletar Evento',
      editar_perfil:'Editar Perfil', trocar_senha:'Trocar Senha', atualizar_avatar:'Atualizar Foto',
      admin_reset_senha:'Admin Reset Senha', esqueci_senha:'Esqueci Senha', redefinir_senha:'Redefinir Senha',
    };

    const header = ['Data/Hora','Usuário','Email','Ação','Categoria','Dispositivo','IP'];
    const rows = logs.map(l => [
      new Date(l.createdAt).toLocaleString('pt-BR'),
      `"${(l.userName||'').replace(/"/g,'""')}"`,
      `"${(l.userEmail||'').replace(/"/g,'""')}"`,
      `"${ACTION_LABELS[l.action] || l.action}"`,
      l.category || '',
      l.device || '',
      l.ip || '',
    ].join(','));

    const csv = [header.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="uniplanner-logs-${days}d.csv"`);
    res.send('\uFEFF' + csv); // BOM para Excel reconhecer UTF-8
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/export-users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const User = require("../models/User");
    const Task = require("../models/Task");
    const Subject = require("../models/Subject");

    const users = await User.find().select("-password -avatar -resetToken").sort({ createdAt: -1 });

    const rows = await Promise.all(users.map(async u => {
      const [tasks, subjects] = await Promise.all([
        Task.countDocuments({ user: u._id }),
        Subject.countDocuments({ user: u._id }),
      ]);
      return [
        `"${(u.name||'').replace(/"/g,'""')}"`,
        `"${(u.email||'').replace(/"/g,'""')}"`,
        `"${(u.curso||'').replace(/"/g,'""')}"`,
        u.periodo || '',
        tasks,
        subjects,
        new Date(u.createdAt).toLocaleString('pt-BR'),
      ].join(',');
    }));

    const header = ['Nome','Email','Curso','Período','Tarefas','Matérias','Cadastro'];
    const csv = [header.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="uniplanner-usuarios.csv"');
    res.send('\uFEFF' + csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
