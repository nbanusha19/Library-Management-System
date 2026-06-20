import { useState, useRef, useEffect } from "react";
import { api } from "../api";

export default function ProfileModal({ user, onUpdate, onClose, showToast }) {
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [password, setPassword] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setUsername(user?.username || "");
    setEmail(user?.email || "");
    setPhone(user?.phone || "");
    setError("");
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
      setError("Only JPG, JPEG, and PNG images are allowed");
      showToast("Only JPG, JPEG, and PNG images are allowed", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError("Image size must be less than 5MB");
      showToast("Image size must be less than 5MB", "error");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
      setPhotoFile(file);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !email.trim() || !phone.trim()) {
      const msg = "Username, email, and phone are required.";
      setError(msg);
      showToast(msg, "warning");
      return;
    }

    const phoneDigits = phone.trim().replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      const msg = "Enter valid phone number";
      setError(msg);
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
    if (photoFile) {
      formData.append("profile_photo", photoFile);
    }

    try {
      const updated = await api.updateProfile(formData);
      onUpdate(updated);
      localStorage.setItem("lms_auth", JSON.stringify(updated));
      showToast("Profile updated successfully", "success");
      onClose();
    } catch (e) {
      const errorMsg = e.message || "Failed to update profile";
      setError(errorMsg);
      showToast(errorMsg, "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-profile" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Profile</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Profile Image Section */}
          <div className="profile-image-section">
            <div className="profile-image-display">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="modal-profile-img" />
              ) : user?.profile_photo ? (
                <img src={user.profile_photo} alt="Current" className="modal-profile-img" />
              ) : (
                <div className="modal-avatar-placeholder">👤</div>
              )}
            </div>
            <button
              type="button"
              className="btn-change-photo"
              onClick={() => fileInputRef.current?.click()}
            >
              📷 Change Picture
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={(e) => handlePhotoSelect(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            {photoFile && (
              <small className="photo-size-info">
                ✓ Selected ({(photoFile.size / 1024 / 1024).toFixed(2)} MB)
              </small>
            )}
            <small className="photo-hint">JPG, JPEG, or PNG • Max 5MB</small>
          </div>

          {error && <div className="error-box">{error}</div>}

          {/* Form Fields */}
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>New Password (Optional)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
            />
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              type="button"
              className="secondary"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary"
              disabled={uploading}
            >
              {uploading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
