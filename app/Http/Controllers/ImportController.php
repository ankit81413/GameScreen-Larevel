<?php

namespace App\Http\Controllers;

use App\Models\Wallpaper;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class ImportController extends Controller
{
    public function import()
    {
        $response = Http::get('https://ankit81413.github.io/GameScreen/wallpapers.json');

        if (!$response->successful()) {
            return 'Failed to fetch JSON';
        }

        $data = $response->json();

        foreach ($data as $code => $item) {

            $wallpaperId = DB::table('wallpapers')->insertGetId([
                'code' => $code,
                'name' => $item['name'],
                'thumbnail' => $item['thumbnail'],
                'quality_thumbnail' => $item['Quality_thumbnail'] ?? null,
                'type' => $item['type'],
                'orientation' => $item['orientation'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($item['link'] as $quality => $linkData) {
                DB::table('wallpaper_links')->insert([
                    'wallpaper_id' => $wallpaperId,
                    'quality' => $quality,
                    'size' => $linkData[0],
                    'url' => $linkData[1],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            foreach ($item['tags'] as $tagName) {

                $tagId = DB::table('tags')->where('name', $tagName)->value('id');

                if (!$tagId) {
                    $tagId = DB::table('tags')->insertGetId([
                        'name' => $tagName,
                    ]);
                }

                DB::table('wallpaper_tag')->insert([
                    'wallpaper_id' => $wallpaperId,
                    'tag_id' => $tagId,
                ]);
            }
        }

        return 'Import Completed';
    }


    // public function view()
    // {
    //     $wallpapers = Wallpaper::with(['links', 'tags'])->get();

    //     return response()->json($wallpapers);
    // }
}
