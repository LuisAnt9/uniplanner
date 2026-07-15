const Task = require("../models/Task");
const { calculatePriority } = require("../services/priorityService");
const { logAction } = require("../middleware/logger");
const { validateTask, isValidObjectId } = require("../middleware/validate");

exports.getTasks = async (req, res, next) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.completed !== undefined)
      filter.completed = req.query.completed === "true";

    const tasks = await Task.find(filter)
      .populate("subject", "name color")
      .sort({ dueDate: 1 })
      .lean(); // lean() retorna POJOs — mais rápido e seguro

    const result = tasks.map(t => ({ ...t, priority: calculatePriority(t) }));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    // Valida entradas
    const errors = validateTask(req.body);
    if (errors.length) return res.status(400).json({ success: false, error: errors[0], errors });

    // Garante que o subject pertence ao mesmo usuário
    if (req.body.subject) {
      if (!isValidObjectId(req.body.subject)) {
        return res.status(400).json({ success: false, error: "Matéria inválida." });
      }
      const Subject = require("../models/Subject");
      const subj = await Subject.findOne({ _id: req.body.subject, user: req.user._id });
      if (!subj) return res.status(400).json({ success: false, error: "Matéria não encontrada." });
    }

    const task = await Task.create({
      title: req.body.title,
      description: req.body.description || "",
      dueDate: req.body.dueDate,
      difficulty: req.body.difficulty || 1,
      subject: req.body.subject || null,
      user: req.user._id,
    });

    await task.populate("subject", "name color");
    logAction(req, { action: "criar_tarefa", category: "tarefa", details: { title: task.title } });
    res.status(201).json({ success: true, data: { ...task.toObject(), priority: calculatePriority(task) } });
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({ success: false, error: "ID de tarefa inválido." });

    const errors = validateTask(req.body);
    if (errors.length) return res.status(400).json({ success: false, error: errors[0], errors });

    if (req.body.subject) {
      const Subject = require("../models/Subject");
      const subj = await Subject.findOne({ _id: req.body.subject, user: req.user._id });
      if (!subj) return res.status(400).json({ success: false, error: "Matéria não encontrada." });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        title: req.body.title,
        description: req.body.description || "",
        dueDate: req.body.dueDate,
        difficulty: req.body.difficulty || 1,
        subject: req.body.subject || null,
      },
      { new: true, runValidators: true }
    ).populate("subject", "name color");

    if (!task)
      return res.status(404).json({ success: false, error: "Tarefa não encontrada ou você não tem permissão para editá-la." });

    logAction(req, { action: "editar_tarefa", category: "tarefa", details: { title: task.title } });
    res.json({ success: true, data: { ...task.toObject(), priority: calculatePriority(task) } });
  } catch (err) {
    next(err);
  }
};

exports.completeTask = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({ success: false, error: "ID de tarefa inválido." });

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, completed: false }, // Evita re-completar
      { completed: true },
      { new: true }
    ).populate("subject", "name color");

    if (!task)
      return res.status(404).json({ success: false, error: "Tarefa não encontrada ou já foi concluída." });

    logAction(req, { action: "concluir_tarefa", category: "tarefa", details: { title: task.title } });
    res.json({ success: true, data: { ...task.toObject(), priority: calculatePriority(task) } });
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({ success: false, error: "ID de tarefa inválido." });

    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task)
      return res.status(404).json({ success: false, error: "Tarefa não encontrada ou você não tem permissão para deletá-la." });

    logAction(req, { action: "deletar_tarefa", category: "tarefa", details: { title: task.title } });
    res.json({ success: true, message: "Tarefa deletada com sucesso." });
  } catch (err) {
    next(err);
  }
};
