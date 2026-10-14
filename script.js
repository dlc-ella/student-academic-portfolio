const PLANNER_KEY = "academicTasks";
const SORT_KEY = "academicSort";
const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };
const PRIORITY_LABEL = { high: "High", medium: "Medium", low: "Low" };
const SORT_MODES = ["manual", "deadline", "priority"];
const DAY_MS = 24 * 60 * 60 * 1000;
const SVG_NS = "http://www.w3.org/2000/svg";

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

function setAttrs(node, attrs) {
    Object.entries(attrs).forEach(([name, value]) => node.setAttribute(name, value));
    return node;
}

function svgEl(tag, attrs) {
    return setAttrs(document.createElementNS(SVG_NS, tag), attrs);
}

function setInvalid(field, invalid) {
    if (invalid) {
        field.setAttribute("aria-invalid", "true");
    } else {
        field.removeAttribute("aria-invalid");
    }
}

function readStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        return null;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        return;
    }
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

function makeButton(className, content, type) {
    const button = el("button", className);
    button.type = type || "button";
    button.append(content);
    return button;
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

function createIcon(name) {
    const svg = svgEl("svg", {
        viewBox: "0 0 24 24",
        class: "icon icon-" + name,
        "aria-hidden": "true",
        focusable: "false"
    });

    if (name === "grip") {
        [[9, 6], [15, 6], [9, 12], [15, 12], [9, 18], [15, 18]].forEach(([cx, cy]) => {
            svg.append(svgEl("circle", { cx: cx, cy: cy, r: "1.7", fill: "currentColor" }));
        });
        return svg;
    }

    svg.append(svgEl("path", {
        d: name === "up" ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2.6",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
    }));
    return svg;
}

function actionButton(className, content, ariaLabel, disabled, tooltip) {
    const button = makeButton(className, content);
    button.setAttribute("aria-label", ariaLabel);
    if (tooltip) {
        button.title = tooltip;
    }
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
        const saved = JSON.parse(readStorage(PLANNER_KEY));
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
    writeStorage(PLANNER_KEY, JSON.stringify(tasks));
}

function loadSort() {
    const saved = readStorage(SORT_KEY);
    return SORT_MODES.includes(saved) ? saved : "manual";
}

function saveSort(mode) {
    writeStorage(SORT_KEY, mode);
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

function isOverdue(task) {
    return !task.done && task.due !== "" && daysUntil(task.due) < 0;
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

function taskIdOf(node) {
    return Number(node.closest(".task").dataset.id);
}

function initPlanner() {
    const taskForm = document.getElementById("taskForm");
    if (!taskForm) {
        return;
    }

    const taskInput = document.getElementById("taskName");
    const taskCounter = document.getElementById("taskCounter");
    const courseInput = document.getElementById("taskCourse");
    const dueInput = document.getElementById("taskDue");
    const priorityInput = document.getElementById("taskPriority");
    const taskError = document.getElementById("taskError");
    const taskList = document.getElementById("taskList");
    const emptyMessage = document.getElementById("emptyMessage");
    const noMatch = document.getElementById("noMatch");
    const plannerTools = document.getElementById("plannerTools");
    const plannerNotice = document.getElementById("plannerNotice");
    const taskCount = document.getElementById("taskCount");
    const sortSelect = document.getElementById("sortBy");
    const filterButtons = document.querySelectorAll("[data-filter]");

    let tasks = loadTasks();
    let currentFilter = "all";
    let currentSort = loadSort();
    let editingId = null;
    let pendingFocus = null;
    let noticeTimer = 0;
    let drag = null;
    const expandedIds = new Set();

    function commit(id, selectors) {
        pendingFocus = id === undefined ? null : { id: id, selectors: selectors };
        saveTasks(tasks);
        render();
    }

    function updateTask(id, changes) {
        tasks = tasks.map((task) => (task.id === id ? { ...task, ...changes } : task));
    }

    function showNotice(text) {
        plannerNotice.textContent = text;
        clearTimeout(noticeTimer);
        noticeTimer = setTimeout(() => {
            plannerNotice.textContent = "";
        }, 7000);
    }

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

    function commitVisibleOrder(reordered) {
        const current = getVisibleTasks();
        if (reordered.every((task, index) => task.id === current[index].id)) {
            return;
        }

        const ids = new Set(reordered.map((task) => task.id));
        const slots = [];
        tasks.forEach((task, index) => {
            if (ids.has(task.id)) {
                slots.push(index);
            }
        });

        const next = tasks.slice();
        slots.forEach((slot, index) => {
            next[slot] = reordered[index];
        });
        tasks = next;

        if (currentSort !== "manual") {
            currentSort = "manual";
            sortSelect.value = "manual";
            saveSort("manual");
            showNotice("Sorting switched to My order so your new order stays.");
        }
    }

    function moveTask(id, direction) {
        const visible = getVisibleTasks();
        const index = visible.findIndex((task) => task.id === id);
        const target = index + direction;
        if (index === -1 || target < 0 || target >= visible.length) {
            return;
        }
        [visible[index], visible[target]] = [visible[target], visible[index]];
        commitVisibleOrder(visible);
    }

    function moveTaskTo(id, targetId, placeAfter) {
        const visible = getVisibleTasks();
        const moving = visible.find((task) => task.id === id);
        const rest = visible.filter((task) => task.id !== id);
        const index = rest.findIndex((task) => task.id === targetId);
        if (!moving || index === -1) {
            return;
        }
        rest.splice(placeAfter ? index + 1 : index, 0, moving);
        commitVisibleOrder(rest);
    }

    function createTaskItem(task, position, total) {
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

        const canMove = total > 1;
        if (canMove) {
            const grip = el("span", "grip");
            grip.setAttribute("aria-hidden", "true");
            grip.title = "Drag to reorder";
            grip.append(createIcon("grip"));
            item.append(grip);
        }

        const checkbox = el("input");
        checkbox.type = "checkbox";
        checkbox.id = "task-check-" + task.id;
        checkbox.checked = task.done;

        const text = el("label", "task-text", task.text);
        text.htmlFor = checkbox.id;
        text.id = "task-text-" + task.id;

        const more = makeButton("more-btn", "Show more");
        more.hidden = true;
        setAttrs(more, { "aria-expanded": "false", "aria-controls": text.id });

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

        const main = el("div", "task-main");
        main.append(text, more, meta);

        const body = el("div", "task-body");
        body.append(checkbox, main);

        const actions = el("div", "task-actions");

        actions.append(
            actionButton("edit-btn", "Edit", "Edit task: " + task.text),
            actionButton("delete-btn", "Delete", "Delete task: " + task.text)
        );

        item.append(body, actions);
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
        textInput.maxLength = taskInput.maxLength;
        const courseField = makeInput("text", "course", task.course);
        courseField.maxLength = courseInput.maxLength;
        const dueField = makeInput("date", "due", task.due);
        const priorityField = makePrioritySelect("priority", task.priority);

        const grid = el("div", "edit-grid");
        grid.append(
            makeLabel("Task", textInput),
            makeLabel("Course", courseField),
            makeLabel("Deadline", dueField),
            makeLabel("Priority", priorityField)
        );

        const actions = el("div", "edit-actions");
        actions.append(
            makeButton("save-btn", "Save", "submit"),
            makeButton("cancel-btn", "Cancel")
        );

        form.append(grid, actions);
        item.append(form);
        return item;
    }

    function updateClamps() {
        taskList.querySelectorAll(".task").forEach((item) => {
            const text = item.querySelector(".task-text");
            const toggle = item.querySelector(".more-btn");
            if (!text || !toggle) {
                return;
            }

            const expanded = expandedIds.has(Number(item.dataset.id));
            text.classList.toggle("clamped", !expanded);
            const overflowing = text.scrollHeight > text.clientHeight + 1;

            toggle.hidden = !expanded && !overflowing;
            toggle.textContent = expanded ? "Show less" : "Show more";
            toggle.setAttribute("aria-expanded", String(expanded));
        });
    }

    function updateCounter() {
        const length = taskInput.value.length;
        const limit = taskInput.maxLength;
        taskCounter.textContent = length === 0 ? "" : length + " / " + limit;

        if (length >= limit) {
            taskCounter.dataset.state = "full";
        } else if (length >= limit - 20) {
            taskCounter.dataset.state = "near";
        } else {
            taskCounter.dataset.state = "";
        }
    }

    function restoreFocus() {
        if (!pendingFocus) {
            return;
        }
        const item = taskList.querySelector('[data-id="' + pendingFocus.id + '"]');
        if (item) {
            pendingFocus.selectors.some((selector) => {
                const target = item.querySelector(selector);
                if (target && !target.disabled && !target.hidden) {
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

        taskList.innerHTML = "";
        visible.forEach((task, index) => {
            taskList.appendChild(createTaskItem(task, index, visible.length));
        });

        const completed = tasks.filter((task) => task.done).length;
        const overdue = tasks.filter(isOverdue).length;
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

        updateClamps();
        restoreFocus();
    }

    taskForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const text = taskInput.value.trim();

        if (text === "") {
            taskError.textContent = "Type a task first.";
            setInvalid(taskInput, true);
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
        setInvalid(taskInput, false);
        setFilter("all");
        commit();
        taskForm.reset();
        updateCounter();
        taskInput.focus();
    });

    taskInput.addEventListener("input", () => {
        taskError.textContent = "";
        setInvalid(taskInput, false);
        updateCounter();
    });

    taskList.addEventListener("change", (event) => {
        if (event.target.type !== "checkbox") {
            return;
        }
        const id = taskIdOf(event.target);
        updateTask(id, { done: event.target.checked });
        commit(id, ["input[type='checkbox']"]);
    });

    taskList.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) {
            return;
        }

        const id = taskIdOf(button);
        const is = (name) => button.classList.contains(name);

        if (is("delete-btn")) {
            tasks = tasks.filter((task) => task.id !== id);
            expandedIds.delete(id);
            if (editingId === id) {
                editingId = null;
            }
            commit();
        }

        else if (is("more-btn")) {
            if (!expandedIds.delete(id)) {
                expandedIds.add(id);
            }
            commit(id, [".more-btn"]);
        } else if (is("edit-btn")) {
            editingId = id;
            commit(id, [".edit-text"]);
        } else if (is("cancel-btn")) {
            editingId = null;
            commit(id, [".edit-btn"]);
        }
    });

    taskList.addEventListener("submit", (event) => {
        event.preventDefault();
        const form = event.target;
        const id = taskIdOf(form);
        const textField = form.elements["text"];
        const text = textField.value.trim();

        if (text === "") {
            setInvalid(textField, true);
            textField.focus();
            return;
        }

        updateTask(id, {
            text: text,
            course: form.elements["course"].value.trim(),
            due: form.elements["due"].value,
            priority: form.elements["priority"].value
        });

        editingId = null;
        commit(id, [".edit-btn"]);
    });

    taskList.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && editingId !== null) {
            const id = editingId;
            editingId = null;
            commit(id, [".edit-btn"]);
        }
    });

    function clearDropMarks() {
        taskList.querySelectorAll(".drop-before, .drop-after").forEach((node) => {
            node.classList.remove("drop-before", "drop-after");
        });
    }

    function findDropTarget(y) {
        const rows = Array.from(taskList.querySelectorAll(".task")).filter((row) => row !== drag.item);
        let last = null;

        for (const row of rows) {
            const box = row.getBoundingClientRect();
            if (y < box.top + box.height / 2) {
                return { row: row, after: false };
            }
            last = row;
        }
        return last ? { row: last, after: true } : null;
    }

    function updateDrag() {
        const offset = drag.lastY - drag.startY + (window.scrollY - drag.startScroll);
        drag.item.style.transform = "translateY(" + offset + "px)";

        clearDropMarks();
        drag.hit = findDropTarget(drag.lastY);
        if (drag.hit) {
            drag.hit.row.classList.add(drag.hit.after ? "drop-after" : "drop-before");
        }
    }

    function dragLoop() {
        if (!drag) {
            return;
        }
        const edge = 90;
        const speed = 14;
        if (drag.lastY < edge) {
            window.scrollBy({ top: -speed, behavior: "instant" });
        } else if (drag.lastY > window.innerHeight - edge) {
            window.scrollBy({ top: speed, behavior: "instant" });
        }
        updateDrag();
        drag.frame = requestAnimationFrame(dragLoop);
    }

    function endDrag() {
        if (!drag) {
            return;
        }
        cancelAnimationFrame(drag.frame);
        drag.item.classList.remove("dragging");
        drag.item.style.transform = "";
        taskList.classList.remove("is-dragging");
        clearDropMarks();
        drag = null;
    }

    taskList.addEventListener("pointerdown", (event) => {
        const grip = event.target.closest(".grip");
        if (!grip || drag || (event.pointerType === "mouse" && event.button !== 0)) {
            return;
        }
        event.preventDefault();

        const item = grip.closest(".task");
        grip.setPointerCapture(event.pointerId);
        drag = {
            id: Number(item.dataset.id),
            item: item,
            pointerId: event.pointerId,
            startY: event.clientY,
            startScroll: window.scrollY,
            lastY: event.clientY,
            hit: null,
            frame: 0
        };
        item.classList.add("dragging");
        taskList.classList.add("is-dragging");
        drag.frame = requestAnimationFrame(dragLoop);
    });

    taskList.addEventListener("pointermove", (event) => {
        if (drag && event.pointerId === drag.pointerId) {
            drag.lastY = event.clientY;
        }
    });

    taskList.addEventListener("pointerup", (event) => {
        if (!drag || event.pointerId !== drag.pointerId) {
            return;
        }
        drag.lastY = event.clientY;
        updateDrag();

        const id = drag.id;
        const hit = drag.hit;
        endDrag();

        if (hit) {
            moveTaskTo(id, Number(hit.row.dataset.id), hit.after);
            commit();
        }
    });

    taskList.addEventListener("pointercancel", (event) => {
        if (drag && event.pointerId === drag.pointerId) {
            endDrag();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && drag) {
            endDrag();
        }
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
        plannerNotice.textContent = "";
        render();
    });

    let resizeFrame = 0;
    window.addEventListener("resize", () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(updateClamps);
    });

    sortSelect.value = currentSort;
    updateCounter();
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
        error = el("p", "field-error");
        error.id = field.id + "-error";
        field.insertAdjacentElement("afterend", error);
        field.setAttribute("aria-describedby", error.id);
    }
    return error;
}

function showFieldError(field, message) {
    getErrorElement(field).textContent = message;
    setInvalid(field, message !== "");
}

function validateField(field) {
    const message = rules[field.name](field.value.trim());
    showFieldError(field, message);
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
            ...values
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

        const values = {};
        fields.forEach(function (field) {
            values[field.name] = field.value.trim();
        });

        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
        setFormStatus("", "");

        try {
            const sent = await sendMessage(values);
            if (sent) {
                contactForm.reset();
                fields.forEach(function (field) {
                    showFieldError(field, "");
                });
                setFormStatus("Message sent. Thank you, " + values.name.split(" ")[0] + ".", "ok");
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

// PROJECT VIDEO

const video = document.getElementById("packet-tracer-video");

if (video) {
    const PLAYBACK_SPEED = 2;
    const applySpeed = () => {
        video.playbackRate = PLAYBACK_SPEED;
    };

    video.muted = true;
    video.defaultPlaybackRate = PLAYBACK_SPEED;
    applySpeed();
    ["loadedmetadata", "play"].forEach((name) => video.addEventListener(name, applySpeed));
}