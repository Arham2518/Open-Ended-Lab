// backend/models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: 120,
  },
  priority: {
    type: String,
    enum: ['high', 'med', 'low'],
    default: 'med',
  },
  due: {
    type: String,   // stored as YYYY-MM-DD string for simplicity
    default: '',
  },
  done: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
