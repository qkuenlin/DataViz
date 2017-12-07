let width = parseInt(d3.select(".svg-content").style("width"));
let height = parseInt(d3.select(".svg-content").style("height"));
let color = d3.scaleLinear().domain([4, 6, 7, 8]).range(["red", "orange", "yellow", "green"]);

let diameter = height,
radius = diameter / 2,
innerRadius = radius - 40;

let cluster = d3.cluster().size([360, innerRadius]);
let ClusterType;

let line = d3.radialLine()
    .curve(d3.curveBundle.beta(0.85))
    .radius(function (d) { return d.y; })
    .angle(function (d) { return d.x / 180 * Math.PI; });


let svg = d3.select("svg");
let backgroundLayer = svg.append('g');
let CircularVizLayer = svg.append('g').attr("transform", "translate(" + 2 * width / 3 + "," + height / 2 + ")");
let MovieVizLayer = svg.append('g');
let UILayer = svg.append('g');

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


let tooltipDiv = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

function UISetup() {
    sliderYear = new dhtmlXSlider({
        parent: "sliderYear",
        linkTo: ["sliderYearLink", "sliderYearLink2"],
        step: 1,
        min: 1937,
        max: 2017,
        value: [2010, 2017],
        range: true
    })

    sliderReview = new dhtmlXSlider({
        parent: "sliderReview",
        linkTo: ["sliderReviewLink", "sliderReviewLink2"],
        step: 0.1,
        min: 0,
        max: 10,
        value: [0, 10],
        range: true
    })

    /*
    let dropDown = document.getElementById("DepartementOptions");
    JobDepartments.forEach(function (d) {
    let el = document.createElement("option");
    el.textContent = d;
    el.value = d;

    dropDown.appendChild(el);
});
*/
}

function filterAll() {
    mapMovie_filtered = filterReviews(sliderReview.getValue(), filterYears(sliderYear.getValue(), mapMovie));
    mapCrewMovie_filtered = filterLinksPerDepartement(d3.select('#DepartementOptions').property('value'), linksForFilteredMovies());
    if (currentViz == 2)  {
        drawMovieViz(movieVizSet, true);
        showMovieInfo(currentMovie);
    }
    else drawCircularViz();
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
        AxisChange();
    }
    else {
        document.getElementById('CustomAxisSelector').style.display = "none";
        simulation
    .force("link", d3.forceLink().id(function (d) { return d.id_movie; }).distance(50))
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(function (d) { return d.radius; }))
        .force("posX", null).force("posY", null);

    }
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

//display DB info inside side panel
function displayDBInfo() {
    let stats = getDBStats();
    let sidepanel = d3.select(".side-panel");
    sidepanel.selectAll("*").remove();
    sidepanel.append("hr");
    let div = sidepanel.append("div").classed("textInfo", true)
    div.append("h1").text("Welcome to the Ultimate Movie Data Viz");
    div.append("p").classed('justified', true).text("This DB contains information on " + all_movies.length.toString() + " movies.");
    div.append("p").classed("justified", true).text("With a total of " + people.length.toString() + " people.")
    div.append("p").classed("justified", true).text("The number of links between those movies and the crew is " + all_people_movies_links.length + ".")
    div.append("p").classed("justified", true).text("The DB contains ranking based on " + stats.vote_count + " votes.");
    div.append("p").classed("justified", true).text("The movie with the best score is " + stats.max_vote.title + " with a score of " + stats.max_vote.vote_average + "/10.")
    div.append("p").classed("justified", true).text("The movie with the best revenue is " + stats.max_rev.title + " with a revenue of " + (stats.max_rev.revenue).toLocaleString() + "$.");
    div.append("p").classed("justified", true).text("The movie with the highest budget is " + stats.max_budget.title + " with a budget of  " + (stats.max_budget.Budget).toLocaleString() + "$.");
    div.append("p").classed("justified", true).text("The oldest movie is " + stats.oldest.title + ", released on " + stats.oldest.release_date + ".");
    div.append("p").classed("justified", true).text("The youngest movie is " + stats.youngest.title + ", released on " + stats.youngest.release_date + ".");
    div.append("p").classed("justified", true).text("The longuest movie is " + stats.longuest.title + ", with a runtime of " + stats.longuest.runtime + " minutes.");
    div.append("p").classed("justified", true).text("The total revenue of the movies in the DB is of " + (stats.tot_rev).toLocaleString() + "$.");
    div.append("p").classed("justified", true).text("The total length of the movies in the DB is " + (stats.tot_runtime).toLocaleString() + " minutes, which is " + minutes2String(stats.tot_runtime) + ".");

    div.style("height", parseInt(d3.select(".side-panel").style("height")) / 2 + 'px');
    div.style("overflow-y", "scroll");
    sidepanel.append("hr");
    let svg_width = parseInt(d3.select(".side-panel").style("width"));
    let svg_height = parseInt(d3.select(".side-panel").style("height")) -
    parseInt(d3.select(".textInfo").style("height"));

    let svg = sidepanel.append("svg").attr("width", svg_width).attr("height", svg_height);
    let margin = { top: 5, right: 5, bottom: 20, left: 50 };
    let g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    let width = svg.attr("width") - margin.left - margin.right;
    let height = svg.attr("height") - margin.top - margin.bottom;

    let x = d3.scaleBand().range([0, width]).paddingInner(0.05),
    y = d3.scaleLinear().range([height, 0]);

    x.domain(stats.movie_freq.map(function (d) { return d.year; }));
    y.domain([0, d3.max(stats.movie_freq, function (d) { return d.count; })]);

    g.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickValues(x.domain().filter(function (d, i) { return !(i % 4) })));

    g.append("g")
    .call(d3.axisLeft(y))
    g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Film per year");

    g.selectAll(".bar")
    .data(stats.movie_freq)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function (d) { return x(d.year); })
    .attr("y", function (d) { return y(d.count); })
    .attr("width", x.bandwidth())
    .attr("height", function (d) { return height - y(d.count); });
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

function linksForFilteredMovies() {
    let newMap = new Map();
    mapCrewMovie.forEach(function (value, key, map) {
        let newSet = new Set();
        value.forEach(function (d) {
            if (mapMovie_filtered.get(d.id_movie)) newSet.add(d);
        })

        if (newSet.size > 0) newMap.set(key, newSet)
    });

    return newMap;
}

function filterLinksPerDepartement(dept, _map) {

    if (dept != "All") {
        let newMap = new Map();

        _map.forEach(function (value, key, map) {
            let newSet = new Set();

            value.forEach(function (d) {
                if (d.department == dept) newSet.add(d);
            })

            if (newSet.size > 0) newMap.set(key, newSet)
        });

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

function createLinkMap() {
    all_people_movies_links.forEach(function (d) {
        let n = mapCrewMovie.get(d.id_person);
        if (!n) {
            mapCrewMovie.set(d.id_person, new Set());
            n = mapCrewMovie.get(d.id_person);
        }
        n.add({ id_movie: d.id_movie, department: d.department, job: d.job });

        let m = mapMovieCrew.get(d.id_movie);
        if (!m) {
            mapMovieCrew.set(d.id_movie, new Set());
            m = mapMovieCrew.get(d.id_movie);
        }
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

    /*
    movieSet.forEach(function (movie) {
        let crewAndMovieLinks = getCrewAndMovieLinks(movie);

        crewAndMovieLinks.links.forEach(function (m_id) {
            let m = mapMovie.get(m_id);
            if (movieSet.has(m)) {
                let link = { source: movie, target: m, value: 1 };
                links.push(link);
                movieSet.add(m);
            }
        });
    });
    */
    movieSet = Array.from(movieSet);

    return { links: links, nodes: movieSet };
}

loadFiles()

d3.select(window).on("resize", function () {
    drawCircularViz();
})

let CircularLink, CircularNode;

function drawCircularViz(update) {
    if (!loaded) {
        return;
    }

    document.getElementById('MovieVizOptions').style.display = "none";
    document.getElementById('CircularVizOptions').style.display = "inline";

    //if (update) return updateCircularViz();

    currentViz = 1;

    width = parseInt(d3.select(".wrapper").style("width")) - parseInt(d3.select(".side-panel").style("width"));
    CircularVizLayer.selectAll("*").remove();
    MovieVizLayer.selectAll("*").remove();


    svg.attr("width", width)

    backgroundLayer.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "background")
    .on("click", function () { resetView(); });

    let tooltipDiv = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    let root = packageHierarchy(filtered_movies).sum(function (d) { return d.size; });

    cluster(root);

    CircularLink = CircularVizLayer.append("g").selectAll("link"),
        CircularNode = CircularVizLayer.append("g").selectAll("nodes");

    CircularLink = CircularLink
   .data(getLinks(root.leaves()))
   .enter().append("path")
     //.transition().duration(2000)
    .each(function (d) { d.source = d[0], d.target = d[d.length - 1] })
    .attr("class", "link")
    .attr("d", line)
    .on("mouseover", mouseoveredLink);

    CircularNode = CircularNode
    .data(root.leaves())
    .enter().append("circle")
    .attr("class", "node")
    .attr("r", 4)
    .attr("fill", function (d) { return color(d.data.vote_average); })
    .on("click", function (d) { click(d); })
    .on("mouseover", mouseovered)
    .on("mouseout", mouseouted)
       // .transition().duration(2000)
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
             .transition().duration(2000)
            .each(function (d) { d.source = d[0], d.target = d[d.length - 1] })
            .attr("class", "link")
            .attr("d", line)
            .on("mouseover", mouseoveredLink);

        CircularNode.data(root.leaves());

        CircularNode.transition().duration(2000)
            .attr("transform", function (d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
    }

    function resetView() {
        tooltipDiv.style("opacity", 0);
        CircularLink.attr("class", "link");

        CircularNode.attr("class", "node")
        .attr("r", 4)
        .attr("fill", function (d) { return color(d.data.vote_average); })
        displayDBInfo();
    }

    function click(n) {
        tooltipDiv.style("opacity", 0);
        d = n.data;
        showMovieInfo(d);
        drawMovieViz(new Set().add(d));
        /*
        node.filter(function (i) { return d.id_movie != i.data.id_movie })
        .attr("class", "node");

        link.attr("class", function (x) {
            if (x.source.data.id_movie == d.id_movie || x.target.data.id_movie == d.id_movie) {

                node.filter(function (i) {
                    return (x.source.data.id_movie == i.data.id_movie || x.target.data.id_movie == i.data.id_movie);
                }).attr("class", "node");

                return "link";
            }
            else return "link";
        });
        */
    }

    function mouseovered(d) {
        tooltipDiv.transition()
        .duration(200)
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

        tooltipDiv.transition()
        .duration(200)
        .style("opacity", 0);
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

function drawMovieViz(_movies, recalculate) {
    if (!loaded) {
        return;
    }

    document.getElementById('CircularVizOptions').style.display = "none";
    document.getElementById('MovieVizOptions').style.display = "inline";

    simulation.force("center", null).force("link", null).force("charge", null).force("posX", null).force("posY", null);

    if (document.getElementById("CustomAxisSwitch").checked && !recalculate) {
        switcForceMode();
    }
    else {
        currentViz = 2;
        movieVizSet = _movies

        width = parseInt(d3.select(".wrapper").style("width")) - parseInt(d3.select(".side-panel").style("width"));
        CircularVizLayer.selectAll("*").remove();
        MovieVizLayer.selectAll("*").remove();
        svg.attr("width", width)

        backgroundLayer.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "background")
        .on("click", function () { tooltipDiv.style("opacity", 0); resetView(); });

        graph = createGraph(_movies);

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
                .attr("r", function (d) { if (_movies.has(d)) return 15; else return 6 })
                .attr("fill", function (d) { return color(d.vote_average); })
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
            simulation.restart();
        }

        MovieNode.append("title").text(function (d) { return d.title });

        simulation.nodes(graph.nodes).on("tick", ticked);
        simulation.force("link").links(graph.links);
    }

    function switcForceMode() {
        let maxWidth = width * 0.9;
        let maxHeight = height * 0.9;

        let xAxisType = d3.select('#XAxis').property('value');
        let yAxisType = d3.select('#YAxis').property('value');

        let xAxis;
        let yAxis;

        let strength = 10;

        if (xAxisType == "Year") {
            xAxis = d3.scaleLinear().domain([new Date("1970-1-1"), new Date("2017-12-30")]);

            simulation.force("posX", d3.forceX(function (d) { return xAxis(new Date(d.release_date)) * maxWidth; }).strength(strength))

        }
        else if (xAxisType == "Reviews") {
            xAxis = d3.scaleLinear().domain([0, 10]);

            simulation.force("posX", d3.forceX(function (d) { return xAxis(d.vote_average) * maxWidth; }).strength(strength))
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
            xAxis = d3.scaleLinear().domain([min, max]);
            simulation.force("posX", d3.forceX(function (d) { return xAxis(d.Budget) * maxWidth; }).strength(strength))

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
            xAxis = d3.scaleLinear().domain([min, max]);
            simulation.force("posX", d3.forceX(function (d) { return xAxis(d.revenue) * maxWidth; }).strength(strength))

        }

        if (yAxisType == "Year") {
            yAxis = d3.scaleLinear().domain([new Date("1970-1-1"), new Date("2017-12-30")]);
            simulation.force("posY", d3.forceY(function (d) { return maxHeight - yAxis(new Date(d.release_date)) * maxHeight; }).strength(strength))

        }
        else if (yAxisType == "Reviews") {
            yAxis = d3.scaleLinear().domain([0, 10]);
            simulation.force("posY", d3.forceY(function (d) { return maxHeight - yAxis(d.vote_average) * maxHeight; }).strength(strength))

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
            yAxis = d3.scaleLinear().domain([min, max]);
            simulation.force("posY", d3.forceY(function (d) { return maxHeight - yAxis(d.Budget) * maxHeight; }).strength(strength))

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
            yAxis = d3.scaleLinear().domain([min, max]);
            simulation.force("posY", d3.forceY(function (d) { return maxHeight - yAxis(d.revenue) * maxHeight; }).strength(strength))

        }

        simulation.alphaTarget(0.01).restart();

        //xAxis.domain(stats.movie_freq.map(function (d) { return d.year; }));
        //y.domain([0, d3.max(stats.movie_freq, function (d) { return d.count; })]);

        MovieVizLayer.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xAxis).tickValues(xAxis.domain()));

        //alert("test");
        /*
        g.append("g")
        .call(d3.axisLeft(yAxis))
        g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Film per year");
        */
        /*
        g.selectAll(".bar")
        .data(stats.movie_freq)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) { return x(d.year); })
        .attr("y", function (d) { return y(d.count); })
        .attr("width", x.bandwidth())
        .attr("height", function (d) { return height - y(d.count); });
        */
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
        if (_movies.has(d)) {

            _movies.delete(d);
            if (_movies.size == 0) {
                drawCircularViz();
                return;
            }
            else {
                drawMovieViz(_movies, true);
            }
        }
        else {
            showMovieInfo(d);
            _movies.add(d)
            drawMovieViz(_movies, true);
        }

    }

    function mouseovered(d) {
        MovieNode.each(function (n) { n.target = n.source = false; });

        MovieLink.classed("link--highlight", function (l) {
            if (l.target.id_movie == d.id_movie) return l.source.source = true;
            else if (l.source.id_movie == d.id_movie) return l.target.target = true;
        })

        MovieLink.classed("link--fade", function (l) {
            return !(l.target.id_movie == d.id_movie || l.source.id_movie == d.id_movie);
        });

        /*
        node.classed("node--highlight", function (n) { return n.target || n.sources; })
        node.classed("node--fade", function (n) { return !(n.target || n.sources); });
        */
    }

    function mouseouted(d) {
        MovieLink.classed("link--highlight", false).classed("link--fade", false);
        MovieNode.classed("node--highlight", false).classed("node--fade", false);
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


let currentMovie;
function showMovieInfo(d) {
    currentMovie = d;
    function addRow(table, row1, row2) {
        let newRow = table.append("tr");
        newRow.append("td").text(row1);
        newRow.append("td").text(row2);
    }

    let sidepanel = d3.select(".side-panel");
    sidepanel.selectAll("*").remove();
    let div = sidepanel.append("div");
    div.append("h1").text(d.title);
    div.append("h2").text(d.tagline);
    let table = div.append("table").classed("large", true);
    addRow(table, "Released date", d.release_date);
    addRow(table, "Runtime", "" + d.runtime + " min");
    addRow(table, "Vote average", "" + d.vote_average + "/10");
    addRow(table, "Vote count", "" + d.vote_count);
    addRow(table, "Budget", "" + d.Budget.toLocaleString() + "$");
    addRow(table, "Revenue", "" + d.revenue.toLocaleString() + "$");
    div.style("height", parseInt(d3.select(".side-panel").style("height")) / 3 + 'px');
    div.style("overflow-y", "scroll");
    sidepanel.append("hr");
    div = sidepanel.append("div");

    let tmp = getLinksForMovie(d);
    let crewIDs = tmp.crew;
    let moviesIDs = tmp.movies;
    let links = tmp.links;


    let margin = { top: 30, right: 10, bottom: 10, left: 10 };
    let width = parseInt(div.style("width")) - margin.left - margin.right;
    let height = parseInt(d3.select(".side-panel").style("height")) * 2 / 3 - margin.top - margin.bottom;

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


    let svgcontainer = div.append("svg")
    .attr("class", "background")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

    let background = svgcontainer.append("g");
    background.append("rect")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("class", "background");

    let svg = svgcontainer.append("g")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


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
        tooltipDiv.transition()
         .duration(200)
         .style("opacity", .9);
        tooltipDiv.html(d.value)
          .style("left", (d3.event.pageX + 10) + "px")
          .style("top", (d3.event.pageY - 10) + "px");
    });

    let crewNames = svg.append("g")
    .selectAll("text")
    .data(crew)
    .enter().append("text")
    .attr("text-anchor", "end")
    .attr("x", function (d) { return d.x; })
    .attr("y", function (d) { return d.y + 6; })
    .attr("class", "text_default")
    .text(function (d) { return crewByID(d.id).name; });

    let moviesName = svg.append("g")
    .selectAll("text")
    .data(movies)
    .enter().append("text")
    .attr("text-anchor", "start")
    .attr("x", function (d) { return d.x; })
    .attr("y", function (d) { return d.y + 6; })
    .attr("class", "text_default")
    .text(function (d) { return movieByID(d.id).title; });

    div.style("height", parseInt(d3.select(".side-panel").style("height")) * 2 / 3 + 'px');
    div.style("overflow-y", "scroll");
}
