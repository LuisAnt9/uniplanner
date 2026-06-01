const express = require("express");
const router = express.Router();
const { getSubjects, createSubject, updateSubject, deleteSubject } = require("../controllers/subjectController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, getSubjects);
router.post("/", requireAuth, createSubject);
router.put("/:id", requireAuth, updateSubject);
router.delete("/:id", requireAuth, deleteSubject);
module.exports = router;
