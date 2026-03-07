"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");

        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            await register(email, password);
            router.push("/");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Registration failed.");
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
                            <h1>Create Account</h1>
                            <p>Join DealFinder and start saving</p>
                        </div>

                        {error && <div className="auth-error">{error}</div>}

                        <form onSubmit={handleSubmit} className="auth-form" id="register-form">
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
                                    placeholder="Min. 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirm">Confirm Password</label>
                                <input
                                    id="confirm"
                                    type="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn-primary btn-full"
                                disabled={loading}
                                id="register-submit-btn"
                            >
                                {loading ? "Creating Account…" : "Sign Up"}
                            </button>
                        </form>

                        <p className="auth-footer">
                            Already have an account?{" "}
                            <Link href="/login" className="auth-link">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </section>
            </main>
        </>
    );
}
