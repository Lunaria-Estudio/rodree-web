let isZenMode = false;
let animationFrame = null;
let pos = { x: 100, y: 100 };
let vel = { x: 0.8, y: 0.8 };
let phase2Timer = null;
let phase3Timer = null;

const getPlayer = () => document.getElementById('custom-player');

function startFloating() {
    const player = getPlayer();
    if (!player || !isZenMode) return;

    const rect = player.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (pos.x + rect.width >= vw || pos.x <= 0) vel.x *= -1;
    if (pos.y + rect.height >= vh || pos.y <= 0) vel.y *= -1;

    pos.x += vel.x;
    pos.y += vel.y;

    player.style.left = `${pos.x}px`;
    player.style.top = `${pos.y}px`;

    animationFrame = requestAnimationFrame(startFloating);
}

export function activateZenMode() {
    if (window.innerWidth <= 768) return; // Sin zen mode en móvil
    if (isZenMode) return;
    document.body.classList.add('zen-active');

    const player = getPlayer();
    if (player) {
        const rect = player.getBoundingClientRect();
        pos.x = rect.left;
        pos.y = rect.top;
    }

    startFloating();

    // Fase 2: menú desaparece al minuto y medio (90 seg)
    phase2Timer = setTimeout(() => {
        document.body.classList.add('zen-phase-2');
    }, 10 * 1000);

    // Fase 3: título desaparece a los 3 min y medio (210 seg desde fase 1)
    phase3Timer = setTimeout(() => {
        document.body.classList.add('zen-phase-3');
    }, 20 * 1000);
}

export function deactivateZenMode() {
    if (!isZenMode) return;
    isZenMode = false;

    document.body.classList.remove('zen-active');
    document.body.classList.remove('zen-phase-2');
    document.body.classList.remove('zen-phase-3');

    clearTimeout(phase2Timer);
    clearTimeout(phase3Timer);
    cancelAnimationFrame(animationFrame);

    const player = getPlayer();
    if (player && window.innerWidth > 768) {
        player.style.left = '';
        player.style.top = '';
    }
}