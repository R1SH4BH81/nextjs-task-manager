"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasTokens } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    if (hasTokens()) {
      router.replace("/dashboard");
    }
  }, [router]);
  return (
    <div className="hero">
      <h1 style={{ fontSize: 28 }}>Manage your tasks efficiently</h1>
      <p className="muted">
        Secure auth, fast list, filtering and quick actions.
      </p>
      <div className="row">
        <a className="btn primary" href="/dashboard">
          Open Dashboard
        </a>
        <a className="btn" href="/login">
          Login
        </a>
        <a className="btn" href="/register">
          Register
        </a>
      </div>
    </div>
  );
}
