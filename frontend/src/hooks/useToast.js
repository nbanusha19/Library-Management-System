import { useContext } from "react";

// Create a simple context for toast notifications
import { createContext } from "react";

export const ToastContext = createContext();

export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    // Fallback if context not available
    return {
      toast: (message, type) => {
        console.log(`[Toast] ${type}: ${message}`);
      },
      showToast: (message, type) => {
        console.log(`[Toast] ${type}: ${message}`);
      },
    };
  }
  
  return context;
}
