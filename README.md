# V Grand Infra Tracker

A web-based construction progress tracking system built with Python Flask, Firebase Firestore, and vanilla HTML/CSS/JS.

## Features

- **Firebase Authentication** — Email/password login for multiple users
- **Progress Tracker Grid** — Color-coded status for each flat/work item combination
- **Timeline History** — Every color change is logged with date and user
- **Remarks** — Auto-generated remarks on status changes + manual editable remarks
- **Admin Settings** — Add, rename, reorder, and delete work items
- **2 Blocks, 5 Floors, 6 Flats per floor** — Full project structure

## Color Status System

| Color | Meaning |
|-------|---------|
| Red | Yet to start |
| Yellow | In progress |
| Blue | Patch work / pending |
| Green | Completed |

## Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project.
2. Enable **Firestore Database** and **Authentication** (Email/Password sign-in method).
3. Go to Project Settings → General → Your apps → Web app → Register app.
4. Copy the Firebase config object.
5. Paste it into `/static/js/firebase-config.js` (replace the placeholder values).

### Firestore Rules

Set these rules in Firestore Database → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /projects/{project}/cells/{cellId} {
      allow read, write: if request.auth != null;
    }
    match /settings/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Running Locally

1. Install dependencies:
```bash
pip install flask flask-cors
```

2. Update `firebase-config.js` with your Firebase credentials.

3. Run the Flask server:
```bash
python app.py
```

4. Open [http://localhost:5000](http://localhost:5000) in Chrome.

## Project Structure

```
/project
  app.py              # Flask server
  /static
    /js
      firebase-config.js   # Firebase credentials (user fills this)
      app.js               # All frontend logic
    /css
      style.css
  /templates
    index.html        # Single page app shell
  README.md
```

## Usage

1. Register or login with email/password.
2. Select Block (A/B) and Floor (1–5).
3. Click any colored cell to change status.
4. Click **history** under a cell to view timeline and edit remarks.
5. Click **Settings** in the top bar to manage work items.

## Future Features

- PDF/Excel export of tracker per block/floor
- Admin dashboard to manage users
- Daily progress report via email
- Photo upload per flat
- Push notifications when status changes
