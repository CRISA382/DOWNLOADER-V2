<?php
require_once 'helper.php';
$helper = new DownloaderHelper();

$url = $_GET['url'] ?? '';

$valid = $helper->validateUrl($url);
if (!$valid['valid']) $helper->jsonResponse(['success' => false, 'message' => $valid['message']], 400);
if ($valid['platform'] !== 'tiktok') $helper->jsonResponse(['success' => false, 'message' => 'Bukan link TikTok'], 400);

try {
    $response = $helper->curlRequest(
        'https://tiktokio.com/api/v1/tk/',
        'POST',
        ['url' => $url, 'action' => 'post'],
        ['Content-Type: application/x-www-form-urlencoded']
    );
    
    if (!$response['success']) throw new Exception('Gagal menghubungi server TikTok');
    
    $html = $response['data'];
    $videoUrl = null;
    $title = 'TikTok Video';
    $author = '';
    $cover = '';
    
    // Cari link download mp4
    if (preg_match_all('/<a[^>]+href="(https?:\/\/[^"]+\.mp4[^"]*)"/i', $html, $matches)) {
        $videoUrl = html_entity_decode($matches[1][0]);
    }
    
    // Fallback: cari mp4 di seluruh HTML
    if (!$videoUrl && preg_match('/https?:\/\/[^"\']+\.mp4[^"\']*/i', $html, $m)) {
        $videoUrl = $m[0];
    }
    
    // Ambil title dan cover
    if (preg_match('/<title>(.*?)<\/title>/i', $html, $t)) {
        $title = html_entity_decode($t[1]);
    }
    if (preg_match('/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i', $html, $i)) {
        $cover = html_entity_decode($i[1]);
    }
    
    if (!$videoUrl) throw new Exception('Tidak dapat menemukan link video');
    
    $helper->jsonResponse([
        'success'   => true,
        'platform'  => 'tiktok',
        'video_url' => $videoUrl,
        'title'     => $title,
        'author'    => $author,
        'cover'     => $cover,
        'watermark' => false,
    ]);
    
} catch (Exception $e) {
    $helper->jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
}
