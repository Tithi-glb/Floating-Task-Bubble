const mongoose = require("mongoose");

const SubtaskSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  done: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

const TaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
  dueDate: {
    type: String,
    default: "",
  },
  completed: {
    type: Boolean,
    default: false,
  },
  subtasks: [SubtaskSchema],
  time: {
    type: String,
    default: "",
  },
  completedDate: {
    type: String,
  },
  completedTime: {
    type: String,
  },
  isFocused: {
    type: Boolean,
    default: false,
  },
  color: {
    type: String,
    default: "#60A5FA",
  },
  reminderDate: {
    type: String,
    default: "",
  },
  reminderTime: {
    type: String,
    default: "",
  },
  hasReminder: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true, // Automatically provides createdAt and updatedAt
});

module.exports = mongoose.model("Task", TaskSchema);
