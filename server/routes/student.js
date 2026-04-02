const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Course = require("../models/Course");
const { protect } = require("../middleware/auth");

// GET /api/student/dashboard
router.get("/dashboard", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "enrolledCourses.course",
        select: "title thumbnail instructor category level rating lectures duration"
      })
      .populate("wishlist", "title thumbnail price instructor rating");

    const enrolledCourses = user.enrolledCourses.filter(e => e.course);
    const inProgress = enrolledCourses.filter(e => e.progress > 0 && e.progress < 100);
    const completed = enrolledCourses.filter(e => e.progress === 100);

    res.json({
      success: true,
      dashboard: {
        user: { name: user.name, email: user.email, avatar: user.avatar },
        stats: {
          enrolled: enrolledCourses.length,
          inProgress: inProgress.length,
          completed: completed.length,
          wishlist: user.wishlist.length
        },
        enrolledCourses,
        wishlist: user.wishlist
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/student/my-courses
router.get("/my-courses", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "enrolledCourses.course",
        select: "title thumbnail instructor category level rating lectures duration",
        populate: { path: "lectures", select: "title duration" }
      });
    res.json({ success: true, courses: user.enrolledCourses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/student/course/:id/progress
router.get("/course/:id/progress", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const enrollment = user.enrolledCourses.find(e => e.course?.toString() === req.params.id);
    if (!enrollment) return res.status(404).json({ success: false, message: "Not enrolled" });
    res.json({ success: true, progress: enrollment.progress, completedLectures: enrollment.completedLectures });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
