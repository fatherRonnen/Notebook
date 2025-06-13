const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/index');
const User = require('../src/models/User');
const Note = require('../src/models/Note');

// Mock user data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

// Mock note data
const testNote = {
  title: 'Test Note',
  content: 'This is a test note content.',
  tags: ['test', 'note']
};

let userId;
let token;
let noteId;

// Connect to test database before tests
beforeAll(async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-notebook-test';
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

// Clean up database after tests
afterAll(async () => {
  await User.deleteMany({});
  await Note.deleteMany({});
  await mongoose.connection.close();
});

// Set up test user and token before each test
beforeEach(async () => {
  // Clean up database
  await User.deleteMany({});
  await Note.deleteMany({});
  
  // Create test user
  const user = await new User(testUser).save();
  userId = user._id;
  
  // Generate token
  token = jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'testsecret',
    { expiresIn: '1h' }
  );
  
  // Create test note
  const note = await new Note({
    ...testNote,
    user: userId
  }).save();
  noteId = note._id;
});

describe('Notes API', () => {
  describe('GET /api/notes', () => {
    it('should get all notes for a user', async () => {
      const res = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toEqual(1);
      expect(res.body[0].title).toEqual(testNote.title);
    });

    it('should not get notes without authentication', async () => {
      const res = await request(app)
        .get('/api/notes');
      
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should get a note by ID', async () => {
      const res = await request(app)
        .get(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('title', testNote.title);
      expect(res.body).toHaveProperty('content', testNote.content);
    });

    it('should not get a note with invalid ID', async () => {
      const res = await request(app)
        .get('/api/notes/invalidid')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(500);
    });

    it('should not get a note that belongs to another user', async () => {
      // Create another user
      const anotherUser = await new User({
        name: 'Another User',
        email: 'another@example.com',
        password: 'password123'
      }).save();
      
      // Create a note for the other user
      const anotherNote = await new Note({
        ...testNote,
        title: 'Another User Note',
        user: anotherUser._id
      }).save();
      
      const res = await request(app)
        .get(`/api/notes/${anotherNote._id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('POST /api/notes', () => {
    it('should create a new note', async () => {
      const newNote = {
        title: 'New Test Note',
        content: 'This is a new test note content.',
        tags: ['new', 'test']
      };
      
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(newNote);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('title', newNote.title);
      expect(res.body).toHaveProperty('content', newNote.content);
      expect(res.body).toHaveProperty('user', userId.toString());
      expect(res.body.tags).toEqual(expect.arrayContaining(newNote.tags));
    });

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({
          // Missing title
          content: 'This is a test note content.'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should update a note', async () => {
      const updatedNote = {
        title: 'Updated Test Note',
        content: 'This is an updated test note content.',
        tags: ['updated', 'test']
      };
      
      const res = await request(app)
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedNote);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('title', updatedNote.title);
      expect(res.body).toHaveProperty('content', updatedNote.content);
      expect(res.body.tags).toEqual(expect.arrayContaining(updatedNote.tags));
    });

    it('should not update a note that belongs to another user', async () => {
      // Create another user
      const anotherUser = await new User({
        name: 'Another User',
        email: 'another@example.com',
        password: 'password123'
      }).save();
      
      // Create a note for the other user
      const anotherNote = await new Note({
        ...testNote,
        title: 'Another User Note',
        user: anotherUser._id
      }).save();
      
      const updatedNote = {
        title: 'Trying to Update',
        content: 'This should not work',
        tags: ['unauthorized']
      };
      
      const res = await request(app)
        .put(`/api/notes/${anotherNote._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedNote);
      
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should delete a note', async () => {
      const res = await request(app)
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message', 'Note removed');
      
      // Verify note is deleted
      const notes = await Note.find({ user: userId });
      expect(notes.length).toEqual(0);
    });

    it('should not delete a note that belongs to another user', async () => {
      // Create another user
      const anotherUser = await new User({
        name: 'Another User',
        email: 'another@example.com',
        password: 'password123'
      }).save();
      
      // Create a note for the other user
      const anotherNote = await new Note({
        ...testNote,
        title: 'Another User Note',
        user: anotherUser._id
      }).save();
      
      const res = await request(app)
        .delete(`/api/notes/${anotherNote._id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(401);
      
      // Verify note is not deleted
      const note = await Note.findById(anotherNote._id);
      expect(note).toBeTruthy();
    });
  });
});