import { useState } from "react";
import { Activity } from "lucide-react";

interface LoginProps {
  onLogin: (user: { name: string; email: string }) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handle = () => {
    if (!form.email || !form.password) {
      setError("Please fill all fields");
      return;
    }
    if (isSignup && !form.name) {
      setError("Please enter your name");
      return;
    }
    // Simple local auth — in production connect to real backend
    const users = JSON.parse(localStorage.getItem("fs_users") || "[]");
    if (isSignup) {
      if (users.find((u: any) => u.email === form.email)) {
        setError("Email already registered");
        return;
      }
      users.push({ name: form.name, email: form.email, password: form.password });
      localStorage.setItem("fs_users", JSON.stringify(users));
      onLogin({ name: form.name, email: form.email });
    } else {
      const user = users.find((u: any) => u.email === form.email && u.password === form.password);
      if (!user) {
        setError("Invalid email or password");
        return;
      }
      onLogin({ name: user.name, email: user.email });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center">
            <Activity className="w-5 h-5 text-card" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">FinSight</h1>
            <p className="text-xs text-muted-foreground font-body">Stock Anomaly Intelligence</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <h2 className="font-display text-xl font-semibold text-foreground mb-1">
            {isSignup ? "Create account" : "Welcome back"}
          </h2>
          <p className="text-sm text-muted-foreground font-body mb-6">
            {isSignup ? "Start detecting market anomalies" : "Sign in to your dashboard"}
          </p>

          <div className="space-y-4">
            {isSignup && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ranga Srinidhi"
                  className="mt-1.5 w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors font-body"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="mt-1.5 w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors font-body"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                onKeyDown={e => e.key === "Enter" && handle()}
                className="mt-1.5 w-full bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors font-body"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              onClick={handle}
              className="w-full gradient-accent text-card font-medium text-sm rounded-lg py-2.5 hover:opacity-90 transition-opacity font-body mt-2"
            >
              {isSignup ? "Create Account" : "Sign In"}
            </button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6 font-body">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => { setIsSignup(!isSignup); setError(""); }}
              className="text-primary hover:underline font-medium"
            >
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>

        {/* Demo hint */}
        <p className="text-center text-xs text-muted-foreground mt-4 font-body">
          Demo: sign up with any email/password to get started
        </p>
      </div>
    </div>
  );
};

export default Login;