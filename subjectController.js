const Subject = require("../models/Subject");

exports.createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);
    res.json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};