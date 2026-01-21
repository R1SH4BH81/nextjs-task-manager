"use client";
import { useEffect, useState } from "react";
import { hasTokens, register } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    if (hasTokens()) router.replace("/dashboard");
  }, [router]);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(email, name, password);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="grid" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="card">
        <h1 style={{ fontSize: 22, marginBottom: 10 }}>Create account</h1>
        {error && (
          <div className="tag" style={{ marginBottom: 10 }}>
            {error}
          </div>
        )}
        <form className="grid" onSubmit={onSubmit}>
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <a className="btn" href="/login">
          Already have an account? Login
        </a>
        <a className="btn" href="/">
          Back
        </a>
      </div>
    </div>
  );
}
