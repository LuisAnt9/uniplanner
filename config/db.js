const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI não definida no .env");

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10s para selecionar servidor
      socketTimeoutMS: 45000,          // 45s timeout de socket
      maxPoolSize: 10,                 // máximo de conexões simultâneas
    });

    console.log("✅ MongoDB conectado");

    // Reconecta automaticamente se a conexão cair
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB desconectado — tentando reconectar...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconectado");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ Erro MongoDB:", err.message);
    });

  } catch (error) {
    console.error("❌ Falha ao conectar no MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
