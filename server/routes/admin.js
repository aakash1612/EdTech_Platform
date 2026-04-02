const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Course = require("../models/Course");
const Order = require("../models/Order");
const Lecture = require("../models/Lecture");
const { protect, adminOnly } = require("../middleware/auth");

// GET /api/admin/stats
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalCourses, totalOrders, totalRevenue] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Course.countDocuments(),
      Order.countDocuments({ status: "completed" }),
      Order.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    const recentOrders = await Order.find({ status: "completed" })
      .populate("user", "name email")
      .populate("course", "title price")
      .sort({ createdAt: -1 })
      .limit(10);

    const monthlyRevenue = await Order.aggregate([
      { $match: { status: "completed", createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCourses,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentOrders,
        monthlyRevenue
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: "student" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/users/:id/toggle - activate/deactivate
router.put("/users/:id/toggle", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/users/:id/enroll - manually enroll a user
router.put("/users/:id/enroll", protect, adminOnly, async (req, res) => {
  try {
    const { courseId } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const alreadyEnrolled = user.enrolledCourses.some(e => e.course?.toString() === courseId);
    if (!alreadyEnrolled) {
      user.enrolledCourses.push({ course: courseId, enrolledAt: new Date() });
      await user.save();
      await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });
    }
    res.json({ success: true, message: "User enrolled" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/users/:id/enrollment/:courseId — revoke a student's course access
router.delete("/users/:id/enrollment/:courseId", protect, adminOnly, async (req, res) => {
  try {
    const { id: userId, courseId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const wasEnrolled = user.enrolledCourses.some(e => e.course?.toString() === courseId);
    if (!wasEnrolled) {
      return res.status(400).json({ success: false, message: "Student is not enrolled in this course" });
    }

    // Remove enrollment entry
    user.enrolledCourses = user.enrolledCourses.filter(e => e.course?.toString() !== courseId);
    await user.save();

    // Decrement course enrolledCount (floor at 0)
    await Course.findByIdAndUpdate(courseId, [
      { $set: { enrolledCount: { $max: [0, { $subtract: ["$enrolledCount", 1] }] } } }
    ]);

    // Mark related order as revoked (keep for audit trail, don't delete)
    await Order.updateMany(
      { user: userId, course: courseId, status: "completed" },
      { $set: { status: "refunded" } }
    );

    res.json({ success: true, message: "Enrollment revoked successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users/:id — fetch single student with full enrollment details
router.get("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate({
        path: "enrolledCourses.course",
        select: "title thumbnail category price instructor enrolledCount"
      });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Pull their orders too
    const orders = await Order.find({ user: req.params.id })
      .populate("course", "title price")
      .sort({ createdAt: -1 });

    res.json({ success: true, user, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/courses/:id/publish
router.put("/courses/:id/publish", protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    course.isPublished = !course.isPublished;
    await course.save();
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/courses/:id/feature
router.put("/courses/:id/feature", protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    course.isFeatured = !course.isFeatured;
    await course.save();
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/seed - seed demo data
router.post("/seed", protect, adminOnly, async (req, res) => {
  try {
    const existing = await Course.countDocuments();
    if (existing > 0) return res.json({ success: true, message: "Data already seeded" });

    const courses = [
      {
        title: "Complete React Developer Course",
        description: "Master React from scratch. Build real-world apps with hooks, Redux, and more.",
        shortDescription: "Go from zero to React hero with this comprehensive course.",
        instructor: "Alex Johnson",
        category: "Web Development",
        level: "Beginner",
        price: 1299,
        originalPrice: 3999,
        thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400",
        isPublished: true,
        isFeatured: true,
        whatYouLearn: ["React fundamentals", "Hooks and state", "Redux", "REST API integration"],
        requirements: ["Basic JavaScript", "HTML & CSS"],
        tags: ["react", "javascript", "frontend"],
        enrolledCount: 1240,
        rating: { average: 4.8, count: 320 }
      },
      {
        title: "Node.js Backend Mastery",
        description: "Build scalable REST APIs with Node.js, Express, and MongoDB.",
        shortDescription: "Master backend development with Node.js and Express.",
        instructor: "Sarah Chen",
        category: "Web Development",
        level: "Intermediate",
        price: 999,
        originalPrice: 2999,
        thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400",
        isPublished: true,
        isFeatured: true,
        whatYouLearn: ["REST API design", "Authentication", "MongoDB", "Deployment"],
        requirements: ["JavaScript basics", "Basic Node.js"],
        tags: ["nodejs", "express", "backend"],
        enrolledCount: 890,
        rating: { average: 4.7, count: 210 }
      },
      {
        title: "Machine Learning with Python",
        description: "Learn ML algorithms, scikit-learn, and build AI-powered apps.",
        shortDescription: "Your gateway to AI and machine learning.",
        instructor: "Dr. Priya Sharma",
        category: "Machine Learning",
        level: "Advanced",
        price: 1999,
        originalPrice: 5999,
        thumbnail: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400",
        isPublished: true,
        isFeatured: true,
        whatYouLearn: ["Supervised learning", "Neural networks", "Data preprocessing", "Model deployment"],
        requirements: ["Python basics", "Basic statistics"],
        tags: ["python", "ml", "ai", "data-science"],
        enrolledCount: 2100,
        rating: { average: 4.9, count: 560 }
      },
      {
        title: "UI/UX Design Fundamentals",
        description: "Learn Figma, design principles, and create stunning user interfaces.",
        shortDescription: "Design beautiful products users love.",
        instructor: "Maya Patel",
        category: "Design",
        level: "Beginner",
        price: 799,
        originalPrice: 2499,
        thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400",
        isPublished: true,
        isFeatured: false,
        whatYouLearn: ["Figma", "Color theory", "Typography", "Prototyping"],
        requirements: ["No experience needed"],
        tags: ["design", "figma", "ux", "ui"],
        enrolledCount: 670,
        rating: { average: 4.6, count: 180 }
      },
      {
        title: "DevOps & Docker Bootcamp",
        description: "Master containerization, CI/CD, and cloud deployment.",
        shortDescription: "Ship faster with DevOps practices.",
        instructor: "Ravi Kumar",
        category: "DevOps",
        level: "Intermediate",
        price: 1499,
        originalPrice: 3999,
        thumbnail: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400",
        isPublished: true,
        isFeatured: false,
        whatYouLearn: ["Docker & Kubernetes", "CI/CD pipelines", "AWS basics", "Monitoring"],
        requirements: ["Linux basics", "Some programming experience"],
        tags: ["devops", "docker", "kubernetes", "aws"],
        enrolledCount: 440,
        rating: { average: 4.5, count: 120 }
      },
      {
        title: "Python for Beginners",
        description: "Start your programming journey with Python - completely free!",
        shortDescription: "Learn Python from absolute zero.",
        instructor: "Team EduLearn",
        category: "Data Science",
        level: "Beginner",
        price: 0,
        originalPrice: 0,
        thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400",
        isPublished: true,
        isFeatured: false,
        whatYouLearn: ["Python syntax", "Data types", "Control flow", "Functions"],
        requirements: ["A computer"],
        tags: ["python", "free", "beginner"],
        enrolledCount: 5600,
        rating: { average: 4.7, count: 1200 }
      }
    ];

    await Course.insertMany(courses);
    res.json({ success: true, message: `Seeded ${courses.length} courses` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
