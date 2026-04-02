const express = require("express");
const router = express.Router();
const Lecture = require("../models/Lecture");
const Course = require("../models/Course");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");

// GET /api/lectures/course/:courseId - get all lectures for a course
// Returns full video URLs only if student is enrolled or admin
router.get("/course/:courseId", protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const isAdmin = req.user.role === "admin";
    const isEnrolled = req.user.enrolledCourses?.some(
      e => e.course?.toString() === req.params.courseId
    );

    const lectures = await Lecture.find({ course: req.params.courseId, isActive: true })
      .sort({ order: 1 });

    // Hide video URL for non-enrolled students (except preview lectures)
    const result = lectures.map(lec => {
      const l = lec.toObject();
      if (!isAdmin && !isEnrolled && !l.isPreview) {
        l.videoUrl = null;
        l.locked = true;
      } else {
        l.locked = false;
      }
      return l;
    });

    res.json({ success: true, lectures: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/lectures/:id - single lecture (enrolled or admin)
router.get("/:id", protect, async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id).populate("course", "title");
    if (!lecture) return res.status(404).json({ success: false, message: "Lecture not found" });

    const isAdmin = req.user.role === "admin";
    const isEnrolled = req.user.enrolledCourses?.some(
      e => e.course?.toString() === lecture.course._id.toString()
    );

    if (!isAdmin && !isEnrolled && !lecture.isPreview) {
      return res.status(403).json({ success: false, message: "Enroll to access this lecture" });
    }

    res.json({ success: true, lecture });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/lectures - admin add lecture
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { courseId, title, description, videoUrl, videoType, order, section, isPreview, duration, resources } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const lecture = await Lecture.create({
      title, description, videoUrl, videoType: videoType || "youtube",
      order: order || course.lectures.length + 1,
      section: section || "Main Content",
      isPreview: isPreview || false,
      duration: duration || 0,
      resources: resources || [],
      course: courseId
    });

    course.lectures.push(lecture._id);
    // Recalculate duration
    const all = await Lecture.find({ course: courseId });
    const totalMins = all.reduce((acc, l) => acc + (l.duration || 0), 0);
    course.duration = `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
    await course.save();

    res.status(201).json({ success: true, lecture });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/lectures/:id - admin update lecture
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const lecture = await Lecture.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lecture) return res.status(404).json({ success: false, message: "Lecture not found" });
    res.json({ success: true, lecture });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/lectures/:id - admin delete
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) return res.status(404).json({ success: false, message: "Lecture not found" });

    await Course.findByIdAndUpdate(lecture.course, {
      $pull: { lectures: lecture._id }
    });
    await Lecture.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Lecture deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/lectures/:id/complete - mark lecture complete
router.post("/:id/complete", protect, async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) return res.status(404).json({ success: false, message: "Lecture not found" });

    const user = await User.findById(req.user._id);
    const enrollment = user.enrolledCourses.find(e => e.course?.toString() === lecture.course.toString());
    if (!enrollment) return res.status(403).json({ success: false, message: "Not enrolled" });

    if (!enrollment.completedLectures.includes(req.params.id)) {
      enrollment.completedLectures.push(req.params.id);
    }

    const course = await Course.findById(lecture.course).populate("lectures");
    enrollment.progress = Math.round((enrollment.completedLectures.length / course.lectures.length) * 100);

    await user.save();
    res.json({ success: true, progress: enrollment.progress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
