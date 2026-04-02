const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Course title is required"],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, "Description is required"]
  },
  shortDescription: {
    type: String,
    maxlength: 300
  },
  thumbnail: {
    type: String,
    default: ""
  },
  instructor: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ["Web Development", "Mobile Development", "Data Science", "Machine Learning", "DevOps", "Design", "Business", "Marketing", "Photography", "Music", "Other"]
  },
  level: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    default: "Beginner"
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: "INR"
  },
  language: {
    type: String,
    default: "English"
  },
  duration: {
    type: String,
    default: "0 hours"
  },
  lectures: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecture"
  }],
  requirements: [String],
  whatYouLearn: [String],
  tags: [String],
  isPublished: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  enrolledCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

courseSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Course", courseSchema);
