window.addEventListener("load", () => {
  const searchInput = document.getElementById("searchInput");
  searchInput.setAttribute("autocomplete", "off");

  let images = []; // Store JSON data globally for search functionality

  fetch("https://raw.githubusercontent.com/sachicodex/database/refs/heads/main/edu.json")
    .then((res) => res.json())
    .then((data) => {
      images = data;
      displayImages(images);
    })
    .catch((err) => console.error("Error loading images:", err));

  // Function to display images
  function displayImages(imageData) {
    const grid = document.getElementById("imageGrid");
    grid.innerHTML = "";

    imageData.forEach((imgData) => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("card");

      const link = document.createElement("a");
      link.href = imgData.link;
      link.target = "_blank";

      const imageContainer = document.createElement("div");
      imageContainer.classList.add("image-container");

      const skeleton = document.createElement("div");
      skeleton.classList.add("skeleton");
      imageContainer.appendChild(skeleton);

      const img = document.createElement("img");
      img.src = imgData.src;
      img.alt = imgData.alt;
      img.style.visibility = "hidden";
      img.style.opacity = "0";

      img.onload = () => {
        skeleton.remove();
        img.style.visibility = "visible";
        img.style.opacity = "1";
        img.classList.add("fade-in");
      };

      imageContainer.appendChild(img);
      link.appendChild(imageContainer);

      const title = document.createElement("div");
      title.classList.add("image-title");
      title.textContent = imgData.title;

      link.appendChild(title);
      wrapper.appendChild(link);
      grid.appendChild(wrapper);
    });
  }

  // Function to display suggestions
  function displaySuggestions(query) {
    const suggestionsContainer = document.getElementById("suggestedItems");
    suggestionsContainer.innerHTML = "";

    if (query) {
      const suggestions = images.filter((img) => img.title.toLowerCase().includes(query)).slice(0, 3); // Limit to 3 suggestions

      if (suggestions.length === 0) {
        const noSuggestions = document.createElement("div");
        noSuggestions.classList.add("no-suggestions");
        noSuggestions.textContent = "No matching titles found.";
        suggestionsContainer.appendChild(noSuggestions);
      } else {
        suggestions.forEach((suggestion) => {
          const suggestionItem = document.createElement("div");
          suggestionItem.classList.add("suggestion-item");
          suggestionItem.textContent = suggestion.title;

          // Add click event to populate search input and display results
          suggestionItem.addEventListener("click", () => {
            document.getElementById("searchInput").value = suggestion.title;
            displayImages(images.filter((img) => img.title.toLowerCase().includes(suggestion.title.toLowerCase())));
            suggestionsContainer.innerHTML = "";
          });

          suggestionsContainer.appendChild(suggestionItem);
        });
      }
    }
  }

  // Search functionality
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const filteredImages = images.filter((img) => img.title.toLowerCase().includes(query));
    displayImages(filteredImages);
    displaySuggestions(query);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const suggestedItems = document.querySelector(".suggested-items");

  // Hide suggestions when clicking outside
  document.addEventListener("click", (event) => {
    if (!searchInput.contains(event.target) && !suggestedItems.contains(event.target)) {
      suggestedItems.classList.add("hidden");
    }
  });

  // Show suggestions when input is focused
  searchInput.addEventListener("focus", () => {
    suggestedItems.classList.remove("hidden");
  });

  // Hide suggestions when scrolling (desktop and mobile)
  let isScrolling;
  const hideSuggestionsOnScroll = () => {
    suggestedItems.classList.add("hidden-scroll");
    clearTimeout(isScrolling);
    isScrolling = setTimeout(() => {
      if (document.activeElement === searchInput) {
        suggestedItems.classList.remove("hidden-scroll");
      }
    }, 200);
  };

  window.addEventListener("scroll", hideSuggestionsOnScroll);
  window.addEventListener("touchmove", hideSuggestionsOnScroll);
});
