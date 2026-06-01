const express = require("express");
const router = express.Router();
const { getTasks, createTask, updateTask, completeTask, deleteTask } = require("../controllers/taskController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, getTasks);
router.post("/", requireAuth, createTask);
router.put("/:id", requireAuth, updateTask);
router.put("/:id/complete", requireAuth, completeTask);
router.delete("/:id", requireAuth, deleteTask);
module.exports = router;
