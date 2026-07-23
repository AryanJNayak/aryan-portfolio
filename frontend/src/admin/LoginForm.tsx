/**
 * LoginForm (admin).
 *
 * Purpose: Collect admin email/password, validate, and log in via the API.
 *
 * Inputs:  onSuccess (fn) - called after a successful login.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { FiLock } from "react-icons/fi";

import { login } from "@/api/auth";
import { validateLogin } from "@/schemas";
import type { LoginForm as LoginValues } from "@/types/forms";

interface LoginFormProps {
  onSuccess: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [values, setValues] = useState<LoginValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginValues, string>>>({});
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  /** Purpose: Validate then attempt login. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateLogin(values);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    setLoading(true);
    setFailed(false);
    try {
      await login(values);
      onSuccess();
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl p-8 glass"
      >
        <div className="mb-2 flex items-center gap-3">
          <FiLock className="text-2xl text-brand-400" />
          <h1 className="font-heading text-xl font-bold text-slate-100">Admin Login</h1>
        </div>

        <div>
          <input
            className={inputCls}
            placeholder="Email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
          />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
        </div>
        <div>
          <input
            type="password"
            className={inputCls}
            placeholder="Password"
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          />
          {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
        </div>

        {failed && <p className="text-sm text-red-400">Invalid email or password.</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
          {loading ? "Signing in…" : "Sign In"}
        </button>
        <a href="/" className="block text-center text-xs text-slate-500 hover:text-brand-400">
          ← Back to site
        </a>
      </motion.form>
    </div>
  );
}
