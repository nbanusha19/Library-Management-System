import { useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = JSON.parse(localStorage.getItem("lms_auth") || "null");
    if (auth) {
      setUser(auth);
    }
  }, []);

  return { user };
}
