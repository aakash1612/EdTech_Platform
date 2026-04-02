require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/edtech");
  console.log("Connected to MongoDB");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@edtech.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

  const existing = await User.findOne({ email: adminEmail });
  if (existing) {
    console.log(`Admin already exists: ${adminEmail}`);
  } else {
    await User.create({
      name: "Platform Admin",
      email: adminEmail,
      password: adminPassword,
      role: "admin"
    });
    console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`);
  }

  // Optionally create a demo student
  const studentEmail = "student@test.com";
  const existingStudent = await User.findOne({ email: studentEmail });
  if (!existingStudent) {
    await User.create({
      name: "Demo Student",
      email: studentEmail,
      password: "Student@123",
      role: "student"
    });
    console.log("✅ Demo student created: student@test.com / Student@123");
  } else {
    console.log("Demo student already exists");
  }

  await mongoose.disconnect();
  console.log("Done!");
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
