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
    taskCount.textContent = tasks.length > 0 && completed === tasks.length
        ? "All clear. " + completed + " of " + tasks.length + " completed"
        : completed + " of " + tasks.length + " completed";
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