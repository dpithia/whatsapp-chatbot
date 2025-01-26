# WhatsApp Hockey Roster Bot

A WhatsApp bot that manages hockey game attendance using Twilio's API. The bot maintains a roster of players and a waitlist for weekly hockey games.

## Features

- Manages roster up to 20 players
- Automatic waitlist management
- Weekly game scheduling
- Player join/leave functionality
- Display current roster with player names
- Waitlist management with automatic promotion

## Commands

- `!join` - Join the roster or waitlist
- `!leave` - Leave the roster
- `!roster` - Show current roster
- `!waitlist` - Show current waitlist
- `!help` - Show available commands

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with your Twilio credentials:

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
PORT=3000
```

3. Run the server:

```bash
npm start
```

## Development

To start the development server with auto-reload:

```bash
npm run dev
```

## Technologies Used

- Node.js
- Express
- Twilio API
- WhatsApp

## Demo
![](https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExanUxaGg0MmV1ZTIxc2xsdTFrdmk1eXJuZXI2aGJpOG9ha3c5cGdmbyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ZS9QTsg1LaBeWpu5L3/giphy.gif)
