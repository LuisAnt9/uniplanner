const Subject = require("../models/Subject");
const Task = require("../models/Task");
const { logAction } = require("../middleware/logger");
const { validateSubject, isValidObjectId } = require("../middleware/validate");

exports.getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find({ user: req.user._id }).sort({ name: 1 }).lean();
    res.json({ success: true, data: subjects });
  } catch (err) {
    next(err);
  }
};

exports.createSubject = async (req, res, next) => {
  try {
    const errors = validateSubject(req.body);
    if (errors.length) return res.status(400).json({ success: false, error: errors[0], errors });

    // Verifica duplicata de nome para o mesmo usuário
    const existing = await Subject.findOne({ user: req.user._id, name: { $regex: `^${req.body.name.trim()}$`, $options: "i" } });
    if (existing) return res.status(409).json({ success: false, error: `Você já tem uma matéria chamada "${existing.name}".` });

    const subject = await Subject.create({
      name: req.body.name,
      teacher: req.body.teacher || "",
      schedule: req.body.schedule || "",
      color: req.body.color || "#4a7cf7",
      user: req.user._id,
    });

    logAction(req, { action: "criar_materia", category: "materia", details: { name: subject.name } });
    res.status(201).json({ success: true, data: subject });
  } catch (err) {
    next(err);
  }
};

exports.updateSubject = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({ success: false, error: "ID de matéria inválido." });

    const errors = validateSubject(req.body);
    if (errors.length) return res.status(400).json({ success: false, error: errors[0], errors });

    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name: req.body.name, teacher: req.body.teacher || "", schedule: req.body.schedule || "", color: req.body.color || "#4a7cf7" },
      { new: true, runValidators: true }
    );

    if (!subject)
      return res.status(404).json({ success: false, error: "Matéria não encontrada ou você não tem permissão para editá-la." });

    logAction(req, { action: "editar_materia", category: "materia", details: { name: subject.name } });
    res.json({ success: true, data: subject });
  } catch (err) {
    next(err);
  }
};

exports.deleteSubject = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({ success: false, error: "ID de matéria inválido." });

    const subject = await Subject.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!subject)
      return res.status(404).json({ success: false, error: "Matéria não encontrada ou você não tem permissão para deletá-la." });

    // Desvincula tarefas que usavam essa matéria
    await Task.updateMany({ subject: req.params.id, user: req.user._id }, { $set: { subject: null } });

    logAction(req, { action: "deletar_materia", category: "materia", details: { name: subject.name } });
    res.json({ success: true, message: "Matéria deletada. Tarefas associadas foram atualizadas." });
  } catch (err) {
    next(err);
  }
};
