const Task = require("../models/Task");
const { calculatePriority } = require("../services/priorityService");

exports.getTasks = async (req, res) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.completed !== undefined) filter.completed = req.query.completed === "true";
    const tasks = await Task.find(filter).populate("subject","name color").sort({ dueDate: 1 });
    const result = tasks.map(t => ({ ...t.toObject(), priority: calculatePriority(t) }));
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, user: req.user._id });
    await task.populate("subject","name color");
    res.status(201).json({ success: true, data: { ...task.toObject(), priority: calculatePriority(task) } });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    ).populate("subject","name color");
    if (!task) return res.status(404).json({ success: false, error: "Tarefa não encontrada" });
    res.json({ success: true, data: { ...task.toObject(), priority: calculatePriority(task) } });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
};

exports.completeTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { completed: true },
      { new: true }
    ).populate("subject","name color");
    if (!task) return res.status(404).json({ success: false, error: "Tarefa não encontrada" });
    res.json({ success: true, data: { ...task.toObject(), priority: calculatePriority(task) } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, error: "Tarefa não encontrada" });
    res.json({ success: true, message: "Tarefa deletada" });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
