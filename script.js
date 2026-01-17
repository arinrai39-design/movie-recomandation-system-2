const API_KEY = '34429755'; //this is api key by arin rai from omdb api
const BASE_URL = 'https://www.omdbapi.com/';

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const moviesList = document.getElementById('movies-list');
const loading = document.getElementById('loading');
const pagination = document.getElementById('pagination');
const prevPage = document.getElementById('prev-page');
const nextPage = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const detailsSection = document.getElementById('details');
const movieDetails = document.getElementById('movie-details');
const recommendations = document.getElementById('recommendations');
const watchlistList = document.getElementById('watchlist-list');

let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
let currentPage = 1;
let currentQuery = '';

// Search movies
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        currentQuery = query;
        currentPage = 1;
        fetchMovies(query, currentPage);
    }
});

// Pagination
prevPage.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        fetchMovies(currentQuery, currentPage);
    }
});

nextPage.addEventListener('click', () => {
    currentPage++;
    fetchMovies(currentQuery, currentPage);
});

// Fetch movies from OMDB API
async function fetchMovies(query, page) {
    loading.classList.remove('hidden');
    moviesList.innerHTML = '';
    pagination.classList.add('hidden');
    try {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${query}&page=${page}`);
        const data = await response.json();
        if (data.Response === 'True') {
            displayMovies(data.Search);
            updatePagination(data.totalResults);
        } else {
            moviesList.innerHTML = '<p>No movies found. Try a different search.</p>';
        }
    } catch (error) {
        console.error('Error fetching movies:', error);
        moviesList.innerHTML = '<p>Error loading movies. Check your connection or API key.</p>';
    } finally {
        loading.classList.add('hidden');
    }
}

// Display search results
function displayMovies(movies) {
    moviesList.innerHTML = '';
    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.innerHTML = `
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/200x300?text=No+Image'}" alt="${movie.Title}">
            <h3>${movie.Title}</h3>
            <p>Year: ${movie.Year}</p>
            <p>Type: ${movie.Type}</p>
        `;
        movieCard.addEventListener('click', () => showDetails(movie.imdbID));
        moviesList.appendChild(movieCard);
    });
}

// Update pagination
function updatePagination(totalResults) {
    const totalPages = Math.ceil(totalResults / 10);
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPage.disabled = currentPage === 1;
    nextPage.disabled = currentPage === totalPages;
    pagination.classList.remove('hidden');
}

// Show movie details
async function showDetails(imdbID) {
    loading.classList.remove('hidden');
    try {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`);
        const movie = await response.json();
        if (movie.Response === 'True') {
            movieDetails.innerHTML = `
                <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/200x300?text=No+Image'}" alt="${movie.Title}">
                <h3>${movie.Title} (${movie.Year})</h3>
                <p><strong>Genre:</strong> ${movie.Genre}</p>
                <p><strong>Director:</strong> ${movie.Director}</p>
                <p><strong>Actors:</strong> ${movie.Actors}</p>
                <p><strong>Plot:</strong> ${movie.Plot}</p>
                <p><strong>IMDb Rating:</strong> ${movie.imdbRating}/10</p>
                <p><strong>Runtime:</strong> ${movie.Runtime}</p>
                <button class="watchlist-btn" onclick="toggleWatchlist('${imdbID}', '${movie.Title.replace(/'/g, "\\'")}', '${movie.Poster}')">
                    ${watchlist.some(m => m.id === imdbID) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                </button>
            `;
            detailsSection.classList.remove('hidden');
            fetchRecommendations(movie.Genre.split(',')[0].trim(), movie.Year);
        } else {
            movieDetails.innerHTML = '<p>Movie details not found.</p>';
        }
    } catch (error) {
        console.error('Error fetching details:', error);
        movieDetails.innerHTML = '<p>Error loading details.</p>';
    } finally {
        loading.classList.add('hidden');
    }
}

// Fetch recommendations (similar genre and year)
async function fetchRecommendations(genre, year) {
    try {
        const response = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${genre}&y=${year}&type=movie`);
        const data = await response.json();
        if (data.Response === 'True') {
            const recMovies = data.Search.slice(0, 3);
            displayRecommendations(recMovies);
        } else {
            recommendations.innerHTML = '<p>No recommendations found.</p>';
        }
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        recommendations.innerHTML = '<p>Error loading recommendations.</p>';
    }
}

// Display recommendations
function displayRecommendations(movies) {
    recommendations.innerHTML = '';
    movies.forEach(movie => {
        const recCard = document.createElement('div');
        recCard.className = 'movie-card';
        recCard.innerHTML = `
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/200x300?text=No+Image'}" alt="${movie.Title}">
            <h3>${movie.Title}</h3>
            <p>Year: ${movie.Year}</p>
        `;
        recCard.addEventListener('click', () => showDetails(movie.imdbID));
        recommendations.appendChild(recCard);
    });
}

// Toggle watchlist
function toggleWatchlist(id, title, poster) {
    const index = watchlist.findIndex(m => m.id === id);
    if (index > -1) {
        watchlist.splice(index, 1);
    } else {
        watchlist.push({ id, title, poster });
    }
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    updateWatchlist();
    // Refresh details button text
    const btn = document.querySelector('.watchlist-btn');
    if (btn) {
        btn.textContent = watchlist.some(m => m.id === id) ? 'Remove from Watchlist' : 'Add to Watchlist';
    }
}

// Update watchlist display
function updateWatchlist() {
    watchlistList.innerHTML = '';
    if (watchlist.length === 0) {
        watchlistList.innerHTML = '<p>Your watchlist is empty.</p>';
        return;
    }
    watchlist.forEach(movie => {
        const item = document.createElement('div');
        item.className = 'movie-card';
        item.innerHTML = `
            <img src="${movie.poster !== 'N/A' ? movie.poster : 'https://via.placeholder.com/200x300?text=No+Image'}" alt="${movie.title}">
            <h3>${movie.title}</h3>
            <button class="remove-btn" onclick="toggleWatchlist('${movie.id}', '${movie.title.replace(/'/g, "\\'")}', '${movie.poster}')">Remove</button>
        `;
        watchlistList.appendChild(item);
    });
}

// Load watchlist on page load
updateWatchlist();
