export function useFullScreen() {
    const toggleFullScreen = (id: string) => {
        const el = document.getElementById(id) as any;
        if (!el) {
            return;
        }

        if (document.fullscreenElement) {
            // If already in fullscreen, exit it
            document.exitFullscreen();
        } else {
            if (el.requestFullscreen) {
                el.requestFullscreen();
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            } else if (el.msRequestFullscreen) {
                el.msRequestFullscreen();
            }
        }
    };

    return {toggleFullScreen};
}
