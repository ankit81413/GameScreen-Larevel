import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AccountDashboardLayout from '@/layouts/account-dashboard-layout';
import { showGamingAlert } from '@/lib/gaming-alerts';

type WallpaperPayload = {
    id: number;
    code: string;
    name: string;
    type: string;
    orientation: 'land' | 'port';
    is_private: boolean;
    tags: string[];
};

export default function EditWallpaperPage() {
    const { wallpaper } = usePage().props as any as { wallpaper: WallpaperPayload };

    const form = useForm({
        name: wallpaper?.name ?? '',
        type: wallpaper?.type ?? '1',
        orientation: wallpaper?.orientation ?? 'land',
        is_private: Boolean(wallpaper?.is_private),
        tags: Array.isArray(wallpaper?.tags) ? wallpaper.tags.join(', ') : '',
    });

    const submit = () => {
        form.patch(`/account/wallpapers/${wallpaper.id}`, {
            onSuccess: () =>
                showGamingAlert({
                    type: 'success',
                    title: 'Wallpaper Updated',
                    message: 'Wallpaper details updated successfully.',
                }),
            onError: () =>
                showGamingAlert({
                    type: 'error',
                    title: 'Update Failed',
                    message: 'Please check fields and retry.',
                }),
        });
    };

    return (
        <>
            <Head title={`Edit ${wallpaper?.code ?? 'Wallpaper'}`} />
            <AccountDashboardLayout section="edit-wallpaper">
                <div className="account_shell">
                    <div className="panel panel_form">
                        <h2>Edit Wallpaper</h2>
                        <p className="muted">Update your wallpaper details.</p>

                        <div className="form_grid">
                            <label className="full">
                                <span>Name</span>
                                <input
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                />
                            </label>

                            <label>
                                <span>Type</span>
                                <select
                                    value={form.data.type}
                                    onChange={(event) =>
                                        form.setData('type', event.target.value)
                                    }
                                >
                                    <option value="1">Static</option>
                                    <option value="2">Live Wallpaper</option>
                                </select>
                            </label>

                            <label>
                                <span>Orientation</span>
                                <select
                                    value={form.data.orientation}
                                    onChange={(event) =>
                                        form.setData(
                                            'orientation',
                                            event.target.value as 'land' | 'port',
                                        )
                                    }
                                >
                                    <option value="land">Landscape</option>
                                    <option value="port">Portrait</option>
                                </select>
                            </label>

                            <label className="full">
                                <span>Tags (comma separated)</span>
                                <input
                                    value={form.data.tags}
                                    onChange={(event) =>
                                        form.setData('tags', event.target.value)
                                    }
                                    placeholder="samurai, car, anime"
                                />
                            </label>

                            <label className="full">
                                <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={form.data.is_private}
                                        onChange={(event) =>
                                            form.setData('is_private', event.target.checked)
                                        }
                                    />
                                    Private wallpaper
                                </span>
                            </label>
                        </div>

                        <div className="form_actions" style={{ display: 'flex', gap: 8 }}>
                            <button
                                type="button"
                                className="primary_cta"
                                onClick={submit}
                                disabled={form.processing}
                            >
                                {form.processing ? 'Saving...' : 'Save Changes'}
                            </button>
                            <Link href="/account" className="quick_link">
                                Back
                            </Link>
                        </div>
                    </div>
                </div>
            </AccountDashboardLayout>
        </>
    );
}
