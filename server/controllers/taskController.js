const Task = require("../models/Task");

// Helper to transform task _id to id for the frontend
const transformTask = (task) => {
  if (!task) return null;
  const obj = task.toObject();
  obj.id = obj._id.toString();
  return obj;
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(tasks.map(transformTask));
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ error: "Server error retrieving tasks." });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ error: "Task not found." });
    }
    res.status(200).json(transformTask(task));
  } catch (err) {
    console.error("Get task by id error:", err);
    res.status(500).json({ error: "Server error retrieving task." });
  }
};

exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      completed,
      subtasks,
      time,
      completedDate,
      completedTime,
      isFocused,
      color,
      reminderDate,
      reminderTime,
      hasReminder,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required." });
    }

    const task = new Task({
      userId: req.user._id,
      title: title.trim(),
      description: description || "",
      priority: priority || "Medium",
      dueDate: dueDate || "",
      completed: completed || false,
      subtasks: subtasks || [],
      time: time || "",
      completedDate,
      completedTime,
      isFocused: isFocused || false,
      color: color || "#60A5FA",
      reminderDate: reminderDate || "",
      reminderTime: reminderTime || "",
      hasReminder: hasReminder || false,
    });

    await task.save();
    res.status(201).json(transformTask(task));
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ error: "Server error creating task." });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Clean data to prevent overriding critical fields
    delete updateData.userId;
    delete updateData._id;
    delete updateData.id;

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ error: "Task not found or unauthorized." });
    }

    res.status(200).json(transformTask(task));
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ error: "Server error updating task." });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!task) {
      return res.status(404).json({ error: "Task not found or unauthorized." });
    }

    res.status(200).json({ success: true, message: "Task deleted successfully." });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "Server error deleting task." });
  }
};
