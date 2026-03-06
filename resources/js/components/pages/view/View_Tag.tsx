import { Link } from '@inertiajs/react';
import React from 'react';


type TagProp = {
    name : string;
}

export default function View_Tag({name} : TagProp) {
    return (
        <>
            <Link href={`auto_search?tag=${name}`}>
                {name}
            </Link>
        </>
    );
}
