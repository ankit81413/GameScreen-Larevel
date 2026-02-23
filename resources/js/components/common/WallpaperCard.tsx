
export default function WallpaperCard(props: any) {
    // console.log(props);
    const island= props.item.orientation == "land"
    
    return (
        <>
            <div className={`wallpaper ${island ? "landscape" : "portrait"}`}>
                <div className="image">
                    <a target="_blank" href={`/view/${props.item.code}`}>
                        <img
                            src={`${props.item.thumbnail}`}
                            alt="wallpaper"
                            id={`wallpaper_${props.item.id}`}
                        />
                    </a>
                </div>
                <div className="details">
                    <h2>{props.item.name}</h2>
                    <p>Quality : 4k</p>
                </div>
            </div>
        </>
    );
}
