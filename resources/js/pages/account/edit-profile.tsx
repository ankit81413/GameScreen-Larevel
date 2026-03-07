import { Head, useForm, usePage } from '@inertiajs/react';
import AccountDashboardLayout from '@/layouts/account-dashboard-layout';
import { showGamingAlert } from '@/lib/gaming-alerts';

export default function EditProfilePage() {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const form = useForm({
        name: user?.name ?? '',
        username: user?.username ?? '',
        email: user?.email ?? '',
        birthdate: user?.birthdate ?? '',
        gender: user?.gender ?? '',
        bio: user?.bio ?? '',
    });

    const submit = () => {
        form.patch('/account/edit-profile', {
            preserveScroll: true,
            onSuccess: () =>
                showGamingAlert({
                    type: 'success',
                    title: 'Profile Updated',
                    message: 'Your profile changes are saved.',
                }),
            onError: () =>
                showGamingAlert({
                    type: 'error',
                    title: 'Update Failed',
                    message: 'Please check the fields and try again.',
                }),
        });
    };

    return (
        <>
            <Head title="Edit Profile" />
            <AccountDashboardLayout section="edit-profile">
                <div className="account_shell">
                    <div className="panel panel_form">
                        <h2>Edit Profile</h2>

                        <div className="form_grid">
                            <label>
                                <span>Name</span>
                                <input
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                />
                            </label>
                            <label>
                                <span>Username</span>
                                <input
                                    value={form.data.username}
                                    onChange={(e) => form.setData('username', e.target.value)}
                                />
                            </label>
                            <label>
                                <span>Email</span>
                                <input
                                    type="email"
                                    value={form.data.email ?? ''}
                                    onChange={(e) => form.setData('email', e.target.value)}
                                />
                            </label>
                            <label>
                                <span>Birthdate</span>
                                <input
                                    type="date"
                                    value={form.data.birthdate ?? ''}
                                    onChange={(e) => form.setData('birthdate', e.target.value)}
                                />
                            </label>
                            <label>
                                <span>Gender</span>
                                <select
                                    value={form.data.gender ?? ''}
                                    onChange={(e) => form.setData('gender', e.target.value)}
                                >
                                    <option value="">Prefer not to say</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="non_binary">Non-binary</option>
                                    <option value="prefer_not_to_say">
                                        Prefer not to say
                                    </option>
                                </select>
                            </label>
                            <label className="full">
                                <span>Bio</span>
                                <textarea
                                    value={form.data.bio ?? ''}
                                    onChange={(e) => form.setData('bio', e.target.value)}
                                />
                            </label>
                        </div>

                        <div className="form_actions">
                            <button type="button" className="primary_cta" onClick={submit}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </AccountDashboardLayout>
        </>
    );
}
