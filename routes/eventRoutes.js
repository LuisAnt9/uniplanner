const express = require("express");
const router = express.Router();
const { getEvents, createEvent, updateEvent, deleteEvent } = require("../controllers/eventController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, getEvents);
router.post("/", requireAuth, createEvent);
router.put("/:id", requireAuth, updateEvent);
router.delete("/:id", requireAuth, deleteEvent);
module.exports = router;
