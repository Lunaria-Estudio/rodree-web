import { renderFeed, handleLike, openPost } from './feed.js';

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { 
        if (entry.isIntersecting) entry.target.classList.add('is-visible'); 
    });
}, { threshold: 0.05 });

// === SOUND CLOUD PLAYER ===
const iframe = document.getElementById('sc-widget');
const widget = window.SC.Widget(iframe);

const playBtn = document.getElementById('play-btn');
const nextBtn = document.getElementById('next-btn');
const customPlayer = document.getElementById('custom-player');
const currentProgress = document.getElementById('current-progress');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');
const trackTitleEl = document.getElementById('track-title');

let currentTrackIndex = 0;
let isPlaying = false;
let duration = 0;

const playlist = [
    { title: "RODREE | Nocturnal Ritual", id: "2262729761", image: "https://i1.sndcdn.com/artworks-zRWv8x0LY2Id8kBL-DOP5Pg-t1080x1080.jpg", type: "soundcloud" },
    { title: "RODREE | Afro Set VOL1", id: "2068822248", image: "https://i1.sndcdn.com/artworks-QIyEEKeWfoW1L2Fz-DhJHDA-t1080x1080.png", type: "soundcloud" },
    { title: "RODREE | Afro & Latin House", id: "1720443096", image: "https://i1.sndcdn.com/artworks-5zIz7OMSSx3zV4ei-JjzmaQ-t1080x1080.jpg", type: "soundcloud" },
    { title: "Sesión en Vivo", id: "mTbgNrgw9NM", image: "https://img.youtube.com/vi/mTbgNrgw9NM/maxresdefault.jpg", type: "youtube" }
];

export function loadTrack(index) {
    const track = playlist[index];
    if (!track.id) return;
    
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

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

playBtn.addEventListener('click', () => {
    if (isPlaying) {
        widget.pause();
    } else {
        widget.play();
    }
});

nextBtn.addEventListener('click', () => {
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    document.dispatchEvent(new CustomEvent('load-track', { detail: { index: nextIndex } }));
});

widget.bind(window.SC.Widget.Events.FINISH, () => {
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    document.dispatchEvent(new CustomEvent('load-track', { detail: { index: nextIndex } }));
});

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

widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, (progress) => {
    const percent = (progress.currentPosition / progress.duration) * 100;
    currentProgress.style.width = percent + '%';
    currentTimeEl.textContent = formatTime(progress.currentPosition / 1000);
});

const progressBar = document.getElementById('progress-bar');
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

// === NAVEGACIÓN ===
const menuItems = document.querySelectorAll('.icon-item');
const views = document.querySelectorAll('.view');
const mainHeader = document.getElementById('main-header');

function switchView(sectionId) {
    views.forEach(v => v.classList.remove('active'));
    menuItems.forEach(i => i.classList.remove('active'));

    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');

    const activeItem = document.querySelector(`.icon-item[data-section="${sectionId}"]`);
    if (activeItem) activeItem.classList.add('active');

    const player = document.getElementById('custom-player');
    if (sectionId === 'home-view') {
        mainHeader.classList.remove('visible');
        if (player) {
            player.style.opacity = "1";
            player.style.pointerEvents = "auto";
        }
    } else {
        mainHeader.classList.add('visible');
        if (player) {
            player.style.opacity = "0";
            player.style.pointerEvents = "none";
        }
    }
    document.querySelector('.content').scrollTop = 0;
}

document.getElementById('main-like-btn')?.addEventListener('click', handleLike);
document.getElementById('back-to-feed')?.addEventListener('click', () => document.dispatchEvent(new CustomEvent('switch-view', { detail: { sectionId: 'feed-view' } })));
menuItems.forEach(item => item.addEventListener('click', () => document.dispatchEvent(new CustomEvent('switch-view', { detail: { sectionId: item.getAttribute('data-section') } }))));
document.getElementById('home-logo')?.addEventListener('click', () => document.dispatchEvent(new CustomEvent('switch-view', { detail: { sectionId: 'home-view' } })));

// === BRIDGE DE EVENTOS (Reemplaza a window.X) ===
document.addEventListener('load-track', (e) => loadTrack(e.detail.index));
document.addEventListener('render-sets', () => renderSets());
document.addEventListener('switch-view', (e) => switchView(e.detail.sectionId));
document.addEventListener('open-post', (e) => openPost(e.detail.postId));

// Inicializar el observador para elementos que aparecen al hacer scroll
const initScrollReveal = () => {
    document.querySelectorAll('.reveal-on-scroll').forEach(el => revealObserver.observe(el));
};

const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('sub-email');
        const submitBtn = document.getElementById('sub-btn');
        const messageEl = document.getElementById('sub-message');

        submitBtn.disabled = true;
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'PROCESANDO...';
        messageEl.classList.add('hidden');

        try {
            const response = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput.value })
            });
            const data = await response.json();
            messageEl.textContent = data.message;
            messageEl.classList.remove('hidden');
            if (response.ok) {
                messageEl.style.color = '#c8a96e';
                newsletterForm.reset();
            } else {
                messageEl.style.color = '#ff4444';
            }
        } catch (error) {
            messageEl.textContent = 'Error de conexión. Intentá más tarde.';
            messageEl.classList.remove('hidden');
            messageEl.style.color = '#ff4444';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Primero disparamos la navegación para que la UI responda instantáneamente
    document.querySelector('.icon-item[data-section="bio"]')?.classList.add('active');
    document.dispatchEvent(new CustomEvent('switch-view', { detail: { sectionId: 'bio' } }));
    
    // 2. Activamos el observador de scroll para los elementos de la Bio y otras secciones
    initScrollReveal();

    // 3. Cargamos el resto de los componentes
    document.dispatchEvent(new CustomEvent('render-sets'));

    const urlParams = new URLSearchParams(window.location.search);
    let postId = urlParams.get('post');

    if (!postId && window.location.pathname.startsWith('/post/')) {
        postId = window.location.pathname.split('/post/')[1];
    }

    if (postId) {
        document.dispatchEvent(new CustomEvent('open-post', { detail: { postId } }));
    }

    // 4. El feed se carga al final por ser asíncrono y pesado
    await renderFeed();
});
