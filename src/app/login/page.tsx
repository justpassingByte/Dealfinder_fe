"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
            router.push("/");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Login failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Navbar />
            <main className="container">
                <section className="auth-page">
                    <div className="auth-card">
                        <div className="auth-header">
                            <h1>Welcome Back</h1>
                            <p>Sign in to your DealFinder account</p>
                        </div>

                        {error && <div className="auth-error">{error}</div>}

                        <form onSubmit={handleSubmit} className="auth-form" id="login-form">
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="form-input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    id="password"
                                    type="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn-primary btn-full"
                                disabled={loading}
                                id="login-submit-btn"
                            >
                                {loading ? "Signing In…" : "Sign In"}
                            </button>
                        </form>

                        <p className="auth-footer">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="auth-link">
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </section>
            </main>
        </>
    );
}
