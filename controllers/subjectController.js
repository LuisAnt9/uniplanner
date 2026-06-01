const Subject = require("../models/Subject");

exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user._id }).sort({ name: 1 });
    res.json({ success: true, data: subjects });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.createSubject = async (req, res) => {
  try {
    const subject = await Subject.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: subject });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
};

exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body, { new: true, runValidators: true }
    );
    if (!subject) return res.status(404).json({ success: false, error: "Matéria não encontrada" });
    res.json({ success: true, data: subject });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
};

exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!subject) return res.status(404).json({ success: false, error: "Matéria não encontrada" });
    res.json({ success: true, message: "Matéria deletada" });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
