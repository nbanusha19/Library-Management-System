import { useEffect, useState } from "react";
import { api } from "../api";
import { PageHeader } from "../components/PageHeader";

export default function ProfilePage({ user, onUpdate, showToast }) {
  const [username, setUsername] = useState(user.username || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [password, setPassword] = useState("");
  const [permanentAddress, setPermanentAddress] = useState(user.permanent_address || "");
  const [temporaryAddress, setTemporaryAddress] = useState(user.temporary_address || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setUsername(user.username || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
    setPermanentAddress(user.permanent_address || "");
    setTemporaryAddress(user.temporary_address || "");
  }, [user]);

  const submit = async () => {
    setMessage("");
    if (!username.trim() || !email.trim() || !phone.trim()) {
      const msg = "Username, email, and phone are required.";
      setMessage(msg);
      showToast(msg, "warning");
      return;
    }

    const phoneDigits = phone.trim().replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      const msg = "Enter valid number";
      setMessage(msg);
      showToast(msg, "warning");
      return;
    }

    const formData = new FormData();
    formData.append("username", username.trim());
    formData.append("email", email.trim());
    formData.append("phone", phone.trim());
    if (password.trim()) {
      formData.append("password", password.trim());
    }
    formData.append("permanent_address", permanentAddress.trim());
    formData.append("temporary_address", temporaryAddress.trim());
    if (photoFile) {
      formData.append("profile_photo", photoFile);
    }

    try {
      const updated = await api.updateProfile(formData);
      onUpdate(updated);
      localStorage.setItem("lms_auth", JSON.stringify(updated));
      setMessage("Profile updated successfully.");
      showToast("Profile saved", "success");
      setPassword("");
    } catch (e) {
      setMessage(e.message);
      showToast(e.message, "error");
    }
  };

  return (
    <div className="page-card">
      <PageHeader title="My Profile" subtitle="Update your information and avatar." />

      {message && <p className={message.includes("success") ? "success" : "notice"}>{message}</p>}

      <div className="profile-grid">
        <div className="profile-avatar-box">
          {user.profile_photo ? <img className="profile-avatar" src={user.profile_photo} alt="Profile" /> : <div className="avatar-placeholder-large">👤</div>}
          <p>{user.username}</p>
          <small>{user.role?.toUpperCase()}</small>
        </div>

        <div className="profile-fields">
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
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current password" />
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
          <button className="primary" onClick={submit}>Save Profile</button>
        </div>
      </div>
    </div>
  );
}
