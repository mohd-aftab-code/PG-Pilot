# PG-Pilot

A full-stack application with React frontend and Express backend.

## Project Structure

```
PG-Pilot/
├── client/          # React + Vite frontend application
├── server/          # Express.js backend server
└── README.md        # This file
```

## Tech Stack

### Frontend (Client)
- **React** 19.2.0
- **Vite** (Rolldown-based)
- **ESLint** for code quality

### Backend (Server)
- **Express.js** 5.1.0
- **CORS** enabled for cross-origin requests

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mohd-aftab-code/PG-Pilot.git
cd PG-Pilot
```

2. Install client dependencies:
```bash
cd client
npm install
```

3. Install server dependencies:
```bash
cd ../server
npm install
```

### Running the Application

#### Start the Backend Server
```bash
cd server
npm start
```
The server will run on `http://localhost:5000`

#### Start the Frontend Development Server
```bash
cd client
npm run dev
```
The client will typically run on `http://localhost:5173` (or another port if 5173 is occupied)

### Building for Production

#### Build the Frontend
```bash
cd client
npm run build
```

## Development

- Frontend development server supports Hot Module Replacement (HMR)
- React Compiler is enabled for optimized React code
- ESLint is configured for code quality checks

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Submit a pull request to the `develop` branch

## License

See [LICENSE](LICENSE) file for details.

## Author

Mohd Aftab

