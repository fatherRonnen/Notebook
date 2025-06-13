# AI-Powered Notebook

A modern note-taking application enhanced with artificial intelligence to improve your productivity and organization.

## Features

- **Smart Note Creation**: Create and edit notes with a rich text editor
- **AI-Powered Suggestions**: Get content suggestions as you type
- **Automatic Categorization**: AI automatically categorizes and tags your notes
- **Content Summarization**: Generate concise summaries of your notes
- **Related Content**: Discover connections between your notes
- **Natural Language Search**: Find your notes using conversational queries

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **AI Integration**: OpenAI API

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/ai-notebook.git
cd ai-notebook
```

2. Install dependencies
```
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables
```
# In the backend directory, create a .env file with:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-notebook
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
```

4. Start the development servers
```
# Start backend server
cd backend
npm run dev

# Start frontend server
cd ../frontend
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## License

MIT