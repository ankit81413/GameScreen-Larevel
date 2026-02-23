import React from 'react';

type LoadMoreWallpapersButtonProps = {
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    hasMore?: boolean;
};

export default function LoadMoreWallpapersButton({
    onClick,
    disabled = false,
    loading = false,
    hasMore = true,
}: LoadMoreWallpapersButtonProps) {
    return (
        <>
            <section id="loadmore">
                <button
                    id="loadmore_button"
                    type="button"
                    onClick={onClick}
                    disabled={disabled || loading || !hasMore}
                    aria-busy={loading}
                >
                    <i className="fa-solid fa-rotate-right"></i>
                    {loading ? 'Loading...' : hasMore ? 'Load more' : 'No more'}
                </button>
            </section>
        </>
    );
}
