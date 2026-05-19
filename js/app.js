import { renderFeed, handleLike, openPost } from './feed.js';
import { loadTrack, renderSets } from './components/player.js';
import { activateZenMode, deactivateZenMode } from './components/zenMode.js';

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { 
        if (entry.isIntersecting) entry.target.classList.add('is-visible'); 
    });
}, { threshold: 0.05 });

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
    function getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour >= 8  && hour < 19) return 'day';
        if (hour >= 19 && hour < 23) return 'sunset';
        return 'night';
    }

    function applyTimeBackground() {
    const video = document.getElementById('video-bg');
    if (!video) return;

    const time = getTimeOfDay();

    const config = {
        day:    { src: 'assets/Video Playa 1080.mp4',     poster: 'assets/poster-day.jpg' },
        sunset: { src: 'assets/Video Atardecer 1080.mp4', poster: 'assets/poster-sunset.jpg' },
            night:  { src: 'assets/Video Atardecer 1080.mp4', poster: 'assets/poster-sunset.jpg' }
    };

    const { src, poster } = config[time];
    const source = video.querySelector('source');

    if (source.src.endsWith(src)) return; // Ya está cargado el video correcto

    video.poster = poster;
    source.src = src;
    video.load();
}

applyTimeBackground();
    // --- ZEN MODE INITIALIZATION ---
    const IDLE_TIME = 5 * 60 * 1000; // 5 minutos de inactividad
    let idleTimer;

    const resetIdleTimer = () => {
        deactivateZenMode();
        clearTimeout(idleTimer);
        idleTimer = setTimeout(activateZenMode, IDLE_TIME);
    };

    ['click', 'keydown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, resetIdleTimer);
});

window.addEventListener('mousemove', () => {
    deactivateZenMode();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(activateZenMode, IDLE_TIME);
});

    // 1. Primero disparamos la navegación para que la UI responda instantáneamente
    document.querySelector('.icon-item[data-section="home-view"]')?.classList.add('active');
    document.dispatchEvent(new CustomEvent('switch-view', { detail: { sectionId: 'home-view' } }));
    
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
