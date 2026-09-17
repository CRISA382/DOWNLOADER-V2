<?php

class DownloaderHelper {
    
    public function curlRequest($url, $method = 'GET', $data = null, $headers = []) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT      => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ]);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($data) curl_setopt($ch, CURLOPT_POSTFIELDS, is_array($data) ? http_build_query($data) : $data);
        }
        if (!empty($headers)) curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error    = curl_error($ch);
        curl_close($ch);
        
        if ($error) return ['success' => false, 'message' => "cURL Error: $error"];
        return ['success' => $httpCode >= 200 && $httpCode < 300, 'code' => $httpCode, 'data' => $response];
    }
    
    public function validateUrl($url) {
        $url = trim($url);
        if (empty($url)) return ['valid' => false, 'message' => 'URL tidak boleh kosong'];
        if (!filter_var($url, FILTER_VALIDATE_URL)) return ['valid' => false, 'message' => 'Format URL tidak valid'];
        
        $host = str_replace('www.', '', parse_url($url, PHP_URL_HOST));
        $isTiktok    = strpos($host, 'tiktok.com') !== false;
        $isInstagram = strpos($host, 'instagram.com') !== false || strpos($host, 'instagr.am') !== false;
        
        if (!$isTiktok && !$isInstagram) return ['valid' => false, 'message' => 'Hanya mendukung link TikTok & Instagram'];
        
        return ['valid' => true, 'platform' => $isTiktok ? 'tiktok' : 'instagram'];
    }
    
    public function jsonResponse($data, $httpCode = 200) {
        http_response_code($httpCode);
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
