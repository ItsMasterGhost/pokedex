const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const pokemonDisplay = document.getElementById('pokemon-display');
const loadInitialBtn = document.getElementById('load-initial-btn');
const favoritesList = document.getElementById('favorites-list');

const POKE_API_BASE_URL = 'https://pokeapi.co/api/v2/pokemon/';


const getFavorites = () => JSON.parse(localStorage.getItem('pokemonFavorites')) || [];

// Guarda el array de favoritos en localStorage.
const saveFavorites = (favorites) => {
    localStorage.setItem('pokemonFavorites', JSON.stringify(favorites));
};

// --- Funciones para la API y Renderizado ---

// Función principal para obtener datos de un Pokémon
async function fetchPokemon(query) {
    try {
        const response = await fetch(`${POKE_API_BASE_URL}${query.toLowerCase()}`);
        if (!response.ok) {
            throw new Error('Pokémon no encontrado. ¡Inténtalo de nuevo!');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        pokemonDisplay.innerHTML = `<p class="pokemon-display__message error">${error.message}</p>`;
        return null;
    }
}

// Crea el HTML para una tarjeta de Pokémon
function createPokemonCard(pokemonData) {
    const { id, name, sprites, types, height, weight, stats } = pokemonData;
    const officialArtwork = sprites.other['official-artwork'].front_default;
    const favorites = getFavorites();
    const isFavorite = favorites.includes(id);

    const typesHTML = types.map(t => 
        `<span class="pokemon-card__type type--${t.type.name}">${t.type.name}</span>`
    ).join('');

    const statsHTML = stats.map(s => 
        `<li class="pokemon-card__stat">${s.stat.name}: ${s.base_stat}</li>`
    ).join('');

    return `
        <article class="pokemon-card" id="pokemon-${id}">
            <button 
                class="pokemon-card__fav-btn ${isFavorite ? 'pokemon-card__fav-btn--favorite' : ''}" 
                data-id="${id}"
            >
                ⭐
            </button>
            <img class="pokemon-card__image" src="${officialArtwork}" alt="${name}">
            <h2 class="pokemon-card__name">${name} (#${id})</h2>
            <p class="pokemon-card__info">Altura: ${height / 10} m | Peso: ${weight / 10} kg</p>
            <div class="pokemon-card__types">${typesHTML}</div>
            <ul class="pokemon-card__stats">${statsHTML}</ul>
        </article>
    `;
}

// Renderiza un único Pokémon en el display principal
async function renderPokemon(query) {
    pokemonDisplay.innerHTML = `<p class="pokemon-display__message">Buscando...</p>`;
    const pokemonData = await fetchPokemon(query);
    if (pokemonData) {
        pokemonDisplay.innerHTML = createPokemonCard(pokemonData);
        addFavButtonListener(document.querySelector(`#pokemon-${pokemonData.id} .pokemon-card__fav-btn`));
    }
}

// Renderiza la lista inicial de Pokémon
async function renderInitialList() {
    pokemonDisplay.innerHTML = `<p class="pokemon-display__message">Cargando...</p>`;
    let cardHTML = '';
    try {
        const response = await fetch(`${POKE_API_BASE_URL}?limit=20`);
        const data = await response.json();
        
        const pokemonPromises = data.results.map(p => fetchPokemon(p.name));
        const allPokemonData = await Promise.all(pokemonPromises);
        
        allPokemonData.forEach(pokemonData => {
            if (pokemonData) {
                cardHTML += createPokemonCard(pokemonData);
            }
        });
        
        pokemonDisplay.innerHTML = cardHTML;
        document.querySelectorAll('.pokemon-card__fav-btn').forEach(addFavButtonListener);

    } catch (error) {
        pokemonDisplay.innerHTML = `<p class="pokemon-display__message error">No se pudieron cargar los Pokémon.</p>`;
    }
}

// Renderiza la lista de favoritos
async function renderFavorites() {
    const favorites = getFavorites();
    favoritesList.innerHTML = '';

    if (favorites.length === 0) {
        favoritesList.innerHTML = `<p class="favorites-list__message">Aún no tienes favoritos. ¡Añade algunos!</p>`;
        return;
    }

    const favoritePokemonPromises = favorites.map(id => fetchPokemon(String(id)));
    const favoritePokemonData = await Promise.all(favoritePokemonPromises);

    favoritePokemonData.forEach(pokemonData => {
        if (pokemonData) {
            favoritesList.innerHTML += createPokemonCard(pokemonData);
        }
    });
    document.querySelectorAll('.favorites-list .pokemon-card__fav-btn').forEach(addFavButtonListener);
}


function handleSearch(event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
        renderPokemon(query);
    }
}

function handleFavClick(event) {
    const button = event.currentTarget;
    const pokemonId = parseInt(button.dataset.id);
    let favorites = getFavorites();

    if (favorites.includes(pokemonId)) {
        favorites = favorites.filter(id => id !== pokemonId);
        button.classList.remove('pokemon-card__fav-btn--favorite');
    } else {
        favorites.push(pokemonId);
        button.classList.add('pokemon-card__fav-btn--favorite');
    }

    saveFavorites(favorites);
    renderFavorites();
}

function addFavButtonListener(button) {
    if (button) {
        button.addEventListener('click', handleFavClick);
    }
}


searchForm.addEventListener('submit', handleSearch);
loadInitialBtn.addEventListener('click', renderInitialList);

document.addEventListener('DOMContentLoaded', renderFavorites);