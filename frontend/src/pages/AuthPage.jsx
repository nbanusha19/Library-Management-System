import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { api } from "../api";

export function LoginPage({ onLogin, message, showToast }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      const msg = "Username and password are required.";
      setError(msg);
      showToast(msg, "warning");
      return;
    }
    try {
      const res = await api.login(username.trim(), password.trim());
      showToast(`Welcome, ${res.user.username}!`, "success");
      onLogin(res.user);
    } catch (e) {
      setError(e.message);
      showToast(e.message, "error");
    }
  };

  return (
    <div className="page-card auth-card">
      <PageHeader title="Login" subtitle="Access the library portal." />
      {message && <p className="notice">{message}</p>}
      {error && <p className="error">{error}</p>}
      <div className="form-group">
        <label>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="primary" onClick={submit}>Login</button>
    </div>
  );
}

export function RegisterPage({ onRegister, message, showToast }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [temporaryAddress, setTemporaryAddress] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      const msg = "Enter valid number";
      setError(msg);
      showToast(msg, "warning");
      return;
    }

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
      setError(e.message);
      showToast(e.message, "error");
    }
  };

  return (
    <div className="page-card auth-card">
      <PageHeader title="Register" subtitle="Create an account to borrow books." />
      {message && <p className="notice">{message}</p>}
      {success && <p className="success">{success}</p>}
      {error && <p className="error">{error}</p>}
      <div className="form-group">
        <label>Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Phone</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Permanent Address</label>
        <textarea value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} rows={3} />
      </div>
      <div className="form-group">
        <label>Temporary Address</label>
        <textarea value={temporaryAddress} onChange={(e) => setTemporaryAddress(e.target.value)} rows={2} />
      </div>
      <div className="form-group">
        <label>Profile Photo</label>
        <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="primary" onClick={submit}>Register</button>
    </div>
  );
}
