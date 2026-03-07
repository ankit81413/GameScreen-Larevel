import { Head, useForm } from '@inertiajs/react';
import AccountDashboardLayout from '@/layouts/account-dashboard-layout';
import { showGamingAlert } from '@/lib/gaming-alerts';

export default function ChangePasswordPage() {
    const form = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = () => {
        form.put('/account/change-password', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                showGamingAlert({
                    type: 'success',
                    title: 'Password Changed',
                    message: 'Your new password is active now.',
                });
            },
            onError: () =>
                showGamingAlert({
                    type: 'error',
                    title: 'Password Update Failed',
                    message: 'Check your current password and try again.',
                }),
        });
    };

    return (
        <>
            <Head title="Change Password" />
            <AccountDashboardLayout section="change-password">
                <div className="account_shell">
                    <div className="panel panel_form">
                        <h2>Change Password</h2>

                        <div className="form_grid">
                            <label className="full">
                                <span>Current Password</span>
                                <input
                                    type="password"
                                    value={form.data.current_password}
                                    onChange={(e) =>
                                        form.setData('current_password', e.target.value)
                                    }
                                />
                            </label>
                            <label className="full">
                                <span>New Password</span>
                                <input
                                    type="password"
                                    value={form.data.password}
                                    onChange={(e) => form.setData('password', e.target.value)}
                                />
                            </label>
                            <label className="full">
                                <span>Confirm New Password</span>
                                <input
                                    type="password"
                                    value={form.data.password_confirmation}
                                    onChange={(e) =>
                                        form.setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                />
                            </label>
                        </div>

                        <div className="form_actions">
                            <button type="button" className="primary_cta" onClick={submit}>
                                Update Password
                            </button>
                        </div>
                    </div>
                </div>
            </AccountDashboardLayout>
        </>
    );
}
