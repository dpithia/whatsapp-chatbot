const express = require("express");
const twilio = require("twilio");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

// Middleware to parse incoming webhook requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Store player info objects instead of just phone numbers
let roster = [];
let waitlist = [];
const MAX_PLAYERS = 20;

async function sendWhatsAppMessage(to, message) {
  try {
    console.log("Sending message to:", to);
    console.log("Message content:", message);

    const response = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${to}`,
      body: message,
    });

    console.log("Message sent successfully:", response.sid);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

app.post("/webhook", async (req, res) => {
  try {
    console.log("Received webhook:", req.body);

    const incomingMsg = req.body.Body;
    const from = req.body.From.replace("whatsapp:", "");
    const playerName = req.body.ProfileName || "Unknown Player";

    // Create player object
    const player = {
      phone: from,
      name: playerName,
    };

    console.log("Processing message:", incomingMsg, "from:", playerName);

    switch (incomingMsg.toLowerCase()) {
      case "!help":
        await sendWhatsAppMessage(
          from,
          `
Available Commands:
!join - Join the roster/waitlist
!leave - Leave the roster
!roster - Show current roster
!waitlist - Show current waitlist
!help - Show this message

Games are every Friday
Maximum players: ${MAX_PLAYERS}
                `.trim()
        );
        break;

      case "!join":
        if (roster.some((p) => p.phone === from)) {
          await sendWhatsAppMessage(from, "You're already in the roster!");
        } else if (roster.length < MAX_PLAYERS) {
          roster.push(player);
          await sendWhatsAppMessage(
            from,
            `Added to roster! (${roster.length}/${MAX_PLAYERS})`
          );
        } else if (!waitlist.some((p) => p.phone === from)) {
          waitlist.push(player);
          await sendWhatsAppMessage(
            from,
            `Roster full! Added to waitlist position: ${waitlist.length}`
          );
        }
        break;

      case "!leave":
        const index = roster.findIndex((p) => p.phone === from);
        if (index > -1) {
          roster.splice(index, 1);
          if (waitlist.length > 0) {
            const nextPlayer = waitlist.shift();
            roster.push(nextPlayer);
            await sendWhatsAppMessage(
              nextPlayer.phone,
              "You've been moved from waitlist to roster!"
            );
          }
          await sendWhatsAppMessage(
            from,
            "You've been removed from the roster"
          );
        } else {
          await sendWhatsAppMessage(from, "You're not in the roster!");
        }
        break;

      case "!roster":
        if (roster.length === 0) {
          await sendWhatsAppMessage(from, "Roster is empty!");
        } else {
          const rosterList = roster
            .map((player, i) => `${i + 1}. ${player.name} (${player.phone})`)
            .join("\n");
          await sendWhatsAppMessage(
            from,
            `Current Roster (${roster.length}/${MAX_PLAYERS}):\n${rosterList}`
          );
        }
        break;

      case "!waitlist":
        if (waitlist.length === 0) {
          await sendWhatsAppMessage(from, "Waitlist is empty!");
        } else {
          const waitList = waitlist
            .map((player, i) => `${i + 1}. ${player.name} (${player.phone})`)
            .join("\n");
          await sendWhatsAppMessage(from, `Current Waitlist:\n${waitList}`);
        }
        break;

      default:
        await sendWhatsAppMessage(
          from,
          "Unknown command. Send !help for available commands."
        );
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Error processing webhook");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log("Environment variables loaded:", {
    accountSid: accountSid ? "Set" : "Not set",
    authToken: authToken ? "Set" : "Not set",
    port: port,
  });
});
