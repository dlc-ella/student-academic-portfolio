const PLANNER_KEY = "academicTasks";
const SORT_KEY = "academicSort";
const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };
const PRIORITY_LABEL = { high: "High", medium: "Medium", low: "Low" };
const SORT_MODES = ["manual", "deadline", "priority"];
const DAY_MS = 24 * 60 * 60 * 1000;

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
        node.className = className;
    }
    if (text !== undefined) {
        node.textContent = text;
    }
    return node;
}

function makeInput(type, name, value) {
    const input = el("input");
    input.type = type;
    input.name = name;
    input.value = value;
    return input;
}

function makeLabel(text, control) {
    const label = el("label");
    label.append(text, control);
    return label;
}

function makePrioritySelect(name, value) {
    const select = el("select");
    select.name = name;
    ["low", "medium", "high"].forEach((key) => {
        const option = el("option", "", PRIORITY_LABEL[key]);
        option.value = key;
        option.selected = key === value;
        select.append(option);
    });
    return select;
}

function actionButton(className, label, ariaLabel, disabled) {
    const button = el("button", className, label);
    button.type = "button";
    button.setAttribute("aria-label", ariaLabel);
    button.disabled = Boolean(disabled);
    return button;
}

function normalizeTask(raw) {
    return {
        id: raw.id,
        text: String(raw.text),
        done: Boolean(raw.done),
        course: String(raw.course || ""),
        due: /^\d{4}-\d{2}-\d{2}$/.test(raw.due) ? raw.due : "",
        priority: PRIORITY_WEIGHT[raw.priority] ? raw.priority : "medium"
    };
}

function loadTasks() {
    try {
        const saved = JSON.parse(localStorage.getItem(PLANNER_KEY));
        if (!Array.isArray(saved)) {
            return [];
        }
        return saved
            .filter((item) => item && typeof item.text === "string" && item.text.trim() !== "")
            .map(normalizeTask);
    } catch (error) {
        return [];
    }
}

function saveTasks(tasks) {
    try {
        localStorage.setItem(PLANNER_KEY, JSON.stringify(tasks));
    } catch (error) {
        return;
    }
}

function loadSort() {
    try {
        const saved = localStorage.getItem(SORT_KEY);
        return SORT_MODES.includes(saved) ? saved : "manual";
    } catch (error) {
        return "manual";
    }
}

function saveSort(mode) {
    try {
        localStorage.setItem(SORT_KEY, mode);
    } catch (error) {
        return;
    }
}

function parseDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysUntil(value) {
    return Math.round((parseDate(value) - startOfToday()) / DAY_MS);
}

function plural(count, word) {
    return count + " " + word + (count === 1 ? "" : "s");
}

function formatDate(value) {
    const date = parseDate(value);
    const options = { weekday: "short", day: "numeric", month: "short" };
    if (date.getFullYear() !== new Date().getFullYear()) {
        options.year = "numeric";
    }
    return date.toLocaleDateString(undefined, options);
}

function describeDue(task) {
    if (task.due === "") {
        return null;
    }

    const result = { date: formatDate(task.due), status: "", state: "" };
    if (task.done) {
        return result;
    }

    const days = daysUntil(task.due);
    if (days < 0) {
        result.status = "Overdue by " + plural(-days, "day");
        result.state = "overdue";
    } else if (days === 0) {
        result.status = "Due today";
        result.state = "soon";
    } else if (days === 1) {
        result.status = "Due tomorrow";
        result.state = "soon";
    } else if (days <= 7) {
        result.status = "In " + plural(days, "day");
    }
    return result;
}

function compareDue(a, b) {
    if (a.due === b.due) {
        return 0;
    }
    if (a.due === "") {
        return 1;
    }
    if (b.due === "") {
        return -1;
    }
    return a.due < b.due ? -1 : 1;
}

function comparePriority(a, b) {
    return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
}

function createPriorityMarks(priority) {
    const wrapper = el("span", "priority");
    const marks = el("span", "marks");
    marks.setAttribute("aria-hidden", "true");
    for (let level = 1; level <= 3; level++) {
        marks.append(el("i", level <= PRIORITY_WEIGHT[priority] ? "on" : ""));
    }
    wrapper.append(marks, PRIORITY_LABEL[priority]);
    return wrapper;
}

function initPlanner() {
    const taskForm = document.getElementById("taskForm");
    if (!taskForm) {
        return;
    }

    const taskInput = document.getElementById("taskName");
    const courseInput = document.getElementById("taskCourse");
    const dueInput = document.getElementById("taskDue");
    const priorityInput = document.getElementById("taskPriority");
    const taskError = document.getElementById("taskError");
    const taskList = document.getElementById("taskList");
    const emptyMessage = document.getElementById("emptyMessage");
    const noMatch = document.getElementById("noMatch");
    const plannerTools = document.getElementById("plannerTools");
    const taskCount = document.getElementById("taskCount");
    const orderHint = document.getElementById("orderHint");
    const sortSelect = document.getElementById("sortBy");
    const filterButtons = document.querySelectorAll("[data-filter]");

    let tasks = loadTasks();
    let currentFilter = "all";
    let currentSort = loadSort();
    let editingId = null;
    let draggedId = null;
    let pendingFocus = null;

    const persist = () => saveTasks(tasks);
    const canReorder = () => currentSort === "manual" && currentFilter === "all";

    function matchesFilter(task) {
        if (currentFilter === "all") {
            return true;
        }
        return currentFilter === "done" ? task.done : !task.done;
    }

    function getVisibleTasks() {
        const visible = tasks.filter(matchesFilter);

        if (currentSort === "deadline") {
            visible.sort((a, b) => a.done - b.done || compareDue(a, b) || comparePriority(a, b));
        } else if (currentSort === "priority") {
            visible.sort((a, b) => a.done - b.done || comparePriority(a, b) || compareDue(a, b));
        }
        return visible;
    }

    function setFilter(value) {
        currentFilter = value;
        filterButtons.forEach((button) => {
            button.setAttribute("aria-pressed", String(button.dataset.filter === value));
        });
    }

    function moveTask(id, direction) {
        const index = tasks.findIndex((task) => task.id === id);
        const target = index + direction;
        if (index === -1 || target < 0 || target >= tasks.length) {
            return;
        }
        [tasks[index], tasks[target]] = [tasks[target], tasks[index]];
    }

    function moveTaskTo(id, targetId, placeAfter) {
        if (id === targetId) {
            return;
        }
        const moving = tasks.find((task) => task.id === id);
        tasks = tasks.filter((task) => task.id !== id);
        const index = tasks.findIndex((task) => task.id === targetId);
        tasks.splice(placeAfter ? index + 1 : index, 0, moving);
    }

    function createTaskItem(task, position, total, reorder) {
        if (task.id === editingId) {
            return createEditItem(task);
        }

        const item = el("li", "task priority-" + task.priority);
        item.dataset.id = task.id;
        item.classList.toggle("done", task.done);

        const due = describeDue(task);
        if (due && due.state === "overdue") {
            item.classList.add("overdue");
        }

        if (reorder) {
            item.draggable = true;
            item.append(el("span", "grip"));
        }

        const checkbox = el("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.done;
        checkbox.setAttribute("aria-label", "Mark as completed: " + task.text);

        const meta = el("span", "task-meta");
        if (task.course) {
            meta.append(el("span", "chip", task.course));
        }
        meta.append(createPriorityMarks(task.priority));
        if (due) {
            meta.append(el("span", "due-date", "Due " + due.date));
            if (due.status) {
                meta.append(el("span", "due-status " + due.state, due.status));
            }
        }

        const main = el("span", "task-main");
        main.append(el("span", "task-text", task.text), meta);

        const label = el("label", "task-label");
        label.append(checkbox, main);

        const actions = el("div", "task-actions");
        if (reorder) {
            actions.append(
                actionButton("move-up", "↑", "Move up: " + task.text, position === 0),
                actionButton("move-down", "↓", "Move down: " + task.text, position === total - 1)
            );
        }
        actions.append(
            actionButton("edit-btn", "Edit", "Edit task: " + task.text),
            actionButton("delete-btn", "Delete", "Delete task: " + task.text)
        );

        item.append(label, actions);
        return item;
    }

    function createEditItem(task) {
        const item = el("li", "task editing");
        item.dataset.id = task.id;

        const form = el("form", "edit-form");
        form.noValidate = true;
        form.setAttribute("aria-label", "Edit task");

        const textInput = makeInput("text", "text", task.text);
        textInput.className = "edit-text";
        textInput.maxLength = 120;
        const courseField = makeInput("text", "course", task.course);
        courseField.maxLength = 12;
        const dueField = makeInput("date", "due", task.due);
        const priorityField = makePrioritySelect("priority", task.priority);

        const grid = el("div", "edit-grid");
        grid.append(
            makeLabel("Task", textInput),
            makeLabel("Course", courseField),
            makeLabel("Deadline", dueField),
            makeLabel("Priority", priorityField)
        );

        const saveButton = el("button", "save-btn", "Save");
        saveButton.type = "submit";
        const cancelButton = el("button", "cancel-btn", "Cancel");
        cancelButton.type = "button";

        const actions = el("div", "edit-actions");
        actions.append(saveButton, cancelButton);

        form.append(grid, actions);
        item.append(form);
        return item;
    }

    function restoreFocus() {
        if (!pendingFocus) {
            return;
        }
        const item = taskList.querySelector('[data-id="' + pendingFocus.id + '"]');
        if (item) {
            pendingFocus.selectors.some((selector) => {
                const target = item.querySelector(selector);
                if (target && !target.disabled) {
                    target.focus();
                    return true;
                }
                return false;
            });
        }
        pendingFocus = null;
    }

    function render() {
        const visible = getVisibleTasks();
        const reorder = canReorder();

        taskList.innerHTML = "";
        visible.forEach((task, index) => {
            taskList.appendChild(createTaskItem(task, index, visible.length, reorder));
        });

        const completed = tasks.filter((task) => task.done).length;
        const overdue = tasks.filter((task) => !task.done && task.due !== "" && daysUntil(task.due) < 0).length;
        const hasTasks = tasks.length > 0;

        let summary = completed + " of " + tasks.length + " completed";
        if (hasTasks && completed === tasks.length) {
            summary = "All clear. " + summary;
        } else if (overdue > 0) {
            summary += ", " + overdue + " overdue";
        }
        taskCount.textContent = summary;

        emptyMessage.hidden = hasTasks;
        plannerTools.hidden = !hasTasks;
        noMatch.hidden = !hasTasks || visible.length > 0;
        orderHint.hidden = !(tasks.length > 1 && !reorder);

        restoreFocus();
    }

    taskForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const text = taskInput.value.trim();

        if (text === "") {
            taskError.textContent = "Type a task first.";
            taskInput.setAttribute("aria-invalid", "true");
            taskInput.focus();
            return;
        }

        tasks.push({
            id: Date.now(),
            text: text,
            done: false,
            course: courseInput.value.trim(),
            due: dueInput.value,
            priority: priorityInput.value
        });

        taskError.textContent = "";
        taskInput.removeAttribute("aria-invalid");
        setFilter("all");
        persist();
        render();
        taskForm.reset();
        taskInput.focus();
    });

    taskInput.addEventListener("input", () => {
        taskError.textContent = "";
        taskInput.removeAttribute("aria-invalid");
    });

    taskList.addEventListener("change", (event) => {
        if (event.target.type !== "checkbox") {
            return;
        }
        const id = Number(event.target.closest(".task").dataset.id);
        tasks = tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task));
        pendingFocus = { id: id, selectors: ["input[type='checkbox']"] };
        persist();
        render();
    });

    taskList.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) {
            return;
        }

        const id = Number(button.closest(".task").dataset.id);

        if (button.classList.contains("delete-btn")) {
            tasks = tasks.filter((task) => task.id !== id);
            if (editingId === id) {
                editingId = null;
            }
        } else if (button.classList.contains("move-up")) {
            moveTask(id, -1);
            pendingFocus = { id: id, selectors: [".move-up", ".move-down"] };
        } else if (button.classList.contains("move-down")) {
            moveTask(id, 1);
            pendingFocus = { id: id, selectors: [".move-down", ".move-up"] };
        } else if (button.classList.contains("edit-btn")) {
            editingId = id;
            pendingFocus = { id: id, selectors: [".edit-text"] };
        } else if (button.classList.contains("cancel-btn")) {
            editingId = null;
            pendingFocus = { id: id, selectors: [".edit-btn"] };
        } else {
            return;
        }

        persist();
        render();
    });

    taskList.addEventListener("submit", (event) => {
        event.preventDefault();
        const form = event.target;
        const id = Number(form.closest(".task").dataset.id);
        const text = form.elements["text"].value.trim();

        if (text === "") {
            form.elements["text"].setAttribute("aria-invalid", "true");
            form.elements["text"].focus();
            return;
        }

        tasks = tasks.map((task) => {
            if (task.id !== id) {
                return task;
            }
            return {
                ...task,
                text: text,
                course: form.elements["course"].value.trim(),
                due: form.elements["due"].value,
                priority: form.elements["priority"].value
            };
        });

        editingId = null;
        pendingFocus = { id: id, selectors: [".edit-btn"] };
        persist();
        render();
    });

    taskList.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && editingId !== null) {
            pendingFocus = { id: editingId, selectors: [".edit-btn"] };
            editingId = null;
            render();
        }
    });

    function clearDropMarks() {
        taskList.querySelectorAll(".drop-before, .drop-after, .dragging").forEach((node) => {
            node.classList.remove("drop-before", "drop-after", "dragging");
        });
    }

    taskList.addEventListener("dragstart", (event) => {
        const item = event.target.closest(".task");
        if (!item) {
            return;
        }
        draggedId = Number(item.dataset.id);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(draggedId));
        item.classList.add("dragging");
    });

    taskList.addEventListener("dragover", (event) => {
        if (draggedId === null) {
            return;
        }
        const item = event.target.closest(".task");
        if (!item) {
            return;
        }
        event.preventDefault();
        taskList.querySelectorAll(".drop-before, .drop-after").forEach((node) => {
            node.classList.remove("drop-before", "drop-after");
        });
        if (Number(item.dataset.id) === draggedId) {
            return;
        }
        const box = item.getBoundingClientRect();
        item.classList.add(event.clientY > box.top + box.height / 2 ? "drop-after" : "drop-before");
    });

    taskList.addEventListener("drop", (event) => {
        if (draggedId === null) {
            return;
        }
        event.preventDefault();
        const item = event.target.closest(".task");
        if (item) {
            moveTaskTo(draggedId, Number(item.dataset.id), item.classList.contains("drop-after"));
            persist();
        }
        draggedId = null;
        render();
    });

    taskList.addEventListener("dragend", () => {
        draggedId = null;
        clearDropMarks();
    });

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setFilter(button.dataset.filter);
            render();
        });
    });

    sortSelect.addEventListener("change", () => {
        currentSort = sortSelect.value;
        saveSort(currentSort);
        render();
    });

    sortSelect.value = currentSort;
    render();
}

initPlanner();

// CONTACT PAGE

const CONTACT_ENDPOINT = "https://api.web3forms.com/submit";
const ACCESS_KEY = "b6ec6790-1f7d-4204-80ab-e3f3fc23c077";

const contactForm = document.getElementById("contactForm");

const EMAIL_TYPOS = {
    "gmial.com": "gmail.com",
    "gmai.com": "gmail.com",
    "gmail.co": "gmail.com",
    "gamil.com": "gmail.com",
    "yaho.com": "yahoo.com",
    "yahooo.com": "yahoo.com",
    "hotmial.com": "hotmail.com",
    "outlok.com": "outlook.com"
};

const rules = {
    name: function (value) {
        if (value === "") {
            return "Enter your name.";
        }
        if (value.length < 2) {
            return "Your name needs at least 2 characters.";
        }
        if (!/^\p{L}[\p{L} .'-]*$/u.test(value)) {
            return "Use letters only. Spaces, hyphens and apostrophes are fine.";
        }
        return "";
    },
    email: function (value) {
        if (value === "") {
            return "Enter your email address.";
        }
        const parts = value.split("@");
        const validShape = parts.length === 2 &&
            /^[A-Za-z0-9._%+-]+$/.test(parts[0]) &&
            !parts[0].startsWith(".") &&
            !parts[0].endsWith(".") &&
            !parts[0].includes("..") &&
            /^([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/.test(parts[1]) &&
            value.length <= 254;

        if (!validShape) {
            return "Enter a valid email, like name@example.com.";
        }
        const suggestion = EMAIL_TYPOS[parts[1].toLowerCase()];
        return suggestion ? "Did you mean " + parts[0] + "@" + suggestion + "?" : "";
    },
    phone: function (value) {
        if (value === "") {
            return "Enter your phone number.";
        }
        if (!/^\d+$/.test(value)) {
            return "Use digits only, with no spaces, dashes or +.";
        }
        if (value.length < 7 || value.length > 15) {
            return "A phone number has 7 to 15 digits.";
        }
        return "";
    },
    message: function (value) {
        if (value === "") {
            return "Write a message.";
        }
        if (value.length < 10) {
            return "Say a little more, at least 10 characters.";
        }
        if (value.length > 1000) {
            return "Keep it under 1000 characters.";
        }
        return "";
    }
};

function getErrorElement(field) {
    let error = document.getElementById(field.id + "-error");
    if (!error) {
        error = document.createElement("p");
        error.id = field.id + "-error";
        error.className = "field-error";
        field.insertAdjacentElement("afterend", error);
        field.setAttribute("aria-describedby", error.id);
    }
    return error;
}

function validateField(field) {
    const message = rules[field.name](field.value.trim());
    getErrorElement(field).textContent = message;

    if (message === "") {
        field.removeAttribute("aria-invalid");
    } else {
        field.setAttribute("aria-invalid", "true");
    }
    return message === "";
}

function setFormStatus(text, state) {
    const status = document.getElementById("formError");
    status.textContent = text;
    status.dataset.state = state;
}

async function sendMessage(values) {
    const response = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            access_key: ACCESS_KEY,
            subject: "Portfolio message from " + values.name,
            from_name: "Portfolio contact form",
            name: values.name,
            email: values.email,
            phone: values.phone,
            message: values.message
        })
    });
    const result = await response.json();
    return result.success === true;
}

if (contactForm) {
    const fields = Array.from(contactForm.querySelectorAll("input, textarea"));
    const submitButton = contactForm.querySelector("button[type='submit']");

    fields.forEach(function (field) {
        field.addEventListener("blur", function () {
            if (field.value.trim() !== "" || field.hasAttribute("aria-invalid")) {
                validateField(field);
            }
        });

        field.addEventListener("input", function () {
            if (field.hasAttribute("aria-invalid")) {
                validateField(field);
            }
        });
    });

    contactForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const results = fields.map(validateField);
        const firstInvalid = fields[results.indexOf(false)];

        if (firstInvalid) {
            setFormStatus("Fix the highlighted fields and try again.", "error");
            firstInvalid.focus();
            return;
        }

        if (ACCESS_KEY === "PASTE_YOUR_ACCESS_KEY_HERE") {
            setFormStatus("The contact form is not connected yet.", "error");
            return;
        }

        const values = {
            name: contactForm.elements["name"].value.trim(),
            email: contactForm.elements["email"].value.trim(),
            phone: contactForm.elements["phone"].value.trim(),
            message: contactForm.elements["message"].value.trim()
        };

        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
        setFormStatus("", "");

        try {
            const sent = await sendMessage(values);
            if (sent) {
                contactForm.reset();
                fields.forEach(function (field) {
                    getErrorElement(field).textContent = "";
                    field.removeAttribute("aria-invalid");
                });
                setFormStatus("Message sent. Thank you, " + values.name.split(" ")[0] + ".", "ok");
                alert("Message sent. Thank you, " + values.name.split(" ")[0] + ".", "ok");
            } else {
                setFormStatus("Your message was not sent. Please try again.", "error");
            }
        } catch (error) {
            setFormStatus("Could not reach the server. Check your connection and try again.", "error");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Send Message";
        }
    });
}