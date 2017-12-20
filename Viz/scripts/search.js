
// apply the search as a filter
function switchSearch() {
    switch (currentSearchSwitch) {
        case "All":
            searchAll();
            break
        case "Movie":
            searchFilm();
            break
        case "Keyword":
            searchKeywords();
            break
        case "Crew":
            searchCrew();
            break
    }

}
// reset the search field
function cleanSearch() {
    document.querySelector("#SearchValue").value = "";
}

// check if a movie is in the search result list
function checkIfSearched(movie) {
    if (searchedMovies.movies.has(movie) ||
        searchedMovies.keywords.has(movie) ||
        searchedMovies.crew.has(movie)) return true;
    else return false;
}

function showSearchResult(token=true) {
    let div = d3.select(".TextZone");
    div.selectAll("*").remove();
    tooltipDiv.style("opacity", 0).style("opacity", 0)
    .style("left", (0) + "px")
    .style("top", (0) + "px");
    d3.select(".TitleZone").selectAll("*").remove()
    d3.select(".TitleZone")
    .append("h1").text("Search Result");

    if (searchedMovies.movies.size != 0) {
        paragrah = div.append("p")
        paragrah.append("h4").text("Match by movie title")
        listing = paragrah.append("ul").selectAll("li")
                    .data([...searchedMovies.movies])
                    .enter()
                    .append("li")
                   .append("a")
                    .text((d) => d.title)
                    .attr("href", "#")
                    .attr("class", "listSearch")
                    .on("click", click)
                    .on("mouseover", mouseovered)
                    .on("mouseout", mouseouted)

    }
    if (searchedMovies.keywords.size != 0) {
        paragrah = div.append("p")
        paragrah.append("h4").text("Match by keywords")
        listing = paragrah.append("ul").selectAll("li")
                    .data([...searchedMovies.keywords])
                    .enter()
                    .append("li")
                    .append("a")
                    .text((d) => d.title)
                    .attr("href", "#")
                    .attr("class", "listSearch")
                    .on("click", click)
                    .on("mouseover", mouseovered)
                    .on("mouseout", mouseouted)

    }
    if (searchedMovies.crew.size != 0) {
        paragrah = div.append("p")
        paragrah.append("h4").text("Match by Crew members")
        listing = paragrah.append("ul").selectAll("li")
                    .data([...searchedMovies.crew_detail])
                    .enter()
                    .append("li")
                    .text((d) => crewByID(d[0]).name)
                    .append("ul").selectAll("li")
                    .data((d) =>[...d[1]])
                    .enter()
                    .append("li")
                    .append("a")
                    .attr("href", "#")
                    .attr("class", "listSearch")
                    .text((d) => (mapMovie.get(d.id_movie).title) + " (" + d.job +")")
                    .on("click", click)
                    .on("mouseover", mouseovered)
                    .on("mouseout", mouseouted)
    }

    Zoneheight = getHeight("#info-panel") - getHeight(".TitleZone")
    div.style("max-height", Zoneheight + 'px');
    div.style("overflow-y", "scroll");

    if (token){
        let sidepanel2 = d3.select(".DrawZone");
        let svg = sidepanel2.select("#side-svg");
        svg.selectAll("*").remove();
        // svg.attr("width", parseInt(d3.select(".DrawZone").style("width"))-40) //-40 for the margin (no overflow)
        svg.attr("width",10);
        svg.attr("height",10);
        div.style("overflow-y", "auto");
        div.style("overflow-x", "auto")
        d3.select(".TitleZone2").select("h3").remove("*")
    }
    // let svg_width = parseInt(d3.select(".DrawZone").style("width")) - 30; //col padding is 2*15
    // let svg_height = Zoneheight * 0.01;
    // svg.attr("width", svg_width).attr("height", svg_height);

    // let margin = { top: 5, right: 5, bottom: 30, left: 50 };
    // let g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    // let width = svg.attr("width") - margin.left - margin.right;
    // let height = svg.attr("height") - margin.top - margin.bottom;

    function click(d) {
        cleanSearch();
        let movie = mapMovie.get(d.id_movie)
        tooltipDiv.style("opacity", 0).style("opacity", 0)
        .style("left", (0) + "px")
        .style("top", (0) + "px");

        showMovieInfo(movie);
        drawMovieViz(new Set().add(movie), true);
    }

    function mouseovered(d) {
        MovieNode.classed("node--fade", true);
        MovieLink.classed("link--highlight", function (l) {
            if (l.source.id_movie == d.id_movie || l.target.id_movie == d.id_movie) { //|| l.target.id_movie == d.id_movie
                MovieNode.filter(x=> x.id_movie == l.source.id_movie || x.id_movie == l.target.id_movie).classed("node--highlight", true).classed("node--fade", false);
                return true; //|| x.id_movie == l.target.id_movie
            } else {
                return false;
            }
        })
        MovieLink.classed("link--fade", function (l) {
            return !(l.source.id_movie == d.id_movie || l.target.id_movie == d.id_movie);
        })
    }

    function mouseouted(d) {
        MovieLink.classed("link--highlight", false).classed("link--fade", false);
        MovieNode.classed("node--highlight", false).classed("node--fade", false);

    }
}

//search in all fields
function searchAll() {
    //change the switch
    currentSearchSwitch = "All";
    // check that field search is not empty
    if (document.querySelector("#SearchValue").value.toLowerCase() == "") return;
    let newSet = new Set([...searchFilm(true), ...searchKeywords(true), ...searchCrew(true)]);
    drawMovieViz(newSet, true);
    showSearchResult();
}

function searchFilm(all_token) {
    //change the switch

    // get the words the user want to search
    let search = document.querySelector("#SearchValue").value.toLowerCase()
    if (search == "") return; // check that field search is not empty
    let newSet = new Set();
    // for each movie
    mapMovie_filtered.forEach(function (value, key, map) {
        // if the search term is in the title, add the movie to the set
        if (value.title.toLowerCase().includes(search)) newSet.add(value);
    })
    searchedMovies.movies = newSet;
    // if search all return, if not draw directly
    if (all_token) {
        return newSet
    } else {
        searchedMovies.crew = new Set();
        searchedMovies.keywords = new Set();
        currentSearchSwitch = "Movie";
        drawMovieViz(newSet, true);
        showSearchResult();
    }
}

function searchKeywords(all_token) {
    //change the switch

    // get the words the user want to search
    let search = document.querySelector("#SearchValue").value.toLowerCase()
    if (search == "") return; // check that field search is not empty
    let newSet = new Set();
    // for each movie
    mapMovie_filtered.forEach(function (value, key, map) {
        // if the search term is in the keywords, add the movie to the set
        if (value.keywords.toLowerCase().includes(search)) newSet.add(value);
    })
    searchedMovies.keywords = newSet;
    // if search all return, if not draw directly
    if (all_token) {
        return newSet
    }
    else {
        searchedMovies.crew = new Set();
        searchedMovies.movies = new Set();
        currentSearchSwitch = "Keyword";
        drawMovieViz(newSet, true);
        showSearchResult();
    }
}

function searchCrew(all_token, useid = false) {
    //change the switch

    // get the words the user want to search
    let search = document.querySelector("#SearchValue").value.toLowerCase();
    if (search == "") return; // check that field search is not empty
    let newSet = new Set();
    let newMap = new Map();
    // for each person
    people.forEach(function (value) {
        // if the search is in the name of the perso
        if ((useid && value.id_person == parseInt(search, 10)) || (!useid && value.name.toLowerCase().includes(search))) {
            // get all the movies linked to this person and add them to the set
            let n = mapCrewMovie_filtered.get(value.id_person);

            if (n) {
                let map = new Map();

                n.forEach(function (d) {
                    let value = map.get(d.id_movie);
                    if (value) {
                        value += ", " + d.job;
                        if (d.role) value += ": " + d.role;
                    }
                    else{
                        value = d.job;
                        if (d.role) value += ": " + d.role;
                    }

                    map.set(d.id_movie, value);
                })
                let x = new Set();
                map.forEach(function (value, key) {
                    x.add({ id_movie: key, job: value });
                })

                newMap.set(value.id_person, x);
                n.forEach((d) => newSet.add(mapMovie.get(d.id_movie)))
            }
        };
    })
    searchedMovies.crew = newSet;
    searchedMovies.crew_detail = newMap;
    // if search all return, if not draw directly
    if (all_token) {
        return newSet
    } else {
        searchedMovies.movies = new Set();
        searchedMovies.keywords = new Set();
        currentSearchSwitch = "Crew";
        drawMovieViz(newSet, true);
        showSearchResult();
    }
}

function searchCrewID(crew_id) {
    let search = document.querySelector("#SearchValue");
    search.value = crew_id.toString(10);
    searchCrew(false, true);
    search.value = "";
}
