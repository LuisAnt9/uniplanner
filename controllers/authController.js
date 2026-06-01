const User = require("../models/User");
const { generateToken } = require("../middleware/auth");

exports.register = async (req, res) => {
  try {
    const { name, email, password, curso, periodo } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: "Nome, email e senha são obrigatórios" });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, error: "Email já cadastrado" });

    const user = await User.create({ name, email, password, curso, periodo });
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, curso: user.curso, periodo: user.periodo },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: "Email e senha obrigatórios" });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: "Email ou senha incorretos" });
    }
    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, curso: user.curso, periodo: user.periodo },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.me = async (req, res) => {
  res.json({ success: true, user: req.user });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, curso, periodo } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, curso, periodo },
      { new: true }
    ).select("-password");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
