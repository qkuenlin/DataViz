let width = parseInt(d3.select(".svg-content").style("width"));
let height = parseInt(d3.select(".svg-content").style("height"));
let ReviewColor = d3.scaleLinear().domain([4, 6, 7, 8]).range(["red", "orange", "yellow", "green"]);

let diameter = height-20,
radius = diameter / 2,
innerRadius = radius - 40;

let cluster = d3.cluster().size([360, innerRadius]);
let ClusterType;

let line = d3.radialLine()
.curve(d3.curveBundle.beta(0.85))
.radius(function (d) { return d.y; })
.angle(function (d) { return d.x / 180 * Math.PI; });


let svg = d3.select("#main-svg");
let backgroundLayer = svg.append('g');
let CircularVizLayer = svg.append('g').attr("transform", "translate(" + 2 * width / 3 + "," + height / 2 + ")");
let MovieVizLayer = svg.append('g');
let UILayer = svg.append('g');
let UILayer2 = svg.append('g');

let DateParse = d3.timeFormat("%e %B %Y");


let loaded = false;
let all_movies;
let people;
let all_people_movies_links;

let filtered_movies;

let sliderYear;
let sliderReview;

let JobDepartments = [];

let currentViz = 0; //Current central Viz; 0: no viz, 1: circular, 2: movie graph

let mapMovieCrew = new Map(); // Map from id_movie to Set of id_crew
let mapCrewMovie = new Map(); // Map from id_crew to Set of {id_movie, department, job)
let mapMovie = new Map(); // Map from id_movie to movie object
let mapMovie_filtered = new Map(); // fitlered version of mapMovie

let mapCrewMovie_filtered = new Map(); // filtered version of mapCrewMovie

let movieVizSet = new Set(); //Set of movies in the movie graph viz

let currentCompany = "";

let currentSearchSwitch = "All"; // indicates the last search param: All, Movie, Keyword, Crew
let searchedMovies = {
    movies: new Set(),
    keywords: new Set(),
    crew: new Set(),
    crew_detail: new Map(),
}; // list of searched movies

let tooltipDiv = d3.select("body").append("div")
.attr("class", "tooltip")
.style("opacity", 0)
.style("left", (0) + "px")
.style("top", (0) + "px");


let bb = document.querySelector('#year-filter')
.getBoundingClientRect(),
yearsliderwidth = bb.right - bb.left;
// console.log(yearsliderwidth);

let cc = document.querySelector('#review-filter')
.getBoundingClientRect(),
reviewsliderwidth = cc.right - cc.left;

function resizeSVG(){
    height = getHeight("#main-panel") - getHeight("#filters")
    d3.select(".svg-content").attr("height", height)
}

function Test() {
    console.log(document.querySelector("#SearchValue").value)
    console.log(document.querySelector("#SearchType"))
}
function UISetup() {
    sliderYear = new dhtmlXSlider({
        parent: "sliderYear",
        linkTo: ["sliderYearLink", "sliderYearLink2"],
        step: 1,
        min: 1937,
        max: 2017,
        value: [2010, 2017],
        range: true,
        size: yearsliderwidth-30
    });

    sliderYear.attachEvent("onSlideEnd", function(value){
        filterAll();}
    );

    sliderReview = new dhtmlXSlider({
        parent: "sliderReview",
        linkTo: ["sliderReviewLink", "sliderReviewLink2"],
        step: 0.1,
        min: 0,
        max: 10,
        value: [0, 10],
        range: true,
        size: reviewsliderwidth-30
    });

    sliderReview.attachEvent("onSlideEnd", function(value){
        filterAll();}
    );

    let linearGradient = UILayer2.append("linearGradient").attr("id", "linear-gradient");

    linearGradient
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");

    linearGradient.selectAll("stop")
        .data(ReviewColor.range())
        .enter().append("stop")
        .attr("offset", function(d,i){return i/(ReviewColor.range().length-1);})
        .attr("stop-color", function(d){return d;});

    let xPos = width;
    let yPos = 10;

    UILayer2.append("rect")
        .attr("width", 20)
        .attr("height", 200)
        .attr("x", xPos)
        .attr("y", yPos)
        .attr("opacity", 0.8)
        .style("fill", "url(#linear-gradient)");

    let reviewScale = d3.scaleLinear().domain([10, 0]).range([0, 200]);

    let ColorAxisSVG = d3.axisLeft().scale(reviewScale).ticks(5).tickSize(20);

    UILayer2.append("g")
    .attr("class", "axis")
    .attr("transform", "translate("+ (xPos+20)+","+yPos+")")
    .attr("opacity", 0.8)
    .call(ColorAxisSVG);

    UILayer2.append("text")
                        .classed("text_label", true)
                        .attr("transform", "rotate(90)")
                        .attr("y", -(xPos+40))
                        .attr("x", (yPos+100))
                        .attr("dy", "1em")
                        .style("text-anchor", "middle")
                        .attr("opacity", 0.8)
                        .text("Reviews");
}

// apply the search as a filter
function switchSearch() {
    switch (currentSearchSwitch){
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
    console.log(searchedMovies);
    document.querySelector("#SearchValue").value = "";
}

// check if a movie is in the search result list
function checkIfSearched(movie) {
    if (searchedMovies.movies.has(movie) ||
        searchedMovies.keywords.has(movie) ||
        searchedMovies.crew.has(movie)) return true;
    else return false;
}

function showSearchResult() {
    let div = d3.select(".TextZone");
    div.selectAll("*").remove();
    tooltipDiv.style("opacity", 0).style("opacity", 0)
    .style("left", (0) + "px")
    .style("top", (0) + "px");
    d3.select(".TitleZone").selectAll("*").remove()
    d3.select(".TitleZone")
    .append("h1").text("Search Result");

    if (searchedMovies.movies.size != 0){
        paragrah = div.append("p")
        paragrah.append("h4").text("Match by movie title")
        listing = paragrah.append("ul").selectAll("li")
                    .data([...searchedMovies.movies])
                    .enter()
                    .append("li")
                   .append("a")
                    .text((d)=> d.title)
                    .attr("href","#")
                    .attr("class","listSearch")
                    .on("click", click)
                    .on("mouseover", mouseovered)
                    .on("mouseout",mouseouted)

    }
    if (searchedMovies.keywords.size != 0){
        paragrah = div.append("p")
        paragrah.append("h4").text("Match by keywords")
        listing = paragrah.append("ul").selectAll("li")
                    .data([...searchedMovies.keywords])
                    .enter()
                    .append("li")
                    .append("a")
                    .text((d)=> d.title)
                    .attr("href","#")
                    .attr("class","listSearch")
                    .on("click", click)
                    .on("mouseover", mouseovered)
                    .on("mouseout",mouseouted)

    }
    if (searchedMovies.crew.size != 0){
        paragrah = div.append("p")
        paragrah.append("h4").text("Match by Crew members")
        listing = paragrah.append("ul").selectAll("li")
                    .data([...searchedMovies.crew_detail])
                    .enter()
                    .append("li")
                    .text((d)=> crewByID(d[0]).name)
                    .append("ul").selectAll("li")
                    .data((d)=>[...d[1]])
                    .enter()
                    .append("li")
                    .append("a")
                    .attr("href","#")
                    .attr("class","listSearch")
                    .text((d)=> movieByID(d.id_movie).title)
                    .on("click", click)
                    .on("mouseover", mouseovered)
                    .on("mouseout",mouseouted)

    }

    Zoneheight = getHeight("#side-panel") - getHeight(".TitleZone")
    div.style("max-height", Zoneheight*0.95 + 'px');
    div.style("overflow-y", "scroll");


    let sidepanel2 = d3.select(".DrawZone");
    let svg = sidepanel2.select("#side-svg");
    svg.selectAll("*").remove();
    let svg_width = parseInt(d3.select(".DrawZone").style("width")) -30; //col padding is 2*15
    let svg_height = Zoneheight*0.01;
    svg.attr("width", svg_width).attr("height", svg_height);
    // let margin = { top: 5, right: 5, bottom: 30, left: 50 };
    // let g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    // let width = svg.attr("width") - margin.left - margin.right;
    // let height = svg.attr("height") - margin.top - margin.bottom;

    function click(d){
        cleanSearch();
        let movie = mapMovie.get(d.id_movie)
        console.log(movie)
        ooltipDiv.style("opacity", 0).style("opacity", 0)
        .style("left", (0) + "px")
        .style("top", (0) + "px");

        showMovieInfo(movie);
        drawMovieViz(new Set().add(movie), true);
    }

    function mouseovered(d){
        MovieNode.classed("node--fade", true);
        MovieLink.classed("link--highlight", function(l) {
            if (l.source.id_movie == d.id_movie || l.target.id_movie == d.id_movie) { //|| l.target.id_movie == d.id_movie
                MovieNode.filter(x=> x.id_movie == l.source.id_movie || x.id_movie == l.target.id_movie).classed("node--highlight", true).classed("node--fade", false);
                return true; //|| x.id_movie == l.target.id_movie
            } else {
                return false;
            }
        })
        MovieLink.classed("link--fade", function(l) {
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
    currentSearchSwitch =  "All";
    // check that field search is not empty
    if (document.querySelector("#SearchValue").value.toLowerCase() == "") return;
    let newSet = new Set([...searchFilm(true), ...searchKeywords(true), ...searchCrew(true)]);
    drawMovieViz(newSet, true);
    console.log("hello")
    showSearchResult();
}

function searchFilm(all_token=false) {
    //change the switch

    // get the words the user want to search
    let search = document.querySelector("#SearchValue").value.toLowerCase()
    if (search == "") return; // check that field search is not empty
    let newSet = new Set();
    // for each movie
    mapMovie_filtered.forEach(function (value, key, map){
        // if the search term is in the title, add the movie to the set
        if (value.title.toLowerCase().includes(search)) newSet.add(value);
    })
    searchedMovies.movies = newSet;
    // if search all return, if not draw directly
    if (all_token){
        return newSet
    } else {
        searchedMovies.crew = new Set();
        searchedMovies.keywords =  new Set();
        currentSearchSwitch =  "Movie";
        drawMovieViz(newSet, true);
        showSearchResult();
    }
}

function searchKeywords(all_token=false) {
    //change the switch

    // get the words the user want to search
    let search = document.querySelector("#SearchValue").value.toLowerCase()
    if (search == "") return; // check that field search is not empty
    let newSet = new Set();
    // for each movie
    mapMovie_filtered.forEach(function (value, key, map){
        // if the search term is in the keywords, add the movie to the set
        if (value.keywords.toLowerCase().includes(search)) newSet.add(value);
    })
    searchedMovies.keywords = newSet;
    // if search all return, if not draw directly
    if (all_token){
        return newSet
    }
    else {
        searchedMovies.crew = new Set();
        searchedMovies.movies = new Set();
        currentSearchSwitch =  "Keyword";
        drawMovieViz(newSet, true);
        showSearchResult();
    }
}

function searchCrew(all_token=false) {
    //change the switch

    // get the words the user want to search
    let search = document.querySelector("#SearchValue").value.toLowerCase();
    if (search == "") return; // check that field search is not empty
    let newSet = new Set();
    let newMap = new Map();
    // for each person
    people.forEach(function (value){
        // if the search is in the name of the perso
        if (value.name.toLowerCase().includes(search)){
            // get all the movies linked to this person and add them to the set
            let n = mapCrewMovie_filtered.get(value.id_person)   ;
            if (n) {
                newMap.set(value.id_person,n);
                n.forEach((d)=> newSet.add(movieByID(d.id_movie)))
            }
        };
    })
    searchedMovies.crew = newSet;
    searchedMovies.crew_detail = newMap;
    // if search all return, if not draw directly
    if (all_token){
        return newSet
    } else {
        searchedMovies.movies = new Set();
        searchedMovies.keywords = new Set();
        currentSearchSwitch =  "Crew";
        drawMovieViz(newSet, true);
        showSearchResult();
    }
}


// apply all filters
function filterAll() {
    // filter movie by year then by review
    mapMovie_filtered = filterReviews(sliderReview.getValue(), filterYears(sliderYear.getValue(), mapMovie));
    // filter links between selected movies with the department
    mapCrewMovie_filtered = filterLinksPerDepartement(d3.select('#DepartementOptions').property('value'), linksForFilteredMovies());

    if (document.querySelector("#SearchValue").value.toLowerCase() != ""){
        switchSearch();
    }
    else if(currentCompany != "") {
        filterCompany(currentCompany);
    }
    else if (currentViz == 2)  {
        drawMovieViz(movieVizSet, true);
        showMovieInfo(currentMovie);
    }
    else drawCircularViz();
}

function Reset(){
    cleanSearch();
    currentViz = 1;
    filterAll();
    displayDBInfo();
}

function ClusterChange() {
    ClusterType = d3.select('#ClusterOptions').property('value');
    drawCircularViz(true);
}

function AxisChange() {
    drawMovieViz(movieVizSet);
}

function customAxisChange() {
    if (document.getElementById("CustomAxisSwitch").checked) {
        document.getElementById('CustomAxisSelector').style.display = "inline";
    }
    else {
        document.getElementById('CustomAxisSelector').style.display = "none";
    }
    // resizeSVG()
    AxisChange()
}

//load all json, set loaded to true. If add new json, need to do another callback layer
function loadFiles() {
    d3.json("../movie.json", function (error, data) {
        if (error) throw error;
        all_movies = data;
        all_movies.forEach(function (d) {
            mapMovie.set(d.id_movie, d);
        })

        d3.json("../people.json", function (error, data) {
            if (error) throw error;
            people = data;
            d3.json("../lien.json", function (error, data) {
                if (error) throw error;
                all_people_movies_links = data;
                loaded = true;
                createLinkMap();
                //GetAllDepartmentsAndJobs();
                UISetup();
                displayDBInfo();
                ClusterType = d3.select('#ClusterOptions').property('value');
                document.getElementById('CustomAxisSelector').style.display = "none";
                filterAll();
            })
        });
    });
}

function GetAllDepartmentsAndJobs() {
    all_people_movies_links.forEach(function (link) {
        if (!JobDepartments.includes(link.department)) JobDepartments.push(link.department);
    });
}


//return stats like highest vote_average, num of votes, ...
function getDBStats() {
    let max_vote = all_movies[0];
    let max_rev = all_movies[0];
    let max_budget = all_movies[0];
    let longuest = all_movies[0];
    let oldest_date = new Date(all_movies[0].release_date);
    let oldest = all_movies[0];
    let youngest = all_movies[0];
    let youngest_date = new Date(all_movies[0].release_date);
    let movie_freq = [];
    let vote_count = 0;
    let tot_rev = 0;
    let tot_runtime = 0;
    for (let i = 0; i < all_movies.length; i++) {
        let m = all_movies[i];
        if (m.vote_average > max_vote.vote_average) {
            max_vote = m
        }
        if (m.revenue > max_rev.revenue) {
            max_rev = m;
        }

        if (m.Budget > max_budget.Budget) {
            max_budget = m;
        }

        if (m.runtime > longuest.runtime) {
            longuest = m;
        }

        let date = new Date(m.release_date);
        if (date > youngest_date) {
            youngest = m;
            youngest_date = date;
        }
        if (date < oldest_date) {
            oldest = m;
            oldest_date = date;
        }

        let found = false;
        for (let j = 0; j < movie_freq.length; j++) {
            if (movie_freq[j].year == date.getYear() + 1900) {
                movie_freq[j].count++;
                found = true;
            }
        }
        if (!found) {
            movie_freq.push({ year: date.getYear() + 1900, count: 1 })
        }

        tot_runtime += m.runtime;
        tot_rev += m.revenue;
        vote_count += m.vote_count;
    }

    movie_freq.sort(function (a, b) { return (a.year > b.year) ? 1 : ((b.year > a.year) ? -1 : 0); });

    return {
        max_vote: max_vote,
        max_rev: max_rev,
        max_budget: max_budget,
        longuest: longuest,
        tot_rev: tot_rev,
        vote_count: vote_count,
        tot_runtime: tot_runtime,
        oldest: oldest,
        youngest: youngest,
        movie_freq: movie_freq
    };
}

function date2str(date) {
    return "" + (date.getYear() + 1900) + "/" + date.getMonth().toLocaleString(undefined, { minimumIntegerDigits: 2 }) + "/" + date.getDay().toLocaleString(undefined, { minimumIntegerDigits: 2 });
}


function minutes2String(seconds) {
    var value = seconds;

    var units = {
        "year": 365 * 24 * 60,
        "month": 30 * 24 * 60,
        "day": 24 * 60,
        "hour": 60,
        "minute": 1
    }

    var result = []

    for (var name in units) {
        var p = Math.floor(value / units[name]);
        if (p == 1) result.push(" " + p + " " + name);
        if (p >= 2) result.push(" " + p + " " + name + "s");
        value %= units[name]
    }

    return result;
}

function crewByID(id) {
    let ret = null
    people.forEach(function (p) {
        if (p.id_person == id) {
            ret = p;
        }
    });
    return ret;
}

function movieByID(id) {
    return mapMovie.get(id);
}

function getHeight(tag){
    return parseInt(d3.select(tag).style("height"))
}
//display DB info inside side panel
function displayDBInfo() {
    let stats = getDBStats();
    let div = d3.select(".TextZone");
    div.selectAll("*").remove();
    tooltipDiv.style("opacity", 0)
    .style("left", (0) + "px")
    .style("top", (0) + "px");
    d3.select(".TitleZone").selectAll("*").remove()
    d3.select(".TitleZone")
    .append("h1").text("Welcome to the Ultimate Movie Data Viz");
    div.append("p").classed('justified', true).text("This DB contains information on " + all_movies.length.toString() + " movies.");
    div.append("p").classed("justified", true).text("With a total of " + people.length.toString() + " people.")
    div.append("p").classed("justified", true).text("The number of links between those movies and the crew is " + all_people_movies_links.length + ".")
    div.append("p").classed("justified", true).text("The DB contains ranking based on " + stats.vote_count + " votes.");
    div.append("p").classed("justified", true).text("The movie with the best score is " + stats.max_vote.title + " with a score of " + stats.max_vote.vote_average + "/10.")
    div.append("p").classed("justified", true).text("The movie with the best revenue is " + stats.max_rev.title + " with a revenue of " + (stats.max_rev.revenue).toLocaleString() + "$.");
    div.append("p").classed("justified", true).text("The movie with the highest budget is " + stats.max_budget.title + " with a budget of  " + (stats.max_budget.Budget).toLocaleString() + "$.");
    div.append("p").classed("justified", true).text("The oldest movie is " + stats.oldest.title + ", released on " + DateParse(new Date(stats.oldest.release_date)) + ".");
    div.append("p").classed("justified", true).text("The youngest movie is " + stats.youngest.title + ", released on " + DateParse(new Date(stats.youngest.release_date)) + ".");
    div.append("p").classed("justified", true).text("The longuest movie is " + stats.longuest.title + ", with a runtime of " + stats.longuest.runtime + " minutes.");
    div.append("p").classed("justified", true).text("The total revenue of the movies in the DB is of " + (stats.tot_rev).toLocaleString() + "$.");
    div.append("p").classed("justified", true).text("The total length of the movies in the DB is " + (stats.tot_runtime).toLocaleString() + " minutes, which is " + minutes2String(stats.tot_runtime) + ".");

    Zoneheight = getHeight("#side-panel") - getHeight(".TitleZone")
    div.style("max-height", Zoneheight*0.45 + 'px');
    div.style("overflow-y", "scroll");


    let sidepanel2 = d3.select(".DrawZone");
    let svg = sidepanel2.select("#side-svg");
    svg.selectAll("*").remove();
    let svg_width = parseInt(d3.select(".DrawZone").style("width")) -30; //col padding is 2*15
    let svg_height = Zoneheight*0.50;
    svg.attr("width", svg_width).attr("height", svg_height);
    let margin = { top: 5, right: 5, bottom: 30, left: 50 };
    let g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    let width = svg.attr("width") - margin.left - margin.right;
    let height = svg.attr("height") - margin.top - margin.bottom;

    let x = d3.scaleBand().range([0, width]).paddingInner(0.05),
    y = d3.scaleLinear().range([height, 0]);

    drawBarChart(g, width, height, margin, stats.movie_freq, "year", "count", "Film per year")
}

function drawBarChart(g, width, height, margin, data, xField, yField, yLabel) {
    let x = d3.scaleBand().range([0, width]).paddingInner(0.05),
    y = d3.scaleLinear().range([height, 0]);

    x.domain(data.map(function (d) { return d[xField]; }));
    y.domain([0, d3.max(data, function (d) { return d[yField]; })]);

    g.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickValues(x.domain().filter(function (d, i) { return !(i % 4) })));

    g.append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y))
    g.append("text")
    .classed("text_label", true)
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text(yLabel);

    g.selectAll(".bar")
    .data(data)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function (d) { return x(d[xField]); })
    .attr("y", function (d) { return y(d[yField]); })
    .attr("width", x.bandwidth())
    .attr("height", function (d) { return height - y(d[yField]); });
}

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

//returns all the crew ids and all the movies that share someone.
function getCrewAndMovieLinks(movie) {
    let crew = mapMovieCrew.get(movie.id_movie);
    let related_movies = new Set();

    crew.forEach(function (c) {
        crewData = mapCrewMovie_filtered.get(c);

        if (crewData) {
            mapCrewMovie_filtered.get(c).forEach(function (m) {
                related_movies.add(m.id_movie);
            });
        }
    });

    crew = Array.from(crew);
    related_movies = Array.from(related_movies);
    crew.sort(function (a, b) { return a - b; });
    related_movies.sort(function (a, b) { return a - b; });
    return { crew: crew, links: related_movies };
}

// create link list
function createLinkMap() {
    // For each link in the data
    all_people_movies_links.forEach(function (d) {
        //check if link already present in mapCrewMovie
        let n = mapCrewMovie.get(d.id_person);
        if (!n) { //if not
            // create the key corresponding to this person
            mapCrewMovie.set(d.id_person, new Set());
            n = mapCrewMovie.get(d.id_person);
        }
        // in all case, add the film to the list od film for this person
        n.add({ id_movie: d.id_movie, department: d.department, job: d.job });

        // check if link already in mapMovieCrew
        let m = mapMovieCrew.get(d.id_movie);
        if (!m) { //if not
            // create the key corresponding to this movie
            mapMovieCrew.set(d.id_movie, new Set());
            m = mapMovieCrew.get(d.id_movie);
        }
        // add the person to the list of this movie
        m.add(d.id_person);
    })
}



function getLinks(nodes) {
    var map = [],
    imports = [];

    nodes.forEach(function (d) {
        map[d.data.id_movie] = d;
    });

    nodes.forEach(function (d) {
        getCrewAndMovieLinks(d.data).links.forEach(function (i) {
            imports.push(map[d.data.id_movie].path(map[i]));
        });
    });

    return imports;
}

function createGraph(movies) {
    let links = [];
    let movieSet = new Set();
    movies.forEach(function (movie) {
        movieSet.add(movie);
        let crewAndMovieLinks = getCrewAndMovieLinks(movie);

        crewAndMovieLinks.links.forEach(function (m_id) {
            let m = mapMovie.get(m_id);
            let link = { source: movie, target: m, value: 1 };
            links.push(link);
            movieSet.add(m);
        });
    });

    movieSet = Array.from(movieSet);

    return { links: links, nodes: movieSet };
}

function addingToGraph(movie){
    let movieSet = new Set();

    graph.nodes.forEach(function(m){
        movieSet.add(mapMovie.get(m.id_movie));
    })

    movieSet.add(movie);
    let crewAndMovieLinks = getCrewAndMovieLinks(movie);

    crewAndMovieLinks.links.forEach(function (m_id) {
        let m = mapMovie.get(m_id);
        let link = { source: movie, target: m, value: 1 };
        graph.links.push(link);
        movieSet.add(m);
    });

    movieSet = Array.from(movieSet);

    graph.nodes = movieSet;
}

loadFiles()

d3.select(window).on("resize", function () {
    drawCircularViz();
    displayDBInfo();
})

let CircularLink, CircularNode;

function drawCircularViz(update) {
    if (!loaded) {
        return;
    }

    document.getElementById('on-click-toggle').style.display = "none";
    document.getElementById('reset-company-filter').style.display = "none";
    document.getElementById("CustomAxisSwitch").checked = false;
    document.getElementById('MovieVizOptions').style.display = "none";
    document.getElementById('CustomAxisSelector').style.display = "none";
    document.getElementById('CircularVizOptions').style.display = "inline";
    document.getElementById('button-reset').style.display = "none";

    //resize svg
    //resizeSVG();

    // if we go to this viz, we clean the search field
    cleanSearch();
    //if (update) return updateCircularViz();

    currentViz = 1;

    width = parseInt(d3.select(".wrapper").style("width")) - parseInt(d3.select(".side-panel").style("width"));
    CircularVizLayer.selectAll("*").remove();
    MovieVizLayer.selectAll("*").remove();
    UILayer.selectAll("*").remove();


    svg.attr("width", width)

    /*
    backgroundLayer.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "background")
    .on("click", function () { resetView(); });
    */

    let root = packageHierarchy(filtered_movies).sum(function (d) { return d.size; });

    cluster(root);

    CircularLink = CircularVizLayer.append("g").selectAll("link"),
    CircularNode = CircularVizLayer.append("g").selectAll("nodes");

    CircularLink = CircularLink
    .data(getLinks(root.leaves()))
    .enter().append("path")
    .each(function (d) { d.source = d[0], d.target = d[d.length - 1] })
    .attr("class", "link")
    .attr("d", line)
    .on("mouseover", mouseoveredLink);

    CircularNode = CircularNode
    .data(root.leaves())
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", 4)
    .attr("fill", function (d) { return ReviewColor(d.data.vote_average); })
    .on("click", function (d) { click(d); })
    .on("mouseover", mouseovered)
    .on("mouseout", mouseouted)
    .attr("dy", "0.31em")
    .attr("transform", function (d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
    .attr("text-anchor", function (d) { return d.x < 180 ? "start" : "end"; })
    .text(function (d) { return d.data.name; });

    function updateCircularViz() {
        CircularLink.selectAll("*").remove();
        let root = packageHierarchy(filtered_movies).sum(function (d) { return d.size; });

        cluster(root);
        CircularLink = CircularLink
        .data(getLinks(root.leaves()))
        .enter().append("path")
        .each(function (d) { d.source = d[0], d.target = d[d.length - 1] })
        .attr("class", "link")
        .attr("d", line)
        .on("mouseover", mouseoveredLink);

        CircularNode.data(root.leaves());

        CircularNode.transition().duration(2000)
        .attr("transform", function (d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
    }

    function click(n) {
        tooltipDiv.style("opacity", 0).style("left", (0) + "px")
        .style("top", (0) + "px");
        d = n.data;
        showMovieInfo(d);
        drawMovieViz(new Set().add(d), true);
    }

    function mouseovered(d) {
        tooltipDiv
        .style("opacity", .9);
        tooltipDiv.html(d.data.title)
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 10) + "px");

        CircularNode.each(function (n) { n.target = n.source = false; });

        CircularLink.classed("link--highlight", function (l) {
            if (l.target === d) return l.source.source = true;
            else if (l.source === d) return l.target.target = true;
        })
        .filter(function (l) {
            return !(l.target === d || l.source === d);
        }).classed("link--fade", true);

        CircularNode.classed("node--highlight", function (n) { return n.target || n.sources; })
        .classed("node--fade", function (n) { return !(n.target || n.sources); });
    }

    function mouseouted(d) {
        CircularLink.classed("link--highlight", false).classed("link--fade", false);
        CircularNode.classed("node--highlight", false).classed("node--fade", false);

        tooltipDiv
        .style("opacity", 0).style("left", (0) + "px")
        .style("top", (0) + "px");
        tooltipDiv.html(d.data.title)
    }



    function mouseoveredLink(d) {
        CircularNode.each(function (n) { n.target = n.source = false; });

        CircularLink.classed("link--highlight", function (l) {
            if (l === d) return l.source.source = true;
            else if (l === d) return l.target.target = true;
        })
    }
}

let graph;
let simulation = d3.forceSimulation();

let MovieLink, MovieNode;

function drawMovieViz(_movies, recalculate, adding) {
    if (!loaded) {
        return;
    }

    document.getElementById('on-click-toggle').style.display = "inline-block";
    document.getElementById('CircularVizOptions').style.display = "none";
    document.getElementById('MovieVizOptions').style.display = "inline";
    document.getElementById('button-reset').style.display = "inline";

    //change svg height
    //resizeSVG()

    simulation.force("center", null).force("link", null).force("charge", null).force("posX", null).force("posY", null);

    if (document.getElementById("CustomAxisSwitch").checked && !recalculate) {
        switcForceMode();
    }
    else if(!document.getElementById("CustomAxisSwitch").checked && !recalculate){
        UILayer.selectAll("*").remove();

        simulation
        .force("link", d3.forceLink().id(function (d) { return d.id_movie; }).distance(50))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(function (d) { return d.radius; }))

        simulation.force("link").links(graph.links);

        simulation.alphaTarget(0.05).restart();

        MovieLink.attr("class", "Link--movieViz");
    }
    else {
        currentViz = 2;

        width = parseInt(d3.select(".wrapper").style("width")) - parseInt(d3.select(".side-panel").style("width"));
        CircularVizLayer.selectAll("*").remove();
        MovieVizLayer.selectAll("*").remove();
        UILayer.selectAll("*").remove();
        svg.attr("width", width)

        if(adding){
            addingToGraph(_movies);
            movieVizSet.add(_movies);
        }
        else{
            movieVizSet = _movies
            graph = createGraph(_movies);
        }

        MovieLink = MovieVizLayer.append("g")
        .attr("class", "link--movieViz")
        .selectAll("line")
        .data(graph.links)
        .enter().append("line");

        MovieNode = MovieVizLayer.append("g")
        .attr("class", "node")
        .selectAll("circle")
        .data(graph.nodes)
        .enter().append("circle")
        .attr("r", function (d) {if (movieVizSet.has(d)) return 15; else return 6 })
        .attr("fill", function (d) { return ReviewColor(d.vote_average); })
        .on("click", function (d) { click(d); })
        .on("mouseover", mouseovered)
        .on("mouseout", mouseouted)
        .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

        if (document.getElementById("CustomAxisSwitch").checked) {
            switcForceMode();
        }
        else {
            simulation
            .force("link", d3.forceLink().id(function (d) { return d.id_movie; }).distance(50))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(function (d) { return d.radius; }))
            simulation.alphaTarget(0.05).restart();

            simulation.force("link").links(graph.links);

        }

        MovieNode.append("title").text(function (d) { return d.title });

        simulation.nodes(graph.nodes).on("tick", ticked);
    }

    function switcForceMode() {
        let maxWidth = width - 150;
        let maxHeight = height -50;

        let minWidth = 120;
        let minHeight = 60;

        let xAxisType = d3.select('#XAxis').property('value');
        let yAxisType = d3.select('#YAxis').property('value');

        let xAxis;
        let yAxis;

        let strength = 10;

        if (xAxisType == "Release Date") {
            let max = new Date("1900-1-1");
            let min = new Date("2100-1-1");
            MovieNode.each(function(d){
                if(new Date(d.release_date) > max) max = new Date(d.release_date);
                else if(new Date(d.release_date) < min) min = new Date(d.release_date);
            })

            min /= 1.01;
            max *= 1.01;

            xAxis = d3.scaleLinear().domain([min, max]).range([minWidth, maxWidth]);

            simulation.force("posX", d3.forceX(function (d) { return xAxis(new Date(d.release_date)); }).strength(strength))

        }
        else if (xAxisType == "Reviews") {
            xAxis = d3.scaleLinear().domain([0, 10]).range([minWidth, maxWidth]);

            simulation.force("posX", d3.forceX(function (d) { return xAxis(d.vote_average); }).strength(strength))
        }
        else if (xAxisType == "Budget") {
            let max = 0;
            let min = 1000000000000;
            MovieNode.each(function (d) {
                if (max < d.Budget) max = d.Budget;
                else if (min > d.Budget) min = d.Budget;
            })
            min = 0.85 * min;
            max = 1.1 * max;
            xAxis = d3.scaleLinear().domain([min, max]).range([minWidth, maxWidth]);
            simulation.force("posX", d3.forceX(function (d) { return xAxis(d.Budget); }).strength(strength))

        }
        else if (xAxisType == "Revenue") {
            let max = 0;
            let min = 1000000000;
            MovieNode.each(function (d) {
                if (max < d.revenue) max = d.revenue;
                else if (min > d.revenue) min = d.revenue;
            })
            min = 0.85 * min;
            max = 1.1 * max;
            xAxis = d3.scaleLinear().domain([min, max]).range([minWidth, maxWidth]);
            simulation.force("posX", d3.forceX(function (d) { return xAxis(d.revenue); }).strength(strength))

        }

        if (yAxisType == "Release Date") {
            let max = new Date("1900-1-1");
            let min = new Date("2100-1-1");
            MovieNode.each(function(d){
                if(new Date(d.release_date) > max) max = new Date(d.release_date);
                else if(new Date(d.release_date) < min) min = new Date(d.release_date);
            })

            min /= 1.01;
            max *= 1.01;

            yAxis = d3.scaleLinear().domain([min, max]).range([maxHeight, minHeight]);
            simulation.force("posY", d3.forceY(function (d) { return yAxis(new Date(d.release_date)); }).strength(strength))

        }
        else if (yAxisType == "Reviews") {
            yAxis = d3.scaleLinear().domain([0, 10]).range([maxHeight, minHeight]);
            simulation.force("posY", d3.forceY(function (d) { return yAxis(d.vote_average); }).strength(strength))

        }
        else if (yAxisType == "Budget") {
            let max = 0;
            let min = 1000000000;
            MovieNode.each(function (d) {
                if (max < d.Budget) max = d.Budget;
                else if (min > d.Budget) min = d.Budget;
            })
            min = 0.85 * min;
            max = 1.1 * max;
            yAxis = d3.scaleLinear().domain([min, max]).range([maxHeight, minHeight]);
            simulation.force("posY", d3.forceY(function (d) { return yAxis(d.Budget); }).strength(strength))

        }
        else if (yAxisType == "Revenue") {
            let max = 0;
            let min = 1000000000;
            MovieNode.each(function (d) {
                if (max < d.revenue) max = d.revenue;
                else if (min > d.revenue) min = d.revenue;
            })
            min = 0.85 * min;
            max = 1.1 * max;
            yAxis = d3.scaleLinear().domain([min, max]).range([maxHeight, minHeight]);
            simulation.force("posY", d3.forceY(function (d) { return yAxis(d.revenue); }).strength(strength))
        }

        simulation.alphaTarget(0.01).restart();

        MovieLink.classed("link--hidden", true);

        UILayer.selectAll("*").remove();

        let xAxisSVG = d3.axisTop().scale(xAxis);


        if (xAxisType == "Release Date") {
            xAxisSVG.tickFormat(d3.timeFormat("%B %Y"));
        }

        UILayer.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0,"+ minHeight+")")
        .call(xAxisSVG);


        let yAxisSVG = d3.axisLeft().scale(yAxis);

        if (yAxisType == "Release Date") {
            yAxisSVG.tickFormat(d3.timeFormat("%B %Y"));
        }

        UILayer.append("g")
        .attr("class", "axis")
        .attr("transform", "translate("+ minWidth+",0)")
        .call(yAxisSVG);

        UILayer.append("text")
        .classed("text_label", true)
        .attr("x", width / 2)
        .attr("y", 5)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(xAxisType);

        UILayer.append("text")
        .classed("text_label", true)
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(yAxisType);
    }

    function ticked() {
        MovieLink
        .attr("x1", function (d) { return d.source.x; })
        .attr("y1", function (d) { return d.source.y; })
        .attr("x2", function (d) { return d.target.x; })
        .attr("y2", function (d) { return d.target.y; });
        MovieNode
        .attr("cx", function (d) { return d.x; })
        .attr("cy", function (d) { return d.y; });

    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }


    function click(d) {
        if (!checkIfSearched(d)){
            cleanSearch()
        }
        if (movieVizSet.has(d)) {
            if(document.getElementById('on-click-toggle-switch').checked) {
                showMovieInfo(d);
            } else {
                movieVizSet.delete(d);
                if (movieVizSet.size == 0) {
                    drawCircularViz();
                    displayDBInfo();
                    return;
                } else {
                    if (d.id_movie == currentMovie.id_movie) {
                        showMovieInfo([...movieVizSet][0]);
                    }
                    drawMovieViz(movieVizSet, true);
                }
            }
        }
        else {
            showMovieInfo(d);
            drawMovieViz(d, true, true);
        }

    }

    function mouseovered(d) {
        tooltipDiv
        .style("opacity", 9);
        tooltipDiv.html(d.title)
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 10) + "px");

        MovieNode.each(function (n) { n.target = n.source = false; });

        MovieLink.classed("link--highlight", function (l) {
            if (l.target.id_movie == d.id_movie) return l.source.source = true;
            else if (l.source.id_movie == d.id_movie) return l.target.target = true;
        })

        if(document.getElementById("CustomAxisSwitch").checked){
            MovieLink.classed("link--hidden", function (l) {
                return !(l.target.id_movie == d.id_movie || l.source.id_movie == d.id_movie);
            });
        }
        else{
            MovieLink.classed("link--fade", function (l) {
                return !(l.target.id_movie == d.id_movie || l.source.id_movie == d.id_movie);
            });
        }

        /*
        node.classed("node--highlight", function (n) { return n.target || n.sources; })
        node.classed("node--fade", function (n) { return !(n.target || n.sources); });
        */
    }

    function mouseouted(d) {
        tooltipDiv.style("opacity", 0)
        .style("left", (0) + "px")
        .style("top", (0) + "px");
        MovieNode.classed("node--highlight", false).classed("node--fade", false);

        if(document.getElementById("CustomAxisSwitch").checked){
            MovieLink.classed("link--highlight", false).classed("link--hidden", true);
        }
        else{
            MovieLink.classed("link--highlight", false).classed("link--fade", false);

        }
    }

}

function packageHierarchy(movies) {
    let map = {};
    let root = { name: "", children: [] };
    map[""] = root;

    movies.sort(function (a, b) {
        if (ClusterType == "Production") {
            return a.production_companies - b.production_companies;
        }
        else if (ClusterType == "Year") {
            return new Date(a.release_date) - new Date(b.release_date);
        }
        else if (ClusterType == "Reviews") {
            return a.vote_average - b.vote_average;
        }
    });

    movies.forEach(function (d) {

        let key;

        if (ClusterType == "Production") { //Cluster by companies
            key = d.production_companies;
            let i = key.indexOf(",");

            if (i != -1) {
                key = key.substring(key.indexOf("[") + 1, i);
            }
            else {
                key = key.substring(key.indexOf("[") + 1, key.indexOf("]"));
            }
        }
        else if (ClusterType == "Year") { //Cluster by Years
            key = new Date(d.release_date).getYear() + 1900;
        }
        else if (ClusterType == "Reviews") { //Cluster by Reviews
            key = d.vote_average;
        }
        else {
            key = ""; // no cluster
        }

        let parent = map[key];

        if (!parent) {
            parent = map[key] = { name: key, children: [] };
            parent.parent = root;
            parent.key = key;

            root.children.push(parent);
        }

        let newNode = d;
        newNode.parent = parent;
        newNode.key = d.title;
        parent.children.push(newNode);

        map[d.id_movie] = newNode;
    });

    return d3.hierarchy(map[""]);
}


function getLinksForMovie(movie) {
    let crew = new Set(mapMovieCrew.get(movie.id_movie));
    let related_movies = new Set();
    let linksCrewMovie = [];
    crew.forEach(function (c) {
        crewData = mapCrewMovie_filtered.get(c);
        let add = false;
        if (crewData) {
            mapCrewMovie_filtered.get(c).forEach(function (m) {
                if (m.id_movie != movie.id_movie) {
                    add = true;
                    related_movies.add(m.id_movie);
                    let link = Object.assign({}, m);
                    link.id_person = c;
                    linksCrewMovie.push(link);
                }
            });
            if (!add) {
                crew.delete(c);
            }
        } else {
            crew.delete(c);
        }
    });
    return { crew: Array.from(crew), movies: Array.from(related_movies), links: linksCrewMovie };
}

let departmentColorMap = new Map();

function departmentColor(departmentName) {
    let color = departmentColorMap.get(departmentName);
    if (!color) {
        let colors = d3.scaleOrdinal(d3.schemeCategory20).domain(d3.range(0, 19));
        color = colors(departmentColorMap.size);
        departmentColorMap.set(departmentName, color);
    }
    return color;
}


function removeCompanyFilter() {
    currentCompany = "";
    document.getElementById('reset-company-filter').style.display = "none";
    filterAll();
}

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

    filtered_movies = filtered_movies.filter(x=>{x.production_companies.includes(company)});

    mapCrewMovie_filtered = linksForFilteredMovies();
    drawMovieViz(movieVizSet, true);
    showMovieInfo(currentMovie);
}


function overCompany(company) {
    MovieNode.classed("node--highlight", function(d) {
        return d.production_companies.includes(company)
    });
    MovieNode.classed("node--fade", function(d) {
        return !d.production_companies.includes(company)
    });
    MovieLink.classed("link--highlight", function(d) {
        return d.source.production_companies.includes(company) && d.target.production_companies.includes(company);
    });
    MovieLink.classed("link--fade", function(d) {
        return !d.source.production_companies.includes(company) || !d.target.production_companies.includes(company);
    });
}

function outCompany(company) {
    MovieLink.classed("link--highlight", false).classed("link--fade", false);
    MovieNode.classed("node--highlight", false).classed("node--fade", false);
}

function getArrayFromString(str) {
    return str.substr(1, str.length -2).replace(/'/g, "").split(", ")
}
function addRow(table, row1, row2) {
    let newRow = table.append("tr");
    newRow.append("th").attr("scope","row").text(row1);
    newRow.append("td").text(row2);
}
function addRowArrWithOnClick(table, row, array, onclick) {
    let newRow = table.append("tr");
    newRow.append("th").attr("scope","row").text(row);
    let td = newRow.append("td");
    for(let i = 0; i < array.length; i++) {
        if(i > 0) {
            td.append("span").text(", ");
        }
        td.append("span").classed("textWithLink", true)
        .text(array[i]).on("click", x=> onclick(array[i]))
        .on("mouseover", x=>overCompany(array[i]))
        .on("mouseout", x=>outCompany());
    }
}

let currentMovie;
function showMovieInfo(d) {
    currentMovie = d;
    let titleZone = d3.select(".TitleZone")
    titleZone.selectAll("*").remove()
    titleZone.append("h1").text(d.title)
    let textZone = d3.select(".TextZone");
    textZone.selectAll("*").remove();
    textZone.append("h3").text(d.tagline);
    let table = textZone.append("table").classed("table table-striped table-dark", true);
    let str = getArrayFromString(d.production_companies);
    addRowArrWithOnClick(table, "Production Companies", str, filterCompany);
    addRow(table, "Released date", DateParse(new Date(d.release_date)));
    addRow(table, "Runtime", "" + d.runtime + " min");
    addRow(table, "Vote average", "" + d.vote_average + "/10");
    addRow(table, "Vote count", "" + d.vote_count);
    addRow(table, "Budget", "" + d.Budget.toLocaleString() + "$");
    addRow(table, "Revenue", "" + d.revenue.toLocaleString() + "$");

    Zoneheight = getHeight("#side-panel") - getHeight(".TitleZone")


    textZone.style("max-height", Zoneheight*0.35 + 'px');
    textZone.style("overflow-y", "scroll");

    div = d3.select(".DrawZone");

    let tmp = getLinksForMovie(d);
    let crewIDs = tmp.crew;
    let moviesIDs = tmp.movies;
    let links = tmp.links;


    let margin = { top: 20, right: 10, bottom: 20, left: 5 };
    //svg legerement plus petit que ce que pourrait car enlève deja marges
    let width = parseInt(div.style("width"))-30 - margin.left - margin.right; //div.col has 2*15 of pad
    let height = Zoneheight * 0.6 - margin.top - margin.bottom;

    let min_height = Math.max(crewIDs.length, moviesIDs.length) * 16; //text = 12, 4 margin
    if (height < min_height) {
        height = min_height;
    }


    let crewScale = d3.scaleLinear().range([0, height]).domain([0, crewIDs.length]);
    let crewX = width / 4;
    let movieX = width * 3 / 4;
    let movieScale = d3.scaleLinear().range([0, height]).domain([0, moviesIDs.length]);
    let crew = [];
    let movies = [];
    crewIDs.forEach(function (d, i) {
        crew.push({ id: d, x: crewX, y: crewScale(i) });
    });
    moviesIDs.forEach(function (d, i) {
        movies.push({ id: d, x: movieX, y: movieScale(i) });
    });
    let graphLinks = [];
    links.forEach(function (link) {
        let l = { source: crew.find(d => d.id == link.id_person), target: movies.find(d => d.id == link.id_movie), value: link.department };
        graphLinks.push(l);
    });


    let svgcontainer = div.select("#side-svg");
    svgcontainer.selectAll("*").remove()
    svgcontainer//.attr("class", "background")
    .attr("width", width +100) // to see long names #TODO faire taille fonction du nom
    .attr("height", height + margin.top + margin.bottom);

    // let background = svgcontainer.append("g");
    // background.append("rect")
    // .attr("width", width )
    // .attr("height", height)
    // .attr("class", "background");

    let svg = svgcontainer.append("g")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let crewNames;
    let moviesName;

    let drawnLinks = svg.append("g")
    .attr("class", "side-links")
    .selectAll("link")
    .data(graphLinks)
    .enter().append("line")
    .attr("stroke", function (d) { return departmentColor(d.value) })
    .attr("x1", function (d) { return d.source.x; })
    .attr("y1", function (d) { return d.source.y; })
    .attr("x2", function (d) { return d.target.x; })
    .attr("y2", function (d) { return d.target.y; })
    .on("mouseover", function (d) {
        MovieLink.classed("link--highlight", function (l) {
            return d.target.id == l.target.id_movie && l.source.id_movie == currentMovie.id_movie ||
            d.target.id == l.source.id_movie && l.target.id_movie == currentMovie.id_movie;
        })
        MovieLink.classed("link--fade", function (l) {
            return !(d.target.id == l.target.id_movie && l.source.id_movie == currentMovie.id_movie ||
                d.target.id == l.source.id_movie && l.target.id_movie == currentMovie.id_movie);
        });
        MovieNode.classed("node--highlight", function (l) {
            return l.id_movie == currentMovie.id_movie || l.id_movie == d.target.id;
        })
        MovieNode.classed("node--fade", function (l) {
            return !(l.id_movie == currentMovie.id_movie || l.id_movie == d.target.id);
        });
        tooltipDiv
        .style("opacity", 9);
        tooltipDiv.html(d.value)
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 10) + "px");
        drawnLinks.classed("side-links--highlight", function(l){
            return l.source.id == d.source.id && l.target.id == d.target.id;
        })
        drawnLinks.classed("side-links--fade", function(l){
            return !(l.source.id == d.source.id && l.target.id == d.target.id);
        })
        crewNames.classed("text_highlight", function(l) {
            return l.id == d.source.id
        })
        crewNames.classed("text_fade", function(l) {
            return l.id != d.source.id
        })
        moviesName.classed("text_highlight", function(l) {
            return l.id == d.target.id
        })
        moviesName.classed("text_fade", function(l) {
            return l.id != d.target.id
        })
    })
        .on("mouseout", function (d) {
            MovieLink.classed("link--highlight", false).classed("link--fade", false);
            MovieNode.classed("node--highlight", false).classed("node--fade", false);
            drawnLinks.classed("side-links--highlight", false)
            .classed("side-links--fade", false);
            crewNames.classed("text_highlight", false)
            .classed("text_fade", false);
            crewNames.classed("text_fade", false)
            .classed("text_fade", false);
            moviesName.classed("text_highlight", false)
            .classed("text_fade", false);
            moviesName.classed("text_fade", false)
            .classed("text_fade", false);
        });

    crewNames = svg.append("g")
    .selectAll("text")
    .data(crew)
    .enter().append("text")
    .attr("text-anchor", "end")
    .attr("x", function (d) { return d.x; })
    .attr("y", function (d) { return d.y + 6; })
    .attr("class", "text_default")
    .text(function (d) { return crewByID(d.id).name; })
    .on("mouseover", function(d) {
        tooltipDiv
        .style("opacity", 0);
        MovieLink.classed("link--fade", true);
        MovieNode.classed("node--fade", true);
        moviesName.classed("text_fade", true);
        drawnLinks.classed("side-links--highlight", function(l){
            if (l.source.id == d.id) {
                MovieLink._groups[0].forEach(function(l2) {
                    if (l.target.id == l2.__data__.target.id_movie && currentMovie.id_movie == l2.__data__.source.id_movie ||
                        l.target.id == l2.__data__.source.id_movie && currentMovie.id_movie == l2.__data__.target.id_movie) {
                        MovieLink.filter(function (x) {
                            return x.target.id_movie == l2.__data__.target.id_movie &&
                            x.source.id_movie == l2.__data__.source.id_movie;
                        }).classed("link--highlight", true).classed("link--fade", false);
                    }
                })
                MovieNode._groups[0].forEach(function(n) {
                    if (l.target.id == n.__data__.id_movie || n.__data__.id_movie == currentMovie.id_movie) {
                        MovieNode.filter(function (x) {
                            return x.id_movie == n.__data__.id_movie;
                        }).classed("node--highlight", true).classed("node--fade", false);
                    }
                })
                moviesName.classed("text_highlight", function(m) {
                    if (m.id==l.target.id) {
                        moviesName.filter(x=> x.id == m.id).classed("text_fade", false)
                        return true
                    } else {
                        return false
                    }
                })
                return true
            } else {
                return false
            }
        })
        drawnLinks.classed("side-links--fade", function(l){
            return l.source.id != d.id
        })
        crewNames.classed("text_highlight", function(l) {
            return l.id == d.id
        })
        crewNames.classed("text_fade", function(l) {
            return l.id != d.id
        })
    })
        .on("mouseout", function(d) {
            MovieLink.classed("link--highlight", false).classed("link--fade", false);
            MovieNode.classed("node--highlight", false).classed("node--fade", false);
            moviesName.classed("text_highlight", false).classed("text_fade", false);
            crewNames.classed("text_highlight", false).classed("text_fade", false);
            drawnLinks.classed("side-links--highlight", false).classed("side-links--fade", false);
        })
        .on("click", function(d) {
            cleanSearch();
            let movies = mapCrewMovie_filtered.get(d.id)
            let movieSet = new Set();
            movies.forEach(function(d) {
                movieSet.add(mapMovie.get(d.id_movie))
            })
            drawMovieViz(movieSet, true);
            tooltipDiv.style("opacity", 0);
        });

    moviesName = svg.append("g")
    .selectAll("text")
    .data(movies)
    .enter().append("text")
    .attr("text-anchor", "start")
    .attr("x", function (d) { return d.x; })
    .attr("y", function (d) { return d.y + 6; })
    .attr("class", "text_default")
    .text(function (d) { return movieByID(d.id).title; })
    .on("click", function(d) {
        cleanSearch();
        let movie = mapMovie.get(d.id)
        tooltipDiv.style("opacity", 0);
        showMovieInfo(movie);
        drawMovieViz(new Set().add(movie), true);
    })
    .on("mouseover", function(d) {
        MovieNode.classed("node--fade", true);
        MovieLink.classed("link--highlight", function(l) {
            if (l.source.id_movie == d.id || l.target.id_movie == d.id) {
                MovieNode.filter(x=> x.id_movie == l.source.id_movie || x.id_movie == l.target.id_movie).classed("node--highlight", true).classed("node--fade", false);
                return true;
            } else {
                return false;
            }
        })
        MovieLink.classed("link--fade", function(l) {
            return !(l.source.id_movie == d.id || l.target.id_movie == d.id);
        })

        tooltipDiv
        .style("opacity", 0);
        crewNames.classed("text_fade", true)
        drawnLinks.classed("side-links--highlight", function(l){
            if (l.target.id == d.id) {
                crewNames.classed("text_highlight", function(m) {
                    if (m.id==l.source.id) {
                        crewNames.filter(x=> x.id == m.id).classed("text_fade", false)
                        return true
                    } else {
                        return false
                    }
                })
                return true
            } else {
                return false
            }
        })
        drawnLinks.classed("side-links--fade", function(l){
            return l.target.id != d.id
        })
        moviesName.classed("text_highlight", function(l) {
            return l.id == d.id
        })
        moviesName.classed("text_fade", function(l) {
            return l.id != d.id
        })
    })
    .on("mouseout", function(d) {
        MovieLink.classed("link--highlight", false).classed("link--fade", false);
        MovieNode.classed("node--highlight", false).classed("node--fade", false);
        moviesName.classed("text_highlight", false).classed("text_fade", false);
        crewNames.classed("text_highlight", false).classed("text_fade", false);
        drawnLinks.classed("side-links--highlight", false).classed("side-links--fade", false);
    });

    div.style("max-height", Zoneheight * 0.6 + 'px');
    div.style("overflow-y", "scroll");
    div.style("overflow-x", "scroll")
}
