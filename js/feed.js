import { db, doc, getDoc, setDoc, updateDoc, increment } from './firebase.js';

// === FEED DATA ===
export const feedPosts = [
    {
        id: "post-1",
        date: "Abril 2025",
        image: "https://picsum.photos/seed/rodree1/800/600",
        title: "Rituales de Arena",
        shortText: "La luz se funde con el pulso de la tierra. Un ritual de sonido que nace en el silencio.",
        text: "<p>La luz se funde con el pulso de la tierra. Un ritual de sonido que nace en el silencio de la arena y muere en el baile colectivo bajo la luna menguante.</p><p>Sentir la vibración de las frecuencias bajas mezclándose con el romper de las olas no es solo música, es una reconexión con lo primario. En este set, busqué capturar esa transición entre la calma absoluta y la euforia orgánica.</p><p>Cada track fue seleccionado para honrar el espacio que habitamos. No hay pistas de baile, solo territorios que conquistamos con el movimiento.</p>"
    },
    {
        id: "post-2",
        date: "Marzo 2025",
        image: "https://picsum.photos/seed/rodree2/800/600",
        title: "Cazadores de Amaneceres",
        shortText: "Cazando amaneceres entre cables y sintetizadores. La naturaleza dicta nuestro tempo.",
        text: "<p>Cazando amaneceres entre cables y sintetizadores. La naturaleza siempre dicta el tempo de nuestra noche, marcando el final de un ciclo y el inicio de otro.</p><p>Cuando el primer rayo de sol toca la controladora, el sonido cambia. Se vuelve más etéreo, más ligero, acompañando el despertar del mundo mientras nosotros nos negamos a dormir.</p><p>La curaduría en estos momentos es crítica: es el puente entre la oscuridad profunda del club y la claridad infinita del horizonte costero.</p>"
    },
    {
        id: "post-3",
        date: "Febrero 2025",
        image: "https://picsum.photos/seed/rodree3/800/600",
        title: "Tribu Digital",
        shortText: "Texturas que viajan del mar a la pista. El eco de una tribu que baila bajo las estrellas.",
        text: "<p>Texturas que viajan del mar a la pista. El eco de una tribu digital que baila bajo las estrellas de la costa, unida por un mismo pulso invisible.</p><p>La tecnología nos permite crear estos oasis sonoros en cualquier rincón del mundo. Somos nómadas armados con ritmos afro-house y texturas orgánicas que desafían el paso del tiempo.</p><p>Gracias a todos los que formaron parte de esta ceremonia. La música es el lenguaje, pero el baile es la respuesta.</p>"
    }
];

export async function loadFeedLikeCounts() {
    for (const post of feedPosts) {
        const docRef = doc(db, "likes", post.id);
        const docSnap = await getDoc(docRef);
        const countEl = document.querySelector(`#card-like-${post.id} .card-like-count`);
        if (countEl) {
            countEl.textContent = docSnap.exists() ? docSnap.data().count : '0';
        }
    }
}

export function renderFeed(revealObserver) {
    const container = document.getElementById('feed-container');
    if (!container) return;
    container.innerHTML = feedPosts.map(post => {
        const isLiked = localStorage.getItem(`liked-${post.id}`) === 'true';
        return `
            <div class="feed-card reveal-on-scroll" onclick="openPost('${post.id}')">
                <div class="feed-date">${post.date}</div>
                <div class="feed-image">
                    <img src="${post.image}" alt="${post.title}">
                </div>
                <div class="feed-text">
                    <strong>${post.title}</strong><br>
                    ${post.shortText}
                </div>
                <div class="feed-footer">
                    <div class="card-like-preview" id="card-like-${post.id}">
                        <span class="card-like-icon ${isLiked ? 'active' : ''}">${isLiked ? '♥' : '♡'}</span>
                        <span class="card-like-count">...</span>
                    </div>
                    <span class="read-more">Leer más →</span>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.feed-card').forEach(el => revealObserver.observe(el));
    loadFeedLikeCounts();
}

export const openPost = async (postId) => {
    const post = feedPosts.find(p => p.id === postId);
    if (!post) return;

    document.getElementById('p-image').src = post.image;
    document.getElementById('p-date').textContent = post.date;
    document.getElementById('p-title').textContent = post.title;
    document.getElementById('p-body').innerHTML = post.text;
    
    const likeBtn = document.getElementById('main-like-btn');
    likeBtn.setAttribute('data-id', postId);
    
    const isLiked = localStorage.getItem(`liked-${postId}`) === 'true';
    likeBtn.classList.toggle('active', isLiked);
    likeBtn.querySelector('.like-icon').textContent = isLiked ? '♥' : '♡';
    likeBtn.querySelector('.like-count').textContent = '...';

    window.switchView('post-view');

    const docRef = doc(db, "likes", postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        likeBtn.querySelector('.like-count').textContent = docSnap.data().count;
    } else {
        await setDoc(docRef, { count: 0 });
        likeBtn.querySelector('.like-count').textContent = '0';
    }
};
window.openPost = openPost;

export const handleLike = async (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const postId = btn.getAttribute('data-id');
    const countSpan = btn.querySelector('.like-count');
    const iconSpan = btn.querySelector('.like-icon');
    const isLiked = localStorage.getItem(`liked-${postId}`) === 'true';
    
    const docRef = doc(db, "likes", postId);
    
    if (!isLiked) {
        await updateDoc(docRef, { count: increment(1) });
        localStorage.setItem(`liked-${postId}`, 'true');
        btn.classList.add('active');
        iconSpan.textContent = '♥';
        countSpan.textContent = parseInt(countSpan.textContent) + 1;
    } else {
        await updateDoc(docRef, { count: increment(-1) });
        localStorage.removeItem(`liked-${postId}`);
        btn.classList.remove('active');
        iconSpan.textContent = '♡';
        countSpan.textContent = Math.max(0, parseInt(countSpan.textContent) - 1);
    }
};