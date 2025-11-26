// Simple movie review app using localStorage

// Initial movie set. These will be seeded into localStorage as "user-added"
// so they appear in the Add/Drop UI and can be removed by the user.
const INITIAL_MOVIES = [
    { id: 'm1', title: 'DevAstra : The Unheard Battle of Parshurama', year: 2023, poster: './The-Conjuring-Last-Rites-English.jpg', description: 'A chilling supernatural horror.' },
    { id: 'm2', title: 'DevAstra : Discovery of The Immortal', year: 2024, poster: './Nobody-2-English.jpg', description: 'High-octane action sequel.' },
    { id: 'm3', title: 'DevAstra : Unleash The Fire', year: 2023, poster: './The-Fantastic-Four-First-Steps-English.jpg', description: 'Sci-fi exploration at its best.' },
    { id: 'm4', title: 'DevAstra : The Dhoomaketu Effect', year: 2020, poster: './F1-The-Movie-English.jpg', description: 'A mystery that keeps you guessing.' }
];

// runtime movies list (will be populated by merging user movies)
let movies = [];

// key for user-added movies in localStorage
const USER_MOVIES_KEY = 'user_movies_v1';
// max poster size in bytes (1.5 MB)
const MAX_POSTER_BYTES = 1.5 * 1024 * 1024;

function loadUserMovies() {
    try { return JSON.parse(localStorage.getItem(USER_MOVIES_KEY)) || []; }
    catch (e) { return []; }
}

function saveUserMovies(list) {
    localStorage.setItem(USER_MOVIES_KEY, JSON.stringify(list));
}

function mergeUserMoviesIntoList() {
    let user = loadUserMovies();
    // If there are no user movies stored yet, seed from INITIAL_MOVIES
    // and convert ids to user-style (prefix with 'u') so they can be dropped.
    if (!user || user.length === 0) {
        user = INITIAL_MOVIES.map(m => {
            const newId = m.id && String(m.id).startsWith('u') ? m.id : 'u' + m.id;
            return { ...m, id: newId };
        });
        saveUserMovies(user);
    }
    // merge into runtime list without duplicating ids
    user.forEach(m => {
        if (!movies.find(x => x.id === m.id)) movies.push(m);
    });
}

// Poster candidate pool (can be replaced with real image URLs).
// Note: automated fetching from Google is not performed here; if you want actual Google images,
// provide the exact image URLs or place images in the project folder and update the list below.
const posterCandidates = [
    // placeholders that look like posters; replace these with real poster URLs when available
    'https://via.placeholder.com/300x450/111827/ffffff?text=Latest+Movie+1',
    'https://via.placeholder.com/300x450/1f2937/ffb86b?text=Latest+Movie+2',
    'https://via.placeholder.com/300x450/0b3d91/ffffff?text=Latest+Movie+3',
    'https://via.placeholder.com/300x450/7b2cbf/ffffff?text=Latest+Movie+4',
    'https://via.placeholder.com/300x450/2a9d8f/ffffff?text=Latest+Movie+5',
    'https://via.placeholder.com/300x450/e76f51/ffffff?text=Latest+Movie+6',
    'https://via.placeholder.com/300x450/023e8a/ffffff?text=Latest+Movie+7',
    'https://via.placeholder.com/300x450/ff006e/ffffff?text=Latest+Movie+8',
    'https://via.placeholder.com/300x450/0f172a/ffffff?text=Latest+Movie+9',
    'https://via.placeholder.com/300x450/264653/ffffff?text=Latest+Movie+10',
    'https://via.placeholder.com/300x450/8ac926/ffffff?text=Latest+Movie+11',
    'https://via.placeholder.com/300x450/ffbe0b/111827?text=Latest+Movie+12'
];

// If true, the scroll will use random unique posters from posterCandidates (no repeats).
// Set to false to use the posters from the `movies` array instead.
const useRandomScrollPosters = true;

// Optional: use The Movie Database (TMDB) to fetch real poster images.
// To enable, get an API key from https://www.themoviedb.org/ and paste it below.
// The script will fall back to posterCandidates if no key is provided or fetching fails.
const TMDB_API_KEY = '';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

/**
 * Fetch poster URLs from TMDB (popular/now_playing) until we have at least `count` unique posters.
 * Returns an array of poster URLs (strings). Falls back to empty array on error.
 */
async function fetchTMDBPosters(count = 8) {
    if (!TMDB_API_KEY) return [];
    const urls = new Set();
    const endpoints = [
        `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
        `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=1`
    ];
    try {
        for (const ep of endpoints) {
            const res = await fetch(ep);
            if (!res.ok) continue;
            const data = await res.json();
            (data.results || []).forEach(m => {
                if (m.poster_path) urls.add(TMDB_IMAGE_BASE + m.poster_path);
            });
            if (urls.size >= count) break;
        }
    } catch (e) {
        console.warn('TMDB fetch failed', e);
        return [];
    }
    return Array.from(urls).slice(0, count);
}

/**
 * Return an array of poster URLs to use in the scroll. Prefers TMDB when API key is set.
 */
async function getRandomPosterURLs(count = 8) {
    // try TMDB first
    if (TMDB_API_KEY) {
        const tmdb = await fetchTMDBPosters(count);
        if (tmdb && tmdb.length >= Math.min(count, 4)) return tmdb; // accept if at least a few results
    }
    // fallback: pick unique random from posterCandidates
    return pickUniqueRandom(posterCandidates, Math.min(count, posterCandidates.length));
}

/** Fetch movies from server DB. Falls back to local seeded movies when endpoint fails. */
async function fetchMoviesFromServer() {
    try {
        const resp = await fetch('backend/get_movies.php');
        if (!resp.ok) return null;
        const data = await resp.json();
        if (data && data.success && Array.isArray(data.rows)) {
            // convert DB rows into our runtime movie shape and include dbId
            return data.rows.map(r => ({ id: 'm' + r.id, dbId: Number(r.id), title: r.title, year: r.year, poster: r.poster_path ? r.poster_path : './placeholder.jpg', description: r.description || '' }));
        }
        return null;
    } catch (e) {
        console.warn('Could not fetch movies from server', e);
        return null;
    }
}

// key for localStorage
const REVIEWS_KEY = 'movie_reviews_v1';

function loadReviews() {
    try { return JSON.parse(localStorage.getItem(REVIEWS_KEY)) || {}; }
    catch (e) { return {}; }
}

function saveReviews(reviews) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
}

function getAverageRating(reviewsForMovie) {
    if (!reviewsForMovie || reviewsForMovie.length === 0) return null;
    const sum = reviewsForMovie.reduce((s, r) => s + Number(r.rating), 0);
    return (sum / reviewsForMovie.length).toFixed(1);
}

function renderMovies(filter = '') {
    const grid = document.getElementById('movie-grid');
    grid.innerHTML = '';
    const reviews = loadReviews();
    const q = filter.trim().toLowerCase();

    movies.filter(m => m.title.toLowerCase().includes(q)).forEach(m => {
        const card = document.createElement('article');
        card.className = 'card';
        const movieReviews = reviews[m.id] || [];
        const avg = getAverageRating(movieReviews);

        const starsHTML = renderStars(avg);

        card.innerHTML = `
            <img src="${m.poster}" alt="${m.title} poster">
            <div class="card-body">
                <h3 class="card-title">${m.title}</h3>
                <div class="card-meta">${m.year}</div>
                <div class="rating"> 
                    <span class="score" data-target="${avg ? avg : ''}">${avg ? avg : '—'}</span>
                    <small>${movieReviews.length} review(s)</small>
                </div>
                <div class="stars">${starsHTML}</div>
                <div class="card-actions">
                    <button class="btn secondary" data-action="view" data-id="${m.id}">View</button>
                    <button class="btn primary" data-action="review" data-id="${m.id}">Add Review</button>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
    // animate numeric averages after render
    animateAverages();
}

/* Render star HTML based on average (1-decimal or null) */
function renderStars(avg) {
    const max = 5;
    if (!avg) {
        return Array.from({ length: max }).map(() => `<span class="star">☆</span>`).join('');
    }
    const numeric = Math.round(Number(avg));
    return Array.from({ length: max }).map((_, i) => (i < numeric ? `<span class="star filled">★</span>` : `<span class="star">☆</span>`)).join('');
}

/* animate all score numbers (from 0 to target) */
function animateAverages() {
    const els = document.querySelectorAll('.score[data-target]');
    els.forEach(el => {
        const target = parseFloat(el.getAttribute('data-target'));
        if (!isFinite(target)) return;
        animateNumber(el, 0, target, 700);
    });
}

/* --- Movie scroll: populate a horizontal marquee-style track and make it loop --- */
function createScrollItem(m) {
    const item = document.createElement('div');
    item.className = 'scroll-item';
    item.innerHTML = `
        <img src="${m.poster}" alt="${m.title} poster" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
        <div class="released">Released: ${m.year}</div>
    `;
    // subtle hover pop
    item.addEventListener('mouseenter', () => item.style.transform = 'translateY(-6px) scale(1.02)');
    item.addEventListener('mouseleave', () => item.style.transform = 'translateY(0) scale(1)');
    return item;
}

async function renderScroll() {
    const track = document.getElementById('scroll-track');
    if (!track) return;
    track.innerHTML = '';
    // create items
    let items;
    if (useRandomScrollPosters) {
        const count = Math.max(6, Math.min(posterCandidates.length, 10)); // show between 6 and 10 posters
        // get poster URLs (prefer TMDB if API key provided)
        const urlsPromise = getRandomPosterURLs(count);
        // since renderScroll may be called synchronously from init(), support awaiting here
        // but if getRandomPosterURLs returns a promise, await it.
        // (we'll handle async by making init() await renderScroll)
        // create item elements from URLs
        const urls = await urlsPromise;
        items = urls.map((url, i) => createScrollItem({ poster: url, title: `Latest ${i + 1}`, year: new Date().getFullYear() }));
    } else {
        items = movies.map(m => createScrollItem(m));
    }
    // append two copies to allow seamless 50% translation
    items.forEach(it => track.appendChild(it));
    items.forEach(it => track.appendChild(it.cloneNode(true)));
    // calculate duration based on total width (approx) or number of items
    const duration = Math.max(12, items.length * 4); // seconds
    track.style.setProperty('--scroll-duration', duration + 's');
    track.setAttribute('data-animate', 'true');
}

/* pick n unique random items from an array */
function pickUniqueRandom(arr, n) {
    const copy = arr.slice();
    const out = [];
    n = Math.min(n, copy.length);
    for (let i = 0; i < n; i++) {
        const idx = Math.floor(Math.random() * copy.length);
        out.push(copy.splice(idx, 1)[0]);
    }
    return out;
}

/* animate number into element with one decimal */
function animateNumber(el, from, to, duration) {
    const start = performance.now();
    function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const value = from + (to - from) * t;
        el.textContent = value.toFixed(1);
        if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

/* small toast message */
function showToast(text, ms = 3000) {
    // remove existing toast if present
    const existing = document.querySelector('.toast');
    if (existing) {
        // fade out and remove immediately
        existing.style.opacity = '0';
        existing.style.transform = 'translateX(-50%) translateY(8px)';
        existing.addEventListener('transitionend', () => existing.remove(), { once: true });
    }

    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    document.body.appendChild(t);
    // Force paint then ensure visible (some browsers need explicit inline styles)
    // Start visible
    requestAnimationFrame(() => {
        t.style.opacity = '1';
        t.style.transform = 'translateX(-50%) translateY(0)';
    });

    // schedule hide after ms (default 3000ms)
    setTimeout(() => {
        // trigger fade/slide out using the CSS transition
        t.style.opacity = '0';
        t.style.transform = 'translateX(-50%) translateY(8px)';
        // remove after transition completes
        t.addEventListener('transitionend', () => {
            if (t && t.parentNode) t.parentNode.removeChild(t);
        }, { once: true });
    }, ms);
}

function openModal(forMovieId = null) {
    const modal = document.getElementById('review-modal');
    modal.setAttribute('aria-hidden', 'false');
    populateMovieSelect(forMovieId);
}

function closeModal() {
    const modal = document.getElementById('review-modal');
    modal.setAttribute('aria-hidden', 'true');
    document.getElementById('review-form').reset();
}

function populateMovieSelect(selectedId = null) {
    const select = document.getElementById('movie-select');
    select.innerHTML = '';
    movies.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id; opt.textContent = `${m.title} (${m.year})`;
        if (m.id === selectedId) opt.selected = true;
        select.appendChild(opt);
    });
}

function getUniqueMovieId() {
    return 'u' + Date.now() + Math.floor(Math.random() * 1000);
}

function openAddMovieModal() {
    const modal = document.getElementById('movie-modal');
    modal.setAttribute('aria-hidden', 'false');
    // default to add mode and update UI
    const addRadio = document.getElementById('action-add');
    if (addRadio) addRadio.checked = true;
    toggleAddDropUI();
}

function closeAddMovieModal() {
    const modal = document.getElementById('movie-modal');
    modal.setAttribute('aria-hidden', 'true');
    document.getElementById('movie-form').reset();
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(file);
    });
}

async function handleAddMovieSubmit(e) {
    e.preventDefault();
    // determine whether user wants to add or drop
    const action = document.querySelector('input[name="movie-action"]:checked')?.value || 'add';
    if (action === 'add') {
        const title = document.getElementById('movie-title').value.trim();
        const year = parseInt(document.getElementById('movie-year').value, 10) || new Date().getFullYear();
        const fileInput = document.getElementById('movie-poster-file');
        const posterName = document.getElementById('movie-poster-name').value.trim();
        const desc = document.getElementById('movie-desc').value.trim();

        if (!title) { showToast('Please enter a movie title'); return; }

        let posterURL = 'https://via.placeholder.com/300x450?text=No+Image';
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const f = fileInput.files[0];
            if (f.size > MAX_POSTER_BYTES) {
                showToast('Poster file is too large. Max 1.5 MB.');
                return;
            }
            try {
                posterURL = await readFileAsDataURL(f);
            } catch (err) {
                console.warn('Error reading file', err);
                showToast('Could not read poster file.');
                return;
            }
        }

        const id = getUniqueMovieId();
        const newMovie = { id, title, year, poster: posterURL, description: desc || '' };

        // persist user movies only (keep initial static list immutable-ish)
        const userMovies = loadUserMovies();
        userMovies.push(newMovie);
        saveUserMovies(userMovies);

        // merge into runtime list and re-render
        movies.push(newMovie);
        // try to upload to backend so the movie is visible in phpMyAdmin
        try {
            const form = new FormData();
            form.append('title', title);
            form.append('year', year);
            form.append('description', desc || '');
            if (fileInput && fileInput.files && fileInput.files[0]) form.append('poster', fileInput.files[0]);
            const resp = await fetch('backend/add_movie.php', { method: 'POST', body: form });
            if (resp && resp.ok) {
                const data = await resp.json();
                if (data && data.success) {
                    // update local movie poster path to server path if provided
                    const idx = movies.findIndex(m => m.id === id);
                    if (idx !== -1) {
                        if (data.poster) movies[idx].poster = data.poster;
                        if (data.id) movies[idx].dbId = Number(data.id);
                        // update the saved userMovies as well
                        const umIdx = userMovies.findIndex(m => m.id === id);
                        if (umIdx !== -1) {
                            if (data.poster) userMovies[umIdx].poster = data.poster;
                            if (data.id) userMovies[umIdx].dbId = Number(data.id);
                            saveUserMovies(userMovies);
                        }
                    }
                    showToast('Movie added and saved to server', 4000);
                } else {
                    console.warn('Server add_movie response', data);
                    showToast('Movie added locally — server rejected', 4000);
                }
            } else {
                showToast('Movie added locally — server unavailable', 4000);
            }
        } catch (err) {
            console.warn('Could not upload movie to backend', err);
            showToast('Movie added locally — upload failed', 4000);
        }
        renderMovies(document.getElementById('search').value);
        renderScroll();
        closeAddMovieModal();
        // keep the movie-added toast visible for 15 seconds
        showToast('Movie added successfully', 15000);
    } else {
        // drop mode
        const dropSelect = document.getElementById('movie-drop-select');
        const idToDrop = dropSelect ? dropSelect.value : null;
        if (!idToDrop) { showToast('No movie selected to drop'); return; }
        // only allow dropping user-added movies (ids starting with 'u')
        if (!idToDrop.startsWith('u')) { showToast('Only user-added movies can be dropped'); return; }

        if (!confirm('Are you sure you want to drop this movie? This will remove local reviews too.')) return;

        // remove from userMovies
        let userMovies = loadUserMovies();
        userMovies = userMovies.filter(m => m.id !== idToDrop);
        saveUserMovies(userMovies);

        // remove from runtime movies
        movies = movies.filter(m => m.id !== idToDrop);

        // remove any associated reviews stored locally
        const reviews = loadReviews();
        if (reviews[idToDrop]) {
            delete reviews[idToDrop];
            saveReviews(reviews);
        }

        renderMovies(document.getElementById('search').value);
        renderScroll();
        closeAddMovieModal();
        // keep the movie-dropped toast visible for 15 seconds
        showToast('Movie dropped', 15000);
    }
}

function populateDropSelect() {
    const sel = document.getElementById('movie-drop-select');
    if (!sel) return;
    sel.innerHTML = '';
    const user = loadUserMovies();
    if (user.length === 0) {
        const opt = document.createElement('option'); opt.value = ''; opt.textContent = 'No user-added movies'; sel.appendChild(opt); return;
    }
    user.forEach(m => {
        const opt = document.createElement('option'); opt.value = m.id; opt.textContent = `${m.title} (${m.year})`; sel.appendChild(opt);
    });
}

function toggleAddDropUI() {
    const action = document.querySelector('input[name="movie-action"]:checked')?.value || 'add';
    const addFields = document.getElementById('add-fields');
    const dropLabel = document.getElementById('drop-select-label');
    const submitBtn = document.getElementById('submit-movie');
    if (action === 'add') {
        if (addFields) addFields.style.display = '';
        if (dropLabel) dropLabel.style.display = 'none';
        if (submitBtn) submitBtn.textContent = 'Add Movie';
        // enable add inputs and restore validation
        const title = document.getElementById('movie-title');
        const year = document.getElementById('movie-year');
        const fileInput = document.getElementById('movie-poster-file');
        const posterName = document.getElementById('movie-poster-name');
        const desc = document.getElementById('movie-desc');
        if (title) { title.disabled = false; title.required = true; }
        if (year) year.disabled = false;
        if (fileInput) fileInput.disabled = false;
        if (posterName) posterName.disabled = false;
        if (desc) desc.disabled = false;
    } else {
        if (addFields) addFields.style.display = 'none';
        if (dropLabel) dropLabel.style.display = '';
        if (submitBtn) submitBtn.textContent = 'Drop Movie';
        populateDropSelect();
        // disable add inputs to avoid form validation blocking submit
        const title = document.getElementById('movie-title');
        const year = document.getElementById('movie-year');
        const fileInput = document.getElementById('movie-poster-file');
        const posterName = document.getElementById('movie-poster-name');
        const desc = document.getElementById('movie-desc');
        if (title) { title.disabled = true; title.required = false; }
        if (year) year.disabled = true;
        if (fileInput) fileInput.disabled = true;
        if (posterName) posterName.disabled = true;
        if (desc) desc.disabled = true;
    }
}

function handleCardAction(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    if (action === 'review') openModal(id);
    if (action === 'view') showDetails(id);
}

function showDetails(id) {
    const movie = movies.find(m => m.id === id);
    const reviews = loadReviews()[id] || [];
    let details = `Title: ${movie.title}\nYear: ${movie.year}\n\nReviews:\n`;
    if (reviews.length === 0) details += 'No reviews yet.';
    else reviews.forEach(r => { details += `• (${r.rating}) ${r.text}\n`; });
    alert(details);
}

function handleReviewSubmit(e) {
    e.preventDefault();
    const movieId = document.getElementById('movie-select').value;
    const rating = document.getElementById('rating-select').value;
    const text = document.getElementById('review-text').value.trim();
    if (!movieId) return;
    const reviews = loadReviews();
    reviews[movieId] = reviews[movieId] || [];
    reviews[movieId].push({ rating, text, date: new Date().toISOString() });
    saveReviews(reviews);
    closeModal();
    renderMovies(document.getElementById('search').value);
    showToast('Review added — thank you!');
}

// Try to POST the review to a PHP backend if available. This is best-effort
// — the app still works offline using localStorage.
async function postReviewToServer(movieId, rating, text) {
    try {
        // include server-side movie id and title when available
        const movie = movies.find(m => m.id === movieId);
        const movieDbId = movie && movie.dbId ? movie.dbId : null;
        const movieTitle = movie ? movie.title : null;
        const body = { movieId, rating, text };
        if (movieDbId) body.movieDbId = movieDbId;
        if (movieTitle) body.movieTitle = movieTitle;

        const resp = await fetch('backend/submit.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!resp.ok) {
            console.warn('Server rejected review:', resp.statusText);
            return null;
        }
        const data = await resp.json();
        return data;
    } catch (err) {
        // network error or server unreachable
        console.warn('Could not reach backend/submit.php', err);
        return null;
    }
}

// Updated form submit handler that saves locally and also posts to server.
async function handleReviewSubmitWithBackend(e) {
    e.preventDefault();
    const movieId = document.getElementById('movie-select').value;
    const rating = document.getElementById('rating-select').value;
    const text = document.getElementById('review-text').value.trim();
    if (!movieId) return;
    const reviews = loadReviews();
    reviews[movieId] = reviews[movieId] || [];
    const reviewObj = { rating, text, date: new Date().toISOString() };
    reviews[movieId].push(reviewObj);
    saveReviews(reviews);
    closeModal();
    renderMovies(document.getElementById('search').value);
    showToast('Review added — saving...');

    const serverResp = await postReviewToServer(movieId, rating, text);
    if (serverResp && serverResp.success) {
        showToast('Review synced to server ✅');
    } else {
        showToast('Saved locally — server unavailable', 3500);
    }
}

async function init() {
    // merge any user-added movies saved in localStorage
    mergeUserMoviesIntoList();
    renderMovies();
    await renderScroll();
    // event delegation for movie grid
    document.getElementById('movie-grid').addEventListener('click', handleCardAction);
    document.getElementById('add-review-btn').addEventListener('click', () => openModal());
    // Add movie button handlers
    const addMovieBtn = document.getElementById('add-movie-btn');
    if (addMovieBtn) addMovieBtn.addEventListener('click', () => openAddMovieModal());
    const closeMovieBtn = document.getElementById('close-movie-modal');
    if (closeMovieBtn) closeMovieBtn.addEventListener('click', closeAddMovieModal);
    const movieForm = document.getElementById('movie-form');
    if (movieForm) movieForm.addEventListener('submit', handleAddMovieSubmit);
    // radio toggles for add/drop
    const addRadio = document.getElementById('action-add');
    const dropRadio = document.getElementById('action-drop');
    if (addRadio) addRadio.addEventListener('change', toggleAddDropUI);
    if (dropRadio) dropRadio.addEventListener('change', toggleAddDropUI);
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('review-form').addEventListener('submit', handleReviewSubmitWithBackend);
    document.getElementById('search').addEventListener('input', e => renderMovies(e.target.value));

    // keyboard escape to close modal
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

document.addEventListener('DOMContentLoaded', init);
