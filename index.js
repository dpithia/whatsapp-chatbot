const express = require("express");
const twilio = require("twilio");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

let roster = [];
let waitlist = [];
const MAX_PLAYERS = 20;

async function sendInteractiveMessage(to) {
  try {
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${to}`,
      body: "Hockey Roster Bot - Select an option:",
      persistentAction: [
        `menu:View Options:
                    [
                        {
                            "type": "text",
                            "title": "Join",
                            "payload": "!join"
                        },
                        {
                            "type": "text",
                            "title": "Leave",
                            "payload": "!leave"
                        },
                        {
                            "type": "text",
                            "title": "View Roster",
                            "payload": "!roster"
                        },
                        {
                            "type": "text",
                            "title": "View Waitlist",
                            "payload": "!waitlist"
                        }
                    ]`,
      ],
    });
  } catch (error) {
    console.error("Error sending interactive message:", error);
  }
}

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

    // Send interactive menu after each message
    await sendInteractiveMessage(to);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

app.post("/webhook", async (req, res) => {
  try {
    const incomingMsg = req.body.Body;
    const from = req.body.From.replace("whatsapp:", "");
    const playerName = req.body.ProfileName || "Unknown Player";

    const player = {
      phone: from,
      name: playerName,
    };

    // Handle button responses
    const command = incomingMsg.toLowerCase();

    switch (command) {
      case "!join":
      case "join":
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
      case "leave":
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
      case "view roster":
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
      case "view waitlist":
        if (waitlist.length === 0) {
          await sendWhatsAppMessage(from, "Waitlist is empty!");
        } else {
          const waitList = waitlist
            .map((player, i) => `${i + 1}. ${player.name} (${player.phone})`)
            .join("\n");
          await sendWhatsAppMessage(from, `Current Waitlist:\n${waitList}`);
        }
        break;

      case "!help":
      case "menu":
      default:
        await sendInteractiveMessage(from);
        break;
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
});
