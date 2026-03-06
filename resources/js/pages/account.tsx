import { Head, Link, usePage } from '@inertiajs/react';
import Header from '@/components/includes/Header';
import Footer from '@/components/includes/Footer';
import type { SharedData } from '@/types';
import '../../css/style.css';
import '../../css/new_style.css';

export default function Account() {
    const { auth } = usePage<SharedData>().props as any;
    const user = auth?.user;

    return (
        <>
            <Head title="Account" />
            <Header />

            <section
                style={{
                    maxWidth: '900px',
                    margin: '20px auto',
                    padding: '20px',
                }}
            >
                <div
                    style={{
                        background: '#11141c',
                        border: '1px solid rgba(255,153,0,0.45)',
                        borderRadius: '14px',
                        padding: '24px',
                        color: 'white',
                    }}
                >
                    <h1
                        style={{
                            marginBottom: '8px',
                            fontSize: '32px',
                            color: '#ff9900',
                        }}
                    >
                        Account
                    </h1>
                    <p style={{ color: '#c9c9c9', marginBottom: '18px' }}>
                        Manage your profile and account settings.
                    </p>

                    <div style={{ marginBottom: '16px' }}>
                        <p>
                            <strong>Name:</strong> {user?.name ?? '-'}
                        </p>
                        <p>
                            <strong>Email:</strong> {user?.email ?? '-'}
                        </p>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            gap: '10px',
                            flexWrap: 'wrap',
                        }}
                    >
                        <Link
                            href="/settings/profile"
                            style={{
                                background: '#ff9900',
                                color: '#000',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontWeight: 600,
                            }}
                        >
                            Profile Settings
                        </Link>
                        <Link
                            href="/settings/password"
                            style={{
                                background: 'transparent',
                                color: '#ffb347',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,153,0,0.45)',
                                fontWeight: 600,
                            }}
                        >
                            Change Password
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    );
}
