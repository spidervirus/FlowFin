"use client";

import { useEffect } from "react";

interface StoreUserDataProps {
  userId: string;
}

export default function StoreUserData({ userId }: StoreUserDataProps) {
  useEffect(() => {
    if (userId) {
      // Store the user ID in localStorage for components that need it
      localStorage.setItem("currentUserId", userId);
      
      // Also store in userData format for compatibility with existing code
      const userData = {
        user: {
          id: userId
        }
      };
      localStorage.setItem("userData", JSON.stringify(userData));
      
      console.log("User ID stored in localStorage:", userId);
    }
  }, [userId]);

  // This component doesn't render anything visible
  return null;
} 