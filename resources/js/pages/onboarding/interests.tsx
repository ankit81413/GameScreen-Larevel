import { Head, router, usePage } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
import { showGamingAlert } from '@/lib/gaming-alerts';

type InterestTag = {
    id: number;
    name: string;
    thumbnail?: string | null;
};

export default function OnboardingInterests() {
    const { rounds } = usePage().props as any;
    const roundsData = (Array.isArray(rounds) ? rounds : []) as InterestTag[][];
    const [currentRound, setCurrentRound] = useState(0);
    const [selectedByRound, setSelectedByRound] = useState<number[][]>([
        [],
        [],
        [],
    ]);
    const [isSaving, setIsSaving] = useState(false);

    const roundTags = roundsData[currentRound] ?? [];
    const selectedCurrentRound = selectedByRound[currentRound] ?? [];

    const selectedTotal = useMemo(
        () => selectedByRound.reduce((count, list) => count + list.length, 0),
        [selectedByRound],
    );

    const toggleTag = (tagId: number) => {
        setSelectedByRound((current) => {
            const next = [...current];
            const set = new Set(next[currentRound]);

            if (set.has(tagId)) {
                set.delete(tagId);
            } else if (set.size < 3) {
                set.add(tagId);
            } else {
                showGamingAlert({
                    type: 'warning',
                    title: 'Limit Reached',
                    message: 'Pick only 3 tags in this round.',
                });
            }

            next[currentRound] = Array.from(set);
            return next;
        });
    };

    const nextRound = () => {
        if (selectedCurrentRound.length !== 3) {
            showGamingAlert({
                type: 'warning',
                title: 'Select 3 Tags',
                message: `Round ${currentRound + 1}: choose exactly 3 tags.`,
            });
            return;
        }

        setCurrentRound((round) => Math.min(round + 1, 2));
    };

    const previousRound = () => {
        setCurrentRound((round) => Math.max(round - 1, 0));
    };

    const getCsrfToken = () =>
        (
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? ''
        ).trim();

    const completeOnboarding = async () => {
        if (selectedByRound.some((round) => round.length !== 3)) {
            showGamingAlert({
                type: 'warning',
                title: 'Incomplete Selection',
                message: 'Choose 3 tags in each round before continuing.',
            });
            return;
        }

        setIsSaving(true);
        try {
            const csrf = getCsrfToken();
            const response = await fetch('/onboarding/interests', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
                },
                body: JSON.stringify({
                    rounds: selectedByRound,
                    _token: csrf,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save interests');
            }

            showGamingAlert({
                type: 'success',
                title: 'Interests Saved',
                message: 'Your feed will now be personalized.',
            });
            router.visit('/');
        } catch (error) {
            showGamingAlert({
                type: 'error',
                title: 'Save Failed',
                message: 'Could not save interests. Please try again.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AuthLayout
            title="Pick Interests"
            description={`Round ${currentRound + 1} of 3 • Choose exactly 3 tags`}
        >
            <Head title="Choose Interests" />

            <div className="flex flex-col gap-5">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
                        gap: '10px',
                    }}
                >
                    {roundTags.map((tag) => {
                        const active = selectedCurrentRound.includes(tag.id);

                        return (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                style={{
                                    position: 'relative',
                                    borderRadius: '12px',
                                    border: active
                                        ? '2px solid #f59e0b'
                                        : '1px solid rgba(255,255,255,0.14)',
                                    padding: 0,
                                    overflow: 'hidden',
                                    minHeight: '96px',
                                    cursor: 'pointer',
                                    backgroundColor: '#0b1222',
                                }}
                            >
                                {tag.thumbnail ? (
                                    <img
                                        src={tag.thumbnail}
                                        alt={tag.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            position: 'absolute',
                                            inset: 0,
                                        }}
                                    />
                                ) : null}
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background:
                                            'linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.75))',
                                    }}
                                />
                                <span
                                    style={{
                                        position: 'relative',
                                        zIndex: 2,
                                        display: 'block',
                                        padding: '10px',
                                        color: active ? '#fbbf24' : '#f8fafc',
                                        fontWeight: 700,
                                        textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                                    }}
                                >
                                    {tag.name}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                    <p className="text-sm text-[#9ca3af]">Selected: {selectedTotal}/9</p>
                    <div className="flex gap-3">
                        {currentRound > 0 && (
                            <Button
                                type="button"
                                onClick={previousRound}
                                className="h-11 rounded-lg border border-white/20 bg-transparent text-white hover:bg-white/10"
                            >
                                Back
                            </Button>
                        )}

                        {currentRound < 2 ? (
                            <Button
                                type="button"
                                onClick={nextRound}
                                className="h-11 rounded-lg bg-[#ff9900] font-semibold text-black transition-colors hover:bg-[#f4a825]"
                            >
                                Next Round
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={completeOnboarding}
                                disabled={isSaving}
                                className="h-11 rounded-lg bg-[#ff9900] font-semibold text-black transition-colors hover:bg-[#f4a825]"
                            >
                                {isSaving ? 'Saving...' : 'Finish'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
