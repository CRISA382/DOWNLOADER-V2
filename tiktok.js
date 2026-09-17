export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const url = req.query.url;

    if (!url) {
        return res.status(400).json({ success: false, message: 'URL tidak boleh kosong' });
    }

    if (!url.includes('tiktok.com') && !url.includes('vm.tiktok')) {
        return res.status(400).json({ success: false, message: 'Bukan link TikTok' });
    }

    try {
        // METODE 1: Coba pakai tikwm.com (paling stabil untuk server)
        let videoUrl = null;
        let title = 'TikTok Video';
        let author = '';
        let cover = '';

        try {
            const apiRes = await fetch(
                `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json',
                    },
                }
            );
            const apiData = await apiRes.json();

            if (apiData && apiData.code === 0 && apiData.data) {
                videoUrl = apiData.data.play;
                title = apiData.data.title || title;
                author = apiData.data.author?.unique_id || '';
                cover = apiData.data.cover || '';
            }
        } catch (e) {
            console.log('tikwm gagal:', e.message);
        }

        // METODE 2: Fallback ke tiktokio
        if (!videoUrl) {
            try {
                const formData = new URLSearchParams();
                formData.append('url', url);
                formData.append('action', 'post');

                const apiRes = await fetch('https://tiktokio.com/api/v1/tk/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    },
                    body: formData.toString(),
                });

                const html = await apiRes.text();

                const mp4Match = html.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/i);
                if (mp4Match) {
                    videoUrl = mp4Match[0];
                }

                const titleMatch = html.match(/<title>(.*?)<\/title>/i);
                if (titleMatch) title = titleMatch[1];

                const coverMatch = html.match(/property="og:image"\s+content="([^"]+)"/i);
                if (coverMatch) cover = coverMatch[1];
            } catch (e) {
                console.log('tiktokio gagal:', e.message);
            }
        }

        if (!videoUrl) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil video. Server mungkin diblokir atau link tidak valid.',
            });
        }

        return res.status(200).json({
            success: true,
            platform: 'tiktok',
            video_url: videoUrl,
            title: title,
            author: author,
            cover: cover,
            watermark: false,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error: ' + error.message,
        });
    }
}
