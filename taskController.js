const Task = require("../models/Task");
const { calculatePriority } = require("../services/priorityService");

exports.createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find();

    const result = tasks.map(task => ({
      ...task._doc,
      priority: calculatePriority(task)
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { completed: true },
      { new: true }
    );

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};