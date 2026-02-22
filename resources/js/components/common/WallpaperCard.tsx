import React from 'react';

export default function WallpaperCard(props: any) {
    console.log(props);
    
    return (
        <>
            <div className="wallpaper landscape">
                <div className="image">
                    <a target="_blank" href={`image.html?value=${props.item.code}`}>
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
