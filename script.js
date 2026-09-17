let selectedPlatform = 'auto';

// Tab selector
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        selectedPlatform = tab.dataset.platform;
    });
});

function clearInput() {
    document.getElementById('videoUrl').value = '';
    document.getElementById('result').innerHTML = '';
}

function fillExample(url) {
    document.getElementById('videoUrl').value = url;
}

function detectPlatform(url) {
    if (url.includes('tiktok.com') || url.includes('vm.tiktok')) return 'tiktok';
    if (url.includes('instagram.com') || url.includes('instagr.am')) return 'instagram';
    return null;
}

async function downloadVideo() {
    const url = document.getElementById('videoUrl').value.trim();
    const resultDiv = document.getElementById('result');
    const btn = document.getElementById('downloadBtn');

    if (!url) {
        resultDiv.innerHTML = '<div class="error-box">⚠️ Masukkan URL terlebih dahulu!</div>';
        return;
    }

    let platform = selectedPlatform;
    if (platform === 'auto') platform = detectPlatform(url);

    if (!platform) {
        resultDiv.innerHTML = '<div class="error-box">❌ Platform tidak didukung. Gunakan link TikTok atau Instagram.</div>';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    resultDiv.innerHTML = '<p class="loading">⏳ Sedang mengambil video...</p>';

    try {
        const endpoint = `api/${platform}.php?url=${encodeURIComponent(url)}`;
        const response = await fetch(endpoint);
        const data = await response.json();

        if (data.success) {
            resultDiv.innerHTML = `
                <div class="success-box">
                    <h3><i class="fas fa-check-circle"></i> Berhasil!</h3>
                    <div class="video-preview">
                        ${data.cover || data.thumbnail
                            ? `<img class="thumb" src="${data.cover || data.thumbnail}" alt="Thumbnail">`
                            : ''}
                        <div class="meta">
                            <p class="title">${(data.title || 'Video ' + platform).substring(0, 100)}</p>
                            ${data.author ? `<p class="author">@${data.author}</p>` : ''}
                        </div>
                    </div>
                    <a href="${data.video_url}" target="_blank" download class="download-link">
                        <i class="fas fa-download"></i> Unduh Video
                    </a>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `<div class="error-box">❌ ${data.message || 'Gagal mengambil video.'}</div>`;
        }
    } catch (error) {
        resultDiv.innerHTML = `<div class="error-box">❌ Terjadi kesalahan: ${error.message}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-download"></i> Unduh Sekarang';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('videoUrl');
    const clearBtn = document.querySelector('.clear-btn');

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') downloadVideo();
    });

    input.addEventListener('input', () => {
        clearBtn.style.display = input.value ? 'block' : 'none';
    });
});
