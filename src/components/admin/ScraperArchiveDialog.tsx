"use client";

import { useState } from "react";
import { ScraperProfile } from "@/lib/scraperProfiles";

interface Props {
    profile: ScraperProfile;
    actionBusy?: boolean;
    onArchive: () => Promise<void> | void;
}

export default function ScraperArchiveDialog({ profile, actionBusy = false, onArchive }: Props) {
    const [confirmed, setConfirmed] = useState(false);

    return (
        <section className="admin-card admin-card-danger">
            <div className="admin-card-header">
                <div>
                    <h3>Delete Profile</h3>
                    <p className="text-muted">Delete is archive-only in v1. The database record is hidden from the main list, but you still need to use the cleanup command for the VPS folder.</p>
                </div>
            </div>

            <div className="admin-inline-note">
                <strong>Profile:</strong> {profile.displayName}
                {" | "}
                <strong>Status:</strong> {profile.effectiveStatus}
            </div>

            <label className="admin-checkbox">
                <input checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" />
                <span>I understand this archives the profile record and requires separate VPS cleanup.</span>
            </label>

            <button
                className="btn-danger"
                disabled={!confirmed || actionBusy}
                onClick={() => void onArchive()}
                type="button"
            >
                {actionBusy ? "Archiving..." : "Archive Profile"}
            </button>
        </section>
    );
}
