// === SOUND CLOUD PLAYER COMPONENT ===

// Private State & DOM Elements
const iframe = document.getElementById('sc-widget');
const widget = window.SC.Widget(iframe);

const playBtn = document.getElementById('play-btn');
const nextBtn = document.getElementById('next-btn');
const customPlayer = document.getElementById('custom-player');
const currentProgress = document.getElementById('current-progress');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const trackTitleEl = document.getElementById('track-title');
const progressBar = document.getElementById('progress-bar');

let currentTrackIndex = 0;
let isPlaying = false;
let duration = 0;

const playlist = [
    { title: "RODREE | Nocturnal Ritual", id: "2262729761", image: "https://i1.sndcdn.com/artworks-zRWv8x0LY2Id8kBL-DOP5Pg-t1080x1080.jpg", type: "soundcloud" },
    { title: "RODREE | Afro Set VOL1", id: "2068822248", image: "https://i1.sndcdn.com/artworks-QIyEEKeWfoW1L2Fz-DhJHDA-t1080x1080.png", type: "soundcloud" },
    { title: "RODREE | Afro & Latin House", id: "1720443096", image: "https://i1.sndcdn.com/artworks-5zIz7OMSSx3zV4ei-JjzmaQ-t1080x1080.jpg", type: "soundcloud" },
    { title: "Sesión en Vivo", id: "mTbgNrgw9NM", image: "https://img.youtube.com/vi/mTbgNrgw9NM/maxresdefault.jpg", type: "youtube" }
];

// --- Internal Helpers ---
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

export function renderSets() {
    const grid = document.getElementById('sets-grid');
    if (!grid) return;

    grid.innerHTML = playlist.map((set, index) => {
        const isYT = set.type === 'youtube';
        return `
            <div class="set-card ${isYT ? 'youtube-card' : ''}">
                <div class="set-cover-wrapper">
                    <img src="${set.image}" alt="${set.title}" class="set-cover" loading="lazy">
                    <div class="set-overlay"></div>
                    ${isYT ? '<div class="yt-icon">▶</div>' : ''}
                </div>
                <h3 class="set-title">${set.title}</h3>
                ${isYT ? 
                    `<a href="https://youtu.be/${set.id}" target="_blank" rel="noopener noreferrer" class="set-listen-btn" id="yt-set-link">Ver Video</a>` :
                    `<button class="set-listen-btn" onclick="document.dispatchEvent(new CustomEvent('load-track', { detail: { index: ${index} } }))">Escuchar</button>`
                }
            </div>
        `;
    }).join('');

    const ytLink = document.getElementById('yt-set-link');
    if (ytLink) {
        ytLink.addEventListener('click', () => {
            widget.pause();
        });
    }
}

// --- Public API ---
export function loadTrack(index) {
    const track = playlist[index];
    if (!track || !track.id) return;
    
    currentTrackIndex = index;
    trackTitleEl.textContent = track.title;
    
    const trackUrl = `https://api.soundcloud.com/tracks/${track.id}`;
    
    widget.load(trackUrl, {
        show_user: false,
        hide_related: true,
        show_comments: false,
        show_teaser: false,
        auto_play: true
    });
}

// --- Event Listeners ---
playBtn.addEventListener('click', () => {
    isPlaying ? widget.pause() : widget.play();
});

nextBtn.addEventListener('click', () => {
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    document.dispatchEvent(new CustomEvent('load-track', { detail: { index: nextIndex } }));
});

if (progressBar) {
    progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const clickedValue = x / rect.width;
        currentProgress.style.width = (clickedValue * 100) + '%';
        widget.getDuration((durationMs) => {
            widget.seekTo(durationMs * clickedValue);
        });
    });
}

// --- Widget Bindings ---
widget.bind(window.SC.Widget.Events.READY, () => {
    widget.getDuration((dur) => {
        duration = dur / 1000;
        totalTimeEl.textContent = formatTime(duration);
    });
});

widget.bind(window.SC.Widget.Events.PLAY, () => {
    isPlaying = true;
    customPlayer.classList.add('playing');
});

widget.bind(window.SC.Widget.Events.PAUSE, () => {
    isPlaying = false;
    customPlayer.classList.remove('playing');
});

widget.bind(window.SC.Widget.Events.FINISH, () => {
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    document.dispatchEvent(new CustomEvent('load-track', { detail: { index: nextIndex } }));
});

widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, (progress) => {
    const percent = (progress.currentPosition / progress.duration) * 100;
    currentProgress.style.width = percent + '%';
    currentTimeEl.textContent = formatTime(progress.currentPosition / 1000);
});

// --- Custom Events Bridge ---
document.addEventListener('load-track', (e) => loadTrack(e.detail.index));
document.addEventListener('render-sets', () => renderSets());