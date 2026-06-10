const express = require("express");
const router = express.Router();
const { register, login, me, updateProfile, forgotPassword } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.put("/profile", requireAuth, updateProfile);
router.post("/forgot-password", forgotPassword);

module.exports = router;
