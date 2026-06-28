import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import ProfileModal from "./ProfileModal";

export default function ProfilePopup({ user, onClose, showToast, onProfileUpdate, onLogout }) {
  const [showEditForm, setShowEditForm] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const closeTimerRef = useRef(null);

  const getInitial = () => {
    return user?.username ? user.username.charAt(0).toUpperCase() : "👤";
  };

  const getAvatarUrl = () => {
    if (user?.profile_photo && user.profile_photo.includes("http")) {
      return user.profile_photo;
    }
    return null;
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const requestClose = () => {
    setIsVisible(false);
    closeTimerRef.current = window.setTimeout(() => onClose(), 220);
  };

  const handleLogoutClick = () => {
    requestClose();
    onLogout();
  };

  return (
    <>
      <div className={`profile-popup-overlay ${isVisible ? "visible" : "closing"}`} onClick={requestClose} />
      <div className={`profile-popup ${isVisible ? "visible" : "closing"}`}>
        {/* Header with Avatar */}
        <div className="profile-popup-header">
          {getAvatarUrl() ? (
            <img src={getAvatarUrl()} alt={user?.username} className="profile-avatar" />
          ) : (
            <div className="profile-avatar-initial">{getInitial()}</div>
          )}
          <button className="popup-close" onClick={requestClose} aria-label="Close profile menu">✕</button>
        </div>

        {/* Profile Info */}
        <div className="profile-popup-body">
          <h3>{user?.username}</h3>
          <p className="profile-email">{user?.email}</p>
          
          <div className="profile-meta">
            <div className="meta-item">
              <span className="meta-label">Phone:</span>
              <span className="meta-value">{user?.phone || "N/A"}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Role:</span>
              <span className={`meta-value role-badge role-${user?.role}`}>
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </span>
            </div>
            {user?.status && (
              <div className="meta-item">
                <span className="meta-label">Status:</span>
                <span className={`meta-value status-badge status-${user?.status}`}>
                  {user?.status?.charAt(0).toUpperCase() + user?.status?.slice(1)}
                </span>
              </div>
            )}
            {user?.permanent_address && (
              <div className="meta-item">
                <span className="meta-label">Address:</span>
                <span className="meta-value">{user?.permanent_address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="profile-popup-footer">
          <button 
            className="btn-primary"
            onClick={() => setShowEditForm(true)}
          >
            ⚙️ Settings
          </button>
          <button 
            className="btn-danger"
            onClick={handleLogoutClick}
          >
            Logout
          </button>
          <button 
            className="btn-secondary"
            onClick={requestClose}
          >
            Close
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditForm && (
        <ProfileModal 
          user={user}
          onClose={() => setShowEditForm(false)}
          showToast={showToast}
          onUpdate={onProfileUpdate}
        />
      )}
    </>
  );
}
