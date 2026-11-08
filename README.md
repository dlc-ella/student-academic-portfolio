# Student Academic Portfolio & Management Website

A responsive, multi-page personal academic portfolio and study management web application designed and developed for **Daniella Eboma**, a B.Sc. Cybersecurity student at **Miva Open University**. 

This project was built from scratch using semantic **HTML5**, modern **CSS3** (CSS Grid, Flexbox, and custom properties), and vanilla **ES6+ JavaScript** for the **COS 106 (Introduction to Web Technologies)** Practical Term Project—with zero external frameworks, libraries, or build steps.

* **Live Website (GitHub Pages):** [https://dlc-ella.github.io/student-academic-portfolio/](https://dlc-ella.github.io/student-academic-portfolio/)
* **GitHub Repository:** [https://github.com/dlc-ella/student-academic-portfolio](https://github.com/dlc-ella/student-academic-portfolio)

---

## Project Synopsis

The **Student Academic Portfolio and Management Website** serves as both a public-facing academic showcase and a practical daily study planner. Visitors, lecturers, and collaborators can explore Daniella's educational background, review completed networking and web development projects, watch a Cisco Packet Tracer lab walkthrough, and send direct messages through a validated contact form. Meanwhile, the interactive planner enables students to organize coursework tasks, track deadlines, and persist their study schedule directly in the browser.

---

## Website Pages & Architecture

| Page | File | Overview & Key Elements |
| :--- | :--- | :--- |
| **Home** | `index.html` | Hero section with student portrait, welcome message, animated cybersecurity keyword badges, brief biography, and primary call-to-action. |
| **About Me** | `about.html` | Responsive CSS Grid showcasing educational background, career aspirations, technical skills, hobbies, and a semantic HTML table of Cisco certifications. |
| **Projects** | `projects.html` | Three sample project cards with 16:10 screenshots, descriptions, and repository/live links, plus an embedded HTML5 video walkthrough of a Packet Tracer lab. |
| **Academic Planner** | `planner.html` | Interactive JavaScript study planner supporting task creation, inline editing, completion toggling, deletion, filtering, sorting, and drag-and-drop reordering. |
| **Contact Me** | `contact.html` | Client-side validated contact form (Name, Email, Phone Number, Message) integrated with the Web3Forms API for asynchronous message delivery. |

---

## Key Features & Technical Highlights

### 1. Interactive Academic Task Planner (`planner.html` & `script.js`)
* **Full CRUD Lifecycle:** Add new academic tasks (up to 120 characters with a live character counter), edit existing tasks inline, mark tasks as completed, or delete them.
* **Course Tags, Deadlines & Priorities:** Attach a course code (e.g., `COS 106`), a due date, and one of three priority levels (`Low`, `Medium`, `High`) rendered with visual priority marks.
* **Automatic Deadline Intelligence:** Dynamically calculates days remaining and applies status badges such as *Overdue by X days*, *Due today*, *Due tomorrow*, or *In X days*.
* **Filtering & Multi-Mode Sorting:** Filter the task list by **All**, **Active**, or **Done**, and sort tasks by **My order** (manual), **Deadline**, or **Priority**.
* **Pointer Drag-and-Drop Reordering:** Reorder tasks smoothly using mouse, touch, or stylus via the grip handle (with automatic viewport edge-scrolling). Automatically switches sorting to *My order* so custom arrangements are preserved.
* **Browser Persistence:** Tasks and sort preferences are serialized into `localStorage` (`academicTasks` and `academicSort`), ensuring study schedules survive page reloads and browser restarts.

### 2. Validated Contact Form (`contact.html` & `script.js`)
* **Strict Client-Side Validation:** Validates fields on `blur`, `input`, and `submit` events:
  * **No Empty Fields:** Blocks submission and moves focus to the first invalid input.
  * **Name Validation:** Requires at least 2 Unicode letter characters (allowing spaces, hyphens, and apostrophes).
  * **Email Format & Typo Detection:** Validates `local@domain.tld` structure and checks against common domain typos (e.g., prompting *"Did you mean name@gmail.com?"* if the user types `gmial.com` or `yaho.com`).
  * **Digits-Only Phone Validation:** Enforces `/^\d+$/` (7 to 15 digits with no spaces, dashes, or `+` signs) per project specifications.
  * **Message Length Check:** Ensures messages are between 10 and 1,000 characters.
* **Asynchronous Delivery:** Submits form data via `fetch()` to Web3Forms without reloading the page.

### 3. Visual Design System & Accessibility (`styles.css`)
* **Cybersecurity "Redacted Document" Theme:** Uses a custom deep red palette (`--oxblood`, `--claret`, `--madder`, `--rose`, `--petal`, `--blush`) paired with editorial `Georgia` serif headings, a `@keyframes declassify` load animation on the homepage keywords, and a classified redaction-bar graphic when the planner queue is empty.
* **Responsive Layout:** Built with CSS Grid and Flexbox, adapting cleanly from desktop monitors down to `720px` and mobile viewports.
* **Inclusive & Accessible:** Features semantic HTML5 landmarks (`header`, `nav`, `main`, `section`, `article`, `footer`), `aria-current="page"`, `aria-live="polite"` status updates, automatic focus restoration after planner actions, 44px minimum touch targets on coarse pointers, and full `prefers-reduced-motion: reduce` support.

---

## Project File Structure

```text
student-academic-portfolio/
├── index.html                        # Homepage (Hero, Bio, Keywords)
├── about.html                        # About Me (Education, Skills, Certifications Table)
├── projects.html                     # Academic Projects & HTML5 Video Walkthrough
├── planner.html                      # Interactive Academic Task Planner
├── contact.html                      # Contact Form with JS Validation
├── styles.css                        # External Stylesheet (Variables, Grid/Flexbox, Media Queries)
├── script.js                         # JavaScript Engine (Planner DOM/Storage, Form Validation, Video Speed)
├── LICENSE                           # MIT License
├── README.md                         # Project Documentation
├── images/
│   ├── daniella.jpg                  # Student Portrait & Favicon
│   ├── portfolio-screenshot.png      # Project 1 Preview Image
│   ├── packet-tracer-screenshot.png  # Project 2 Preview & Video Poster Image
│   ├── planner-screenshot.png        # Project 3 Preview Image
│   └── svgs/
│       ├── email-transparent.svg     # Footer Email Icon
│       └── github-transparent.svg    # Footer GitHub Icon
└── videos/
    └── packet-tracer-lab.mp4         # Cisco Packet Tracer Lab Walkthrough Video
```

---

## Local Setup & Deployment Guide

### Running Locally
Because this project uses standard HTML, CSS, and JavaScript with no build tools required, you can run it in seconds:
1. Clone the repository:
   ```bash
   git clone https://github.com/dlc-ella/student-academic-portfolio.git
   ```
2. Open the project folder and double-click `index.html` to launch it in any modern web browser, or use the **Live Server** extension in Visual Studio Code.

### Configuring the Contact Form (Web3Forms)
The contact form sends messages via [Web3Forms](https://web3forms.com) so it works seamlessly on static hosting:
1. Request a free access key at [web3forms.com](https://web3forms.com) using your email address.
2. Open `script.js` and locate the `ACCESS_KEY` constant under the `// CONTACT PAGE` section.
3. Replace the key string with your own Web3Forms key and test the form from `contact.html`.

### Deploying to GitHub Pages
1. Push all files to the root of your GitHub repository (`main` branch).
2. Navigate to **Settings → Pages** in your GitHub repository.
3. Under **Build and deployment**, select **Deploy from a branch**, choose `main` and `/ (root)`, and click **Save**.
4. Your site will be published at `https://<username>.github.io/<repository-name>/`. *(Note: GitHub Pages file paths are case-sensitive, so ensure `images/` and `videos/` remain lowercase.)*

---

## Author & License

* **Author:** Daniella Eboma
* **GitHub:** [@dlc-ella](https://github.com/dlc-ella)
* **License:** Distributed under the [MIT License](LICENSE).