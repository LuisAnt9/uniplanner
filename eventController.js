const Event = require("../models/Event");

exports.createEvent = async (req, res) => {
  try {
    const event = await Event.create(req.body);
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};