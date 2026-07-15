require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const eventRoutes = require("./routes/eventRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const { setupVapid } = require("./services/pushService");
const { startCronJobs } = require("./services/cronJobs");
const { sanitizeBody } = require("./middleware/validate");
const { globalErrorHandler } = require("./middleware/errorHandler");

const app = express();

// ─── Segurança ───
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*", credentials: true }));
app.set("trust proxy", 1); // Necessário para rate limit funcionar atrás do Render

// Limite de tamanho do body — evita payloads maliciosos
app.use(express.json({ limit: "50kb" }));

// Sanitização automática de todas as entradas
app.use(sanitizeBody);

// Rate limiting global — 300 req/15min por IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Muitas requisições. Aguarde alguns minutos e tente novamente." },
});
app.use("/api", globalLimiter);

// Rate limiting para auth — previne brute force de senha
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, error: "Muitas tentativas de login. Aguarde 15 minutos." },
  skipSuccessfulRequests: true, // Não conta tentativas bem-sucedidas
});

// Rate limiting para esqueci senha — evita spam de email
const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 5,
  message: { success: false, error: "Muitas tentativas de recuperação de senha. Aguarde 1 hora." },
});

// ─── Banco & Serviços ───
connectDB();
setupVapid();
startCronJobs();

// ─── Rotas ───
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/auth/forgot-password", forgotLimiter); // Limitador extra
app.use("/api/tasks", taskRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);

// ─── Frontend ───
app.use(express.static(path.join(__dirname, "public")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

// ─── Handler global de erros (DEVE ser o último middleware) ───
app.use(globalErrorHandler);

// ─── Captura erros assíncronos não tratados ───
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason?.message || reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err.message);
  // Em produção, o processo deve ser reiniciado pelo Render automaticamente
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));
