"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Erro ao fazer login");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid-bg flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            🚴
          </div>
          <h1 className="font-bold text-xl" style={{ color: "var(--text-primary)" }}>S2 Bike</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Dashboard · Meta Ads & CRM</p>
        </div>

        {/* Form */}
        <div className="card p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-2"
                style={{ color: "var(--text-muted)" }}>
                Usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="seu usuário"
                autoComplete="username"
                required
                className="w-full text-sm px-4 py-3 rounded-lg outline-none transition-colors"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border-bright)",
                  color: "var(--text-primary)",
                }}
                onFocus={e => e.target.style.borderColor = "var(--accent-blue)"}
                onBlur={e => e.target.style.borderColor = "var(--border-bright)"}
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-2"
                style={{ color: "var(--text-muted)" }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full text-sm px-4 py-3 rounded-lg outline-none transition-colors"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border-bright)",
                  color: "var(--text-primary)",
                }}
                onFocus={e => e.target.style.borderColor = "var(--accent-blue)"}
                onBlur={e => e.target.style.borderColor = "var(--border-bright)"}
              />
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{
                color: "#ef4444",
                background: "#ef444422",
                border: "1px solid #ef444444",
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-medium text-sm transition-all"
              style={{
                background: loading ? "var(--border-bright)" : "var(--accent-blue)",
                color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                border: "none",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
          S2 Bike Shop Piracicaba · {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
