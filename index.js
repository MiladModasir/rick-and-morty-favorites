// index.js
const apiUrls = [
  "https://rickandmortyapi.com/api/character?page=1",
  "https://rickandmortyapi.com/api/character?page=2",
];
const container = document.querySelector("#collection");
const favoritesContainer = document.querySelector("#favorites");

// Fetch, build cards, and wire up initial total & click‐updates

Promise.all(apiUrls.map((url) => fetch(url).then((res) => res.json())))
  .then((pages) => {
    const allCharacters = pages.flatMap((page) => page.results);
    const characters = allCharacters.slice(0, 30);
    characters.forEach((character) => {
      const card = document.createElement("div");
      card.classList.add("card");

      card.innerHTML = `
        <img src="${character.image}" alt="${character.name}" />
        <h3>${character.name}</h3>
        <p>Status: ${character.status}</p>
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
    });
    // Initial total after all cards are in place
    updateTotalEpisodes();
  })
  .catch((err) => console.error("Error fetching characters:", err));

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
document.getElementById("sortAZ").addEventListener("click", () => {
  sortCards(container, true);
  sortCards(favoritesContainer, true);
});
document.getElementById("sortZA").addEventListener("click", () => {
  sortCards(container, false);
  sortCards(favoritesContainer, false);
});

// Recalculate & display total episodes in the “collection”
function updateTotalEpisodes() {
  const cards = Array.from(container.children);
  const sum = cards.reduce(
    (acc, card) => acc + Number(card.dataset.episode),
    0
  );
  document.querySelector("#total-episodes span").textContent = sum;
}
