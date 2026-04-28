import { db, doc, getDoc, setDoc, updateDoc, increment, collection, getDocs, orderBy, query } from '../firebase.js';

/**
 * Obtiene todos los posts ordenados por fecha de creación.
 */
export async function fetchPosts() {
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

/**
 * Obtiene el conteo de likes de un post específico.
 */
export async function fetchLikeCount(postId) {
    const docRef = doc(db, "likes", postId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().count : null;
}

/**
 * Inicializa o actualiza el documento de likes.
 */
export async function createLikeDoc(postId) {
    const docRef = doc(db, "likes", postId);
    await setDoc(docRef, { count: 0 });
}

export async function updateLikeCount(postId, amount) {
    const docRef = doc(db, "likes", postId);
    await updateDoc(docRef, { count: increment(amount) });
}