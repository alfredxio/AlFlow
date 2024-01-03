const mongoose = require("mongoose");

const flowSchema = new mongoose.Schema({
  id: {
    type: String,
  },
  infoPosition: {
    x: {
      type: Number,
    },
    y: {
      type: Number,
    },
  },
  pulsePosition: {
    x: {
      type: Number,
    },
    y: {
      type: Number,
    },
  },
  scroll: {
    type: Number,
  },
  info: {
    type: String,
  },
  screenshot: {
    type: String,
  },
});

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  key: {
    type: String,
  },
  uniqueId: {
    type: String,
  },
  path: {
    type: String,
  },
  description: {
    heading: {
      type: String,
    },
    subHeading: {
      type: String,
    },
    finish: {
      type: String,
    },
    finishText: {
      type: String,
    },
  },
  flow: [flowSchema],
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
  },
  projects: [projectSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const User = mongoose.model("User", userSchema);

const publicProjectSchema = new mongoose.Schema({
  email: {
    type: String,
  },
  projectID: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const PublicProject = mongoose.model("PublicProject", publicProjectSchema);

module.exports = { User, PublicProject };
