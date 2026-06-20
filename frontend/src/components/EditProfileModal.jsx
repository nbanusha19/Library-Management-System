import { useState } from "react";
import { api } from "../api";

export default function EditProfileModal({ user, onClose, showToast, onProfileUpdate }) {
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
    permanent_address: user?.permanent_address || "",
    temporary_address: user?.temporary_address || "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validation
      if (!formData.username || !formData.email || !formData.phone) {
        throw new Error("Username, email, and phone are required");
      }

      // Validate phone
      const phoneDigits = formData.phone.replace(/\D/g, "");
      if (phoneDigits.length !== 10) {
        throw new Error("Phone number must be exactly 10 digits");
      }

      // Validate password if provided
      if (formData.password) {
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
      }

      // Build update object
      const updateData = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        permanent_address: formData.permanent_address || null,
        temporary_address: formData.temporary_address || null,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await api.updateProfile(updateData);
      
      if (showToast) {
        showToast("Profile updated successfully", "success");
      }

      // Update parent with new profile data
      if (onProfileUpdate && response.profile) {
        onProfileUpdate(response.profile);
      }

      onClose();
    } catch (err) {
      const errorMsg = err.message || "Failed to update profile";
      setError(errorMsg);
      if (showToast) {
        showToast(errorMsg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Profile</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-profile-form">
          {error && <div className="form-error">{error}</div>}

          {/* Username */}
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Your username"
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your@email.com"
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="10-digit phone number"
            />
          </div>

          {/* Permanent Address */}
          <div className="form-group">
            <label>Permanent Address</label>
            <textarea
              name="permanent_address"
              value={formData.permanent_address}
              onChange={handleChange}
              placeholder="Your permanent address"
              rows="3"
            />
          </div>

          {/* Temporary Address */}
          <div className="form-group">
            <label>Temporary Address</label>
            <textarea
              name="temporary_address"
              value={formData.temporary_address}
              onChange={handleChange}
              placeholder="Your temporary address"
              rows="3"
            />
          </div>

          {/* Password Change */}
          <div className="form-separator">
            <p>Leave empty to keep your current password</p>
          </div>

          <div className="form-group">
            <label>New Password (Optional)</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="New password"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
            />
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
