// index.js
const apiUrls = [
  "https://rickandmortyapi.com/api/character?page=1",
  "https://rickandmortyapi.com/api/character?page=2",
];
const container = document.querySelector("#collection");
const favoritesContainer = document.querySelector("#favorites");

// Fetch, build cards, and wire up initial total & click‐updates
function fetchCharacters(urls, limit = 40) {
  Promise.all(urls.map((url) => fetch(url).then((res) => res.json())))
  .then((pages) => {
    const allCharacters = pages.flatMap((page) => page.results);
    const characters = allCharacters.slice(0, limit);
      characters.forEach((character) => createCard(character));
    // Initial total after all cards are in place
    updateTotalEpisodes();
  })
.catch((err) => console.error("Error fetching characters:", err));
}

function filterCardByName(searchCard) {
  const card = Array.from(container.children);
  const search = searchCard.value.toLowerCase();
  card.forEach((card) => {
    const name = card.querySelector("h3").textContent.toLowerCase()
    if(name.includes(search)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  })
}
function searchCard () {
  const search = document.getElementById("search");
  search.addEventListener("input", (e) => {
  filterCardByName(e.target);
  }) 
}

  // card function
  function createCard(character) {
    const card = document.createElement("div");
      card.classList.add("card");

      card.innerHTML = `
        <img src="${character.image}" alt="${character.name}" />
        <h3>${character.name}</h3>
        <p>Status: ${character.status}</p>
        <p>Species: ${character.species}</p>
      `; 
    
      // Store episode count on the element
      card.dataset.episode = character.episode.length;
      // Move between lists & recalc on click
      card.addEventListener("click", () => {
        if (card.parentElement.id === "collection") {
          favoritesContainer.appendChild(card);
        } else {
          container.appendChild(card);
        }
        updateTotalEpisodes();
      });
      container.appendChild(card);
    }

// Sort helper
function sortCards(targetContainer, ascending = true) {
  const cards = Array.from(targetContainer.children);
  cards.sort((a, b) => {
    const nameA = a.querySelector("h3").textContent.toLowerCase();
    const nameB = b.querySelector("h3").textContent.toLowerCase();
    return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
  });
  cards.forEach((card) => targetContainer.appendChild(card));
}

// Wire up sort buttons
function wireUpSortButtons() {
  const sortAZ = document.getElementById("sortAZ");
  const sortZA = document.getElementById("sortZA");
sortAZ.addEventListener("click", () => {
  sortCards(container, true);
  sortCards(favoritesContainer, true);
})
sortZA.addEventListener("click", () => {
sortCards(container, false);
sortCards(favoritesContainer, false);
})
}


// Recalculate & display total episodes in the “collection”
function updateTotalEpisodes() {
  const cards = Array.from(container.children);
  const sum = cards.reduce(
    (acc, card) => acc + Number(card.dataset.episode),
    0
  );
  document.querySelector("#total-episodes span").textContent = sum;
}
function init () {
  fetchCharacters(apiUrls);
  wireUpSortButtons();
  searchCard();
}
init(); // all the functions are called in the init function
