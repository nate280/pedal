import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { data, error } = await signUp(email, password);
        if (error) throw error;
        if (!data.session) {
          toast({
            variant: "success",
            title: "Check your inbox",
            description: "Confirm your email to finish creating the account.",
          });
        }
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: mode === "signin" ? "Sign in failed" : "Sign up failed",
        description: err.message ?? "Something went wrong.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background bg-glow px-6">
      {/* ambient accent orb */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={36} className="mb-5" />
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Keep every bike on the floor rolling.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card/80 p-6 shadow-2xl backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@studio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "signin" ? "Sign in" : "Create account"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New to Pedal?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() =>
              setMode((m) => (m === "signin" ? "signup" : "signin"))
            }
            className="font-medium text-brand transition-opacity hover:opacity-80"
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
