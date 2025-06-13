const express = require('express');
const { check } = require('express-validator');
const noteController = require('../controllers/noteController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   GET /api/notes
// @desc    Get all notes for a user
// @access  Private
router.get('/', noteController.getNotes);

// @route   GET /api/notes/:id
// @desc    Get a single note by ID
// @access  Private
router.get('/:id', noteController.getNoteById);

// @route   POST /api/notes
// @desc    Create a new note
// @access  Private
router.post(
  '/',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('content', 'Content is required').not().isEmpty()
  ],
  noteController.createNote
);

// @route   PUT /api/notes/:id
// @desc    Update a note
// @access  Private
router.put(
  '/:id',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('content', 'Content is required').not().isEmpty()
  ],
  noteController.updateNote
);

// @route   DELETE /api/notes/:id
// @desc    Delete a note
// @access  Private
router.delete('/:id', noteController.deleteNote);

// @route   GET /api/notes/search
// @desc    Search notes
// @access  Private
router.get('/search', noteController.searchNotes);

module.exports = router;