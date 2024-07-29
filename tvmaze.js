"use strict";

const $showsList = $("#showsList");
const $episodesArea = $("#episodesArea");
const $searchForm = $("#searchForm");
const $mainContent = $("#mainContent");

const MISSING_IMAGE_URL = "https://tinyurl.com/tv-missing";


async function getShowsByTerm(term) {
  const response = await axios.get('https://api.tvmaze.com/search/shows', {
    params: {
      q: term
    }
  });

  return response.data.map(result => {
    const show = result.show;
    return {
      id: show.id,
      name: show.name,
      summary: show.summary,
      image: show.image ? show.image.medium : MISSING_IMAGE_URL
    };
  });
}


function populateShows(shows) {
  $showsList.empty();

  for (let show of shows) {
    const $show = $(
      `<div data-show-id="${show.id}" class="Show col-md-12 col-lg-6 mb-4">
         <div class="media">
           <img
              src="${show.image}"
              alt="${show.name}"
              class="w-25 me-3 card-img-top">
           <div class="media-body">
             <h5 class="text-primary">${show.name}</h5>
             <div><small>${show.summary}</small></div>
             <button class="btn btn-outline-light btn-sm Show-getEpisodes">
               Episodes
             </button>
           </div>
         </div>
       </div>
      `);

    $showsList.append($show);
  }
}


async function searchForShowAndDisplay() {
  const term = $("#searchForm-term").val();
  const shows = await getShowsByTerm(term);

  $episodesArea.hide();
  populateShows(shows);
}

$searchForm.on("submit", async function (evt) {
  evt.preventDefault();
  await searchForShowAndDisplay();
});



async function getEpisodesOfShow(id) {
  const response = await axios.get(`https://api.tvmaze.com/shows/${id}/episodes`);
  return response.data.map(episode => ({
    id: episode.id,
    name: episode.name,
    season: episode.season,
    number: episode.number
  }));
}


function populateEpisodesAndShowDetails(show, episodes) {
  const $showDetails = $(`
    <div class="Show-details">
      <button id="closeEpisodes" class="btn btn-danger btn-sm">X</button>
      <img src="${show.image}" alt="${show.name}" class="img-fluid">
      <h2 class="text-primary">${show.name}</h2>
      <div><small>${show.summary}</small></div>
      <h3>Episodes</h3>
      <ul id="episodesList"></ul>
    </div>
  `);

  const $episodesList = $showDetails.find("#episodesList");
  for (let episode of episodes) {
    const $item = $(
      `<li>${episode.name} (S${episode.season}, Ep${episode.number})</li>`
    );
    $episodesList.append($item);
  }

  $episodesArea.html($showDetails);
  $episodesArea.fadeIn("slow");

  $("#closeEpisodes").on("click", function() {
    $episodesArea.fadeOut("slow", function() {
      $episodesArea.empty(); // Clear the contents
      $mainContent.removeClass("col-8").addClass("col-12");
    });
  });
}

/** Episode btn click */

async function handleEpisodeClick(evt) {
  const $show = $(evt.target).closest(".Show");
  const showId = $show.data("show-id");
  const shows = await getShowsByTerm($("#searchForm-term").val());
  const show = shows.find(s => s.id === showId);
  
  if (!showId || !show) {
    console.error("Show not found!");
    return;
  }

  const episodes = await getEpisodesOfShow(showId);
  populateEpisodesAndShowDetails(show, episodes);
  
  // Adjust layout Lots of googling for this one.
  $mainContent.removeClass("col-12").addClass("col-8");
  $episodesArea.removeClass("d-none").fadeIn("slow").addClass("d-block");
}

$showsList.on("click", ".Show-getEpisodes", handleEpisodeClick);
