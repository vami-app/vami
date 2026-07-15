"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState(/** @type {Record<string,string>} */ ({}));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [user, loading, router]);

  /** @param {string} key @param {string} value */
  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  /** @param {React.FormEvent} e */
  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSubmitting(true);
    try {
      await register(form);
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        const fe = {};
        for (const e2 of err.errors || []) if (e2.field) fe[e2.field] = e2.message;
        setFieldErrors(fe);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-1 text-center font-serif text-3xl font-bold">Join Inkwell</h1>
      <p className="mb-8 text-center text-ink-soft">Create an account to start writing.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Input
          label="Name"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          error={fieldErrors.name}
          placeholder="Ada Lovelace"
        />
        <Input
          label="Username"
          required
          value={form.username}
          onChange={(e) => update("username", e.target.value.toLowerCase())}
          error={fieldErrors.username}
          placeholder="ada"
        />
        <Input
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          error={fieldErrors.email}
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          type="password"
          required
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          error={fieldErrors.password}
          placeholder="At least 8 characters"
        />
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
