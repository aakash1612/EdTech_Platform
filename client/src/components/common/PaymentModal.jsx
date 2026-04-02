import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiX, FiLock, FiCreditCard, FiSmartphone, FiGlobe,
  FiCheck, FiShield, FiAlertCircle, FiLoader
} from "react-icons/fi";

// ── Utility: load Razorpay SDK script ──
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Card number formatter ──
function formatCard(val) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(val) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
  return digits;
}

// ── Detect card brand ──
function cardBrand(num) {
  const n = num.replace(/\s/g, "");
  if (/^4/.test(n)) return { name: "Visa", color: "#1a1f71" };
  if (/^5[1-5]/.test(n)) return { name: "Mastercard", color: "#eb001b" };
  if (/^3[47]/.test(n)) return { name: "Amex", color: "#007bc1" };
  if (/^6(?:011|5)/.test(n)) return { name: "Discover", color: "#f76f20" };
  if (/^(?:508[5-9]|6069[0-9][0-9]|607[0-9]|608[0-5])/.test(n)) return { name: "RuPay", color: "#2a6099" };
  return null;
}

const TABS = [
  { id: "card", label: "Card", icon: <FiCreditCard size={15} /> },
  { id: "upi", label: "UPI", icon: <FiSmartphone size={15} /> },
  { id: "netbanking", label: "Net Banking", icon: <FiGlobe size={15} /> },
];

const BANKS = [
  { code: "HDFC", name: "HDFC Bank" },
  { code: "ICICI", name: "ICICI Bank" },
  { code: "SBI", name: "State Bank of India" },
  { code: "AXIS", name: "Axis Bank" },
  { code: "KOTAK", name: "Kotak Mahindra" },
  { code: "YES", name: "Yes Bank" },
];

// ── States ──
// idle → creating → checkout → processing → success | failed

export default function PaymentModal({ course, onClose, onSuccess }) {
  const [state, setState] = useState("creating"); // idle|creating|checkout|processing|success|failed
  const [orderData, setOrderData] = useState(null);
  const [tab, setTab] = useState("card");
  const [error, setError] = useState("");

  // Card form
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [upiId, setUpiId] = useState("");
  const [bank, setBank] = useState("HDFC");
  const [cvvVisible, setCvvVisible] = useState(false);

  // Create order on mount
  useEffect(() => {
    createOrder();
  }, []);

  const createOrder = async () => {
    setState("creating");
    setError("");
    try {
      const { data } = await axios.post("/payment/create-order", { courseId: course._id });
      if (!data.success) throw new Error(data.message);

      if (data.gateway === "free") {
        // Free course — enroll immediately
        await axios.post("/payment/enroll-free", { courseId: course._id });
        setState("success");
        return;
      }

      if (data.gateway === "razorpay") {
        // Load Razorpay SDK and open native checkout
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          // SDK failed — fall through to sandbox UI
          setOrderData({ ...data, gateway: "sandbox" });
          setState("checkout");
          return;
        }
        openRazorpayCheckout(data);
        return;
      }

      // sandbox or stripe — show our UI
      setOrderData(data);
      setState("checkout");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to create order");
      setState("failed");
    }
  };

  const openRazorpayCheckout = (data) => {
    const options = {
      key: data.key,
      amount: data.order.amount,
      currency: data.order.currency,
      name: "EduLearn",
      description: data.course.title,
      image: data.course.thumbnail || "",
      order_id: data.order.id,
      prefill: data.prefill || {},
      theme: { color: "#6C63FF" },
      modal: {
        ondismiss: () => {
          setOrderData(data);
          setState("checkout"); // fall back to our UI if dismissed
        }
      },
      handler: async (response) => {
        setState("processing");
        try {
          const res = await axios.post("/payment/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            courseId: course._id,
            dbOrderId: data.dbOrderId
          });
          if (res.data.success) setState("success");
          else { setError(res.data.message); setState("failed"); }
        } catch (err) {
          setError(err.response?.data?.message || "Verification failed");
          setState("failed");
        }
      }
    };
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (resp) => {
      setError(resp.error?.description || "Payment failed");
      setOrderData(data);
      setState("failed");
    });
    rzp.open();
  };

  const submitSandbox = async () => {
    if (tab === "card") {
      if (!card.number || !card.expiry || !card.cvv || !card.name)
        return setError("Please fill in all card details");
      if (card.number.replace(/\s/g, "").length < 16)
        return setError("Please enter a valid 16-digit card number");
    }
    if (tab === "upi") {
      if (!upiId || !upiId.includes("@"))
        return setError("Please enter a valid UPI ID (e.g. name@upi)");
    }

    setError("");
    setState("processing");

    try {
      const res = await axios.post("/payment/sandbox-verify", {
        courseId: course._id,
        dbOrderId: orderData?.dbOrderId,
        cardNumber: card.number
      });
      if (res.data.success) setState("success");
      else { setError(res.data.message); setState("failed"); }
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed. Please try again.");
      setState("failed");
    }
  };

  const brand = cardBrand(card.number);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, animation: "fadeIn 0.2s ease"
      }}
    >
      <div style={{
        width: "100%", maxWidth: 460, maxHeight: "92vh", overflowY: "auto",
        background: "#12121f", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20, boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
        animation: "slideUp 0.25s ease"
      }}>

        {/* ── Creating ── */}
        {state === "creating" && <LoadingState message="Preparing secure checkout…" />}

        {/* ── Checkout form ── */}
        {state === "checkout" && (
          <CheckoutForm
            course={course}
            orderData={orderData}
            tab={tab} setTab={setTab}
            card={card} setCard={setCard}
            upiId={upiId} setUpiId={setUpiId}
            bank={bank} setBank={setBank}
            cvvVisible={cvvVisible} setCvvVisible={setCvvVisible}
            brand={brand} error={error} setError={setError}
            onClose={onClose}
            onSubmit={submitSandbox}
          />
        )}

        {/* ── Processing ── */}
        {state === "processing" && <LoadingState message="Processing your payment…" sub="Please do not close this window" />}

        {/* ── Success ── */}
        {state === "success" && (
          <SuccessState course={course} onContinue={onSuccess} />
        )}

        {/* ── Failed ── */}
        {state === "failed" && (
          <FailedState error={error} onRetry={createOrder} onClose={onClose} />
        )}
      </div>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform: translateY(30px); } to { opacity:1; transform: translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────
function CheckoutForm({
  course, orderData, tab, setTab, card, setCard,
  upiId, setUpiId, bank, setBank, cvvVisible, setCvvVisible,
  brand, error, setError, onClose, onSubmit
}) {
  const isSandbox = !orderData?.key; // no real Razorpay key = sandbox

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: "20px 24px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <FiLock size={14} style={{ color: "#6BCB77" }} />
            <span style={{ fontSize: 12, color: "#6BCB77", fontWeight: 600 }}>Secure Checkout</span>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem", color: "#F1F0FF", margin: 0 }}>
            Complete Payment
          </h2>
        </div>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.07)", border: "none", color: "#A8A3C7",
          width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
        }}>×</button>
      </div>

      {/* Order summary */}
      <div style={{
        margin: "16px 24px",
        background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)",
        borderRadius: 12, padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 14
      }}>
        {course.thumbnail && (
          <img src={course.thumbnail} alt="" style={{ width: 56, height: 40, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
            onError={e => e.target.style.display = "none"} />
        )}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#F1F0FF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {course.title}
          </div>
          <div style={{ fontSize: 12, color: "#A8A3C7", marginTop: 2 }}>Lifetime access · Certificate included</div>
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem", color: "#F1F0FF", flexShrink: 0 }}>
          ₹{course.price?.toLocaleString()}
        </div>
      </div>

      {/* Sandbox notice */}
      {isSandbox && (
        <div style={{
          margin: "0 24px 12px",
          background: "rgba(255,217,61,0.08)", border: "1px solid rgba(255,217,61,0.25)",
          borderRadius: 10, padding: "10px 14px",
          display: "flex", gap: 10, alignItems: "flex-start"
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔬</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#FFD93D", marginBottom: 2 }}>
              Test Mode — No real charges
            </div>
            <div style={{ fontSize: 11, color: "#A8A3C7", lineHeight: 1.5 }}>
              Add your Razorpay keys in <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 5px", borderRadius: 4 }}>server/.env</code> to enable live payments.
              Use any test card details below.
            </div>
          </div>
        </div>
      )}

      {/* Payment method tabs */}
      <div style={{ margin: "0 24px", display: "flex", gap: 6, borderRadius: 10, background: "rgba(255,255,255,0.04)", padding: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setError(""); }}
            style={{
              flex: 1, padding: "9px 6px", border: "none", borderRadius: 8, cursor: "pointer",
              background: tab === t.id ? "rgba(108,99,255,0.3)" : "transparent",
              color: tab === t.id ? "#9D97FF" : "#6E6A8A",
              fontWeight: tab === t.id ? 600 : 400, fontSize: 13,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.15s"
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Form body */}
      <div style={{ padding: "16px 24px 4px" }}>
        {tab === "card" && (
          <CardForm card={card} setCard={setCard} brand={brand}
            cvvVisible={cvvVisible} setCvvVisible={setCvvVisible} isSandbox={isSandbox} />
        )}
        {tab === "upi" && (
          <UpiForm upiId={upiId} setUpiId={setUpiId} isSandbox={isSandbox} />
        )}
        {tab === "netbanking" && (
          <NetBankingForm bank={bank} setBank={setBank} />
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          margin: "4px 24px 12px",
          background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)",
          borderRadius: 10, padding: "10px 14px",
          display: "flex", gap: 10, alignItems: "center",
          fontSize: 13, color: "#FF6B6B"
        }}>
          <FiAlertCircle size={16} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Pay button */}
      <div style={{ padding: "8px 24px 24px" }}>
        <button onClick={onSubmit} style={{
          width: "100%", padding: "14px",
          background: "linear-gradient(135deg, #6C63FF, #9D97FF)",
          border: "none", borderRadius: 12, cursor: "pointer",
          color: "#fff", fontWeight: 700, fontSize: 16,
          fontFamily: "var(--font-display)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          transition: "all 0.2s", boxShadow: "0 4px 20px rgba(108,99,255,0.4)"
        }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "none"}
        >
          <FiLock size={16} />
          Pay ₹{course.price?.toLocaleString()} Securely
        </button>

        {/* Trust badges */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 16, marginTop: 14, flexWrap: "wrap"
        }}>
          {["🔒 SSL Encrypted", "✓ 30-day refund", "🏦 Bank-grade security"].map((badge, i) => (
            <span key={i} style={{ fontSize: 11, color: "#6E6A8A", display: "flex", alignItems: "center", gap: 4 }}>
              {badge}
            </span>
          ))}
        </div>

        {/* Payment logos */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 10, marginTop: 12, opacity: 0.5
        }}>
          {["Visa", "MC", "RuPay", "UPI", "Razorpay"].map(logo => (
            <span key={logo} style={{
              fontSize: 10, fontWeight: 700, padding: "2px 6px",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: 4,
              color: "#A8A3C7", letterSpacing: "0.05em"
            }}>{logo}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Card form ──
function CardForm({ card, setCard, brand, cvvVisible, setCvvVisible, isSandbox }) {
  return (
    <div>
      {/* Card number */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Card Number</label>
        <div style={{ position: "relative" }}>
          <input
            value={card.number}
            onChange={e => setCard(c => ({ ...c, number: formatCard(e.target.value) }))}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
            inputMode="numeric"
            style={{ ...inputStyle, paddingRight: brand ? 80 : 14, letterSpacing: "0.1em", fontFamily: "monospace, monospace" }}
          />
          {brand && (
            <span style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              fontSize: 11, fontWeight: 800, color: "#fff",
              background: brand.color, padding: "2px 8px", borderRadius: 4,
              letterSpacing: "0.05em"
            }}>{brand.name}</span>
          )}
        </div>
      </div>

      {/* Expiry + CVV */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Expiry Date</label>
          <input
            value={card.expiry}
            onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
            placeholder="MM / YY"
            maxLength={7}
            inputMode="numeric"
            style={{ ...inputStyle, fontFamily: "monospace, monospace", letterSpacing: "0.05em" }}
          />
        </div>
        <div>
          <label style={labelStyle}>
            CVV
            <span style={{ fontSize: 10, color: "#6E6A8A", marginLeft: 6, cursor: "pointer" }}
              onClick={() => setCvvVisible(v => !v)}>
              {cvvVisible ? "Hide" : "Show"}
            </span>
          </label>
          <input
            value={card.cvv}
            onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
            placeholder="•••"
            type={cvvVisible ? "text" : "password"}
            maxLength={4}
            inputMode="numeric"
            style={{ ...inputStyle, fontFamily: "monospace, monospace", letterSpacing: "0.15em" }}
          />
        </div>
      </div>

      {/* Cardholder name */}
      <div style={{ marginBottom: 6 }}>
        <label style={labelStyle}>Cardholder Name</label>
        <input
          value={card.name}
          onChange={e => setCard(c => ({ ...c, name: e.target.value }))}
          placeholder="Name as on card"
          style={{ ...inputStyle, textTransform: "uppercase", letterSpacing: "0.05em" }}
        />
      </div>

      {isSandbox && (
        <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: "#6E6A8A", lineHeight: 1.7 }}>
            <strong style={{ color: "#A8A3C7" }}>Test cards:</strong><br />
            ✅ Success: <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 3 }}>4111 1111 1111 1111</code><br />
            ❌ Declined: <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 3 }}>0000 0000 0000 0000</code><br />
            Expiry: any future date · CVV: any 3 digits
          </div>
        </div>
      )}
    </div>
  );
}

// ── UPI form ──
function UpiForm({ upiId, setUpiId, isSandbox }) {
  return (
    <div>
      <label style={labelStyle}>UPI ID</label>
      <input
        value={upiId}
        onChange={e => setUpiId(e.target.value)}
        placeholder="yourname@upi"
        style={inputStyle}
      />
      {isSandbox && (
        <div style={{ marginTop: 10, fontSize: 11, color: "#6E6A8A", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
          <strong style={{ color: "#A8A3C7" }}>Test UPI:</strong> Enter any ID with <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 3 }}>@</code> symbol (e.g. test@upi)
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 14 }}>
        {["GooglePay", "PhonePe", "Paytm", "BHIM", "Amazon Pay", "WhatsApp"].map(app => (
          <button key={app} type="button"
            onClick={() => setUpiId(prev => prev || `${app.toLowerCase().replace(/\s/g, "")}@upi`)}
            style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "8px 6px", cursor: "pointer",
              color: "#A8A3C7", fontSize: 11, fontWeight: 500,
              transition: "all 0.15s"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(108,99,255,0.15)"; e.currentTarget.style.color = "#9D97FF"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#A8A3C7"; }}
          >{app}</button>
        ))}
      </div>
    </div>
  );
}

// ── Net Banking form ──
function NetBankingForm({ bank, setBank }) {
  return (
    <div>
      <label style={labelStyle}>Select Your Bank</label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {BANKS.map(b => (
          <button key={b.code} type="button" onClick={() => setBank(b.code)}
            style={{
              background: bank === b.code ? "rgba(108,99,255,0.2)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${bank === b.code ? "rgba(108,99,255,0.5)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8, padding: "10px 12px",
              color: bank === b.code ? "#9D97FF" : "#A8A3C7",
              fontSize: 13, cursor: "pointer", textAlign: "left",
              fontWeight: bank === b.code ? 600 : 400,
              transition: "all 0.15s"
            }}>
            {b.name}
          </button>
        ))}
      </div>
      <select
        value={bank} onChange={e => setBank(e.target.value)}
        style={{ ...inputStyle, color: "#A8A3C7" }}
      >
        <option value="">-- More banks --</option>
        {["Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank", "IndusInd Bank", "Federal Bank"].map(b => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
    </div>
  );
}

// ── Loading state ──
function LoadingState({ message, sub }) {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center" }}>
      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        border: "3px solid rgba(108,99,255,0.2)",
        borderTopColor: "#6C63FF",
        animation: "spin 0.8s linear infinite",
        margin: "0 auto 20px"
      }} />
      <div style={{ fontWeight: 600, fontSize: 15, color: "#F1F0FF", marginBottom: 6 }}>{message}</div>
      {sub && <div style={{ fontSize: 12, color: "#6E6A8A" }}>{sub}</div>}
    </div>
  );
}

// ── Success state ──
function SuccessState({ course, onContinue }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "rgba(107,203,119,0.15)", border: "2px solid #6BCB77",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px", fontSize: 32
      }}>
        <FiCheck size={32} style={{ color: "#6BCB77" }} />
      </div>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.3rem", color: "#F1F0FF", marginBottom: 8 }}>
        Payment Successful!
      </h2>
      <p style={{ color: "#A8A3C7", fontSize: 14, marginBottom: 6 }}>
        You're now enrolled in
      </p>
      <p style={{ color: "#F1F0FF", fontWeight: 600, fontSize: 15, marginBottom: 32 }}>
        {course.title}
      </p>
      <button onClick={onContinue} style={{
        width: "100%", padding: "14px",
        background: "linear-gradient(135deg, #6C63FF, #9D97FF)",
        border: "none", borderRadius: 12, cursor: "pointer",
        color: "#fff", fontWeight: 700, fontSize: 16,
        fontFamily: "var(--font-display)"
      }}>
        Start Learning →
      </button>
    </div>
  );
}

// ── Failed state ──
function FailedState({ error, onRetry, onClose }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "rgba(255,107,107,0.12)", border: "2px solid #FF6B6B",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px"
      }}>
        <FiAlertCircle size={32} style={{ color: "#FF6B6B" }} />
      </div>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem", color: "#F1F0FF", marginBottom: 10 }}>
        Payment Failed
      </h2>
      <p style={{ color: "#FF6B6B", fontSize: 13, marginBottom: 28, padding: "0 16px", lineHeight: 1.6 }}>
        {error || "Something went wrong. Please try again."}
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onClose} style={{
          flex: 1, padding: "12px",
          background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10, cursor: "pointer", color: "#A8A3C7",
          fontWeight: 500, fontSize: 14
        }}>Cancel</button>
        <button onClick={onRetry} style={{
          flex: 1, padding: "12px",
          background: "linear-gradient(135deg, #6C63FF, #9D97FF)",
          border: "none", borderRadius: 10, cursor: "pointer",
          color: "#fff", fontWeight: 600, fontSize: 14
        }}>Try Again</button>
      </div>
    </div>
  );
}

// ── Shared styles ──
const inputStyle = {
  width: "100%", padding: "11px 14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, color: "#F1F0FF",
  fontSize: 14, outline: "none",
  transition: "border-color 0.15s"
};

const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "#A8A3C7", marginBottom: 7, letterSpacing: "0.03em"
};
