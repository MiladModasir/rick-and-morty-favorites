/**********************
 * CONFIG / ROOT NODES
 **********************/
const apiUrls = [
  "https://rickandmortyapi.com/api/character?page=1",
  "https://rickandmortyapi.com/api/character?page=2",
];

const container = document.querySelector("#collection");
const favoritesContainer = document.querySelector("#favorites");

/**********************
 * GENERIC UI HELPERS
 **********************/
function showLoading() {
  // lightweight text loader (swap for skeletons if you want)
  container.innerHTML = '<p class="loading">Loading characters…</p>';
}

function showError(retryFn) {
  container.innerHTML = `
    <div class="error">
      <p>We couldn’t load characters. Check your connection or try again.</p>
      <button id="retry">Retry</button>
    </div>
  `;
  const retry = document.getElementById("retry");
  if (retry) retry.addEventListener("click", retryFn);
}

// Optional: counts in headers (add #collectionTitle / #favoritesTitle in HTML to use)
function updateCounts() {
  const colTitle = document.getElementById("collectionTitle");
  const favTitle = document.getElementById("favoritesTitle");
  if (colTitle) colTitle.textContent = `Full Collection (${container.children.length})`;
  if (favTitle) favTitle.textContent = `Favorites (${favoritesContainer.children.length})`;
}

/************************
 * FAVORITES PERSISTENCE
 ************************/
let favoriteIds = new Set();

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify([...favoriteIds]));
}

function loadFavorites() {
  const data = localStorage.getItem("favorites");
  if (!data) return;
  try {
    favoriteIds = new Set(JSON.parse(data));
  } catch (e) {
    console.error("Error parsing favorites from localStorage:", e);
  }
}

/*********************
 * SUMMARY (SPECIES)
 *********************/
function displaySpeciesSummary(summaryobj) {
  const summaryDiv = document.getElementById("species-summary");
  if (!summaryDiv) return;

  summaryDiv.innerHTML = "";

  const total = Object.values(summaryobj).reduce((acc, val) => acc + val, 0);
  const totalEl = document.createElement("h3");
  totalEl.textContent = `Total Characters in Favorites: ${total}`;
  summaryDiv.appendChild(totalEl);

  if (total === 0) {
    const noSpeciesEl = document.createElement("p");
    noSpeciesEl.textContent = "No species in favorites.";
    summaryDiv.appendChild(noSpeciesEl);
    return;
  }

  for (let species in summaryobj) {
    const p = document.createElement("p");
    p.textContent = `${species}: ${summaryobj[species]}`;
    summaryDiv.appendChild(p);
  }
}

function getSpeciesSummaryFromDOM(listContainer) {
  const cards = Array.from(listContainer.children);
  return cards.reduce((acc, card) => {
    const species = card.dataset.species || "Unknown";
    acc[species] = (acc[species] || 0) + 1;
    return acc;
  }, {});
}

/****************
 * SEARCH (name)
 ****************/
function filterCollectionByName(inputEl) {
  const cards = Array.from(container.children);
  const search = inputEl.value.toLowerCase();
  let visible = 0;

  cards.forEach((card) => {
    const name = card.querySelector("h3").textContent.toLowerCase();
    const show = name.includes(search);
    card.style.display = show ? "" : "none";
    if (show) visible++;
  });

  // Simple empty state for search
  let empty = document.getElementById("noResults");
  if (!empty) {
    empty = document.createElement("p");
    empty.id = "noResults";
    empty.style.display = "none";
    empty.textContent = "No results. Try a different name.";
    container.appendChild(empty);
  }
  empty.style.display = visible === 0 ? "" : "none";
}

function debounce(fn, delay = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function wireUpSearch() {
  const search = document.getElementById("search");
  if (!search) return;

  // hydrate previous search if you want persistence
  const saved = localStorage.getItem("searchTerm") || "";
  if (saved) {
    search.value = saved;
    filterCollectionByName(search);
  }

  const handler = debounce((e) => {
    localStorage.setItem("searchTerm", e.target.value);
    filterCollectionByName(e.target);
  }, 300);

  search.addEventListener("input", handler);
}

/********************
 * SORTING (name/ep)
 ********************/
let lastSort = { mode: "name", ascending: true }; // remember last sort

function sortCards(targetContainer, opts = lastSort) {
  lastSort = opts; // keep latest
  const cards = Array.from(targetContainer.children);

  cards.sort((a, b) => {
    if (opts.mode === "name") {
      const nameA = a.querySelector("h3").textContent.toLowerCase();
      const nameB = b.querySelector("h3").textContent.toLowerCase();
      const cmp = nameA.localeCompare(nameB);
      return opts.ascending ? cmp : -cmp;
    } else if (opts.mode === "episodes") {
      const epA = Number(a.dataset.episode) || 0;
      const epB = Number(b.dataset.episode) || 0;
      if (epA !== epB) return opts.ascending ? epA - epB : epB - epA;
      // stable tie-break by name
      const nameA = a.querySelector("h3").textContent.toLowerCase();
      const nameB = b.querySelector("h3").textContent.toLowerCase();
      return nameA.localeCompare(nameB);
    }
    return 0;
  });

  cards.forEach((card) => targetContainer.appendChild(card));
}

function wireUpSortButtons() {
  const pairs = [
    ["sortAZ", () => ({ mode: "name", ascending: true })],
    ["sortZA", () => ({ mode: "name", ascending: false })],
    ["sortMostEpisodes", () => ({ mode: "episodes", ascending: false })],
    ["sortLeastEpisodes", () => ({ mode: "episodes", ascending: true })],
  ];

  const allBtns = [];

  pairs.forEach(([id, getOpts]) => {
    const btn = document.getElementById(id);
    if (!btn) return; // safe if button missing
    allBtns.push(btn);

    btn.addEventListener("click", () => {
      const opts = getOpts();
      sortCards(container, opts);
      sortCards(favoritesContainer, opts);

      // active visual + a11y
      allBtns.forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
    });
  });
}

/*****************
 * CARD FACTORY
 *****************/
function createCard(character) {
  const card = document.createElement("div");
  card.classList.add("card");

  card.innerHTML = `
    <img loading="lazy" src="${character.image}" alt="${character.name}" />
    <h3>${character.name}</h3>
    <p>Status: ${character.status}</p>
    <p>Species: ${character.species}</p>
  `;

  // stable data for summary / sorts
  card.dataset.species = character.species;
  card.dataset.episode = character.episode.length;

  // move card between lists + persist + refresh UI
  card.addEventListener("click", () => {
    const id = character.id;

    if (card.parentElement && card.parentElement.id === "collection") {
      favoritesContainer.appendChild(card);
      favoriteIds.add(id);
    } else {
      container.appendChild(card);
      favoriteIds.delete(id);
    }

    saveFavorites();
    displaySpeciesSummary(getSpeciesSummaryFromDOM(favoritesContainer));
    updateCounts();

    // keep current sort order intact on both lists
    sortCards(container, lastSort);
    sortCards(favoritesContainer, lastSort);
  });

  return card; // IMPORTANT: we return; fetch decides where to append
}

/*******************
 * DATA FETCH / RENDER
 *******************/
function fetchCharacters(urls, limit = 40) {
  showLoading();

  Promise.all(
    urls.map((url) =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
    )
  )
    .then((pages) => {
      container.innerHTML = ""; // clear loader
      const allCharacters = pages.flatMap((p) => p.results || []);
      const characters = allCharacters.slice(0, limit);

      characters.forEach((character) => {
        const card = createCard(character);
        if (favoriteIds.has(character.id)) {
          favoritesContainer.appendChild(card);
        } else {
          container.appendChild(card);
        }
      });

      // initial summary/counts after render
      displaySpeciesSummary(getSpeciesSummaryFromDOM(favoritesContainer));
      updateCounts();

      // re-apply last sort (default A–Z)
      sortCards(container, lastSort);
      sortCards(favoritesContainer, lastSort);
    })
    .catch((err) => {
      console.error("Error fetching characters:", err);
      showError(() => fetchCharacters(urls, limit));
    });
}

/********
 * INIT
 ********/
function init() {
  loadFavorites(); // must be before fetching
  fetchCharacters(apiUrls);
  wireUpSortButtons();
  wireUpSearch();

  // initialize summary (will be overwritten after fetch)
  displaySpeciesSummary(getSpeciesSummaryFromDOM(favoritesContainer));
  updateCounts();
}

init();
