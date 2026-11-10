// Приймає заявку з сайту й надсилає її в Telegram.
// Токен і chat ID беруться зі змінних середовища Netlify, у коді їх немає.
const clean = (v, max) => String(v == null ? "" : v).replace(/[<>&]/g, "").slice(0, max).trim();

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { statusCode: 500, body: "Not configured" };

  let d;
  try { d = JSON.parse(event.body || "{}"); } catch (e) { return { statusCode: 400, body: "Bad JSON" }; }

  const name = clean(d.name, 80), contact = clean(d.contact, 80);
  if (!name || !contact) return { statusCode: 400, body: "Missing fields" };

  const text = [
    "📷 <b>Новий запис!</b>",
    "",
    "<b>Послуга:</b> " + clean(d.service, 80),
    "<b>Дата:</b> " + clean(d.date, 40) + ", " + clean(d.time, 10),
    "<b>Макіяж:</b> " + (d.makeup ? "так" : "ні"),
    "<b>Вартість:</b> " + clean(d.total, 40) + " (без студії)",
    "",
    "<b>Ім’я:</b> " + name,
    "<b>Контакт:</b> " + contact,
    d.wish ? "<b>Побажання:</b> " + clean(d.wish, 500) : ""
  ].filter((l, i, a) => l !== "" || (a[i - 1] !== "" && i !== a.length - 1)).join("\n");

  try {
    const r = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" })
    });
    if (!r.ok) return { statusCode: 502, body: "Telegram error" };
    return { statusCode: 200, body: "ok" };
  } catch (e) {
    return { statusCode: 502, body: "Network error" };
  }
};
