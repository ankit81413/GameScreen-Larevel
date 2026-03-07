import React, { useEffect, useMemo, useState } from 'react';
import {
    GAMING_ALERT_EVENT,
    type GamingAlertPayload,
} from '@/lib/gaming-alerts';

type AlertItem = GamingAlertPayload & { id: string };

const MAX_ALERTS = 4;
const DEFAULT_DURATION_MS = 6000;

export default function GamingAlerts() {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);

    useEffect(() => {
        const handleAlert = (event: Event) => {
            const customEvent = event as CustomEvent<GamingAlertPayload>;
            const payload = customEvent.detail;
            if (!payload?.title) {
                return;
            }

            const nextAlert: AlertItem = {
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                type: payload.type,
                title: payload.title,
                message: payload.message,
                durationMs:
                    payload.durationMs ??
                    (payload.type === 'error'
                        ? 8000
                        : payload.type === 'warning'
                          ? 7000
                          : DEFAULT_DURATION_MS),
            };

            setAlerts((current) => [nextAlert, ...current].slice(0, MAX_ALERTS));
        };

        window.addEventListener(GAMING_ALERT_EVENT, handleAlert as EventListener);
        return () =>
            window.removeEventListener(
                GAMING_ALERT_EVENT,
                handleAlert as EventListener,
            );
    }, []);

    useEffect(() => {
        if (!alerts.length) {
            return;
        }

        const timers = alerts.map((alert) =>
            window.setTimeout(() => {
                setAlerts((current) =>
                    current.filter((item) => item.id !== alert.id),
                );
            }, alert.durationMs ?? DEFAULT_DURATION_MS),
        );

        return () => timers.forEach((timer) => window.clearTimeout(timer));
    }, [alerts]);

    const alertIcon = useMemo(
        () => ({
            success: 'fa-solid fa-circle-check',
            error: 'fa-solid fa-triangle-exclamation',
            warning: 'fa-solid fa-bolt',
        }),
        [],
    );

    if (!alerts.length) {
        return null;
    }

    return (
        <div className="gaming_alert_stack" aria-live="polite" aria-atomic="true">
            {alerts.map((alert) => (
                <div
                    key={alert.id}
                    className={`gaming_alert gaming_alert_${alert.type}`}
                >
                    <div className="gaming_alert_glow" />
                    <i className={alertIcon[alert.type]} />
                    <div className="gaming_alert_content">
                        <h4>{alert.title}</h4>
                        {alert.message ? <p>{alert.message}</p> : null}
                    </div>
                    <button
                        type="button"
                        className="gaming_alert_close"
                        onClick={() =>
                            setAlerts((current) =>
                                current.filter((item) => item.id !== alert.id),
                            )
                        }
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
            ))}
        </div>
    );
}
