const container = document.getElementById('poke-container');
const loading = document.getElementById('loading');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const overlay = document.getElementById('overlay');
const closeBtn = document.getElementById('closeBtn');
const filterButtons = document.getElementById('filter-buttons');

// Hamburger menu toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
  const expanded = hamburger.getAttribute('aria-expanded') === 'true' || false;
  hamburger.setAttribute('aria-expanded', !expanded);
  navMenu.classList.toggle('active');
});

// Close nav menu when clicking outside hamburger or nav menu
document.addEventListener('click', (event) => {
  const isClickInsideNav = navMenu.contains(event.target);
  const isClickOnHamburger = hamburger.contains(event.target);
  if (!isClickInsideNav && !isClickOnHamburger) {
    navMenu.classList.remove('active');
    hamburger.setAttribute('aria-expanded', false);
  }
});

// Close nav menu when clicking a nav link
const navLinks = navMenu.querySelectorAll('a');
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('active');
    hamburger.setAttribute('aria-expanded', false);
  });
});

// Keyboard accessibility for hamburger button (toggle on Enter or Space)
hamburger.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    const expanded = hamburger.getAttribute('aria-expanded') === 'true' || false;
    hamburger.setAttribute('aria-expanded', !expanded);
    navMenu.classList.toggle('active');
  }
});

// New function to open popup with filter info
function openFilterPopup(button) {
  const imageSrc = button.getAttribute('data-image');
  const title = button.getAttribute('data-title');
  const description = button.getAttribute('data-description');

  document.querySelector('.overlay .image').innerHTML = `<img src="${imageSrc}" alt="${title}">`;
  document.querySelector('.overlay .nameNnum h3').textContent = title;
  document.querySelector('.overlay .nameNnum h4').textContent = '';
  document.querySelector('.overlay .height p:nth-child(2)').textContent = '';
  document.querySelector('.overlay .weight p:nth-child(2)').textContent = '';
  document.querySelector('.overlay .exp p:nth-child(2)').textContent = '';
  document.querySelector('.overlay .category p:nth-child(2)').textContent = '';
  document.querySelector('.overlay .gender p:nth-child(2)').textContent = '';
  document.querySelector('.overlay .abilities p:nth-child(2)').textContent = '';
  document.querySelector('.overlay .description p:nth-child(2)').textContent = description;

  const popup = document.querySelector('.popup');
  popup.classList.add('flip');
  overlay.classList.add('active');
}

// Add event listeners to filter buttons for popup
document.querySelectorAll('#filter-buttons button').forEach(button => {
  button.addEventListener('click', (event) => {
    // Prevent default filterByType onclick from firing twice
    if (event.detail === 1) { // single click
      openFilterPopup(button);
    }
  });
});

// Close popup when clicking any filter button
if (filterButtons) {
  filterButtons.addEventListener('click', () => {
    overlay.classList.remove('active');
    const popup = document.querySelector('.popup');
    if (popup) {
      popup.classList.remove('flip');
      popup.classList.remove('closing');
    }
  });
}

let offset = 0;
const limit = 20;
const maxPokemonCount = 1025;
let loadedCount = 0;
let totalCount = 0;
  
let currentPokemonList = [];
let fullPokemonList = null; // To store all 1025 Pokémon data

function getRandomOffset() {
  return Math.floor(Math.random() * (maxPokemonCount - limit + 1));
}

async function fetchPokemonList() {
  showLoading(true);
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
    const data = await res.json();

    totalCount = Math.min(data.count, maxPokemonCount);

    const pokemonCountDiv = document.getElementById('pokemonCount');
    pokemonCountDiv && (pokemonCountDiv.textContent = `Total Pokémon available: ${totalCount}`);

    let results = data.results;
    if (offset + limit > maxPokemonCount) {
      results = data.results.slice(0, maxPokemonCount - offset);
    }

    const allPokeData = await Promise.all(
      results.map(pokemon => fetch(pokemon.url).then(res => res.json()))
    );

    allPokeData.sort((a, b) => a.id - b.id);

    const filteredPokeData = allPokeData.filter(p => p.id <= maxPokemonCount);

    // Store current Pokémon list for sorting
    currentPokemonList = filteredPokeData;

    if (offset === 0) {
      container.innerHTML = '';
      loadedCount = 0; 
    }

    const loadedCountDiv = document.getElementById('loadedCount');

    for (const pokeData of filteredPokeData) {
      renderCard(pokeData);
      loadedCount++;
      loadedCountDiv && (loadedCountDiv.textContent = `Loaded ${loadedCount} of ${totalCount} Pokémon`);
    }

    if (loadedCount >= totalCount) {
      loadMoreBtn.style.display = 'none';
    } else {
      loadMoreBtn.style.display = 'inline-block';
    }
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Failed to load Pokémon. Try again later.</p>";
  } finally {
    showLoading(false);
  }
}

function renderCard(pokemon) {
  const card = document.createElement('div');
  card.classList.add('card');
  card.innerHTML = `
    <h4>#${pokemon.id.toString().padStart(3, '0')}</h4>
    <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
    <h3>${capitalizeFirstLetter(pokemon.name)}</h3>
    <div>
      ${pokemon.types.map(t => `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`).join('')}
    </div>
  `;

  card.onclick = () => {
    fillOverlay(pokemon);
    const popup = document.querySelector('.popup');
    popup.classList.add('flip');
    overlay.classList.add('active');
  };

  container.appendChild(card);
}

async function fillOverlay(pokemon) {
  document.querySelector('.overlay .image').innerHTML = `
    <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
  `;
  document.querySelector('.overlay .nameNnum h3').textContent = capitalizeFirstLetter(pokemon.name);
  document.querySelector('.overlay .nameNnum h4').textContent = `#${pokemon.id.toString().padStart(3, '0')}`;
  document.querySelector('.overlay .height p:nth-child(2)').textContent = `${(pokemon.height / 10).toFixed(1)} m`;
  document.querySelector('.overlay .weight p:nth-child(2)').textContent = `${(pokemon.weight / 10).toFixed(1)} kg`;
  document.querySelector('.overlay .exp p:nth-child(2)').textContent = `${pokemon.base_experience} XP`;

  try {
    const speciesRes = await fetch(pokemon.species.url);
    if (!speciesRes.ok) throw new Error('Failed to fetch species data');
    const speciesData = await speciesRes.json();

    const genusEntry = speciesData.genera.find(g => g.language.name === 'en');
    const category = genusEntry ? genusEntry.genus : 'Unknown';

    let gender = 'Unknown';
    if (speciesData.gender_rate === -1) {
      gender = 'Genderless';
    } else {
      const femaleRate = speciesData.gender_rate / 8;
      const maleRate = 1 - femaleRate;
      gender = `♂ ${Math.round(maleRate * 100)}% / ♀ ${Math.round(femaleRate * 100)}%`;
    }

    const flavorEntry = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en');
    const description = flavorEntry ? flavorEntry.flavor_text.replace(/\f/g, ' ') : 'No description available.';
    const abilities = pokemon.abilities.map(a => capitalizeFirstLetter(a.ability.name)).join(', ');

    document.querySelector('.overlay .category p:nth-child(2)').textContent = category;
    document.querySelector('.overlay .gender p:nth-child(2)').textContent = gender;
    document.querySelector('.overlay .abilities p:nth-child(2)').textContent = abilities;
    document.querySelector('.overlay .description p:nth-child(2)').textContent = description;
  } catch (error) {
    console.error(error);
    document.querySelector('.overlay .category p:nth-child(2)').textContent = 'Unknown';
    document.querySelector('.overlay .gender p:nth-child(2)').textContent = 'Unknown';
    document.querySelector('.overlay .abilities p:nth-child(2)').textContent = 'Unknown';
    document.querySelector('.overlay .description p:nth-child(2)').textContent = 'No description available.';
  }
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function showLoading(isLoading) {
  loading.style.display = isLoading ? 'block' : 'none';
}

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

const searchPokemon = debounce(async () => {
  const input = document.getElementById('searchInput').value.toLowerCase();
  container.innerHTML = '';
  loadMoreBtn.style.display = 'none';

  // Check if a filter is active by checking currentPokemonList
  if (!currentPokemonList || currentPokemonList.length === 0) {
    container.innerHTML = "<p style='text-align:center; font-weight:bold;'>Only the Pokémon listed in the selected filter category can be searched. Please choose a filter to view and search from the available options.</p>";
    showLoading(false);
    return;
  }

  if (input === '') {
    // Show all Pokémon in current filter
    currentPokemonList.forEach(pokemon => renderCard(pokemon));
    loadMoreBtn.style.display = 'none';
    showLoading(false);
    return;
  }

  showLoading(true);
  try {
    // Filter currentPokemonList locally for partial matches
    const filtered = currentPokemonList.filter(p => p.name.includes(input));

    if (filtered.length === 0) {
      container.innerHTML = "<p style='text-align:center; font-weight:bold;'>❌ No Pokémon found.</p>";
      return;
    }

    filtered.sort((a, b) => a.id - b.id);

    for (const pokeData of filtered) {
      renderCard(pokeData);
    }
  } catch (error) {
    container.innerHTML = "<p style='text-align:center; font-weight:bold;'>❌ No Pokémon found.</p>";
  } finally {
    showLoading(false);
  }
}, 500);

async function filterByType(type) {
  const buttons = document.querySelectorAll('.filter-buttons button');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    btn.style.transform = '';
  });
  buttons.forEach(btn => {
    if (btn.getAttribute('onclick') === `filterByType('${type}')`) {
      btn.classList.add('active');
      btn.style.transform = 'scale(1.2)';
      setTimeout(() => {
        btn.style.transform = '';
      }, 200);
    }
  });

  container.innerHTML = '';
  loadMoreBtn.style.display = 'none';

  if (type === "") {
    // Fetch full Pokémon list for "all" filter
    showLoading(true);
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=0&limit=${maxPokemonCount}`);
      if (!res.ok) throw new Error("Failed to fetch all Pokémon");
      const data = await res.json();

      totalCount = Math.min(data.count, maxPokemonCount);
      loadedCount = 0;
      const loadedCountDiv = document.getElementById('loadedCount');
      loadedCountDiv && (loadedCountDiv.textContent = `Loaded 0 of ${totalCount} Pokémon`);

      const allPokeData = await Promise.all(
        data.results.map(pokemon => fetch(pokemon.url).then(res => res.json()))
      );

      allPokeData.sort((a, b) => a.id - b.id);

      const filteredPokeData = allPokeData.filter(p => p.id <= maxPokemonCount);

      // Store current Pokémon list for sorting
      currentPokemonList = filteredPokeData;

      container.innerHTML = '';

      for (const pokeData of filteredPokeData) {
        renderCard(pokeData);
        loadedCount++;
        if (loadedCountDiv) {
          loadedCountDiv.textContent = `Loaded ${loadedCount} of ${totalCount} Pokémon`;
        }
      }
    } catch (error) {
      console.error(error);
      container.innerHTML = "<p>❌ Failed to load all Pokémon.</p>";
    } finally {
      showLoading(false);
    }
    return;
  }

  showLoading(true);
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
    if (!res.ok) throw new Error("Type not found");
    const data = await res.json();
    let pokemonList = data.pokemon.map(p => p.pokemon);

    if (pokemonList.length > maxPokemonCount) {
      pokemonList = pokemonList.slice(0, maxPokemonCount);
    }

    totalCount = pokemonList.length;
    loadedCount = 0;
    const loadedCountDiv = document.getElementById('loadedCount');
    loadedCountDiv && (loadedCountDiv.textContent = `Loaded 0 of ${totalCount} Pokémon`);

    const allPokeData = await Promise.all(
      pokemonList.map(p => fetch(p.url).then(res => res.json()))
    );

    allPokeData.sort((a, b) => a.id - b.id);

    const filteredPokeData = allPokeData.filter(p => p.id <= maxPokemonCount);

    // Store current Pokémon list for sorting
    currentPokemonList = filteredPokeData;

    container.innerHTML = '';

    for (const pokeData of filteredPokeData) {
      renderCard(pokeData);
      loadedCount++;
      if (loadedCountDiv) {
        loadedCountDiv.textContent = `Loaded ${loadedCount} of ${totalCount} Pokémon`;
      }
    }
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>❌ Failed to load Pokémon by type.</p>";
  } finally {
    showLoading(false);
  }
}

closeBtn.onclick = () => {
  const popup = document.querySelector('.popup');
  if (!popup) return;

  // Start closing animation
  popup.classList.remove('flip');
  popup.classList.add('closing');

  // Clear popup content immediately
  document.querySelector('.overlay .image').innerHTML = '';
  document.querySelector('.overlay .nameNnum h3').textContent = '';
  document.querySelector('.overlay .nameNnum h4').textContent = '';
  document.querySelector('.overlay .height p:nth-child(2)').textContent = '';
  document.querySelector('.overlay .weight p:nth-child(2)').textContent = '';
  document.querySelector('.overlay .exp p:nth-child(2)').textContent = '';
  document.querySelector('.overlay .category p:nth-child(2)').textContent = '';
  document.querySelector('.overlay .gender p:nth-child(2)').textContent = '';
  document.querySelector('.overlay .abilities p:nth-child(2)').textContent = '';
  document.querySelector('.overlay .description p:nth-child(2)').textContent = '';
};

overlay.onclick = (e) => {
  if (e.target === overlay) {
    const popup = document.querySelector('.popup');
    if (!popup) return;

    // Start closing animation
    popup.classList.remove('flip');
    popup.classList.add('closing');

    // Clear popup content immediately
    document.querySelector('.overlay .image').innerHTML = '';
    document.querySelector('.overlay .nameNnum h3').textContent = '';
    document.querySelector('.overlay .nameNnum h4').textContent = '';
    document.querySelector('.overlay .height p:nth-child(2)').textContent = '';
    document.querySelector('.overlay .weight p:nth-child(2)').textContent = '';
    document.querySelector('.overlay .exp p:nth-child(2)').textContent = '';
    document.querySelector('.overlay .category p:nth-child(2)').textContent = '';
    document.querySelector('.overlay .gender p:nth-child(2)').textContent = '';
    document.querySelector('.overlay .abilities p:nth-child(2)').textContent = '';
    document.querySelector('.overlay .description p:nth-child(2)').textContent = '';
  }
};

// Listen for animation end to hide overlay and remove closing class
const popup = document.querySelector('.popup');
if (popup) {
  popup.addEventListener('animationend', (event) => {
    if (event.animationName === 'popupClose') {
      overlay.classList.remove('active');
      popup.classList.remove('closing');
    }
  });
}

async function loadMorePokemon() {
  offset += limit;
  fetchPokemonList();
}

async function loadAllPokemon(event) {
  if (event) event.preventDefault();
  showLoading(true);
  try {
    offset = 0;
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadAllBtn = document.getElementById('loadAllBtn');
    loadMoreBtn.style.display = 'none';
    loadAllBtn.style.display = 'none';

    const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=0&limit=${maxPokemonCount}`);
    const data = await res.json();

    totalCount = Math.min(data.count, maxPokemonCount);

    const pokemonCountDiv = document.getElementById('pokemonCount');
    pokemonCountDiv && (pokemonCountDiv.textContent = `Total Pokémon available: ${totalCount}`);

    const allPokeData = await Promise.all(
      data.results.map(pokemon => fetch(pokemon.url).then(res => res.json()))
    );

    allPokeData.sort((a, b) => a.id - b.id);

    const filteredPokeData = allPokeData.filter(p => p.id <= maxPokemonCount);

    container.innerHTML = '';
    loadedCount = 0;

    const loadedCountDiv = document.getElementById('loadedCount');

    for (const pokeData of filteredPokeData) {
      renderCard(pokeData);
      loadedCount++;
      loadedCountDiv && (loadedCountDiv.textContent = `Loaded ${loadedCount} of ${totalCount} Pokémon`);
    }
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>Failed to load all Pokémon. Try again later.</p>";
  } finally {
    showLoading(false);
  }
}

const navHome = document.getElementById('nav-home');
const navPokemon = document.getElementById('nav-pokemon');
const navTypes = document.getElementById('nav-types');
const navAbout = document.getElementById('nav-about');

function clearActiveNav() {
  [navHome, navPokemon, navTypes, navAbout].forEach(nav => nav.classList.remove('active'));
}

function setActiveNav(navElement) {
  clearActiveNav();
  navElement.classList.add('active');
}

navHome.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveNav(navHome);
  document.getElementById('searchInput').value = '';

  // Activate the "all" filter button
  const allFilterButton = document.querySelector('.filter-buttons button[onclick="filterByType(\'\')"]');
  if (allFilterButton) {
    allFilterButton.classList.add('active');
    allFilterButton.style.transform = 'scale(1.2)';
    setTimeout(() => {
      allFilterButton.style.transform = '';
    }, 200);
  }

  // Load all Pokémon by calling filterByType with empty string
  filterByType('');

  loadMoreBtn.style.display = 'inline-block';
});

navPokemon.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveNav(navPokemon);
  document.getElementById('searchInput').value = '';
  offset = getRandomOffset();
  fetchPokemonList();
  loadMoreBtn.style.display = 'inline-block';
});

navTypes.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveNav(navTypes);
  const filterButtons = document.querySelector('.filter-buttons');
  if (filterButtons) {
    // Remove scrolling and add highlight effect instead
    filterButtons.classList.add('highlight');
    setTimeout(() => {
      filterButtons.classList.remove('highlight');
    }, 1000);
  }
});

navAbout.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveNav(navAbout);
  alert('PokeDex App\n\nBrowse and search Pokémon by name, type, and more.\nCreated with PokéAPI.');
});

const sortSelect = document.getElementById('sortSelect');
sortSelect.addEventListener('change', async () => {
  const sortValue = sortSelect.value;

  // Use currentPokemonList if available, else fallback to fullPokemonList
  let listToSort = (currentPokemonList && currentPokemonList.length > 0) ? currentPokemonList : fullPokemonList;

  if (!listToSort) {
    // If no list available, load full list
    showLoading(true);
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=0&limit=${maxPokemonCount}`);
      const data = await res.json();
      const allPokeData = await Promise.all(
        data.results.map(pokemon => fetch(pokemon.url).then(res => res.json()))
      );
      allPokeData.sort((a, b) => a.id - b.id);
      fullPokemonList = allPokeData.filter(p => p.id <= maxPokemonCount);
      listToSort = fullPokemonList;
    } catch (error) {
      console.error(error);
      container.innerHTML = "<p>Failed to load all Pokémon for sorting. Try again later.</p>";
      showLoading(false);
      return;
    }
    showLoading(false);
  }

  let sortedList = [...listToSort];

  if (sortValue === 'lowest') {
    sortedList.sort((a, b) => a.id - b.id);
  } else if (sortValue === 'highest') {
    sortedList.sort((a, b) => b.id - a.id);
  } else if (sortValue === 'az') {
    sortedList.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortValue === 'za') {
    sortedList.sort((a, b) => b.name.localeCompare(a.name));
  }

  container.innerHTML = '';
  sortedList.forEach(pokemon => renderCard(pokemon));
});

// Set default active nav on page load
setActiveNav(navHome);

// Initial load with random offset
offset = getRandomOffset();
fetchPokemonList();
