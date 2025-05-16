"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function StaticSetupPage() {
  const searchParams = useSearchParams();
  const [setupUrl, setSetupUrl] = useState("/setup-wizard");

  useEffect(() => {
    // Check if there's user data in the URL
    const userDataParam = searchParams.get("userData");
    if (userDataParam) {
      // Pass the user data to the setup wizard
      setSetupUrl(`/setup-wizard?userData=${userDataParam}`);

      // Also store the user data in localStorage for later use
      try {
        const userData = JSON.parse(decodeURIComponent(userDataParam));
        localStorage.setItem("userData", JSON.stringify(userData));
      } catch (err) {
        console.error("Error processing URL parameters:", err);
      }
    }
  }, [searchParams]);

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        Setup Wizard
      </h1>
      <p style={{ textAlign: "center", marginBottom: "30px" }}>
        Please use the following link to access the setup wizard:
      </p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <a
          href={setupUrl}
          style={{
            display: "inline-block",
            padding: "10px 20px",
            backgroundColor: "#3b82f6",
            color: "white",
            borderRadius: "5px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Go to Setup Wizard
        </a>
      </div>
      <div style={{ marginTop: "30px", textAlign: "center" }}>
        <p>
          If you're experiencing issues with the setup wizard, try clearing your
          browser cache and cookies.
        </p>
      </div>
    </div>
  );
}
