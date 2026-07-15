const express = require("express");
const router = express.Router();
const {
  register, login, me, updateProfile,
  forgotPassword, resetPassword,
  adminResetPassword, changePassword,
  updateAvatar,
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

// Middleware de admin reutilizável
const requireAdmin = async (req, res, next) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && req.user?.email !== adminEmail)
    return res.status(403).json({ success: false, error: "Acesso restrito ao administrador" });
  next();
};

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.put("/profile", requireAuth, updateProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", requireAuth, changePassword);
router.post("/admin-reset-password", requireAuth, requireAdmin, adminResetPassword);
router.post("/avatar", requireAuth, updateAvatar);

module.exports = router;
