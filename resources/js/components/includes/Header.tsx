import { Link } from '@inertiajs/react';
import React from 'react';

export default function Header() {
    return (
        <>
            <header>
                <div className="left_container">
                    <Link href="/">
                        <div id="logo">
                            <img src="/logo.png" alt="G" id="logo_image" />
                            <h1 className="font-bold">GAME SCREEN</h1>
                        </div>
                    </Link>
                </div>
                <div className="mid_container">
                    <form action="" method="post">
                        <div className="searchbox">
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <input
                                type="text"
                                placeholder="Search your next Screen..."
                            />
                            <div className="search_with_code"><i className="fa-solid fa-expand"></i>
                            
                            </div>
                        </div>
                    </form>
                </div>
                <div className="right_container">
                    <a href="" className='LoginButton'>Login <i className="fa-solid fa-user-astronaut"></i></a>
                    <a href="" className='SignupButton'>Signup</a>
                </div>
            </header>
        </>
    );
}
