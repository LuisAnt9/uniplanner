const Event = require("../models/Event");

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find({ user: req.user._id }).sort({ date: 1 });
    res.json({ success: true, data: events });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.createEvent = async (req, res) => {
  try {
    const event = await Event.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: event });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body, { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ success: false, error: "Evento não encontrado" });
    res.json({ success: true, data: event });
  } catch (err) { res.status(400).json({ success: false, error: err.message }); }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!event) return res.status(404).json({ success: false, error: "Evento não encontrado" });
    res.json({ success: true, message: "Evento deletado" });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
