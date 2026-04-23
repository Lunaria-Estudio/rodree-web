import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, getDocs, deleteDoc, orderBy, query } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCxC2MZLWWZkw12Bs1UO5B9bOf4KTT4yKo",
    authDomain: "rodree-b84d0.firebaseapp.com",
    projectId: "rodree-b84d0",
    storageBucket: "rodree-b84d0.firebasestorage.app",
    messagingSenderId: "584298469864",
    appId: "1:584298469864:web:3cafdf792cfa846cc96c5d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export { doc, getDoc, setDoc, updateDoc, increment, collection, addDoc, getDocs, deleteDoc, orderBy, query };