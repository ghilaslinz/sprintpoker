# Sprint Poker (Hours)

A lightweight planning poker tool for hourly estimates built with React and Socket.IO.

## Features

- Join shared rooms by name with shareable URLs
- Collect individual hourly estimates via numeric inputs
- Real-time updates of participants, shared agenda message, and votes
- Host controls to reveal votes, clear them, and lock inputs
- Automatic calculation of the average estimate and list of abstentions after reveal

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

Install dependencies for both the server and client:

```bash
cd server
npm install
cd ../client
npm install
```

### Running the app locally

Run the Socket.IO server:

```bash
cd server
npm start
```

In a separate terminal, start the React development server:

```bash
cd client
npm run dev
```

The client runs on [http://localhost:5173](http://localhost:5173) and proxies Socket.IO traffic to the server on port 4000.

### Building for production

```bash
cd client
npm run build
```

The static assets are output to `client/dist`.

## Accessibility & UI Notes

- High-contrast color palette inspired by Story Point Poker with accessible focus states
- Numeric inputs allow fractional hour estimates (step of 0.25 hours)
- Shared message and controls can be locked by the host to prevent accidental edits

## License

MIT
