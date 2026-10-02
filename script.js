const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskName");
const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");
const taskCount = document.getElementById("taskCount");

const STORAGE_KEY = "academicTasks";

function loadTasks() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        return [];
    }
}

function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        return;
    }
}

function addTask(text) {
    tasks.push({ id: Date.now(), text: text, done: false });
}

function toggleTask(id) {
    tasks = tasks.map(function (task) {
        return task.id === id ? { id: task.id, text: task.text, done: !task.done } : task;
    });
}

function deleteTask(id) {
    tasks = tasks.filter(function (task) {
        return task.id !== id;
    });
}

function createTaskItem(task) {
    const item = document.createElement("li");
    item.dataset.id = task.id;
    if (task.done) {
        item.classList.add("done");
    }

    const label = document.createElement("label");
    label.className = "task-label";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    label.append(checkbox, text);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "delete-btn";
    removeButton.textContent = "Delete";
    removeButton.setAttribute("aria-label", "Delete task: " + task.text);

    item.append(label, removeButton);
    return item;
}

function render() {
    taskList.innerHTML = "";
    tasks.forEach(function (task) {
        taskList.appendChild(createTaskItem(task));
    });

    const completed = tasks.filter(function (task) {
        return task.done;
    }).length;

    emptyMessage.hidden = tasks.length > 0;
    taskCount.hidden = tasks.length === 0;
    taskCount.textContent = completed + " of " + tasks.length + " completed";
}

let tasks = loadTasks();

if (taskForm) {
    taskForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const text = taskInput.value.trim();

        if (text === "") {
            taskInput.focus();
            return;
        }

        addTask(text);
        saveTasks();
        render();
        taskForm.reset();
        taskInput.focus();
    });

    taskList.addEventListener("change", function (event) {
        const item = event.target.closest("li");
        if (item && event.target.type === "checkbox") {
            toggleTask(Number(item.dataset.id));
            saveTasks();
            render();
        }
    });

    taskList.addEventListener("click", function (event) {
        const button = event.target.closest(".delete-btn");
        if (button) {
            deleteTask(Number(button.closest("li").dataset.id));
            saveTasks();
            render();
        }
    });

    render();
}