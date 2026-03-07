import { Form, Head, router } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { showGamingAlert } from '@/lib/gaming-alerts';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    return (
        <AuthLayout
            title="Create Account"
            description="Set up your Game Screen account"
        >
            <Head title="Register" />
            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                onSuccess={() => {
                    showGamingAlert({
                        type: 'success',
                        title: 'Account Created',
                        message: 'Complete your profile setup.',
                    });
                    router.visit('/onboarding/profile');
                }}
                onError={(errors) => {
                    const firstError = Object.values(errors ?? {})[0];
                    showGamingAlert({
                        type: 'error',
                        title: 'Signup Failed',
                        message:
                            typeof firstError === 'string'
                                ? firstError
                                : 'Please check the form and try again.',
                    });
                }}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label
                                    htmlFor="first_name"
                                    className="text-sm font-medium text-[#d1d5db]"
                                >
                                    First Name
                                </Label>
                                <Input
                                    id="first_name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="given-name"
                                    name="first_name"
                                    placeholder="First name"
                                    className="h-11 rounded-lg border-white/15 bg-[#0b0e14] text-white placeholder:text-[#6b7280] focus-visible:border-[#ff9900]/70 focus-visible:ring-[#ff9900]/25"
                                    style={{ padding: '10px' }}
                                />
                                <InputError
                                    message={errors.first_name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="last_name"
                                    className="text-sm font-medium text-[#d1d5db]"
                                >
                                    Last Name
                                </Label>
                                <Input
                                    id="last_name"
                                    type="text"
                                    required
                                    tabIndex={2}
                                    autoComplete="family-name"
                                    name="last_name"
                                    placeholder="Last name"
                                    className="h-11 rounded-lg border-white/15 bg-[#0b0e14] text-white placeholder:text-[#6b7280] focus-visible:border-[#ff9900]/70 focus-visible:ring-[#ff9900]/25"
                                    style={{ padding: '10px' }}
                                />
                                <InputError
                                    message={errors.last_name}
                                    className="mt-2"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="email"
                                    className="text-sm font-medium text-[#d1d5db]"
                                >
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    tabIndex={3}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com (optional)"
                                    className="h-11 rounded-lg border-white/15 bg-[#0b0e14] text-white placeholder:text-[#6b7280] focus-visible:border-[#ff9900]/70 focus-visible:ring-[#ff9900]/25"
                                    style={{ padding: '10px' }}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="username"
                                    className="text-sm font-medium text-[#d1d5db]"
                                >
                                    Username
                                </Label>
                                <Input
                                    id="username"
                                    type="text"
                                    required
                                    tabIndex={4}
                                    name="username"
                                    placeholder="unique_username"
                                    className="h-11 rounded-lg border-white/15 bg-[#0b0e14] text-white placeholder:text-[#6b7280] focus-visible:border-[#ff9900]/70 focus-visible:ring-[#ff9900]/25"
                                    style={{ padding: '10px' }}
                                />
                                <InputError message={errors.username} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="password"
                                    className="text-sm font-medium text-[#d1d5db]"
                                >
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    tabIndex={5}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Password"
                                    className="h-11 rounded-lg border-white/15 bg-[#0b0e14] text-white placeholder:text-[#6b7280] focus-visible:border-[#ff9900]/70 focus-visible:ring-[#ff9900]/25"
                                    style={{ padding: '10px' }}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label
                                    htmlFor="password_confirmation"
                                    className="text-sm font-medium text-[#d1d5db]"
                                >
                                    Confirm password
                                </Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    required
                                    tabIndex={6}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm password"
                                    className="h-11 rounded-lg border-white/15 bg-[#0b0e14] text-white placeholder:text-[#6b7280] focus-visible:border-[#ff9900]/70 focus-visible:ring-[#ff9900]/25"
                                    style={{ padding: '10px' }}
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-1 h-11 w-full rounded-lg bg-[#ff9900] font-semibold text-black transition-colors hover:bg-[#f4a825]"
                                tabIndex={7}
                                disabled={processing}
                                data-test="register-user-button"
                            >
                                {processing && <Spinner />}
                                Create account
                            </Button>
                        </div>

                        <div className="pt-1 text-center text-sm text-[#9ca3af]">
                            Already have an account?{' '}
                            <TextLink
                                href={login()}
                                tabIndex={8}
                                className="text-[#f5c16f] decoration-[#f5c16f]/40 hover:text-[#ffb347]"
                            >
                                Log in
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
