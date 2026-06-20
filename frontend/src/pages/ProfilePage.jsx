import { useEffect, useState, useRef } from "react";
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
  const [photoPreview, setPhotoPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setUsername(user.username || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
    setPermanentAddress(user.permanent_address || "");
    setTemporaryAddress(user.temporary_address || "");
  }, [user]);

  const handlePhotoSelect = (file) => {
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("");
      showToast("Only JPG, JPEG, and PNG images are allowed", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setMessage("");
      showToast("Image size must be less than 5MB", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
      setPhotoFile(file);
    };
    reader.readAsDataURL(file);
  };

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

    setUploading(true);
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
      setPhotoFile(null);
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      setMessage(e.message);
      showToast(e.message, "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-card">
      <PageHeader title="My Profile" subtitle="Update your information and avatar." />

      {message && <p className={message.includes("success") ? "success" : "notice"}>{message}</p>}

      <div className="profile-grid">
        <div className="profile-avatar-box">
          <div className="profile-image-container">
            {photoPreview ? (
              <img className="profile-avatar" src={photoPreview} alt="Preview" />
            ) : user.profile_photo ? (
              <img className="profile-avatar" src={user.profile_photo} alt="Profile" />
            ) : (
              <div className="avatar-placeholder-large">👤</div>
            )}
          </div>
          <p>{user.username}</p>
          <small>{user.role?.toUpperCase()}</small>
          <button 
            className="secondary" 
            onClick={() => fileInputRef.current?.click()}
            style={{ marginTop: "1rem" }}
          >
            📷 Change Profile Picture
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)}
            style={{ display: "none" }}
          />
          {photoFile && (
            <small style={{ color: "var(--success)", marginTop: "0.5rem" }}>
              ✓ Image selected ({(photoFile.size / 1024 / 1024).toFixed(2)} MB)
            </small>
          )}
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
          <button className="primary" onClick={submit} disabled={uploading}>
            {uploading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
