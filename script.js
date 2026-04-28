const addBtn = document.getElementById('add-btn');

addBtn.addEventListener('click', () => {
    const input = document.getElementById('todo-input');
    const task = input.value;
    if (task === '') return;

    const ul = document.getElementById('todo-list');
    const li = document.createElement('li');
    li.innerHTML = `<span>${task}</span> <button onclick="this.parentElement.remove()">削除</button>`;
    ul.appendChild(li);
    input.value = '';
});