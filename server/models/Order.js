const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: "INR"
  },
  paymentMethod: {
    type: String,
    enum: ["stripe", "razorpay", "free"],
    required: true
  },
  paymentId: {
    type: String,
    default: ""
  },
  orderId: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending"
  },
  receipt: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
