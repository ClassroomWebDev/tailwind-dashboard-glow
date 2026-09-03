import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { HoldModal, readHoldNotice, type HoldNotice } from "@/components/HoldModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — Ambassador Hub" },
      {
        name: "description",
        content:
          "Sign in to Ambassador Hub to complete your member profile and reach your coordinator, mentor and support manager.",
      },
      { property: "og:title", content: "Sign in — Ambassador Hub" },
      {
        property: "og:description",
        content: "Secure member access for ambassadors, coordinators and mentors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);
const nameSchema = z.string().trim().min(2, "Enter your full name").max(100);
const mobileSchema = z
  .string()
  .trim()
  .regex(/^(\+?880|0)1[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number");

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [hold, setHold] = useState<HoldNotice | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", mobile: "" });

  useEffect(() => {
    setHold(readHoldNotice());
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const email = emailSchema.parse(form.email);

      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("Password reset link sent. Check your inbox.");
        setMode("login");
        return;
      }

      const password = passwordSchema.parse(form.password);

      if (mode === "signup") {
        const full_name = nameSchema.parse(form.full_name);
        const mobile = mobileSchema.parse(form.mobile);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name, mobile },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm, then sign in.");
        setMode("login");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.sessionStorage.removeItem("account-hold-notice");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      const message =
        err instanceof z.ZodError
          ? (err.issues[0]?.message ?? "Invalid input")
          : err instanceof Error
            ? err.message
            : "Something went wrong";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  if (hold) return <HoldModal notice={hold} />;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-surface-dark p-12 text-surface-dark-foreground lg:flex">
        <span className="font-display text-lg font-semibold">Ambassador Hub</span>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">
            One profile.
            <br />
            One support line.
          </h2>
          <p className="mt-4 max-w-sm text-sm text-surface-dark-foreground/70">
            Keep your member profile at 100% and stay connected with your coordinator, mentor and
            support manager.
          </p>
        </div>
        <p className="text-xs text-surface-dark-foreground/50">Policy compliant member access</p>
      </div>

      <div className="flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {mode === "login" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "forgot"
              ? "We'll email you a secure reset link."
              : "Use your email and password to continue."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {mode === "signup" ? (
              <>
                <Field label="Full name" required>
                  <Input value={form.full_name} onChange={set("full_name")} maxLength={100} required />
                </Field>
                <Field label="Mobile number" required>
                  <Input
                    value={form.mobile}
                    onChange={set("mobile")}
                    placeholder="01XXXXXXXXX"
                    inputMode="tel"
                    required
                  />
                </Field>
              </>
            ) : null}

            <Field label="Email" required>
              <Input type="email" value={form.email} onChange={set("email")} required />
            </Field>

            {mode !== "forgot" ? (
              <Field label="Password" required>
                <Input type="password" value={form.password} onChange={set("password")} required />
              </Field>
            ) : null}

            <Button type="submit" disabled={busy} className="w-full">
              {busy
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : mode === "signup"
                    ? "Create account"
                    : "Send reset link"}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-sm">
            {mode === "login" ? (
              <>
                <button type="button" className="text-primary hover:underline" onClick={() => setMode("forgot")}>
                  Forgot password?
                </button>
                <p className="text-muted-foreground">
                  No account?{" "}
                  <button type="button" className="text-primary hover:underline" onClick={() => setMode("signup")}>
                    Sign up
                  </button>
                </p>
              </>
            ) : (
              <button type="button" className="text-primary hover:underline" onClick={() => setMode("login")}>
                Back to sign in
              </button>
            )}
          </div>

          <Link to="/" className="mt-8 inline-block text-xs text-muted-foreground hover:underline">
            ← Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required ? <span className="ml-0.5 font-bold text-primary">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
