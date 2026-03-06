// Components
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Forgot Password"
            description="Enter your email to receive a reset link"
        >
            <Head title="Forgot password" />

            {status && (
                <div className="mb-4 rounded-lg border border-[#ff9900]/30 bg-[#2a1d08]/50 px-4 py-3 text-center text-sm font-medium text-[#ffd08b]">
                    {status}
                </div>
            )}

            <div className="space-y-6">
                <Form {...email.form()}>
                    {({ processing, errors }) => (
                        <>
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
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="email@example.com"
                                    className="mt-2 h-11 rounded-lg border-white/15 bg-[#0b0e14] text-white placeholder:text-[#6b7280] focus-visible:border-[#ff9900]/70 focus-visible:ring-[#ff9900]/25"
                                    style={{
                                        padding: '10px',
                                        margin: '10px 0 30px',
                                    }}
                                />

                                <InputError message={errors.email} />
                            </div>

                            <div className="my-6 flex items-center justify-start">
                                <Button
                                    className="h-11 w-full rounded-lg bg-[#ff9900] font-semibold text-black transition-colors hover:bg-[#f4a825]"
                                    disabled={processing}
                                    data-test="email-password-reset-link-button"
                                    style={{
                                        marginBottom: '10px',
                                    }}
                                >
                                    {processing && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}
                                    Email password reset link
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                <div className="space-x-1 text-center text-sm text-[#9ca3af]">
                    <span>Or, return to</span>
                    <TextLink
                        href={login()}
                        className="ml-1 text-[#f5c16f] decoration-[#f5c16f]/40 hover:text-[#ffb347]"
                        style={{ marginLeft: '5px' }}
                    >
                        log in
                    </TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
