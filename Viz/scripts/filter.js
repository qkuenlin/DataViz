// apply all filters
function filterAll() {
    // filter movie by year then by review
    mapMovie_filtered = filterReviews(sliderReview.getValue(), filterYears(sliderYear.getValue(), mapMovie));
    // filter links between selected movies with the department
    mapCrewMovie_filtered = filterLinksPerDepartement(d3.select('#DepartementOptions').property('value'), linksForFilteredMovies());

    if (document.querySelector("#SearchValue").value.toLowerCase() != "") {
        switchSearch();
    }
    else if (currentCompany != "") {
        filterCompany(currentCompany);
    }
    else if (currentViz == 2) {
        drawMovieViz(movieVizSet, true);
        showMovieInfo(currentMovie);
    }
    else drawCircularViz();
}

// filter by years
function filterYears(range, _map) {
    let newMap = new Map();

    _map.forEach(function (value, key, map) {
        let year = new Date(value.release_date).getYear() + 1900;

        if (year >= range[0] && year <= range[1]) {
            newMap.set(key, value);
        }
    });

    filtered_movies = all_movies.filter(function (d) {
        let year = new Date(d.release_date).getYear() + 1900;
        return year >= range[0] && year <= range[1];
    });

    return newMap;
}

// filter by reviews
function filterReviews(range, _map) {
    let newMap = new Map();

    _map.forEach(function (value, key, map) {
        if (value.vote_average >= range[0] && value.vote_average <= range[1]) {
            newMap.set(key, value);
        }
    });

    filtered_movies = filtered_movies.filter(function (d) {
        return d.vote_average >= range[0] && d.vote_average <= range[1];
    });

    return newMap;
}

//get the link only for the filtered movies
function linksForFilteredMovies() {
    let newMap = new Map();
    // for each person
    mapCrewMovie.forEach(function (value, key, map) {
        let newSet = new Set();
        // for each movie linked to one person
        value.forEach(function (d) {
            // if the movie is in the list of filtered movie, keep the movie
            if (mapMovie_filtered.get(d.id_movie)) newSet.add(d);
        })
        // if there is movies for this person, add it to it
        if (newSet.size > 0) newMap.set(key, newSet)
    });
    // return the list of person only with filtered movies
    return newMap;
}

// filter list of linked movie by the department
function filterLinksPerDepartement(dept, _map) {
    // if no filter -> do nothing
    if (dept != "All") {
        let newMap = new Map();
        //for each person
        _map.forEach(function (value, key, map) {
            let newSet = new Set();
            // for each movie of that person
            value.forEach(function (d) {
                // keep the link only if the department match
                if (d.department == dept) newSet.add(d);
            })
            // keep the perso only if she has some links
            if (newSet.size > 0) newMap.set(key, newSet)
        });
        // return the list of person with their movies
        return newMap;

    }
    else {
        return _map;
    }
}

//remove the company filter
function removeCompanyFilter() {
    currentCompany = "";
    document.getElementById('reset-company-filter').style.display = "none";
    filterAll();
}

//filter by a define company
function filterCompany(company) {
    cleanSearch();
    currentCompany = company;
    let newMap = new Map();
    document.getElementById('reset-company-filter').style.display = "inline-block";
    document.getElementById('production-company-name').innerHTML = ("X - " + company);
    mapMovie_filtered.forEach(function (value, key, map) {
        if (value.production_companies.includes(company)) {
            newMap.set(key, value);
        }
    });
    mapMovie_filtered = new Map();
    newMap.forEach(function (value, key, map) {
        mapMovie_filtered.set(key, value);
    });

    filtered_movies = filtered_movies.filter(x=> { x.production_companies.includes(company) });

    mapCrewMovie_filtered = linksForFilteredMovies();
    drawMovieViz(movieVizSet, true);
    showMovieInfo(currentMovie);
}