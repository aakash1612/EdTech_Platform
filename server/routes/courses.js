const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const Lecture = require("../models/Lecture");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");

// GET /api/courses - public browse (published only)
router.get("/", async (req, res) => {
  try {
    const { category, level, search, sort, page = 1, limit = 12 } = req.query;
    const query = { isPublished: true };

    if (category) query.category = category;
    if (level) query.level = level;
    if (search) query.$text = { $search: search };

    let sortObj = { createdAt: -1 };
    if (sort === "popular") sortObj = { enrolledCount: -1 };
    if (sort === "rating") sortObj = { "rating.average": -1 };
    if (sort === "price-low") sortObj = { price: 1 };
    if (sort === "price-high") sortObj = { price: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [courses, total] = await Promise.all([
      Course.find(query)
        .select("-reviews")
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Course.countDocuments(query)
    ]);

    res.json({ success: true, courses, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/courses/featured
router.get("/featured", async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true, isFeatured: true })
      .select("-reviews")
      .limit(6)
      .lean();
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/courses/all - admin gets all courses
router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const courses = await Course.find({})
      .sort({ createdAt: -1 })
      .populate("lectures", "title duration")
      .lean();
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/courses/:id - course detail
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate({
        path: "lectures",
        select: "title description duration order section isPreview videoType",
        options: { sort: { order: 1 } }
      });
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/courses - admin create
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, course });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/courses/:id - admin update
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    res.json({ success: true, course });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/courses/:id - admin delete
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    await Lecture.deleteMany({ course: course._id });
    await Course.findByIdAndDelete(req.params.id);
    // Remove from enrolled users
    await User.updateMany(
      { "enrolledCourses.course": req.params.id },
      { $pull: { enrolledCourses: { course: req.params.id } } }
    );
    res.json({ success: true, message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/courses/:id/review
router.post("/:id/review", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const enrolled = req.user.enrolledCourses?.some(e => e.course?.toString() === req.params.id);
    if (!enrolled) return res.status(403).json({ success: false, message: "Enroll to review" });

    const alreadyReviewed = course.reviews.find(r => r.user?.toString() === req.user._id.toString());
    if (alreadyReviewed) return res.status(400).json({ success: false, message: "Already reviewed" });

    course.reviews.push({ user: req.user._id, name: req.user.name, rating, comment });
    const total = course.reviews.reduce((acc, r) => acc + r.rating, 0);
    course.rating.average = (total / course.reviews.length).toFixed(1);
    course.rating.count = course.reviews.length;
    await course.save();
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/courses/:id/wishlist toggle
router.post("/:id/wishlist", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const idx = user.wishlist.indexOf(req.params.id);
    if (idx > -1) user.wishlist.splice(idx, 1);
    else user.wishlist.push(req.params.id);
    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
