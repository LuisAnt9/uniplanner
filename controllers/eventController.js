const Event = require("../models/Event");
const { logAction } = require("../middleware/logger");
const { validateEvent, isValidObjectId } = require("../middleware/validate");

exports.getEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ user: req.user._id }).sort({ date: 1 }).lean();
    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
};

exports.createEvent = async (req, res, next) => {
  try {
    const errors = validateEvent(req.body);
    if (errors.length) return res.status(400).json({ success: false, error: errors[0], errors });

    const event = await Event.create({
      title: req.body.title,
      date: req.body.date,
      time: req.body.time || "",
      type: req.body.type || "outro",
      description: req.body.description || "",
      user: req.user._id,
    });

    logAction(req, { action: "criar_evento", category: "evento", details: { title: event.title, type: event.type } });
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({ success: false, error: "ID de evento inválido." });

    const errors = validateEvent(req.body);
    if (errors.length) return res.status(400).json({ success: false, error: errors[0], errors });

    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title: req.body.title, date: req.body.date, time: req.body.time || "", type: req.body.type || "outro", description: req.body.description || "" },
      { new: true, runValidators: true }
    );

    if (!event)
      return res.status(404).json({ success: false, error: "Evento não encontrado ou você não tem permissão para editá-lo." });

    logAction(req, { action: "editar_evento", category: "evento", details: { title: event.title } });
    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id))
      return res.status(400).json({ success: false, error: "ID de evento inválido." });

    const event = await Event.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!event)
      return res.status(404).json({ success: false, error: "Evento não encontrado ou você não tem permissão para deletá-lo." });

    logAction(req, { action: "deletar_evento", category: "evento", details: { title: event.title } });
    res.json({ success: true, message: "Evento deletado com sucesso." });
  } catch (err) {
    next(err);
  }
};
