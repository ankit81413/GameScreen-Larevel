export type GamingAlertType = 'success' | 'error' | 'warning';

export type GamingAlertPayload = {
    type: GamingAlertType;
    title: string;
    message?: string;
    durationMs?: number;
};

export const GAMING_ALERT_EVENT = 'game-screen:alert';

export const showGamingAlert = (payload: GamingAlertPayload) => {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(
        new CustomEvent<GamingAlertPayload>(GAMING_ALERT_EVENT, {
            detail: payload,
        }),
    );
};
