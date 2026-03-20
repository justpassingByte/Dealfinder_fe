"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";

const getApiUrl = () => {
    // In production client-side, ALWAYS use relative path to leverage Next.js rewrites/proxy
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
        return "";
    }
    let url = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_INTERNAL_API_URL;
    if (!url) {
        if (process.env.NODE_ENV === "development") {
            url = "http://localhost:4000";
        } else {
            url = "";
        }
    }
    return url.replace(/\/api\/?$/, "").replace(/\/$/, "");
};

const API = getApiUrl();

interface User {
    id: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // On mount, check for stored token
    useEffect(() => {
        const stored = localStorage.getItem("df_token");
        if (stored) {
            setToken(stored);
            fetchMe(stored);
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchMe = async (t: string) => {
        try {
            const res = await fetch(`${API}/api/auth/me`, {
                headers: { Authorization: `Bearer ${t}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUser({ id: data.id, email: data.email });
            } else {
                localStorage.removeItem("df_token");
                setToken(null);
            }
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    const login = useCallback(async (email: string, password: string) => {
        const res = await fetch(`${API}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("df_token", data.token);
    }, []);

    const register = useCallback(async (email: string, password: string) => {
        const res = await fetch(`${API}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("df_token", data.token);
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("df_token");
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
