import { db, doc, getDoc, setDoc, updateDoc, increment, collection, getDocs, orderBy, query } from './firebase.js';

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { 
        if (entry.isIntersecting) entry.target.classList.add('is-visible'); 
    });
}, { threshold: 0.05 });

let livePosts = [];

export async function loadPostsFromFirestore() {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title,
            date: data.date,
            shortText: data.shortText,
            text: data.body,
            image: data.imageUrl
        };
    });
}

export async function loadFeedLikeCounts() {
    for (const post of livePosts) {
        const docRef = doc(db, "likes", post.id);
        const docSnap = await getDoc(docRef);
        const countEl = document.querySelector(`#card-like-${post.id} .card-like-count`);
        if (countEl) {
            countEl.textContent = docSnap.exists() ? docSnap.data().count : '0';
        }
    }
}

export async function renderFeed() {
    const container = document.getElementById('feed-container');
    if (!container) return;

    // PART 1: Loading State (Skeletons)
    const skeletonHTML = `
        <div class="skeleton-card">
            <div class="skeleton-line" style="width: 20%; margin: 24px 24px 12px;"></div>
            <div class="skeleton-image"></div>
            <div class="skeleton-line" style="width: 70%; margin-top: 24px;"></div>
            <div class="skeleton-line" style="width: 100%;"></div>
            <div class="skeleton-line" style="width: 90%; margin-bottom: 24px;"></div>
        </div>
    `;
    container.innerHTML = skeletonHTML.repeat(3);

    
    livePosts = await loadPostsFromFirestore();

    // PART 2: Empty State
    if (livePosts.length === 0) {
        container.innerHTML = `
            <div class="feed-empty-state">
                <h3>Nada por acá todavía.</h3>
                <p>El próximo ritual se está preparando.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = livePosts.map(post => {
        const isLiked = localStorage.getItem(`liked-${post.id}`) === 'true';
        return `
            <div class="feed-card reveal-on-scroll" data-post-id="${post.id}">
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

    container.querySelectorAll('.feed-card').forEach(card => {
    card.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('open-post', { 
            detail: { postId: card.dataset.postId } 
        }));
    });
});

document.querySelectorAll('.feed-card').forEach(el => revealObserver.observe(el));


loadFeedLikeCounts();
    
}

export const openPost = async (postId) => {
    const post = livePosts.find(p => p.id === postId);
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

    // Add/Update Share Button in footer
    const footer = document.querySelector('.post-full-footer');
    let shareBtn = document.getElementById('share-post-btn');
    if (!shareBtn) {
        shareBtn = document.createElement('button');
        shareBtn.id = 'share-post-btn';
        shareBtn.className = 'like-btn'; // Reusing style for minimal aesthetic
        shareBtn.style.marginLeft = '10px';
        footer.appendChild(shareBtn);
    }
    shareBtn.textContent = 'Share';
    shareBtn.onclick = (e) => copyShareLink(postId, e.target);

    document.dispatchEvent(new CustomEvent('switch-view', { detail: { sectionId: 'post-view' } }));

    const docRef = doc(db, "likes", postId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
        likeBtn.querySelector('.like-count').textContent = docSnap.data().count;
    } else {
        await setDoc(docRef, { count: 0 });
        likeBtn.querySelector('.like-count').textContent = '0';
    }
};


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

// === SHARE LOGIC ===
export function copyShareLink(postId, btn) {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        const originalText = btn.textContent;
        btn.textContent = 'Link Copied';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
}
