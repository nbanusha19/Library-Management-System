import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { api } from "../api";

export function LoginPage({ onLogin, onSwitchMode, message, showToast }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      const msg = "Username and password are required.";
      setError(msg);
      showToast(msg, "warning");
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.login(username.trim(), password.trim());
      showToast(`Welcome, ${res.user.username}!`, "success");
      onLogin(res.user);
    } catch (e) {
      const errorMsg = e.message || "Failed to log in. Please try again.";
      setError(errorMsg);
      showToast(errorMsg, "error");
      console.error("[Login Error]", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      submit();
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <div className="auth-card">
          <div className="auth-tabs">
            <button 
              className="auth-tab active" 
              onClick={() => onSwitchMode("login")}
            >
              Login
            </button>
            <button 
              className="auth-tab" 
              onClick={() => onSwitchMode("register")}
            >
              Register
            </button>
          </div>
          
          <PageHeader title="Login" subtitle="Access the library portal." />
          {message && <p className="notice">{message}</p>}
          {error && <p className="error">{error}</p>}
          <div className="form-group">
            <label>Username</label>
            <input 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              placeholder="Enter your username"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              placeholder="Enter your password"
            />
          </div>
          <button className="primary" onClick={submit} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          
          <div className="auth-footer">
            <p>Don't have an account? <button className="auth-link" onClick={() => onSwitchMode("register")}>Register</button></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage({ onRegister, onSwitchMode, message, showToast }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [temporaryAddress, setTemporaryAddress] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setSuccess("");
    if (!username.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      const msg = "All required fields must be filled.";
      setError(msg);
      showToast(msg, "warning");
      return;
    }

    const phoneDigits = phone.trim().replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      const msg = "Phone number must be 10 digits.";
      setError(msg);
      showToast(msg, "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await api.register(
        username.trim(),
        email.trim(),
        phone.trim(),
        password.trim(),
        permanentAddress.trim(),
        temporaryAddress.trim(),
        photoFile
      );
      setSuccess(res.message);
      showToast("Registration successful! Your account is approved.", "success");
      onRegister(res.message);
    } catch (e) {
      const errorMsg = e.message || "Registration failed. Please try again.";
      setError(errorMsg);
      showToast(errorMsg, "error");
      console.error("[Registration Error]", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper register-wrapper">
        <div className="auth-card register-card">
          <div className="auth-tabs">
            <button 
              className="auth-tab" 
              onClick={() => onSwitchMode("login")}
            >
              Login
            </button>
            <button 
              className="auth-tab active" 
              onClick={() => onSwitchMode("register")}
            >
              Register
            </button>
          </div>
          
          <PageHeader title="Register" subtitle="Create an account to borrow books." />
          {message && <p className="notice">{message}</p>}
          {success && <p className="success">{success}</p>}
          {error && <p className="error">{error}</p>}
          <div className="form-group">
            <label>Username</label>
            <input 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              placeholder="Choose a username"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="your@email.com"
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              placeholder="10-digit phone number"
            />
          </div>
          <div className="form-group">
            <label>Permanent Address</label>
            <textarea 
              value={permanentAddress} 
              onChange={(e) => setPermanentAddress(e.target.value)}
              disabled={loading}
              rows={3}
              placeholder="Enter your permanent address"
            />
          </div>
          <div className="form-group">
            <label>Temporary Address</label>
            <textarea 
              value={temporaryAddress} 
              onChange={(e) => setTemporaryAddress(e.target.value)}
              disabled={loading}
              rows={2}
              placeholder="Enter your temporary address"
            />
          </div>
          <div className="form-group">
            <label>Profile Photo (Optional)</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="Minimum 6 characters"
            />
          </div>
          <button className="primary" onClick={submit} disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
          
          <div className="auth-footer">
            <p>Already have an account? <button className="auth-link" onClick={() => onSwitchMode("login")}>Login</button></p>
          </div>
        </div>
      </div>
    </div>
  );
}
