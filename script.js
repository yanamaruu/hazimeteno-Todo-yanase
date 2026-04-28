// --- [1] Firebaseから必要な機能をインポート ---
// --- [1] インポートに "getAuth" 関連を追加 ---
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
const auth = getAuth(app); // 認証機能を初期化

const todoform = document.getElementById('todo-form');

// --- [2] ログイン・ログアウトの処理 ---
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');

// ログイン・新規登録ボタン
loginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    try {
        // ログインを試みる（失敗したら新規登録する）
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) {
            alert("エラーが発生しました: " + err.message);
        }
    }
});

// ログアウトボタン
logoutBtn.addEventListener('click', () => signOut(auth));

// --- [3] ユーザーのログイン状態を監視する ---
let unsubscribe = null; // 監視解除用の変数

onAuthStateChanged(auth, (user) => {
    const loginForm = document.getElementById('login-form');
    const userInfo = document.getElementById('user-info');
    const userEmail = document.getElementById('user-email');

    if (user) {
        // ログイン中
        loginForm.style.display = "none";
        userInfo.style.display = "block";
        userEmail.textContent = user.email;
        startListing(user.uid); // その人のタスクを表示開始
    } else {
        // ログアウト中
        loginForm.style.display = "block";
        userInfo.style.display = "none";
        document.getElementById('todo-list').innerHTML = ""; // リストを空に
        if (unsubscribe) unsubscribe(); // 監視を止める
    }
});

// --- [4] その人のデータだけを読み書きする関数 ---
function startListing(uid) {
    // 自分のUID（ユーザー固有ID）に一致するデータだけを取得
    const q = query(
        collection(db, "todos"), 
        where("uid", "==", uid), // ここがポイント！
        orderBy("createdAt", "desc")
    );

    unsubscribe = onSnapshot(q, (snapshot) => {
        const todoList = document.getElementById('todo-list');
        todoList.innerHTML = "";
        snapshot.forEach((docData) => {
            const todo = docData.data();
            const li = document.createElement('li');
            li.innerHTML = `<span>${todo.text}</span> <button class="delete-btn" data-id="${docData.id}">削除</button>`;
            li.querySelector('.delete-btn').addEventListener('click', () => deleteDoc(doc(db, "todos", docData.id)));
            todoList.appendChild(li);
        });
    });
}

// 保存ボタンの処理を修正
document.getElementById('todo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("ログインしてください");

    const inputEl = document.getElementById('todo-input');
    await addDoc(collection(db, "todos"), {
        text: inputEl.value,
        uid: user.uid, // 誰のタスクか記録する
        createdAt: serverTimestamp()
    });
    inputEl.value = "";
});

// 3. クラウド（Firestore）からデータをリアルタイムで読み出す
// データベースが更新されるたびに、この中身が自動で実行されます
const q = query(collection(db, "todos"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
    todoList.innerHTML = ""; // 一旦リストを空にする
    
    snapshot.forEach((docData) => {
        const todo = docData.data();
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${todo.text}</span>
            <button class="delete-btn" data-id="${docData.id}">削除</button>
        `;
        
        // 削除ボタンの処理
        li.querySelector('.delete-btn').addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            await deleteDoc(doc(db, "todos", id));
        });
        
        todoList.appendChild(li);
    });
});

// 4. 新しいタスクをクラウドに保存する
todoForm.addEventListener('submit', async (e) => {
    console.log("ボタンが押されました！");
    e.preventDefault();
    const taskText = inputEl.value.trim();
    if (!taskText) return;

    try {
        // Firebaseの"todos"というコレクション（箱）に追加
        await addDoc(collection(db, "todos"), {
            text: taskText,
            createdAt: serverTimestamp() // 作成時間を記録（並び替え用）
        });
        inputEl.value = '';
    } catch (error) {
        console.error("保存に失敗しました: ", error);
    }
});