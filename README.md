# Student Academic Portfolio

A responsive, multi-page portfolio and academic planner for **Daniella Eboma**, a first-year B.Sc. Cybersecurity student at Miva Open University. Built with plain HTML, CSS and JavaScript for the COS 106 (Introduction to Web Technologies) term project. No frameworks, no build step, no external libraries.

**Live site:** _add your hosted URL here_
**Repository:** https://github.com/dlc-ella/student-academic-portfolio

## Pages

| Page     | File            | What it does                                                         |
| -------- | --------------- | -------------------------------------------------------------------- |
| Home     | `index.html`    | Portrait, welcome message, short bio, navigation                     |
| About    | `about.html`    | Education, career aspirations, skills, hobbies, certifications table |
| Projects | `projects.html` | Three projects with screenshots and links, plus a video walkthrough  |
| Planner  | `planner.html`  | Interactive academic task planner                                    |
| Contact  | `contact.html`  | Validated contact form that sends a message to the site owner        |

## Features

**Academic planner**
- Add, edit, complete and delete tasks
- Course tag, deadline date and three priority levels
- Overdue, due today and due soon labels
- Filter by All, Active or Done
- Sort by My order, Deadline or Priority
- Rearrange tasks by dragging the handle (mouse, touch or stylus) or with the up and down buttons
- Long tasks collapse to two lines with Show more and Show less
- Tasks are saved in the browser, so they survive a refresh

**Contact form**
- No empty fields, a valid email format and digits-only phone numbers
- Friendly inline messages, plus a "Did you mean gmail.com?" hint for common email typos
- Sends without leaving the page

**Design**
- A deep red palette and a "redacted document" theme tied to the cybersecurity subject
- Responsive layout with CSS Grid and Flexbox, tested down to phone width
- Respects the visitor's reduced-motion setting

## Project structure

```
.
├── index.html
├── about.html
├── projects.html
├── planner.html
├── contact.html
├── styles.css          all styles, one stylesheet
├── script.js           planner and contact form logic
├── images/
│   ├── daniella.jpg
│   ├── portfolio-screenshot.png
│   ├── packet-tracer-screenshot.png
│   ├── planner-screenshot.png
│   └── svgs/           footer icons
├── videos/
│   └── packet-tracer-lab.mp4
└── docs/
    └── DOCUMENTATION.md
```

## Set up the contact form

The form sends messages through [Web3Forms](https://web3forms.com), a free form-to-email service, because a static site has no server of its own.

1. Get a free access key at web3forms.com using your email address.
2. In `script.js`, set `ACCESS_KEY` near the top of the contact section to your key.
3. Send yourself a test message from the Contact page.

Web3Forms access keys are designed to be used in front-end code. Messages are forwarded to the email address the key was created with.

## Deploy with GitHub Pages

1. Push the project to GitHub with `index.html` at the top level.
2. Open the repository, then **Settings, Pages**.
3. Choose **Deploy from a branch**, select `main` and the `/ (root)` folder, then save.
4. After a minute the site is live at `https://<username>.github.io/<repository>/`.

File paths on GitHub Pages are case-sensitive, so `images/` and `Images/` are different folders.

## Accessibility

- Semantic landmarks (`header`, `nav`, `main`, `section`, `article`, `footer`) and one `h1` per page
- Keyboard-operable everywhere, with visible focus outlines
- Every planner action has an accessible name, and focus returns to the right place after each action
- Moving a task never depends on dragging: the up and down buttons work with a keyboard and a screen reader
- Touch targets are at least 44px on touch screens

## Browser support

Built for current versions of Chrome, Edge, Firefox and Safari. Automated checks were run in Chromium at desktop and phone widths. See [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md) for what was tested and what still needs a manual check on real devices.

## Documentation

The full documentation covers the design system, how the planner works internally, the data model, requirement mapping and known limitations: [`docs/DOCUMENTATION.md`](docs/DOCUMENTATION.md).

## Author

Daniella Eboma.
GitHub: https://github.com/dlc-ella