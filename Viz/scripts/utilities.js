// let width = parseInt(d3.select(".wrapper").style("width")) - parseInt(d3.select("#side-panel").style("width"));
let width = parseInt(d3.select("#main-panel").style("width"));
// let height = getHeight("#main-panel") - getHeight("#filters");
let height = getHeight("#filter-Viz") - getHeight("#filters");


// Setting up all svgs containers
let svg = d3.select("#main-svg");
let CircularVizLayer = svg.append('g').attr("id","circular-g")   //.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
let MovieVizLayer = svg.append('g');
let UILayer = svg.append('g');
let UILayer2 = svg.append('g');

svg.attr("width", width)

let ReviewColor = d3.scaleLinear().domain([4, 6, 7, 8]).range(["red", "orange", "yellow", "green"]);

let diameter = height - 20;

let cluster = d3.cluster().size([360, diameter / 2 - 40]);
let ClusterType;

let line = d3.radialLine()
.curve(d3.curveBundle.beta(0.85))
.radius(function (d) { return d.y; })
.angle(function (d) { return d.x / 180 * Math.PI; });

let DateParse = d3.timeFormat("%e %B %Y");

let loaded = false;
let all_movies;
let people;
let all_people_movies_links;

let filtered_movies;

let sliderYear;
let sliderReview;

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

let cc = document.querySelector('#review-filter')
.getBoundingClientRect(),
reviewsliderwidth = cc.right - cc.left;

d3.select(window).on("resize", function () {
    if (currentViz == 2) {
        drawMovieViz(movieVizSet, true);
        showMovieInfo(currentMovie);
    }
    else {
        drawCircularViz();
    }
})

function Reset() {
    cleanSearch();
    currentViz = 1;
    filterAll();
    displayDBInfo();
}

function getHeight(tag) {
    return parseInt(d3.select(tag).style("height"))
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
        // in all case, add the film to the list of film for this person
        n.add({ id_movie: d.id_movie, department: d.department, job: d.job, role: d.role });

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

function UISetup() {
    sliderYear = new dhtmlXSlider({
        parent: "sliderYear",
        linkTo: ["sliderYearLink", "sliderYearLink2"],
        step: 1,
        min: 1937,
        max: 2017,
        value: [2010, 2017],
        range: true,
        size: yearsliderwidth - 30
    });

    sliderYear.attachEvent("onSlideEnd", function (value) {
        filterAll();
    }
    );

    sliderReview = new dhtmlXSlider({
        parent: "sliderReview",
        linkTo: ["sliderReviewLink", "sliderReviewLink2"],
        step: 0.1,
        min: 0,
        max: 10,
        value: [0, 10],
        range: true,
        size: reviewsliderwidth - 30
    });

    sliderReview.attachEvent("onSlideEnd", function (value) {
        filterAll();
    }
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
        .attr("offset", function (d, i) { return i / (ReviewColor.range().length - 1); })
        .attr("stop-color", function (d) { return d; });

    let xPos = width - 45;
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
    .attr("transform", "translate(" + (xPos + 20) + "," + yPos + ")")
    .attr("opacity", 0.8)
    .call(ColorAxisSVG);

    UILayer2.append("text")
                        .classed("text_label", true)
                        .attr("transform", "rotate(90)")
                        .attr("y", -(xPos + 40))
                        .attr("x", (yPos + 100))
                        .attr("dy", "1em")
                        .style("text-anchor", "middle")
                        .attr("opacity", 0.8)
                        .text("Reviews");
}

function resizeSVG() {
    height = getHeight("#filter-Viz") - getHeight("#filters")
    d3.select(".svg-content").attr("height", height)
}

function resizeContainers(){
    height = getHeight("#info-panel") - getHeight("#filters");
    d3.select("#main-viz").style("height",height+"px");
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