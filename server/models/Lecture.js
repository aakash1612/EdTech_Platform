const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Lecture title is required"],
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  videoUrl: {
    type: String,
    required: [true, "Video URL is required"]
  },
  videoType: {
    type: String,
    enum: ["upload", "youtube", "vimeo", "external"],
    default: "upload"
  },
  duration: {
    type: Number,
    default: 0
  },
  order: {
    type: Number,
    required: true
  },
  section: {
    type: String,
    default: "Main Content"
  },
  isPreview: {
    type: Boolean,
    default: false
  },
  resources: [{
    title: String,
    url: String,
    type: { type: String, enum: ["pdf", "link", "code", "other"] }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Lecture", lectureSchema);
