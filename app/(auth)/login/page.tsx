"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setErrors({});
    setPending(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        if (data.error) setError(data.error);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-fg">Welcome back</h1>
          <p className="mt-2 text-sm text-fg-muted">Sign in to Pulse</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-fg-subtle">Email</label>
            <input
              id="email" name="email" type="email" placeholder="you@example.com" required
              className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm text-fg placeholder:text-fg-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              style={{ borderColor: "var(--border-strong)", background: "var(--bg-input)" }}
            />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email[0]}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-fg-subtle">Password</label>
            <input
              id="password" name="password" type="password" placeholder="••••••••" required
              className="mt-1 w-full rounded-lg border px-4 py-2.5 text-sm text-fg placeholder:text-fg-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              style={{ borderColor: "var(--border-strong)", background: "var(--bg-input)" }}
            />
            {errors.password && <p className="mt-1 text-xs text-danger">{errors.password[0]}</p>}
          </div>

          {error && <p className="text-center text-sm text-danger">{error}</p>}

          <button
            type="submit" disabled={pending}
            className="w-full rounded-full bg-brand px-4 py-2.5 font-semibold text-brand-on transition hover:bg-brand-hover disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-fg-muted">
          Don't have an account?{" "}
          <Link href="/signup" className="font-medium text-brand hover:text-brand-hover">Sign up</Link>
        </p>
      </div>
    </div>
  );
}