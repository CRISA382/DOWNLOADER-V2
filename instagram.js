export default async function handler(req, res) {
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

    if (!url.includes('instagram.com') && !url.includes('instagr.am')) {
        return res.status(400).json({ success: false, message: 'Bukan link Instagram' });
    }

    try {
        // METODE 1: Coba scrape via snapinsta/savefrom style
        let videoUrl = null;
        let title = 'Instagram Video';
        let thumbnail = '';

        // METODE 2: Scraping langsung
        try {
            const html = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            }).then(r => r.text());

            // Cari og:video
            let match = html.match(/<meta[^>]+property="og:video"[^>]+content="([^"]+)"/i);
            if (match) videoUrl = match[1];

            // Fallback: video_url di JSON
            if (!videoUrl) {
                match = html.match(/"video_url":"([^"]+)"/);
                if (match) videoUrl = match[1].replace(/\\\//g, '/');
            }

            // Fallback: video_versions
            if (!videoUrl) {
                match = html.match(/"video_versions":\[\{"type":\d+,"url":"([^"]+)"/);
                if (match) videoUrl = match[1].replace(/\\\//g, '/');
            }

            // Title
            match = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
            if (match) title = match[1];

            // Thumbnail
            match = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
            if (match) thumbnail = match[1];

        } catch (e) {
            console.log('Scrape gagal:', e.message);
        }

        if (!videoUrl) {
            return res.status(500).json({
                success: false,
                message: 'Gagal mengambil video Instagram. Post mungkin private atau bukan video/reel.',
            });
        }

        return res.status(200).json({
            success: true,
            platform: 'instagram',
            video_url: videoUrl,
            title: title,
            thumbnail: thumbnail,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error: ' + error.message,
        });
    }
}
