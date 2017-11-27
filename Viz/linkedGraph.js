let width = parseInt(d3.select(".wrapper").style("width"));
let height = parseInt(d3.select(".wrapper").style("height"));
let color = d3.scaleLinear().domain([0, 3, 6, 10]).range(["red", "yellow", "bleu", "green"]);

let diameter = height - 50,
radius = diameter / 2,
innerRadius = radius - 120;

let cluster = d3.cluster().size([360, innerRadius]);
let line = d3.radialLine()
.curve(d3.curveBundle.beta(0.85))
.radius(function (d) { return d.y; })
.angle(function (d) { return d.x / 180 * Math.PI; });


let svg = d3.select("svg");
let backgroundLayer = svg.append('g');
let dataVizLayer = svg.append('g');
let UILayer = svg.append('g');

let loaded = false;
let movies;
let people;
let people_movies_links;

//load all json, set loaded to true. If add new json, need to do another callback layer
function loadFiles() {
    d3.json("../movie.json", function(error, data) {
        if (error) throw error;
        movies = data;

        let scale = d3.scaleLinear().domain([0, movies.length]).range([0, 2 * Math.PI]);

        movies.forEach(function (d, i) {
            let theta = scale(i);
            d.x = radius * Math.sin(theta) + width / 3;
            d.y = radius * Math.cos(theta) + height / 2;
        });

        d3.json("../people.json", function(error, data) {
            if (error) throw error;
            people = data;
            d3.json("../lien.json", function (error, data) {
                if (error) throw error;
                people_movies_links = data;
                loaded = true;
                draw();
                displayDBInfo();
            })
        });
    });
}

//return stats like highest vote_average, num of votes, ...
function getDBStats() {
    let max_vote = movies[0];
    let max_rev = movies[0];
    let max_budget = movies[0];
    let longuest = movies[0];
    let oldest_date = new Date(movies[0].release_date);
    let oldest = movies[0];
    let youngest = movies[0];
    let youngest_date = new Date(movies[0].release_date);
    let movie_freq = [];
    let vote_count = 0;
    let tot_rev = 0;
    let tot_runtime = 0;
    for(let i = 0; i < movies.length; i++) {
        let m = movies[i];
        if (m.vote_average > max_vote.vote_average) {
            max_vote = m
        }
        if (m.revenue > max_rev.revenue) {
            max_rev = m;
        }

        if(m.Budget > max_budget.Budget) {
            max_budget = m;
        }

        if(m.runtime > longuest.runtime) {
            longuest = m;
        }

        let date = new Date(m.release_date);
        if(date > youngest_date) {
            youngest = m;
            youngest_date = date;
        }
        if(date < oldest_date) {
            oldest = m;
            oldest_date = date;
        }

        let found = false;
        for(let j=0; j < movie_freq.length; j++) {
            if(movie_freq[j].year == date.getYear()+1900) {
                movie_freq[j].count++;
                found = true;
            }
        }
        if(!found) {
            movie_freq.push({year: date.getYear()+1900, count: 1})
        }

        tot_runtime += m.runtime;
        tot_rev += m.revenue;
        vote_count += m.vote_count;
    }

    movie_freq.sort(function(a,b) {return (a.year > b.year) ? 1 : ((b.year > a.year) ? -1 : 0);} );

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
    return "" + (date.getYear()+1900) + "/" + date.getMonth().toLocaleString(undefined, {minimumIntegerDigits: 2}) +"/"+ date.getDay().toLocaleString(undefined, {minimumIntegerDigits: 2});
}


function minutes2String(seconds)
{
    var value = seconds;

    var units = {
        "year": 365*24*60,
        "month": 30*24*60,
        "day": 24*60,
        "hour": 60,
        "minute": 1
    }

    var result = []

    for(var name in units) {
        var p =  Math.floor(value/units[name]);
        if(p == 1) result.push(" " + p + " " + name);
        if(p >= 2) result.push(" " + p + " " + name + "s");
        value %= units[name]
    }

    return result;

}

function crewByID(id) {
    let ret = null
    people.forEach(function(p) {
        if(p.id_person == id) {
            ret = p;
        }
    });
    return ret;
}

function movieByID(id) {
    let ret = null;
    movies.forEach(function(m) {
        if(m.id_movie == id) {
            ret = m;
        }
    });
    return ret;
}

//display DB info inside side panel
function displayDBInfo() {
    let stats = getDBStats();
    let sidepanel = d3.select(".side-panel");
    sidepanel.selectAll("*").remove();
    sidepanel.append("hr");
    let div = sidepanel.append("div").classed("textInfo", true)
    div.append("h1").text("Welcome to the Ultimate Movie Data Viz");
    div.append("p").classed('justified', true).text("This DB contains information on " + movies.length.toString() + " movies.");
    div.append("p").classed("justified", true).text("With a total of " + people.length.toString() + " people.")
    div.append("p").classed("justified", true).text("The number of links between those movies and the crew is " + people_movies_links.length + ".")
    div.append("p").classed("justified", true).text("The DB contains ranking based on " + stats.vote_count + " votes.");
    div.append("p").classed("justified", true).text("The movie with the best score is " + stats.max_vote.title + " with a score of " + stats.max_vote.vote_average + "/10.")
    div.append("p").classed("justified", true).text("The movie with the best revenue is " + stats.max_rev.title + " with a revenue of " + (stats.max_rev.revenue).toLocaleString() + "$.");
    div.append("p").classed("justified", true).text("The movie with the highest budget is " + stats.max_budget.title + " with a budget of  " + (stats.max_budget.Budget).toLocaleString() + "$.");
    div.append("p").classed("justified", true).text("The oldest movie is " + stats.oldest.title + ", released on " + stats.oldest.release_date + ".");
    div.append("p").classed("justified", true).text("The youngest movie is " + stats.youngest.title + ", released on " + stats.youngest.release_date + ".");
    div.append("p").classed("justified", true).text("The longuest movie is " + stats.longuest.title + ", with a runtime of " + stats.longuest.runtime + " minutes.");
    div.append("p").classed("justified", true).text("The total revenue of the movies in the DB is of " + (stats.tot_rev).toLocaleString() + "$.");
    div.append("p").classed("justified", true).text("The total length of the movies in the DB is " + (stats.tot_runtime).toLocaleString() + " minutes, which is " + minutes2String(stats.tot_runtime)+ ".");

    div.style("height", parseInt(d3.select(".side-panel").style("height"))/2 + 'px');
    div.style("overflow-y", "scroll");
    sidepanel.append("hr");
    let svg_width = parseInt(d3.select(".side-panel").style("width"));
    let svg_height = parseInt(d3.select(".side-panel").style("height")) -
    parseInt(d3.select(".textInfo").style("height"));

    let svg = sidepanel.append("svg").attr("width", svg_width).attr("height", svg_height);
    let margin = {top: 5, right: 5, bottom: 20, left: 50};
    let g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    let width = svg.attr("width") - margin.left - margin.right;
    let height = svg.attr("height")- margin.top - margin.bottom;

    let x = d3.scaleBand().range([0, width]).paddingInner(0.05),
    y = d3.scaleLinear().range([height, 0]);

    x.domain(stats.movie_freq.map(function(d) { return d.year; }));
    y.domain([0, d3.max(stats.movie_freq, function(d) { return d.count; })]);

    g.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickValues(x.domain().filter(function(d,i){ return !(i%3)})));

    g.append("g")
    .call(d3.axisLeft(y))
    g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x",0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Film per year");



    g.selectAll(".bar")
    .data(stats.movie_freq)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", function(d) {return x(d.year);})
    .attr("y", function(d) {return y(d.count);})
    .attr("width", x.bandwidth())
    .attr("height", function(d) { return height - y(d.count); });
}

//returns all the crew ids and all the movies that share someone.
function getCrewAndMovieLinks(movie) {
    let crew = new Set();
    let related_movies = new Set();
    people_movies_links.forEach( function(link){
        if (movie.id_movie == link.id_movie) {
            crew.add(link.id_person);
        }
    });
    people_movies_links.forEach(function (link) {
        if (link.id_movie != movie.id_movie && crew.has(link.id_person)) {
            related_movies.add(link.id_movie);
        }
    });
    crew = Array.from(crew);
    related_movies = Array.from(related_movies);
    crew.sort(function(a,b) {return a-b;});
    related_movies.sort(function(a,b){return a-b;});
    return {crew: crew, links: related_movies};
}

function createLinks() {
    let links = [];
    movies.forEach(function (movie) {
        let crewAndMovieLinks = getCrewAndMovieLinks(movie);

        crewAndMovieLinks.links.forEach(function (m_id) {
            let m = movies.find(d => d.id_movie == m_id);
            let link = { source: movie, target: m, value: 1 };
            links.push(link);
        });
    });
    return links;
}

loadFiles()

d3.select(window).on("resize", function() {
    draw();
})

function draw() {
    if(!loaded) {
        return;
    }
    width = parseInt(d3.select(".wrapper").style("width"))- parseInt(d3.select(".side-panel").style("width"));
    backgroundLayer.selectAll("*").remove();
    dataVizLayer.selectAll("*").remove();
    svg.attr("width", width)

    backgroundLayer.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "background")
    .on("click", function () { resetView(); });

    let links = createLinks();

    let link = dataVizLayer.append("g")
    .attr("class", "links default")
    .selectAll("link")
    .data(links)
    .enter().append("line")
    //.attr("d", line)
    .attr("x1", function (d) { return d.source.x; })
    .attr("y1", function (d) { return d.source.y; })
    .attr("x2", function (d) { return d.target.x; })
    .attr("y2", function (d) { return d.target.y; });

    let node = dataVizLayer.append("g")
    .attr("class", "nodes default")
    .selectAll("circle")
    .data(movies)
    .enter().append("circle")
    .attr("r", 4)
    .attr("cx", function (d) { return d.x; })
    .attr("cy", function (d) { return d.y; })
    .attr("fill", function (d) { return color(d.vote_average); })
    .on("click", function (d) { click(d); })
    // .call(d3.drag()
    // .on("start", dragstarted)
    // .on("drag", dragged)
    // .on("end", dragended));

    node.append("title")
    .text(function (d) { return d.title; });

    /*
    let simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function (d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height /2));

    simulation.nodes(movies).on("tick", ticked);

    simulation.force("link").links(links);

    function ticked() {
    link
    .attr("x1", function (d) { return d.source.x; })
    .attr("y1", function (d) { return d.source.y; })
    .attr("x2", function (d) { return d.target.x; })
    .attr("y2", function (d) { return d.target.y; });

    node
    .attr("cx", function (d) { return d.x; })
    .attr("cy", function (d) { return d.y; });
}
*/

function resetView() {
    link.attr("class", "links default");

    node.attr("class", "nodes default")
    .attr("r", 4)
    .attr("fill", function (d) { return color(d.vote_average); })
    displayDBInfo();
}

function click(d) {
    showMovieInfo(d);

    node.filter(function (n) { return d.id_movie != n.id_movie })
    .attr("class",  "nodes hide");

    link.attr("class", function (x) {
        if (x.source.id_movie == d.id_movie || x.target.id_movie == d.id_movie) {

            node.filter(function (n) {
                return (x.source.id_movie == n.id_movie || x.target.id_movie == n.id_movie);
            }).attr("class", "nodes show");

            return "links show";
        }
        else return "links hide";
    });
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
}

function showMovieInfo(d) {
    function addRow(table, row1, row2) {
        let newRow = table.append("tr");
        newRow.append("td").text(row1);
        newRow.append("td").text(row2);
    }

    function addCrewLine(c) {
        let l = crewTable.append("tr").append("td");
        let crew = crewByID(c);
        l.text(crew.name);
        l.on("click", function() {
            alert(crew.name);
        });
    }
    function addMovieLine(c) {
        let l = movieTable.append("tr").append("td");
        let m = movieByID(c);
        l.text(m.title);
        l.on("click", function() {
            alert(m.title);
        });
    }

    let sidepanel = d3.select(".side-panel");
    sidepanel.selectAll("*").remove();
    let div = sidepanel.append("div");
    div.append("h1").text(d.title);
    div.append("h2").text(d.tagline);
    let table = div.append("table");
    addRow(table, "Released date", d.release_date);
    addRow(table, "Runtime", ""+d.runtime+" min");
    addRow(table, "Vote average", ""+d.vote_average+"/10");
    addRow(table, "Vote count", ""+d.vote_count);
    addRow(table, "Budget", ""+d.Budget.toLocaleString()+"$");
    addRow(table, "Revenue", ""+d.revenue.toLocaleString()+"$");
    div.style("height", parseInt(d3.select(".side-panel").style("height"))/3 + 'px');
    div.style("overflow-y", "scroll");
    sidepanel.append("hr");
    div = sidepanel.append("div");
    table = div.append("table");
    let headerRow = table.append("tr");
    headerRow.append("th").text("Crew");
    headerRow.append("th").text("Related movies");
    let crewMovie = getCrewAndMovieLinks(d);
    let row = table.append("tr");
    let crewTable = row.append("td").append("table");
    let movieTable = row.append("td").append("table");
    crewMovie.crew.forEach(function(c) {
        addCrewLine(c);
    });
    crewMovie.links.forEach(function(l) {
        addMovieLine(l);
    });
    div.style("height", parseInt(d3.select(".side-panel").style("height"))*2/3 + 'px');
    div.style("overflow-y", "scroll");
}
