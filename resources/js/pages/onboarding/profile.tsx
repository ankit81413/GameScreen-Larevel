import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import AuthLayout from '@/layouts/auth-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showGamingAlert } from '@/lib/gaming-alerts';

export default function OnboardingProfile() {
    const [birthdate, setBirthdate] = useState('');
    const [gender, setGender] = useState('');
    const [bio, setBio] = useState('');
    const [ageConfirmed, setAgeConfirmed] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const getCsrfToken = () =>
        (
            document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content') ?? ''
        ).trim();

    const goToInterests = () => {
        router.visit('/onboarding/interests');
    };

    const saveAndContinue = async () => {
        setIsSaving(true);
        try {
            const csrf = getCsrfToken();
            const response = await fetch('/onboarding/profile', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
                },
                body: JSON.stringify({
                    birthdate: birthdate || null,
                    gender: gender || null,
                    bio: bio || null,
                    age_confirmed: ageConfirmed,
                    _token: csrf,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed');
            }

            showGamingAlert({
                type: 'success',
                title: 'Profile Updated',
                message: 'Now choose your interests.',
            });
            goToInterests();
        } catch (error) {
            showGamingAlert({
                type: 'error',
                title: 'Could Not Save',
                message: 'You can skip this and continue.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AuthLayout
            title="Basic Details"
            description="Optional step before interests"
        >
            <Head title="Profile Setup" />

            <div className="flex flex-col gap-5">
                <div className="grid gap-2">
                    <Label
                        htmlFor="birthdate"
                        className="text-sm font-medium text-[#d1d5db]"
                    >
                        Birthdate (optional)
                    </Label>
                    <Input
                        id="birthdate"
                        type="date"
                        value={birthdate}
                        onChange={(event) => setBirthdate(event.target.value)}
                        className="h-11 rounded-lg border-white/15 bg-[#0b0e14] text-white placeholder:text-[#6b7280] focus-visible:border-[#ff9900]/70 focus-visible:ring-[#ff9900]/25"
                        style={{ padding: '10px' }}
                    />
                </div>

                <div className="grid gap-2">
                    <Label
                        htmlFor="gender"
                        className="text-sm font-medium text-[#d1d5db]"
                    >
                        Gender (optional)
                    </Label>
                    <select
                        id="gender"
                        value={gender}
                        onChange={(event) => setGender(event.target.value)}
                        className="h-11 rounded-lg border border-white/15 bg-[#0b0e14] px-[10px] text-white focus-visible:border-[#ff9900]/70 focus-visible:ring-[#ff9900]/25"
                    >
                        <option value="">Skip for now</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non_binary">Non-binary</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                </div>

                <div className="grid gap-2">
                    <Label
                        htmlFor="bio"
                        className="text-sm font-medium text-[#d1d5db]"
                    >
                        Basic details (optional)
                    </Label>
                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        placeholder="Tell us your wallpaper vibe..."
                        className="min-h-[96px] rounded-lg border border-white/15 bg-[#0b0e14] px-[10px] py-[10px] text-white placeholder:text-[#6b7280] focus-visible:border-[#ff9900]/70 focus-visible:ring-[#ff9900]/25"
                    />
                </div>

                <label className="flex items-center gap-2 text-sm text-[#d1d5db]">
                    <input
                        type="checkbox"
                        checked={ageConfirmed}
                        onChange={(event) => setAgeConfirmed(event.target.checked)}
                    />
                    I confirm I meet age requirements.
                </label>

                <div className="flex gap-3 pt-1">
                    <Button
                        type="button"
                        onClick={goToInterests}
                        className="h-11 flex-1 rounded-lg border border-white/20 bg-transparent text-white hover:bg-white/10"
                    >
                        Skip
                    </Button>
                    <Button
                        type="button"
                        onClick={saveAndContinue}
                        disabled={isSaving}
                        className="h-11 flex-1 rounded-lg bg-[#ff9900] font-semibold text-black transition-colors hover:bg-[#f4a825]"
                    >
                        {isSaving ? 'Saving...' : 'Save & Continue'}
                    </Button>
                </div>
            </div>
        </AuthLayout>
    );
}
