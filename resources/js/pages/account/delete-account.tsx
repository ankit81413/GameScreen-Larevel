import { Head, router, useForm } from '@inertiajs/react';
import AccountDashboardLayout from '@/layouts/account-dashboard-layout';
import { showGamingAlert } from '@/lib/gaming-alerts';

export default function DeleteAccountPage() {
    const form = useForm({
        password: '',
    });

    const submit = () => {
        form.delete('/account/delete-account', {
            preserveScroll: true,
            onSuccess: () => {
                showGamingAlert({
                    type: 'warning',
                    title: 'Account Deleted',
                    message: 'Your account has been archived (soft delete).',
                });
                router.visit('/');
            },
            onError: () =>
                showGamingAlert({
                    type: 'error',
                    title: 'Delete Failed',
                    message: 'Password mismatch. Please try again.',
                }),
        });
    };

    return (
        <>
            <Head title="Delete Account" />
            <AccountDashboardLayout section="delete-account">
                <div className="account_shell">
                    <div className="panel panel_form danger">
                        <h2>Delete Account</h2>
                        <p className="muted">
                            Your account will be soft deleted and can be restored from database.
                        </p>
                        <div className="form_grid">
                            <label className="full">
                                <span>Confirm Password</span>
                                <input
                                    type="password"
                                    value={form.data.password}
                                    onChange={(e) => form.setData('password', e.target.value)}
                                />
                            </label>
                        </div>

                        <div className="form_actions">
                            <button type="button" className="danger_cta" onClick={submit}>
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </AccountDashboardLayout>
        </>
    );
}
