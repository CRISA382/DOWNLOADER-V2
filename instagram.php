<?php
require_once 'helper.php';
$helper = new DownloaderHelper();

$url = $_GET['url'] ?? '';

$valid = $helper->validateUrl($url);
if (!$valid['valid']) $helper->jsonResponse(['success' => false, 'message' => $valid['message']], 400);
if ($valid['platform'] !== 'instagram') $helper->jsonResponse(['success' => false, 'message' => 'Bukan link Instagram'], 400);

try {
    $response = $helper->curlRequest($url, 'GET', null, [
        'Accept: text/html,application/xhtml+xml',
        'Accept-Language: en-US,en;q=0.9',
    ]);
    
    if (!$response['success']) throw new Exception('Gagal mengakses Instagram');
    
    $html = $response['data'];
    $videoUrl = null;
    $title = 'Instagram Video';
    $thumbnail = '';
    
    // Cari og:video
    if (preg_match('/<meta[^>]+property="og:video"[^>]+content="([^"]+)"/i', $html, $m)) {
        $videoUrl = html_entity_decode($m[1]);
    }
    
    // Fallback: cari video_url di JSON
    if (!$videoUrl && preg_match('/"video_url":"([^"]+)"/', $html, $m)) {
        $videoUrl = str_replace('\\/', '/', $m[1]);
    }
    
    // Fallback: cari di script tags
    if (!$videoUrl && preg_match_all('/"video_versions":\[\{"type":\d+,"url":"([^"]+)"/', $html, $m)) {
        $videoUrl = str_replace('\\/', '/', $m[1][0]);
    }
    
    if (preg_match('/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i', $html, $t)) {
        $title = html_entity_decode($t[1]);
    }
    if (preg_match('/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i', $html, $i)) {
        $thumbnail = html_entity_decode($i[1]);
    }
    
    if (!$videoUrl) throw new Exception('Gagal mengekstrak video. Post mungkin private atau bukan video/reel.');
    
    $helper->jsonResponse([
        'success'   => true,
        'platform'  => 'instagram',
        'video_url' => $videoUrl,
        'title'     => $title,
        'thumbnail' => $thumbnail,
    ]);
    
} catch (Exception $e) {
    $helper->jsonResponse(['success' => false, 'message' => $e->getMessage()], 500);
}
