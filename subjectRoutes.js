const express = require("express");
const router = express.Router();
const controller = require("../controllers/subjectController");

router.post("/", controller.createSubject);
router.get("/", controller.getSubjects);

module.exports = router;