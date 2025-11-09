// Backend Data Modeling Exercise
//
// This code contains several data modeling issues to address.
// Look for problems related to:
// - Nested vs. flat data structures
// - Route organization
// - Data duplication
// - API consistency
//
// Your task is to refactor this code following proper data modeling principles
// from the Selego Style Guide. Consider the tradeoffs between different approaches.

// models/task.js
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: {
    type: String,
    enum: ["todo", "in_progress", "review", "done"],
    default: "todo",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  comments: [
    {
      text: String,
      createdAt: { type: Date, default: Date.now },
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  dueDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;

// controllers/taskController.js
const express = require("express");
const router = express.Router();
const Task = require("../models/task");
const User = require("../models/user");

// Create a new task
router.post("/", async (req, res) => {
  try {
    const { title, description, status, user_id, priority, dueDate } = req.body;

    const task = new Task({
      title,
      description,
      status,
      priority,
      dueDate,
      createdBy: user_id,
    });

    await task.save();
    res.status(201).json({ ok: true, data: task });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Failed to create task" });
  }
});

// Assign task to user
router.post("/:id/assign", async (req, res) => {
  try {
    const { user_id } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ ok: false, error: "Task not found" });
    }

    task.assignedTo = user_id;
    task.updatedAt = Date.now();

    await task.save();
    res.status(200).json({ ok: true, data: task });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Failed to assign task" });
  }
});

// Add a comment to a task
router.post("/:id/comments", async (req, res) => {
  try {
    const { text, user_id } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ ok: false, error: "Task not found" });
    }

    const comment = {
      text,
      user: user_id,
    };

    task.comments.push(comment);
    task.updatedAt = Date.now();

    await task.save();
    res.status(201).json({ ok: true, data: comment });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Failed to add comment" });
  }
});

module.exports = router;
