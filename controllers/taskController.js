const Task = require("../models/Task");
const { calculatePriority } = require("../services/priorityService");

exports.getTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.completed !== undefined) {
      filter.completed = req.query.completed === "true";
    }

    const tasks = await Task.find(filter)
      .populate("subject", "name color")
      .sort({ dueDate: 1 });

    const result = tasks.map((task) => ({
      ...task.toObject(),
      priority: calculatePriority(task),
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);
    await task.populate("subject", "name color");
    res.status(201).json({
      success: true,
      data: { ...task.toObject(), priority: calculatePriority(task) },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("subject", "name color");

    if (!task) return res.status(404).json({ success: false, error: "Tarefa não encontrada" });

    res.json({
      success: true,
      data: { ...task.toObject(), priority: calculatePriority(task) },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { completed: true },
      { new: true }
    ).populate("subject", "name color");

    if (!task) return res.status(404).json({ success: false, error: "Tarefa não encontrada" });

    res.json({
      success: true,
      data: { ...task.toObject(), priority: calculatePriority(task) },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: "Tarefa não encontrada" });
    res.json({ success: true, message: "Tarefa deletada" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
