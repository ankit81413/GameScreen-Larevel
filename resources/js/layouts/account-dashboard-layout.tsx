import React from 'react';
import { Link } from '@inertiajs/react';
import Header from '@/components/includes/Header';
import Footer from '@/components/includes/Footer';
import '../../css/style.css';
import '../../css/new_style.css';
import '../../css/account.css';

type AccountSection = 'overview' | 'edit-profile' | 'change-password' | 'delete-account';

export default function AccountDashboardLayout({
    section,
    children,
}: {
    section: AccountSection;
    children: React.ReactNode;
}) {
    return (
        <>
            <Header />
            <section className="account_page">
                <div className="account_dashboard_shell">
                    <aside className="account_sidebar">
                        <h2>Account</h2>
                        <nav>
                            <Link
                                href="/account"
                                className={section === 'overview' ? 'active' : ''}
                            >
                                Overview
                            </Link>
                            <Link
                                href="/account/edit-profile"
                                className={section === 'edit-profile' ? 'active' : ''}
                            >
                                Edit Profile
                            </Link>
                            <Link
                                href="/account/change-password"
                                className={section === 'change-password' ? 'active' : ''}
                            >
                                Change Password
                            </Link>
                            <Link
                                href="/account/delete-account"
                                className={section === 'delete-account' ? 'active danger' : 'danger'}
                            >
                                Delete Account
                            </Link>
                        </nav>
                    </aside>

                    <main className="account_dashboard_content">{children}</main>
                </div>
            </section>
            <Footer />
        </>
    );
}
