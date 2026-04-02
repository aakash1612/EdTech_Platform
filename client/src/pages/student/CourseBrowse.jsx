import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import CourseCard from "../../components/common/CourseCard";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { FiSearch, FiFilter, FiX } from "react-icons/fi";

const CATEGORIES = ["Web Development", "Mobile Development", "Data Science", "Machine Learning", "DevOps", "Design", "Business", "Other"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const SORTS = [
  { val: "", label: "Latest" },
  { val: "popular", label: "Most Popular" },
  { val: "rating", label: "Top Rated" },
  { val: "price-low", label: "Price: Low to High" },
  { val: "price-high", label: "Price: High to Low" },
];

export default function CourseBrowse() {
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [wishlist, setWishlist] = useState([]);
  const { user } = useAuth();

  const category = searchParams.get("category") || "";
  const level = searchParams.get("level") || "";
  const sort = searchParams.get("sort") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 9 });
      if (category) params.set("category", category);
      if (level) params.set("level", level);
      if (sort) params.set("sort", sort);
      if (search) params.set("search", search);
      const { data } = await axios.get(`/courses?${params}`);
      setCourses(data.courses);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [category, level, sort, search, page]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  useEffect(() => {
    if (user) setWishlist(user.wishlist?.map(w => w._id || w) || []);
  }, [user]);

  const setFilter = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.set("page", "1");
    setSearchParams(p);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilter("search", search);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchParams({});
  };

  const toggleWishlist = async (courseId) => {
    if (!user) return toast.error("Login to save courses");
    try {
      const { data } = await axios.post(`/courses/${courseId}/wishlist`);
      setWishlist(data.wishlist);
    } catch { toast.error("Failed to update wishlist"); }
  };

  const hasFilters = category || level || sort || search;

  return (
    <div style={{ minHeight: "100vh", padding: "40px 0" }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 6 }}>
            {category || "All Courses"}
          </h1>
          <p style={{ color: "var(--text2)" }}>{total} courses available</p>
        </div>

        {/* Search + Filters */}
        <div style={{
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: "var(--radius)", padding: 20, marginBottom: 28
        }}>
          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <FiSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
              <input
                type="text" placeholder="Search courses..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: 38, width: "100%" }}
              />
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="btn btn-ghost" title="Clear filters">
                <FiX />
              </button>
            )}
          </form>

          {/* Filter Row */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <FilterSelect label="Category" value={category} onChange={v => setFilter("category", v)}
              options={CATEGORIES.map(c => ({ val: c, label: c }))} />
            <FilterSelect label="Level" value={level} onChange={v => setFilter("level", v)}
              options={LEVELS.map(l => ({ val: l, label: l }))} />
            <FilterSelect label="Sort by" value={sort} onChange={v => setFilter("sort", v)}
              options={SORTS} />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="loading-page"><div className="spinner" /></div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
            <h3>No courses found</h3>
            <p>Try adjusting your filters or search terms</p>
            <button onClick={clearFilters} className="btn btn-outline" style={{ marginTop: 16 }}>Clear Filters</button>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20, marginBottom: 32 }}>
              {courses.map(c => (
                <CourseCard
                  key={c._id} course={c}
                  onWishlist={user ? toggleWishlist : null}
                  isWishlisted={wishlist.includes(c._id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setFilter("page", p)}
                    className={`btn btn-sm ${p === page ? "btn-primary" : "btn-ghost"}`}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const FilterSelect = ({ label, value, onChange, options }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{ width: "auto", minWidth: 140, fontSize: 13 }}
  >
    <option value="">{label}</option>
    {options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
  </select>
);
