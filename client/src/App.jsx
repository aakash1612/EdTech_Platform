import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import CourseBrowse from "./pages/student/CourseBrowse";
import CourseDetail from "./pages/student/CourseDetail";
import CourseLearn from "./pages/student/CourseLearn";
import StudentDashboard from "./pages/student/StudentDashboard";
import MyCourses from "./pages/student/MyCourses";
import Profile from "./pages/student/Profile";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseForm from "./pages/admin/AdminCourseForm";
import AdminLectures from "./pages/admin/AdminLectures";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrders from "./pages/admin/AdminOrders";

// Components
import Navbar from "./components/common/Navbar";
import AdminSidebar from "./components/admin/AdminSidebar";

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
};

const AdminLayout = ({ children }) => (
  <div style={{ display: "flex", minHeight: "100vh" }}>
    <AdminSidebar />
    <main style={{ flex: 1, overflowX: "hidden" }}>{children}</main>
  </div>
);

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<><Navbar /><Home /></>} />
        <Route path="/login" element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/courses" element={<><Navbar /><CourseBrowse /></>} />
        <Route path="/courses/:id" element={<><Navbar /><CourseDetail /></>} />

        {/* Student */}
        <Route path="/dashboard" element={<PrivateRoute role="student"><Navbar /><StudentDashboard /></PrivateRoute>} />
        <Route path="/my-courses" element={<PrivateRoute role="student"><Navbar /><MyCourses /></PrivateRoute>} />
        <Route path="/learn/:courseId" element={<PrivateRoute role="student"><CourseLearn /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Navbar /><Profile /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<PrivateRoute role="admin"><AdminLayout><AdminDashboard /></AdminLayout></PrivateRoute>} />
        <Route path="/admin/courses" element={<PrivateRoute role="admin"><AdminLayout><AdminCourses /></AdminLayout></PrivateRoute>} />
        <Route path="/admin/courses/new" element={<PrivateRoute role="admin"><AdminLayout><AdminCourseForm /></AdminLayout></PrivateRoute>} />
        <Route path="/admin/courses/:id/edit" element={<PrivateRoute role="admin"><AdminLayout><AdminCourseForm /></AdminLayout></PrivateRoute>} />
        <Route path="/admin/courses/:id/lectures" element={<PrivateRoute role="admin"><AdminLayout><AdminLectures /></AdminLayout></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute role="admin"><AdminLayout><AdminUsers /></AdminLayout></PrivateRoute>} />
        <Route path="/admin/orders" element={<PrivateRoute role="admin"><AdminLayout><AdminOrders /></AdminLayout></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#252538",
              color: "#F1F0FF",
              border: "1px solid rgba(255,255,255,0.1)",
              fontFamily: "'DM Sans', sans-serif"
            },
            success: { iconTheme: { primary: "#6BCB77", secondary: "#fff" } },
            error: { iconTheme: { primary: "#FF6B6B", secondary: "#fff" } }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
