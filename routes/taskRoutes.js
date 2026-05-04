const express = require("express");
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
} = require("../controllers/taskController");

router.get("/", getTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.put("/:id/complete", completeTask);
router.delete("/:id", deleteTask);

module.exports = router;
