const webpush = require("web-push");
const mongoose = require("mongoose");

// Schema para salvar as subscriptions dos navegadores
const subscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: String,
    auth: String,
  },
  createdAt: { type: Date, default: Date.now },
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

function setupVapid() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn("⚠️  VAPID keys não configuradas — Web Push desativado.");
    return false;
  }
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || "mailto:admin@uniplanner.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  return true;
}

async function saveSubscription(sub) {
  await Subscription.findOneAndUpdate(
    { endpoint: sub.endpoint },
    sub,
    { upsert: true, new: true }
  );
}

async function sendPushToAll(payload) {
  if (!process.env.VAPID_PUBLIC_KEY) return;
  const subs = await Subscription.find();
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(s, JSON.stringify(payload)).catch(async (err) => {
        // Se o endpoint expirou, remove do banco
        if (err.statusCode === 410) await Subscription.deleteOne({ endpoint: s.endpoint });
        throw err;
      })
    )
  );
  const ok = results.filter((r) => r.status === "fulfilled").length;
  console.log(`🔔 Push enviado para ${ok}/${subs.length} dispositivos`);
}

module.exports = { setupVapid, saveSubscription, sendPushToAll, Subscription };
