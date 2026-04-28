// --- [1] Firebaseから必要な機能をインポート ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- [2] 設定値（コンフィグ） ---
const firebaseConfig = {
  apiKey: "AIzaSyC07ffQp44CTQsGe6jzfo79FsI4ok5WrXc",
  authDomain: "hazimeteno-todo-list.firebaseapp.com",
  projectId: "hazimeteno-todo-list",
  storageBucket: "hazimeteno-todo-list.firebasestorage.app",
  messagingSenderId: "1028454995902",
  appId: "1:1028454995902:web:6fdf7d1fb9c40a73ea0bef",
  measurementId: "G-7EP1KTHWB8"
};

// --- [3] 初期化 ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. HTML要素の取得
const todoForm = document.getElementById('todo-form');
const inputEl = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

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