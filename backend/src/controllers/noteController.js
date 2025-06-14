const { validationResult } = require('express-validator');
const Note = require('../models/Note');

// Get all notes for a user
exports.getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.userId }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error('Error in getNotes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single note by ID
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    // Check if note exists
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Check if user owns the note
    if (note.user.toString() !== req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    res.json(note);
  } catch (error) {
    console.error('Error in getNoteById:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new note
exports.createNote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, content, tags } = req.body;
    
    const newNote = new Note({
      title,
      content,
      tags: tags || [],
      user: req.userId
    });
    
    const note = await newNote.save();
    res.status(201).json(note);
  } catch (error) {
    console.error('Error in createNote:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a note
exports.updateNote = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, content, tags } = req.body;
    
    // Find note by ID
    let note = await Note.findById(req.params.id);
    
    // Check if note exists
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Check if user owns the note
    if (note.user.toString() !== req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Update note fields
    note.title = title;
    note.content = content;
    note.tags = tags || note.tags;
    note.updatedAt = Date.now();
    
    // Save updated note
    note = await note.save();
    res.json(note);
  } catch (error) {
    console.error('Error in updateNote:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a note
exports.deleteNote = async (req, res) => {
  try {
    // Find note by ID
    const note = await Note.findById(req.params.id);
    
    // Check if note exists
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Check if user owns the note
    if (note.user.toString() !== req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Delete note
    await note.remove();
    res.json({ message: 'Note removed' });
  } catch (error) {
    console.error('Error in deleteNote:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search notes
exports.searchNotes = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const notes = await Note.find({
      user: req.userId,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    }).sort({ updatedAt: -1 });
    
    res.json(notes);
  } catch (error) {
    console.error('Error in searchNotes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};