# EduLearn — Full-Stack EdTech Platform

A production-ready MERN stack EdTech platform with admin and student modes, video lectures, and payment integration.

---

## 🚀 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, React Router v6, React Player |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Payment | Razorpay / Stripe (configurable) |
| Styling | Pure CSS with CSS Variables (dark theme) |

---

## 📁 Project Structure

```
edtech/
├── server/                 # Express backend
│   ├── models/             # Mongoose models
│   │   ├── User.js
│   │   ├── Course.js
│   │   ├── Lecture.js
│   │   └── Order.js
│   ├── routes/             # API routes
│   │   ├── auth.js         # Register, login, profile
│   │   ├── courses.js      # CRUD + browse
│   │   ├── lectures.js     # Video management
│   │   ├── payment.js      # Razorpay/Stripe/demo
│   │   ├── admin.js        # Stats, user mgmt
│   │   └── student.js      # Dashboard, progress
│   ├── middleware/
│   │   └── auth.js         # JWT + role guards
│   ├── seed.js             # Create admin + demo user
│   ├── index.js            # Entry point
│   └── .env.example        # Environment template
│
└── client/                 # React frontend
    └── src/
        ├── pages/
        │   ├── Home.jsx            # Landing page
        │   ├── auth/               # Login, Register
        │   ├── student/            # Dashboard, Browse, Learn
        │   └── admin/              # Dashboard, Courses, Users, Orders
        ├── components/
        │   ├── common/             # Navbar, CourseCard
        │   └── admin/              # AdminSidebar
        └── context/
            └── AuthContext.jsx     # Global auth state
```

---

## ⚙️ Setup & Run

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
# Install all dependencies
npm run install:all
```

### 2. Configure Environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/edtech
JWT_SECRET=your_super_secret_key_here

### Razorpay (recommended for India)
1. Create account at [razorpay.com](https://razorpay.com)
2. Get test keys from Dashboard → Settings → API Keys
3. Add to `server/.env`

### Stripe
1. Create account at [stripe.com](https://stripe.com)
2. Get test secret key from Dashboard
3. Add `STRIPE_SECRET_KEY` to `server/.env`
```

### 3. Seed Admin User

```bash
npm run seed
```

This creates:
- **Admin**: `admin@edtech.com` / `Admin@123`
- **Student**: `student@test.com` / `Student@123`

### 4. Start Development

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## 👤 User Roles

### 🔑 Admin
- Login at `/login` using admin credentials
- **Dashboard**: Stats, revenue chart, recent orders
- **Courses**: Create, edit, delete, publish/unpublish, feature
- **Lectures**: Add video lectures to any course (YouTube, Vimeo, external URLs)
- **Students**: View all users, block/unblock accounts
- **Orders**: View all transactions

### 👨‍🎓 Student
- Register at `/register` (auto-assigned student role)
- **Browse**: Filter by category, level, search
- **Course Detail**: Preview curriculum, read reviews, enroll
- **Payment**: Demo payment (or real Razorpay/Stripe with keys)
- **Learn**: Video player with progress tracking
- **Dashboard**: Enrolled courses, progress bars, wishlist

---


## 🎬 Adding Lectures

1. Log in as admin
2. Go to Admin → Courses → click **Lectures** (video icon)
3. Click **Add Lecture**
4. Paste any **YouTube URL** (e.g. `https://youtube.com/watch?v=dQw4w9WgXcQ`)
5. Set as "Free Preview" to let non-enrolled students watch

---

## 🌟 Features

- ✅ JWT auth with role-based access (admin / student)
- ✅ Full course CRUD with thumbnail, pricing, tags, requirements
- ✅ Video lectures via YouTube embed (React Player)
- ✅ Progress tracking per student per course
- ✅ Payment: Razorpay + Stripe + demo mode
- ✅ Course reviews & star ratings
- ✅ Wishlist system
- ✅ Admin dashboard with revenue analytics
- ✅ Publish / unpublish / feature courses
- ✅ Block / unblock student accounts
- ✅ Seed demo data from admin dashboard
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark theme with smooth animations

---

## 🔌 API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register student |
| POST | `/api/auth/login` | — | Login (any role) |
| GET | `/api/auth/me` | ✅ | Get current user |
| GET | `/api/courses` | — | Browse published courses |
| GET | `/api/courses/featured` | — | Featured courses |
| GET | `/api/courses/all` | Admin | All courses |
| POST | `/api/courses` | Admin | Create course |
| PUT | `/api/courses/:id` | Admin | Update course |
| DELETE | `/api/courses/:id` | Admin | Delete course |
| GET | `/api/lectures/course/:id` | ✅ | Course lectures |
| POST | `/api/lectures` | Admin | Add lecture |
| DELETE | `/api/lectures/:id` | Admin | Delete lecture |
| POST | `/api/lectures/:id/complete` | Student | Mark complete |
| POST | `/api/payment/create-order` | ✅ | Initiate payment |
| POST | `/api/payment/verify` | ✅ | Verify Razorpay |
| POST | `/api/payment/demo-enroll` | ✅ | Demo enrollment |
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET | `/api/admin/users` | Admin | All students |
| POST | `/api/admin/seed` | Admin | Seed demo courses |

---

## created by 
   Akash Varshney
