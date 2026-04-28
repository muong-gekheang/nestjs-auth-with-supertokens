"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Session from "supertokens-web-js/recipe/session";

export default function RbpPage() {
  const [result, setResult] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const hasSession = await Session.doesSessionExist();

      if (!hasSession) {
        router.push("/auth");
      }
    };


    checkSession();
  }, []);

  const callAPI = async (action: "read" | "write" | "delete") => {
    try {
      const method =
        action === "read"
          ? "GET"
          : action === "delete"
          ? "DELETE"
          : "POST";

      const res = await fetch(`http://localhost:3000/rbp/${action}`, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const err = await res.json();
        setResult(`Error: ${err.message || res.statusText}`);
        return;
      }

      const data = await res.json();
      setResult(data.message);
    } catch (err) {
      setResult("Error: Could not reach the backend.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>RBAC Test Page</h2>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => callAPI("read")}>READ</button>
        <button onClick={() => callAPI("write")}>WRITE</button>
        <button onClick={() => callAPI("delete")}>DELETE</button>
      </div>

      <hr />

      <h3>Result:</h3>
      <p>{result}</p>
    </div>
  );
}