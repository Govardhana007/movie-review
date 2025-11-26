# Movie Review Mini Project

This is a simple movie review site built with HTML, CSS and JavaScript for a college web technologies mini project.

What is included
- `index.html` — simple login page (guest access redirects to the site)
- `home.html` — main movie listing and review UI
- `style.css` — styles for login and movie pages
- `script.js` — client-side logic (renders movies, handles reviews, stores reviews in localStorage)

How to run
1. Open `index.html` in your browser (double-click or use a local server).
2. Click Submit (or "Continue as guest") — you'll be taken to `home.html`.
3. Search movies, click "View" to see reviews, or click "Add Review" to submit a review.

Notes and assumptions
- Reviews are saved to browser localStorage; they are persistent per browser but not shared across machines.
- Movie posters use placeholder images. Replace `poster` URLs in `script.js` with real images if available.

Next steps (optional)
- Add user authentication and per-user reviews.
- Add movie detail pages and backend persistence.
- Allow editing/deleting reviews.

- Add movies via the UI: click `Add Movie` on `home.html` to create a new movie entry. You can upload a poster file (max 1.5 MB) and optionally provide a poster name. New movies are saved in your browser's `localStorage` and will appear in the listing and scroll.

- Add or Drop movies via the UI: click `Add Movie` (now "Add or Drop Movie") on `home.html`. Choose the action 'Add' to create a new movie or choose 'Drop' to remove a user-added movie. Dropping a movie also removes its local reviews.


https://govardhana007.github.io/miniproject/

PHP backend (optional)
----------------------

This project includes a minimal PHP endpoint at `backend/submit.php` that accepts JSON POSTs and appends reviews to `backend/reviews.json`.

How to run a local PHP server (quick):

1. Ensure PHP is installed (or use XAMPP/WAMP). From a terminal, run in the project folder:

```powershell
cd "c:\Users\Latitude\OneDrive\Desktop\miniproject\miniproject-main (2)"
php -S localhost:8000
```

2. Open `http://localhost:8000/home.html` in your browser.

Notes:
- The front-end still works offline using `localStorage`; the PHP backend is best-effort: reviews are saved locally and the site attempts to POST them to `backend/submit.php`.
- `backend/reviews.json` is created in the `backend` folder when the first review is posted. Make sure the PHP process has write permission for that folder.
- To run via XAMPP: place the project folder into your `htdocs` and visit `http://localhost/<your-folder>/home.html`.

