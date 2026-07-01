import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyC07ffQp44CTQsGe6jzfo79FsI4ok5WrXc",
    authDomain: "hazimeteno-todo-list.firebaseapp.com",
    projectId: "hazimeteno-todo-list",
    storageBucket: "hazimeteno-todo-list.firebasestorage.app",
    messagingSenderId: "1028454995902",
    appId: "1:1028454995902:web:6fdf7d1fb9c40a73ea0bef",
    measurementId: "G-7EP1KTHWB8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- [重要] HTMLの要素をすべて取得 ---
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const todoForm = document.getElementById('todo-form');
const inputEl = document.getElementById('todo-input'); 
const todoList = document.getElementById('todo-list'); 

let unsubscribe = null;

// --- ログイン・ログアウトの処理 ---
loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) {
            alert("エラー: " + err.message);
        }
    }
});

logoutBtn.addEventListener('click', () => signOut(auth));

// --- ログイン状態の監視 ---
onAuthStateChanged(auth, (user) => {
    const loginForm = document.getElementById('login-form');
    const userInfo = document.getElementById('user-info');
    const userEmail = document.getElementById('user-email');
    const userStatus = document.getElementById('user-status');

    if (user) {
        loginForm.style.display = "none";
        userInfo.style.display = "block";
        userStatus.style.display = "none";
        userEmail.textContent = user.email;
        startListing(user.uid);
    } else {
        loginForm.style.display = "block";
        userInfo.style.display = "none";
        userStatus.textContent = "ログインしてください";
        userStatus.style.display = "block";
        todoList.innerHTML = "";
        if (unsubscribe) unsubscribe();
    }
});

// --- データの読み込み ---
function startListing(uid) {
    const q = query(
        collection(db, "todos"), 
        where("uid", "==", uid),
        orderBy("createdAt", "desc")
    );

    unsubscribe = onSnapshot(q, (snapshot) => {
        todoList.innerHTML = "";
        snapshot.forEach((docData) => {
            const todo = docData.data();
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${todo.text}</span> 
                <button class="delete-btn" data-id="${docData.id}">削除</button>
            `;
            li.querySelector('.delete-btn').addEventListener('click', () => {
                deleteDoc(doc(db, "todos", docData.id));
            });
            todoList.appendChild(li);
        });
    });
}

// --- データの保存 ---
todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const taskText = inputEl.value.trim();

    if (!user) return alert("ログインしてください");
    if (!taskText) return;

    try {
        await addDoc(collection(db, "todos"), {
            text: taskText,
            uid: user.uid,
            createdAt: serverTimestamp()
        });
        inputEl.value = "";
    } catch (error) {
        console.error("エラー:", error);
    }
});