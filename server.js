require("dotenv").config(); // TEM QUE SER A PRIMEIRA LINHA

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const connectDB = require("./config/db");

const taskRoutes = require("./routes/taskRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const eventRoutes = require("./routes/eventRoutes");

const app = express();

// 🔥 DEBUG (pode apagar depois)
console.log("MONGO_URI:", process.env.MONGO_URI);

connectDB();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/api/tasks", taskRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/events", eventRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});