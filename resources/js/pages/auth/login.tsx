import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    return (
        <AuthLayout
            title="Welcome Back"
            description="Sign in to continue to Game Screen"
        >
            <Head title="Log in" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-sm font-medium text-[#d1d5db]">
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    className="h-11 rounded-lg border-white/15 bg-[#0b0e14] text-white placeholder:text-[#6b7280] focus-visible:border-[#ff9900]/70 focus-visible:ring-[#ff9900]/25"
                                    style={{padding:"10px"}}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center" style={{display:"flex", justifyContent:"space-between"}}>
                                    <Label
                                        htmlFor="password"
                                        className="text-sm font-medium text-[#d1d5db]"
                                    >
                                        Password
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm text-[#f5c16f] decoration-[#f5c16f]/40 hover:text-[#ffb347]"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    className="h-11 rounded-lg border-white/15 bg-[#0b0e14] text-white placeholder:text-[#6b7280] focus-visible:border-[#ff9900]/70 focus-visible:ring-[#ff9900]/25"
                                    style={{padding:"10px"}}
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                    className="border-white/30 data-[state=checked]:border-[#ff9900] data-[state=checked]:bg-[#ff9900] data-[state=checked]:text-black"
                                    style={{marginRight:"10px"}}
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-sm text-[#b8bec9]"
                                >
                                    Remember me
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-1 h-11 w-full rounded-lg bg-[#ff9900] font-semibold text-black transition-colors hover:bg-[#f4a825]"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>

                        {canRegister && (
                            <div className="pt-1 text-center text-sm text-[#9ca3af]">
                                Don't have an account?{' '}
                                <TextLink
                                    href={register()}
                                    tabIndex={5}
                                    className="text-[#f5c16f] decoration-[#f5c16f]/40 hover:text-[#ffb347]"
                                >
                                    Sign up
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>

            {status && (
                <div className="mt-4 rounded-lg border border-[#ff9900]/30 bg-[#2a1d08]/50 px-4 py-3 text-center text-sm font-medium text-[#ffd08b]">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
