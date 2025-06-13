const express = require('express');
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   POST /api/ai/completion
// @desc    Get text completion suggestions
// @access  Private
router.post('/completion', aiController.getCompletionSuggestion);

// @route   POST /api/ai/notes/:noteId/summary
// @desc    Generate summary for a note
// @access  Private
router.post('/notes/:noteId/summary', aiController.generateSummary);

// @route   POST /api/ai/notes/:noteId/categorize
// @desc    Categorize and tag a note
// @access  Private
router.post('/notes/:noteId/categorize', aiController.categorizeNote);

// @route   GET /api/ai/notes/:noteId/related
// @desc    Find related notes
// @access  Private
router.get('/notes/:noteId/related', aiController.findRelatedNotes);

// @route   POST /api/ai/search
// @desc    Natural language search
// @access  Private
router.post('/search', aiController.naturalLanguageSearch);

module.exports = router;