const request = require('supertest');
const express = require('express');
const aiController = require('../src/controllers/aiController');
const Note = require('../src/models/Note');

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => {
    return {
      completions: {
        create: jest.fn().mockImplementation(async (options) => {
          // Mock different responses based on the prompt
          if (options.prompt.includes('Summarize')) {
            return {
              choices: [{ text: 'This is a mock summary of the note content.' }]
            };
          } else if (options.prompt.includes('category')) {
            return {
              choices: [{ text: '{"category": "Test Category", "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]}' }]
            };
          } else if (options.prompt.includes('Extract')) {
            return {
              choices: [{ text: 'keyword1, keyword2, keyword3' }]
            };
          } else {
            return {
              choices: [{ text: 'Mock completion response' }]
            };
          }
        })
      }
    };
  });
});

// Mock Note model
jest.mock('../src/models/Note', () => {
  return {
    findById: jest.fn(),
    find: jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        { _id: 'note1', title: 'Note 1', content: 'Content 1' },
        { _id: 'note2', title: 'Note 2', content: 'Content 2' }
      ])
    })
  };
});

// Create Express app for testing
const app = express();
app.use(express.json());
app.post('/api/ai/completion', aiController.getCompletionSuggestion);
app.post('/api/ai/notes/:noteId/summary', (req, res, next) => {
  req.userId = 'user123'; // Mock authenticated user
  next();
}, aiController.generateSummary);
app.post('/api/ai/notes/:noteId/categorize', (req, res, next) => {
  req.userId = 'user123'; // Mock authenticated user
  next();
}, aiController.categorizeNote);
app.post('/api/ai/search', (req, res, next) => {
  req.userId = 'user123'; // Mock authenticated user
  next();
}, aiController.naturalLanguageSearch);

describe('AI Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCompletionSuggestion', () => {
    it('should return a suggestion when text is provided', async () => {
      const response = await request(app)
        .post('/api/ai/completion')
        .send({ text: 'This is a test prompt' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('suggestion');
      expect(response.body.suggestion).toBe('Mock completion response');
    });

    it('should return 400 when text is not provided', async () => {
      const response = await request(app)
        .post('/api/ai/completion')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Text is required');
    });
  });

  describe('generateSummary', () => {
    it('should generate a summary for a valid note', async () => {
      // Mock the note
      const mockNote = {
        _id: 'note123',
        user: 'user123',
        title: 'Test Note',
        content: 'This is the content of the test note.',
        save: jest.fn().mockResolvedValue(true)
      };
      
      Note.findById.mockResolvedValue(mockNote);

      const response = await request(app)
        .post('/api/ai/notes/note123/summary');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toBe('This is a mock summary of the note content.');
      expect(mockNote.save).toHaveBeenCalled();
    });

    it('should return 404 when note is not found', async () => {
      Note.findById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/ai/notes/nonexistent/summary');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Note not found');
    });

    it('should return 401 when user does not own the note', async () => {
      // Mock the note with a different user
      const mockNote = {
        _id: 'note123',
        user: 'differentUser',
        title: 'Test Note',
        content: 'This is the content of the test note.'
      };
      
      Note.findById.mockResolvedValue(mockNote);

      const response = await request(app)
        .post('/api/ai/notes/note123/summary');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Not authorized');
    });
  });

  describe('categorizeNote', () => {
    it('should categorize a valid note', async () => {
      // Mock the note
      const mockNote = {
        _id: 'note123',
        user: 'user123',
        title: 'Test Note',
        content: 'This is the content of the test note.',
        save: jest.fn().mockResolvedValue(true)
      };
      
      Note.findById.mockResolvedValue(mockNote);

      const response = await request(app)
        .post('/api/ai/notes/note123/categorize');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('category', 'Test Category');
      expect(response.body).toHaveProperty('tags');
      expect(response.body.tags).toHaveLength(5);
      expect(mockNote.save).toHaveBeenCalled();
    });
  });

  describe('naturalLanguageSearch', () => {
    it('should search notes using extracted keywords', async () => {
      const response = await request(app)
        .post('/api/ai/search')
        .send({ query: 'Find notes about programming' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notes');
      expect(response.body).toHaveProperty('keywords');
      expect(response.body.notes).toHaveLength(2);
      expect(response.body.keywords).toEqual(['keyword1', 'keyword2', 'keyword3']);
    });

    it('should return 400 when query is not provided', async () => {
      const response = await request(app)
        .post('/api/ai/search')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Search query is required');
    });
  });
});