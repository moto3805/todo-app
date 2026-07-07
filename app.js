// 要素を取得
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const prioritySelect = document.getElementById('prioritySelect');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');
const categoryInput = document.getElementById('categoryInput');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
const sortSelect = document.getElementById('sortSelect');
const categoryTags = document.getElementById('categoryTags');

// ローカルストレージからタスクを読み込む
let todos = JSON.parse(localStorage.getItem('todos')) || [];

// フィルター・検索・ソートの状態
let currentFilter = 'all';
let currentSearch = '';
let currentSort = 'default';
let selectedCategory = null;

// 初期表示
renderCategoryTags();
renderTodos();

// 追加ボタンのクリックイベント
addBtn.addEventListener('click', addTodo);

// Enterキーでも追加できるようにする
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

// 検索イベント
searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase();
    renderTodos();
});

// フィルターイベント
filterSelect.addEventListener('change', (e) => {
    currentFilter = e.target.value;
    renderTodos();
});

// ソートイベント
sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderTodos();
});

// タスクを追加する関数
function addTodo() {
    const text = todoInput.value.trim();

    if (text === '') {
        alert('タスクを入力してください！');
        return;
    }

    const todo = {
        id: Date.now(),
        text: text,
        completed: false,
        priority: prioritySelect.value,
        startDate: startDate.value,
        endDate: endDate.value,
        progress: 0,
        category: categoryInput.value.trim()
    };

    todos.push(todo);
    saveTodos();
    renderCategoryTags();
    renderTodos();

    todoInput.value = '';
    startDate.value = '';
    endDate.value = '';
    categoryInput.value = '';
    prioritySelect.value = 'medium';
    todoInput.focus();
}

// タスクを削除する関数
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderCategoryTags();
    renderTodos();
}

// 完了状態を切り替える関数
function toggleTodo(id) {
    todos = todos.map(todo => {
        if (todo.id === id) {
            todo.completed = !todo.completed;
            if (todo.completed) {
                todo.progress = 100;
            }
        }
        return todo;
    });
    saveTodos();
    renderTodos();
}

// 進捗を更新する関数
function updateProgress(id, change) {
    todos = todos.map(todo => {
        if (todo.id === id) {
            todo.progress = Math.max(0, Math.min(100, (todo.progress || 0) + change));
            if (todo.progress === 100) {
                todo.completed = true;
            } else {
                todo.completed = false;
            }
        }
        return todo;
    });
    saveTodos();
    renderTodos();
}

// 優先度の日本語表示
function getPriorityText(priority) {
    const priorities = {
        high: '高',
        medium: '中',
        low: '低'
    };
    return priorities[priority] || '中';
}

// 日付をフォーマットする関数
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
}

// カテゴリータグを表示する関数
function renderCategoryTags() {
    const categories = {};

    todos.forEach(todo => {
        if (todo.category) {
            categories[todo.category] = (categories[todo.category] || 0) + 1;
        }
    });

    if (Object.keys(categories).length === 0) {
        categoryTags.innerHTML = '';
        return;
    }

    categoryTags.innerHTML = Object.entries(categories)
        .map(([category, count]) => `
            <div class="category-tag ${selectedCategory === category ? 'active' : ''}" data-category="${category}">
                ${category} <span class="count">${count}</span>
            </div>
        `).join('');

    categoryTags.querySelectorAll('.category-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const category = tag.dataset.category;
            selectedCategory = selectedCategory === category ? null : category;
            renderCategoryTags();
            renderTodos();
        });
    });
}

// タスクをフィルタリングする関数
function filterTodos(todos) {
    let filtered = [...todos];

    // フィルター（完了/未完了）
    if (currentFilter === 'active') {
        filtered = filtered.filter(todo => !todo.completed);
    } else if (currentFilter === 'completed') {
        filtered = filtered.filter(todo => todo.completed);
    }

    // 検索
    if (currentSearch) {
        filtered = filtered.filter(todo =>
            todo.text.toLowerCase().includes(currentSearch) ||
            (todo.category && todo.category.toLowerCase().includes(currentSearch))
        );
    }

    // カテゴリー選択
    if (selectedCategory) {
        filtered = filtered.filter(todo => todo.category === selectedCategory);
    }

    return filtered;
}

// タスクをソートする関数
function sortTodos(todos) {
    const sorted = [...todos];

    switch (currentSort) {
        case 'priority':
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            sorted.sort((a, b) => {
                const aPriority = priorityOrder[a.priority || 'medium'];
                const bPriority = priorityOrder[b.priority || 'medium'];
                return aPriority - bPriority;
            });
            break;

        case 'startDate':
            sorted.sort((a, b) => {
                if (!a.startDate) return 1;
                if (!b.startDate) return -1;
                return new Date(a.startDate) - new Date(b.startDate);
            });
            break;

        case 'endDate':
            sorted.sort((a, b) => {
                if (!a.endDate) return 1;
                if (!b.endDate) return -1;
                return new Date(a.endDate) - new Date(b.endDate);
            });
            break;

        case 'progress':
            sorted.sort((a, b) => (a.progress || 0) - (b.progress || 0));
            break;

        case 'default':
        default:
            sorted.sort((a, b) => b.id - a.id);
            break;
    }

    return sorted;
}

// タスクを画面に表示する関数
function renderTodos() {
    todoList.innerHTML = '';

    if (todos.length === 0) {
        todoList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">タスクがありません</p>';
        return;
    }

    let displayTodos = filterTodos(todos);
    displayTodos = sortTodos(displayTodos);

    if (displayTodos.length === 0) {
        todoList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">該当するタスクがありません</p>';
        return;
    }

    displayTodos.forEach(todo => {
        const li = document.createElement('li');
        const priority = todo.priority || 'medium';
        li.className = `todo-item priority-${priority} ${todo.completed ? 'completed' : ''}`;

        const detailsHTML = [];
        if (todo.startDate) {
            detailsHTML.push(`<div class="todo-detail-item">📅 開始: ${formatDate(todo.startDate)}</div>`);
        }
        if (todo.endDate) {
            detailsHTML.push(`<div class="todo-detail-item">🏁 終了: ${formatDate(todo.endDate)}</div>`);
        }

        const progress = todo.progress || 0;

        const categoryHTML = todo.category ? `<span class="category-badge">🏷️ ${todo.category}</span>` : '';

        li.innerHTML = `
            <div class="todo-header">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="todo-text">${todo.text}</span>
                ${categoryHTML}
                <span class="priority-badge ${priority}">${getPriorityText(priority)}</span>
            </div>
            ${detailsHTML.length > 0 ? `<div class="todo-details">${detailsHTML.join('')}</div>` : ''}
            <div class="progress-section">
                <div class="progress-label">
                    <span>進捗</span>
                    <span>${progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-controls">
                    <button class="progress-btn decrease">-10%</button>
                    <button class="progress-btn increase">+10%</button>
                    <button class="progress-btn set-50">50%</button>
                    <button class="progress-btn set-100">完了</button>
                </div>
            </div>
            <div class="todo-actions">
                <button class="delete-btn">削除</button>
            </div>
        `;

        // チェックボックスのイベント
        const checkbox = li.querySelector('.todo-checkbox');
        checkbox.addEventListener('change', () => toggleTodo(todo.id));

        // 進捗ボタンのイベント
        li.querySelector('.decrease').addEventListener('click', () => updateProgress(todo.id, -10));
        li.querySelector('.increase').addEventListener('click', () => updateProgress(todo.id, 10));
        li.querySelector('.set-50').addEventListener('click', () => {
            todos = todos.map(t => t.id === todo.id ? {...t, progress: 50, completed: false} : t);
            saveTodos();
            renderTodos();
        });
        li.querySelector('.set-100').addEventListener('click', () => {
            todos = todos.map(t => t.id === todo.id ? {...t, progress: 100, completed: true} : t);
            saveTodos();
            renderTodos();
        });

        // 削除ボタンのイベント
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

        todoList.appendChild(li);
    });
}

// ローカルストレージに保存する関数
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}
