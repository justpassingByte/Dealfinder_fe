"use client";

import { FormEvent, useEffect, useState } from "react";
import { ScraperProfile } from "@/lib/scraperProfiles";

interface Props {
    mode: "create" | "edit";
    initialProfile?: ScraperProfile | null;
    submitting?: boolean;
    onCancel?: () => void;
    onSubmit: (payload: ScraperProfileFormPayload) => Promise<void> | void;
}

export interface ScraperProfileFormPayload {
    displayName: string;
    assignedWorkerId: string;
    profileMountName: string;
    containerProfilePath: string;
    browserHost: string;
    browserPort: number;
    browserTargetPort: number;
    debugTunnelPort: number | null;
    defaultWarmupQuery: string;
    notes: string;
}

interface FormState {
    displayName: string;
    assignedWorkerId: string;
    profileMountName: string;
    containerProfilePath: string;
    browserHost: string;
    browserPort: string;
    browserTargetPort: string;
    debugTunnelPort: string;
    defaultWarmupQuery: string;
    notes: string;
}

function buildInitialState(profile?: ScraperProfile | null): FormState {
    return {
        displayName: profile?.displayName ?? "",
        assignedWorkerId: profile?.assignedWorkerId ?? "",
        profileMountName: profile?.profileMountName ?? "",
        containerProfilePath: profile?.containerProfilePath ?? "/app/shopee_user_profile",
        browserHost: profile?.browserHost ?? "127.0.0.1",
        browserPort: String(profile?.browserPort ?? 9222),
        browserTargetPort: String(profile?.browserTargetPort ?? 9223),
        debugTunnelPort: profile?.debugTunnelPort ? String(profile.debugTunnelPort) : "",
        defaultWarmupQuery: typeof profile?.metadata?.defaultWarmupQuery === "string"
            ? profile.metadata.defaultWarmupQuery
            : "",
        notes: profile?.notes ?? "",
    };
}

export default function ScraperProfileForm({ mode, initialProfile, submitting = false, onCancel, onSubmit }: Props) {
    const [form, setForm] = useState<FormState>(() => buildInitialState(initialProfile));

    useEffect(() => {
        setForm(buildInitialState(initialProfile));
    }, [initialProfile]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await onSubmit({
            displayName: form.displayName.trim(),
            assignedWorkerId: form.assignedWorkerId.trim(),
            profileMountName: form.profileMountName.trim(),
            containerProfilePath: form.containerProfilePath.trim(),
            browserHost: form.browserHost.trim(),
            browserPort: Number(form.browserPort),
            browserTargetPort: Number(form.browserTargetPort),
            debugTunnelPort: form.debugTunnelPort.trim() ? Number(form.debugTunnelPort) : null,
            defaultWarmupQuery: form.defaultWarmupQuery.trim(),
            notes: form.notes.trim(),
        });
    }

    function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    return (
        <section className="admin-card">
            <div className="admin-card-header">
                <div>
                    <h3>{mode === "create" ? "Add Profile" : "Edit Profile"}</h3>
                    <p className="text-muted">This creates the database record. The VPS folder and worker restart still use the guided commands below.</p>
                </div>
            </div>

            <form className="admin-form-grid" onSubmit={handleSubmit}>
                <label className="form-group">
                    <span>Display Name</span>
                    <input className="form-input" value={form.displayName} onChange={(event) => updateField("displayName", event.target.value)} required />
                </label>
                <label className="form-group">
                    <span>Assigned Worker ID</span>
                    <input className="form-input" value={form.assignedWorkerId} onChange={(event) => updateField("assignedWorkerId", event.target.value)} required />
                </label>
                <label className="form-group">
                    <span>Profile Mount Name</span>
                    <input className="form-input" value={form.profileMountName} onChange={(event) => updateField("profileMountName", event.target.value)} required />
                </label>
                <label className="form-group">
                    <span>Container Profile Path</span>
                    <input className="form-input" value={form.containerProfilePath} onChange={(event) => updateField("containerProfilePath", event.target.value)} required />
                </label>
                <label className="form-group">
                    <span>Browser Host</span>
                    <input className="form-input" value={form.browserHost} onChange={(event) => updateField("browserHost", event.target.value)} required />
                </label>
                <label className="form-group">
                    <span>Browser Port</span>
                    <input className="form-input" inputMode="numeric" value={form.browserPort} onChange={(event) => updateField("browserPort", event.target.value)} required />
                </label>
                <label className="form-group">
                    <span>Browser Target Port</span>
                    <input className="form-input" inputMode="numeric" value={form.browserTargetPort} onChange={(event) => updateField("browserTargetPort", event.target.value)} required />
                </label>
                <label className="form-group">
                    <span>Debug Tunnel Port</span>
                    <input className="form-input" inputMode="numeric" value={form.debugTunnelPort} onChange={(event) => updateField("debugTunnelPort", event.target.value)} placeholder="Optional local port" />
                </label>
                <label className="form-group admin-form-grid-span">
                    <span>Default Warmup Query</span>
                    <input className="form-input" value={form.defaultWarmupQuery} onChange={(event) => updateField("defaultWarmupQuery", event.target.value)} placeholder="Used after recovery if you do not type a query manually" />
                </label>
                <label className="form-group admin-form-grid-span">
                    <span>Notes</span>
                    <textarea className="form-input admin-textarea" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} rows={4} />
                </label>
                <div className="admin-form-actions admin-form-grid-span">
                    {onCancel ? (
                        <button className="btn-secondary" onClick={onCancel} type="button">
                            Cancel
                        </button>
                    ) : null}
                    <button className="btn-primary" disabled={submitting} type="submit">
                        {submitting ? "Saving..." : mode === "create" ? "Create Profile" : "Save Changes"}
                    </button>
                </div>
            </form>
        </section>
    );
}
