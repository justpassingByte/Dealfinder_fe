export type ScraperProfileStatus =
    | 'pending_setup'
    | 'active'
    | 'warning'
    | 'blocked'
    | 'recovering'
    | 'warming'
    | 'cooldown'
    | 'offline'
    | 'archived';

export interface ScraperCommandStep {
    title: string;
    description: string;
    command: string;
}

export interface DevtoolsTarget {
    id: string;
    title: string;
    type: string;
    url: string;
    localInspectorUrl: string;
}

export interface DevtoolsStatus {
    reachable: boolean;
    checkedAt: string;
    debugHost: string;
    debugPort: number;
    localTunnelPort: number;
    targetCount: number;
    recommendedTargetId: string | null;
    error: string | null;
}

export interface ScraperProfile {
    id: string;
    displayName: string;
    status: Exclude<ScraperProfileStatus, 'offline'>;
    effectiveStatus: ScraperProfileStatus;
    riskScore: number;
    assignedWorkerId: string;
    profileMountName: string;
    containerProfilePath: string;
    browserHost: string;
    browserPort: number;
    browserTargetPort: number;
    debugTunnelPort: number | null;
    lastHeartbeatAt: string | null;
    lastUsedAt: string | null;
    lastSuccessAt: string | null;
    lastFailureAt: string | null;
    lastCaptchaAt: string | null;
    cooldownUntil: string | null;
    recoveryStartedAt: string | null;
    warmupRequestedAt: string | null;
    warmupSuccessStreak: number;
    archivedAt: string | null;
    notes: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
    isRunnable: boolean;
}

export interface ScraperProfileListItem extends ScraperProfile {
    stats: {
        requestCount24h: number;
        successRate24h: number;
        captchaCount24h: number;
    };
}

export interface ScraperProfileStats {
    requestCount24h: number;
    successCount24h: number;
    successRate24h: number;
    captchaCount24h: number;
    averageLatency24h: number | null;
    currentWarmupStreak: number;
    lastSuccessAt: string | null;
    lastFailureAt: string | null;
    lastCaptchaAt: string | null;
}

export interface ScraperProfileSummary {
    totalProfiles: number;
    runnableProfiles: number;
    blockedProfiles: number;
    recoveringProfiles: number;
    warmingProfiles: number;
    offlineProfiles: number;
    archivedProfiles: number;
    averageRisk: number;
    captchaCount24h: number;
}

export interface ScraperProfileEvent {
    id: string;
    profileId: string;
    eventType: string;
    oldStatus: string | null;
    newStatus: string | null;
    riskDelta: number;
    latencyMs: number | null;
    details: Record<string, unknown>;
    createdAt: string;
}

export interface ScraperProfileDetailResponse {
    profile: ScraperProfile;
    stats: ScraperProfileStats;
    recentEvents: ScraperProfileEvent[];
    commandGuides: {
        add: ScraperCommandStep[];
        recovery: ScraperCommandStep[];
        cleanup: ScraperCommandStep[];
    };
}
