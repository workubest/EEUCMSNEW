# Ethiopian Electric Utility Complaint Management System

A modern, full-stack complaint management system built with React, TypeScript, and Google Apps Script backend.

## Features

- **User Management**: Role-based access control (Admin, Manager, Staff, Technician)
- **Complaint Tracking**: Create, update, and manage customer complaints
- **Real-time Analytics**: Dashboard with complaint statistics and trends
- **Activity Feed**: Track all system activities and changes
- **File Attachments**: Upload and manage complaint-related documents
- **Multi-language Support**: English and Amharic language options
- **Responsive Design**: Modern UI with dark/light theme support

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend**: Google Apps Script (GAS), Express.js proxy server
- **Database**: Google Sheets (via GAS)
- **Deployment**: Netlify (Frontend + Serverless Functions)
- **State Management**: React Query, Context API
- **Authentication**: JWT-based authentication

## Local Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Account (for Apps Script)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eeulogin-tester
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env` and configure your environment variables
   - Set up Google Apps Script deployment URL

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Start proxy server** (in separate terminal)
   ```bash
   node server.js
   ```

## Netlify Deployment

### Automatic Deployment

1. **Connect to GitHub**
   - Push your code to GitHub
   - Connect your repository to Netlify

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18

3. **Environment Variables**
   - Set `GAS_URL` in Netlify environment variables

4. **Deploy**
   ```bash
   npm run netlify:deploy
   ```

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

## Google Apps Script Setup

1. **Open Google Sheet**
   - Go to [Google Sheets](https://sheets.google.com)
   - Create a new spreadsheet

2. **Apps Script Setup**
   - Extensions > Apps Script
   - Copy code from `code.gs`
   - Deploy as Web App
   - Copy deployment URL

3. **Update Environment**
   - Set `GAS_URL` in your environment variables

## API Endpoints

- `GET /api/users` - Get all users
- `POST /api/auth/login` - User authentication
- `GET /api/complaints` - Get complaints
- `POST /api/complaints` - Create complaint
- `PUT /api/complaints/:id` - Update complaint
- `DELETE /api/complaints/:id` - Delete complaint
- `GET /api/activities` - Get activity feed

## Project Structure

```
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities and configurations
│   └── types/         # TypeScript type definitions
├── netlify/
│   └── functions/     # Serverless functions
├── public/            # Static assets
└── dist/              # Build output
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
