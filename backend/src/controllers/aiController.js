const { Configuration, OpenAIApi } = require('openai');
const Note = require('../models/Note');

// Configure OpenAI API
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Get text completion suggestions
exports.getCompletionSuggestion = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }
    
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: text,
      max_tokens: 100,
      temperature: 0.7,
      n: 1,
      stop: null
    });
    
    const suggestion = response.data.choices[0].text.trim();
    res.json({ suggestion });
  } catch (error) {
    console.error('Error in getCompletionSuggestion:', error);
    res.status(500).json({ message: 'AI service error' });
  }
};

// Generate summary for a note
exports.generateSummary = async (req, res) => {
  try {
    const { noteId } = req.params;
    
    // Find note by ID
    const note = await Note.findById(noteId);
    
    // Check if note exists
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Check if user owns the note
    if (note.user.toString() !== req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Generate summary using OpenAI
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Summarize the following text in a concise paragraph:\n\n${note.content}`,
      max_tokens: 150,
      temperature: 0.5,
      n: 1,
      stop: null
    });
    
    const summary = response.data.choices[0].text.trim();
    
    // Update note with summary
    note.summary = summary;
    await note.save();
    
    res.json({ summary });
  } catch (error) {
    console.error('Error in generateSummary:', error);
    res.status(500).json({ message: 'AI service error' });
  }
};

// Categorize and tag a note
exports.categorizeNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    
    // Find note by ID
    const note = await Note.findById(noteId);
    
    // Check if note exists
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Check if user owns the note
    if (note.user.toString() !== req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Generate categories and tags using OpenAI
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Given the following note, provide a category and 5 relevant tags in JSON format:\n\n${note.title}\n${note.content}\n\nOutput format: {"category": "category_name", "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]}`,
      max_tokens: 150,
      temperature: 0.5,
      n: 1,
      stop: null
    });
    
    // Parse the response
    const responseText = response.data.choices[0].text.trim();
    const parsedResponse = JSON.parse(responseText);
    
    // Update note with category and AI tags
    note.category = parsedResponse.category;
    note.aiTags = parsedResponse.tags;
    await note.save();
    
    res.json({
      category: parsedResponse.category,
      tags: parsedResponse.tags
    });
  } catch (error) {
    console.error('Error in categorizeNote:', error);
    res.status(500).json({ message: 'AI service error' });
  }
};

// Find related notes
exports.findRelatedNotes = async (req, res) => {
  try {
    const { noteId } = req.params;
    
    // Find note by ID
    const note = await Note.findById(noteId);
    
    // Check if note exists
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Check if user owns the note
    if (note.user.toString() !== req.userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Find all notes by the user
    const userNotes = await Note.find({ 
      user: req.userId,
      _id: { $ne: noteId } // Exclude the current note
    });
    
    if (userNotes.length === 0) {
      return res.json({ relatedNotes: [] });
    }
    
    // Create embeddings for the current note and all other notes
    // This is a simplified approach - in a real app, you would use embeddings API
    const relatedNotes = userNotes
      .filter(otherNote => {
        // Check if there are common tags
        const commonTags = note.tags.filter(tag => 
          otherNote.tags.includes(tag) || otherNote.aiTags.includes(tag)
        );
        
        // Check if the category is the same
        const sameCategory = note.category && note.category === otherNote.category;
        
        // Check if the title or content contains similar words
        const noteWords = (note.title + ' ' + note.content).toLowerCase().split(/\W+/);
        const otherNoteWords = (otherNote.title + ' ' + otherNote.content).toLowerCase().split(/\W+/);
        const commonWords = noteWords.filter(word => 
          word.length > 4 && otherNoteWords.includes(word)
        );
        
        return commonTags.length > 0 || sameCategory || commonWords.length > 3;
      })
      .map(note => ({
        id: note._id,
        title: note.title,
        summary: note.summary,
        category: note.category,
        tags: [...note.tags, ...note.aiTags]
      }))
      .slice(0, 5); // Limit to 5 related notes
    
    res.json({ relatedNotes });
  } catch (error) {
    console.error('Error in findRelatedNotes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Natural language search
exports.naturalLanguageSearch = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Use OpenAI to extract search keywords from natural language query
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Extract the most important search keywords from this query: "${query}"\n\nKeywords:`,
      max_tokens: 50,
      temperature: 0.3,
      n: 1,
      stop: null
    });
    
    const keywords = response.data.choices[0].text.trim()
      .split(/,|\n/)
      .map(keyword => keyword.trim())
      .filter(keyword => keyword.length > 0);
    
    // Search notes using the extracted keywords
    const searchQueries = keywords.map(keyword => ({
      $or: [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
        { tags: { $in: [new RegExp(keyword, 'i')] } },
        { aiTags: { $in: [new RegExp(keyword, 'i')] } },
        { category: { $regex: keyword, $options: 'i' } }
      ]
    }));
    
    const notes = await Note.find({
      user: req.userId,
      $or: searchQueries
    }).sort({ updatedAt: -1 });
    
    res.json({
      notes,
      keywords
    });
  } catch (error) {
    console.error('Error in naturalLanguageSearch:', error);
    res.status(500).json({ message: 'AI service error' });
  }
};