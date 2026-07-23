import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Deterministic soap bubble config (no random per render)
const SOAP_BUBBLES = [
  { size: 85,  left:  '4%',  dur: 14, delay:  0,  hue: 200 },
  { size: 50,  left: '11%',  dur: 19, delay: -6,  hue: 280 },
  { size: 110, left: '18%',  dur: 23, delay: -12, hue: 320 },
  { size: 38,  left: '28%',  dur: 12, delay: -3,  hue: 160 },
  { size: 65,  left: '40%',  dur: 17, delay: -8,  hue: 240 },
  { size: 92,  left: '52%',  dur: 21, delay: -15, hue: 180 },
  { size: 44,  left: '62%',  dur: 13, delay: -2,  hue: 300 },
  { size: 76,  left: '72%',  dur: 26, delay: -19, hue: 220 },
  { size: 58,  left: '81%',  dur: 16, delay: -9,  hue: 260 },
  { size: 100, left: '89%',  dur: 20, delay: -5,  hue: 340 },
  { size: 42,  left: '95%',  dur: 11, delay: -14, hue: 190 },
  { size: 70,  left:  '7%',  dur: 24, delay: -10, hue: 310 },
  { size: 55,  left: '35%',  dur: 18, delay: -16, hue: 250 },
  { size: 82,  left: '76%',  dur: 15, delay: -7,  hue: 170 },
  { size: 33,  left: '47%',  dur: 22, delay: -4,  hue: 290 },
];

export default function Login({ onLogin, onRegister }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError]       = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
  const savedEmail = localStorage.getItem("rememberEmail");
  const savedPassword = localStorage.getItem("rememberPassword");

  if (savedEmail && savedPassword) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmail(savedEmail);
    setPassword(savedPassword);
    setRemember(true);
  }
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (isSignUp) {
      if (!name.trim())     { setError("Please enter your name."); return; }
      if (!email.trim())    { setError("Please enter your email address."); return; }
      if (!password)        { setError("Please enter a password."); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
      
      setLoading(true);
      await new Promise((r) => setTimeout(r, 800));
      const res = await onRegister(name.trim(), email.trim(), password);
      setLoading(false);

      if (res.success) {
        if (remember) {
          localStorage.setItem("rememberEmail", email);
          localStorage.setItem("rememberPassword", password);
        } else {
          localStorage.removeItem("rememberEmail");
          localStorage.removeItem("rememberPassword");
        }

        setName("");
        setPassword("");
        setIsSignUp(false);
        setSuccessMessage("Account created successfully. Please log in.");
      } else {
        setError(res.error || "Failed to register. Please try again.");
      }
    } else {
      if (!email.trim())    { setError("Please enter your email address."); return; }
      if (!password)        { setError("Please enter your password."); return; }
      
      setLoading(true);
      await new Promise((r) => setTimeout(r, 700));
      const res = await onLogin(email.trim(), password);
      setLoading(false);

      if (res.success) {
        navigate("/dashboard");
      } else {
        setError(res.error || "Incorrect email or password. Please try again.");
      }
    }
  };

  const handleToggleMode = (e) => {
    e.preventDefault();
    setIsSignUp(!isSignUp);
    setError("");
    setSuccessMessage("");
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Root ── */
        .lp-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eef0f8;
          font-family: 'Inter', sans-serif;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        /* ── Soap Bubble Background ── */
        .lp-soap-layer {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .lp-soap {
          position: absolute;
          bottom: -120px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.82);
          box-shadow:
            inset 0 0 18px rgba(255,255,255,0.65),
            inset -3px -3px 10px rgba(160,200,255,0.35),
            inset  3px  3px 10px rgba(255,160,220,0.2),
            0 4px 18px rgba(120,100,200,0.08);
          animation: soapRise linear infinite, soapShimmer ease-in-out infinite;
        }
        .lp-soap::before {
          content: '';
          position: absolute;
          top: 14%;
          left: 20%;
          width: 35%;
          height: 22%;
          border-radius: 50%;
          background: rgba(255,255,255,0.7);
          filter: blur(3px);
          transform: rotate(-30deg);
        }
        .lp-soap::after {
          content: '';
          position: absolute;
          bottom: 18%;
          right: 16%;
          width: 18%;
          height: 12%;
          border-radius: 50%;
          background: rgba(255,255,255,0.45);
          filter: blur(2px);
        }
        @keyframes soapRise {
          0%   { transform: translateY(0)      translateX(0)     scale(1);    opacity: 0;    }
          8%   { opacity: 0.72; }
          92%  { opacity: 0.45; }
          100% { transform: translateY(-115vh) translateX(18px)  scale(0.88); opacity: 0;    }
        }
        @keyframes soapShimmer {
          0%,100% { filter: hue-rotate(0deg)   brightness(1);   }
          25%     { filter: hue-rotate(90deg)  brightness(1.06); }
          50%     { filter: hue-rotate(200deg) brightness(1.03); }
          75%     { filter: hue-rotate(300deg) brightness(1.05); }
        }

        /* ── Split Card ── */
        .lp-card {
          position: relative;
          z-index: 1;
          display: flex;
          width: 100%;
          max-width: 900px;
          min-height: 540px;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 22px 22px 60px #c5c8d8, -22px -22px 60px #ffffff;
          background: #eef0f8;
          animation: cardIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(36px) scale(0.97); }
          to   { opacity:1; transform:translateY(0)    scale(1); }
        }

        /* ── LEFT Panel ── */
        .lp-left {
          flex: 1.1;
          padding: 3rem 3rem 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #eef0f8;
        }
        .lp-hello {
          font-size: 2.6rem;
          font-weight: 800;
          color: #1e1b4b;
          letter-spacing: -1px;
          line-height: 1.1;
          margin-bottom: 0.35rem;
        }
        .lp-hello span.grad {
          background: linear-gradient(135deg, #7c3aed, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .lp-subhead {
          font-size: 0.95rem;
          color: #6b7280;
          margin-bottom: 1.8rem;
        }
        .lp-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #fff1f1;
          border: 1px solid #fecaca;
          color: #dc2626;
          font-size: 0.8125rem;
          padding: 0.625rem 0.875rem;
          border-radius: 12px;
          margin-bottom: 1rem;
          animation: errShake 0.35s ease;
        }
        @keyframes errShake {
          0%,100%{ transform:translateX(0); }
          25%    { transform:translateX(-7px); }
          75%    { transform:translateX(7px); }
        }
        .lp-field { display:flex; flex-direction:column; gap:0.4rem; margin-bottom:1.125rem; }
        .lp-label {
          font-size: 0.76rem;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .lp-input-wrap { position:relative; display:flex; align-items:center; }
        .lp-input-icon {
          position:absolute; left:1rem;
          color: #9ca3af;
          display:flex; pointer-events:none;
          transition: color 0.2s;
        }
        .lp-input {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 2.85rem;
          font-size: 0.9375rem;
          font-family: 'Inter', sans-serif;
          color: #1e1b4b;
          background: #eef0f8;
          border: none;
          border-radius: 14px;
          outline: none;
          box-shadow: inset 6px 6px 12px #d0d2e0, inset -6px -6px 12px #ffffff;
          transition: box-shadow 0.25s;
        }
        .lp-input::placeholder { color: #b0b4c4; }
        .lp-input:focus {
          box-shadow: inset 4px 4px 10px #c3c6d5, inset -4px -4px 10px #ffffff,
                      0 0 0 2.5px rgba(124,58,237,0.35);
        }
        .lp-input-wrap:focus-within .lp-input-icon { color: #7c3aed; }
        .lp-eye-btn {
          position:absolute; right:0.875rem;
          background:none; border:none; cursor:pointer;
          color: #9ca3af; display:flex; padding:0;
          transition: color 0.2s;
        }
        .lp-eye-btn:hover { color: #7c3aed; }
        .lp-options {
          display:flex; align-items:center;
          justify-content:space-between;
          margin-bottom: 1.5rem;
          font-size: 0.8125rem;
        }
        .lp-remember {
          display:flex; align-items:center; gap:0.5rem;
          color: #6b7280; cursor:pointer; user-select:none;
        }
        .lp-remember input[type="checkbox"] {
          width:15px; height:15px; accent-color:#7c3aed; cursor:pointer;
        }
        .lp-forgot {
          color:#7c3aed; text-decoration:none;
          font-weight:500; transition:color 0.18s;
        }
        .lp-forgot:hover { color:#3b82f6; }

        /* ── Sign In / Sign Up Button ── */
        .lp-btn {
          width:100%; padding:0.9rem;
          background: linear-gradient(135deg,#7c3aed 0%,#3b82f6 100%);
          color:#fff; font-size:0.875rem; font-weight:700;
          letter-spacing:0.1em; text-transform:uppercase;
          border:none; border-radius:14px; cursor:pointer;
          font-family:'Inter',sans-serif;
          display:flex; align-items:center; justify-content:center; gap:0.5rem;
          box-shadow: 6px 6px 16px rgba(124,58,237,0.35), -2px -2px 10px rgba(255,255,255,0.5);
          transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
          position:relative; overflow:hidden;
        }
        .lp-btn::after {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,0.18),transparent);
          opacity:0; transition:opacity 0.2s;
        }
        .lp-btn:hover:not(:disabled)::after { opacity:1; }
        .lp-btn:hover:not(:disabled) {
          transform:translateY(-2px);
          box-shadow: 8px 10px 24px rgba(124,58,237,0.48), -2px -2px 12px rgba(255,255,255,0.5);
        }
        .lp-btn:active:not(:disabled) { transform:translateY(0); }
        .lp-btn:disabled { opacity:0.7; cursor:not-allowed; }
        .lp-spinner {
          width:18px; height:18px;
          border:2.5px solid rgba(255,255,255,0.4);
          border-top-color:#fff; border-radius:50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        .lp-create {
          text-align:center; margin-top:1.25rem;
          font-size:0.8125rem; color:#9ca3af;
        }
        .lp-create a {
          color:#7c3aed; font-weight:600;
          text-decoration:none; margin-left:0.2rem;
          transition:color 0.18s;
          cursor:pointer;
        }
        .lp-create a:hover { color:#3b82f6; }

        /* ── RIGHT Panel ── */
        .lp-right {
          flex: 0.9;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          text-align:center;
          padding:3rem 2.5rem;
          background:linear-gradient(145deg,#7c3aed 0%,#4f46e5 45%,#3b82f6 100%);
          position:relative; overflow:hidden;
        }
        .lp-right::before {
          content:''; position:absolute;
          width:320px; height:320px; border-radius:50%;
          border:60px solid rgba(255,255,255,0.07);
          top:-100px; right:-100px;
        }
        .lp-right::after {
          content:''; position:absolute;
          width:220px; height:220px; border-radius:50%;
          border:45px solid rgba(255,255,255,0.06);
          bottom:-60px; left:-60px;
        }
        /* Soap bubbles inside right panel */
        .lp-right-bubble {
          position:absolute; border-radius:50%;
          border:1px solid rgba(255,255,255,0.4);
          background:
            radial-gradient(circle at 30% 25%, rgba(255,255,255,0.6) 0%, transparent 50%),
            radial-gradient(circle at 70% 75%, rgba(200,220,255,0.2) 0%, transparent 50%);
          box-shadow: inset 0 0 12px rgba(255,255,255,0.3);
          animation: rbFloat ease-in-out infinite;
          pointer-events:none;
        }
        @keyframes rbFloat {
          0%,100% { transform:translateY(0) scale(1); }
          50%     { transform:translateY(-15px) scale(1.04); }
        }
        .rb1 { width:60px; height:60px; bottom:15%; left:10%; animation-duration:5s; }
        .rb2 { width:35px; height:35px; top:20%; right:12%; animation-duration:7s; animation-delay:-2s; }
        .rb3 { width:50px; height:50px; bottom:35%; right:8%;  animation-duration:6s; animation-delay:-4s; }

        .lp-right-inner { position:relative; z-index:1; }
        .lp-right-icon {
          width:80px; height:80px; border-radius:24px;
          background:rgba(255,255,255,0.15);
          backdrop-filter:blur(8px);
          border:1px solid rgba(255,255,255,0.25);
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 1.75rem;
          box-shadow:0 8px 32px rgba(0,0,0,0.2);
          animation:logoPulse 3s ease-in-out infinite;
        }
        @keyframes logoPulse {
          0%,100%{ transform:scale(1); box-shadow:0 8px 32px rgba(0,0,0,0.2); }
          50%    { transform:scale(1.05); box-shadow:0 12px 40px rgba(0,0,0,0.3); }
        }
        .lp-welcome {
          font-size:2rem; font-weight:800; color:#fff;
          letter-spacing:-0.5px; margin-bottom:1rem; line-height:1.2;
        }
        .lp-welcome-sub {
          font-size:0.9rem; color:rgba(255,255,255,0.72);
          line-height:1.65; max-width:240px;
          margin:0 auto 2rem;
        }
        .lp-features {
          display:flex; flex-direction:column; gap:0.75rem;
          text-align:left; width:100%; max-width:220px; margin:0 auto;
        }
        .lp-feat-item {
          display:flex; align-items:center; gap:0.625rem;
          color:rgba(255,255,255,0.88); font-size:0.825rem; font-weight:500;
        }
        .lp-feat-dot {
          width:24px; height:24px; border-radius:50%;
          background:rgba(255,255,255,0.2);
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0;
        }

        /* ── Responsive ── */
        @media(max-width:720px){
          .lp-card{ flex-direction:column-reverse; max-width:440px; min-height:unset; border-radius:22px; }
          .lp-left{ padding:2rem 1.75rem 2.25rem; }
          .lp-right{ padding:2.25rem 1.75rem; }
          .lp-hello{ font-size:2rem; }
          .lp-welcome{ font-size:1.6rem; }
        }
        @media(max-width:420px){
          .lp-left{ padding:1.5rem 1.25rem 2rem; }
          .lp-hello{ font-size:1.75rem; }
        }
      `}</style>

      <div className="lp-root">

        {/* ── Soap Bubble Background Layer ── */}
        <div className="lp-soap-layer">
          {SOAP_BUBBLES.map((b, i) => (
            <div
              key={i}
              className="lp-soap"
              style={{
                width: b.size,
                height: b.size,
                left: b.left,
                animationDuration: `${b.dur}s, ${Math.round(b.dur * 0.4)}s`,
                animationDelay: `${b.delay}s, ${b.delay * 0.5}s`,
                background: `
                  radial-gradient(circle at 30% 25%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.08) 38%, transparent 62%),
                  radial-gradient(circle at 70% 75%, hsla(${b.hue}, 80%, 75%, 0.28) 0%, transparent 55%),
                  radial-gradient(circle at 20% 70%, hsla(${b.hue + 60}, 80%, 75%, 0.18) 0%, transparent 50%)
                `,
              }}
            />
          ))}
        </div>

        <div className="lp-card">
          {/* ── LEFT: Form ── */}
          <div className="lp-left">
            <h1 className="lp-hello">
              {isSignUp ? "Create Account" : "Hello!"} <span className="grad">{isSignUp ? "✨" : "👋"}</span>
            </h1>
            <p className="lp-subhead">
              {isSignUp ? "Register your details to create an account" : "Sign in to your workspace to continue"}
            </p>

            {error && (
              <div className="lp-error" role="alert">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {successMessage && (
              <div className="lp-success" role="status">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {isSignUp && (
                <div className="lp-field animate-fadeIn">
                  <label className="lp-label" htmlFor="lp-name">Full Name</label>
                  <div className="lp-input-wrap">
                    <span className="lp-input-icon">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </span>
                    <input id="lp-name" className="lp-input" type="text"
                      placeholder="John Doe" value={name}
                      onChange={(e) => setName(e.target.value)} autoComplete="name" />
                  </div>
                </div>
              )}

              <div className="lp-field">
                <label className="lp-label" htmlFor="lp-email">Email Address</label>
                <div className="lp-input-wrap">
                  <span className="lp-input-icon">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                  <input id="lp-email" className="lp-input" type="email"
                    placeholder="you@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
              </div>

              <div className="lp-field">
                <label className="lp-label" htmlFor="lp-password">Password</label>
                <div className="lp-input-wrap">
                  <span className="lp-input-icon">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input id="lp-password" className="lp-input"
                    type={showPass ? "text" : "password"}
                    placeholder={isSignUp ? "At least 6 characters" : "Enter your password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                  <button type="button" className="lp-eye-btn"
                    onClick={() => setShowPass(v => !v)}
                    aria-label={showPass ? "Hide password" : "Show password"}>
                    {showPass ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {!isSignUp && (
                <div className="lp-options">
                  <label className="lp-remember">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                    Remember me
                  </label>
                  <a href="#" className="lp-forgot">Forgot password?</a>
                </div>
              )}

              <button id="lp-signin-btn" type="submit" className="lp-btn" disabled={loading}>
                {loading ? <span className="lp-spinner" /> : (
                  <>
                    {isSignUp ? "Sign Up" : "Sign In"}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="lp-create">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
              <a href="#" onClick={handleToggleMode}>
                {isSignUp ? "Sign In instead" : "Create one free"}
              </a>
            </p>
          </div>

          {/* ── RIGHT: Welcome Panel ── */}
          <div className="lp-right">
            <div className="lp-right-bubble rb1" />
            <div className="lp-right-bubble rb2" />
            <div className="lp-right-bubble rb3" />

            <div className="lp-right-inner">
              <div className="lp-right-icon">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <circle cx="15" cy="18" r="7" fill="rgba(255,255,255,0.9)"/>
                  <circle cx="25" cy="23" r="5" fill="rgba(255,255,255,0.7)"/>
                  <circle cx="23" cy="13" r="3.5" fill="rgba(255,255,255,0.5)"/>
                </svg>
              </div>
              <h2 className="lp-welcome">
                {isSignUp ? "Welcome Back!" : "Welcome Back!"}
              </h2>
              <p className="lp-welcome-sub">
                Your workspace is ready. Organize tasks as floating bubbles and stay on top of everything.
              </p>
              <div className="lp-features">
                {["Floating task bubbles","Smart priority sorting","Focus mode & quick filters"].map(f => (
                  <div key={f} className="lp-feat-item">
                    <span className="lp-feat-dot">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}