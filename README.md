# ⚡ Command Center
## Your Personal Operating System Dashboard

*Created: February 6, 2026*

---

## Overview

A comprehensive life management dashboard that tracks everything in one place:

- ✅ **Tasks** — Active, prioritized, with due dates
- 📁 **Projects** — Progress tracking with status
- 🎯 **Plans** — Strategic goals with milestones
- 🔄 **Daily Recurring** — Habits and routines
- 📅 **Meetings** — Scheduled calls and events
- 🤝 **Collaborations** — People you're working with
- 📞 **Follow-ups** — Pending outreach items
- 💡 **Recommendations** — AI suggestions
- 💰 **Finance** — Revenue targets and expenses
- 🔄 **Subscriptions** — All your recurring costs
- 💬 **Discussions** — Ongoing conversations
- 🏢 **Companies** — Your business portfolio
- 💡 **Idea Bucket** — Creative concepts

---

## Quick Start

### Local Development
```bash
cd ~/clawd/Projects/Command_Center
python3 -m http.server 3003
# Open http://localhost:3003
```

### Deploy to GitHub Pages
```bash
cd ~/clawd/Projects/Command_Center
git init
git add .
git commit -m "Command Center v1"
gh repo create command-center --public --source=. --push
# Enable Pages in repo settings
```

---

## Files

```
Command_Center/
├── index.html          # Main dashboard (self-contained)
├── data/
│   └── dashboard_data.json  # Data source (for external loading)
├── assets/             # Images, icons
└── README.md
```

---

## Customization

### Update Data
Edit the `data` object in `index.html` or load from `data/dashboard_data.json`:

```javascript
// In index.html, modify the data object:
const data = {
    tasks: { active: [...] },
    projects: [...],
    // etc.
};
```

### Add New Sections
1. Add nav item: `<div class="nav-item" data-section="newsection">🆕 New</div>`
2. Add section: `<section class="section" id="newsection">...</section>`
3. Add render function: `function renderNewSection() {...}`
4. Call in init: `renderNewSection();`

---

## Features

- 🌙 Dark theme (gold & navy)
- 📱 Mobile responsive
- ⏰ Live clock
- ✅ Interactive checkboxes
- 📊 Progress bars
- 🏷️ Priority tags
- 🧭 Tab navigation

---

## Tech Stack

- Pure HTML/CSS/JavaScript
- No frameworks or dependencies
- Self-contained single file
- Works offline

---

*Built for the 711 Companies vision*
