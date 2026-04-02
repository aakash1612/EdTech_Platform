const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Order = require("../models/Order");
const Course = require("../models/Course");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// ── Helper: enroll user after successful payment ──
async function enrollUser(userId, courseId, orderId, paymentId) {
  const [user, course] = await Promise.all([
    User.findById(userId),
    Course.findById(courseId)
  ]);
  if (!user || !course) throw new Error("User or course not found");
  const already = user.enrolledCourses.some(e => e.course?.toString() === courseId.toString());
  if (!already) {
    user.enrolledCourses.push({ course: courseId, enrolledAt: new Date(), progress: 0 });
    await user.save();
    course.enrolledCount = (course.enrolledCount || 0) + 1;
    await course.save();
  }
  if (orderId) {
    await Order.findByIdAndUpdate(orderId, { status: "completed", paymentId: String(paymentId) });
  }
}

// ── POST /api/payment/create-order ──
// Returns gateway type + everything the frontend needs to open checkout
router.post("/create-order", protect, async (req, res) => {
  try {
    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ success: false, message: "courseId required" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!course.isPublished) return res.status(400).json({ success: false, message: "Course not available" });

    const user = await User.findById(req.user._id);
    if (user.enrolledCourses.some(e => e.course?.toString() === courseId)) {
      return res.status(400).json({ success: false, message: "You are already enrolled in this course" });
    }

    // Free course — no payment needed
    if (course.price === 0) {
      return res.json({ success: true, gateway: "free", courseId });
    }

    // ── Razorpay ──
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const Razorpay = require("razorpay");
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      const receiptId = `rcpt_${Date.now()}_${req.user._id.toString().slice(-6)}`;
      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(course.price * 100),
        currency: "INR",
        receipt: receiptId,
        notes: { courseId, courseTitle: course.title, userId: req.user._id.toString(), userEmail: req.user.email }
      });
      const dbOrder = await Order.create({
        user: req.user._id, course: courseId, amount: course.price,
        currency: "INR", paymentMethod: "razorpay",
        orderId: rzpOrder.id, receipt: receiptId, status: "pending"
      });
      return res.json({
        success: true, gateway: "razorpay",
        key: process.env.RAZORPAY_KEY_ID,
        order: rzpOrder, dbOrderId: dbOrder._id,
        prefill: { name: req.user.name, email: req.user.email },
        course: { title: course.title, thumbnail: course.thumbnail, price: course.price }
      });
    }

    // ── Stripe ──
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(course.price * 100), currency: "inr",
        automatic_payment_methods: { enabled: true },
        metadata: { courseId, courseTitle: course.title, userId: req.user._id.toString() }
      });
      const dbOrder = await Order.create({
        user: req.user._id, course: courseId, amount: course.price,
        currency: "INR", paymentMethod: "stripe",
        paymentId: intent.id, status: "pending"
      });
      return res.json({
        success: true, gateway: "stripe",
        clientSecret: intent.client_secret, dbOrderId: dbOrder._id,
        course: { title: course.title, thumbnail: course.thumbnail, price: course.price }
      });
    }

    // ── Sandbox (no keys configured — dev/demo mode) ──
    const sandboxOrder = await Order.create({
      user: req.user._id, course: courseId, amount: course.price,
      currency: "INR", paymentMethod: "razorpay",
      orderId: `sandbox_${Date.now()}`, status: "pending"
    });
    return res.json({
      success: true, gateway: "sandbox",
      dbOrderId: sandboxOrder._id,
      course: { title: course.title, thumbnail: course.thumbnail, price: course.price },
      prefill: { name: req.user.name, email: req.user.email }
    });

  } catch (err) {
    console.error("create-order:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/payment/verify ──
// Verifies Razorpay signature (HMAC-SHA256) then enrolls user
router.post("/verify", protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, dbOrderId } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment fields" });
    }

    // HMAC verification
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "sandbox")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (process.env.RAZORPAY_KEY_SECRET && expected !== razorpay_signature) {
      if (dbOrderId) await Order.findByIdAndUpdate(dbOrderId, { status: "failed" });
      return res.status(400).json({ success: false, message: "Payment verification failed. Invalid signature." });
    }

    await enrollUser(req.user._id, courseId, dbOrderId, razorpay_payment_id);
    res.json({ success: true, message: "Payment verified! You are now enrolled." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/payment/sandbox-verify ──
// Simulated checkout for dev/demo — mimics card processing
router.post("/sandbox-verify", protect, async (req, res) => {
  try {
    const { courseId, dbOrderId, cardNumber } = req.body;
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1500));
    // Card starting with 0000 simulates a declined card
    if (cardNumber && cardNumber.replace(/\s/g, "").startsWith("0000")) {
      if (dbOrderId) await Order.findByIdAndUpdate(dbOrderId, { status: "failed" });
      return res.status(400).json({ success: false, message: "Your card was declined. Please try a different payment method." });
    }
    await enrollUser(req.user._id, courseId, dbOrderId, `sandbox_pay_${Date.now()}`);
    res.json({ success: true, message: "Payment successful! You are now enrolled." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/payment/enroll-free ──
router.post("/enroll-free", protect, async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (course.price > 0) return res.status(400).json({ success: false, message: "Course is not free" });
    const user = await User.findById(req.user._id);
    if (user.enrolledCourses.some(e => e.course?.toString() === courseId)) {
      return res.status(400).json({ success: false, message: "Already enrolled" });
    }
    const order = await Order.create({
      user: req.user._id, course: courseId, amount: 0, paymentMethod: "free", status: "completed"
    });
    await enrollUser(req.user._id, courseId, order._id, "free");
    res.json({ success: true, message: "Enrolled successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/payment/razorpay-webhook ──
router.post("/razorpay-webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (secret) {
      const sig = req.headers["x-razorpay-signature"];
      const digest = crypto.createHmac("sha256", secret).update(req.body).digest("hex");
      if (digest !== sig) return res.status(400).json({ success: false });
    }
    const event = JSON.parse(req.body);
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const order = await Order.findOne({ orderId: payment.order_id });
      if (order && order.status !== "completed") {
        await enrollUser(order.user, order.course, order._id, payment.id);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ── GET /api/payment/orders ──
router.get("/orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("course", "title thumbnail price instructor")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/payment/all-orders (admin) ──
router.get("/all-orders", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admin only" });
    const orders = await Order.find({})
      .populate("user", "name email")
      .populate("course", "title price thumbnail")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
