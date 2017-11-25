let width = parseInt(d3.select(".wrapper").style("width"));
let height = parseInt(d3.select(".wrapper").style("height"));
let color = d3.scaleLinear().domain([0, 5, 10]).range(["red", "bleu", "green"]);

let svg = d3.select("svg");
let backgroundLayer = svg.append('g');
let dataVizLayer = svg.append('g');
let UILayer = svg.append('g');

function loadJSON(filename, bool) {
    d3.json(filename, function(error, data) {
        if (error) throw error;
        console.log(filename + " loaded succesfully");
        console.log(data);
        bool = true;
        return data;
    });
}
let loaded = false;
let movies;
let people;
let people_movies_links;

//load all json, set loaded to true. If add new json, need to do another callback layer
function loadFiles() {
    d3.json("../movie.json", function(error, data) {
        if (error) throw error;
        movies = data;
        d3.json("../people.json", function(error, data) {
            if (error) throw error;
            people = data;
            d3.json("../lien.json", function(error ,data) {
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
    let max_vote = 0;
    let max_vote_title = ""
    let max_rev = 0;
    let max_rev_title = "";
    let tot_rev = 0;
    let oldest = new Date(movies[0].release_date);
    let oldest_title = movies[0].title;
    let youngest_title = movies[0].title;
    let youngest = new Date(movies[0].release_date);
    let movie_freq = []
    for(let i = 0; i < movies.length; i++) {
        let m = movies[i];
        if (m.vote_average > max_vote) {
            max_vote = m.vote_average;
            max_vote_title = m.title;
        }
        if (m.revenue > max_rev) {
            max_rev = m.revenue;
            max_rev_title = m.title;
        }
        let date = new Date(m.release_date);
        if(date.getDate() > youngest.getDate()) {
            youngest_title = m.title;
            youngest = date;
        }
        if(date.getDate() < oldest.getDate()) {
            oldest_title = m.title;
            oldest = date;
        }

        if(date.getYear() in movie_freq) {
            movie_freq[date.getYear()]++;
        } else {
            movie_freq[date.getYear()] = 1;
        }

        tot_rev += m.revenue;
    }
    return {
        max_vote: max_vote,
        max_vote_title: max_vote_title,
        max_rev: max_rev,
        max_rev_title: max_rev_title,
        tot_rev: tot_rev,
        oldest: oldest,
        oldest_title: oldest_title,
        youngest: youngest,
        youngest_title: youngest_title,
        movie_freq: movie_freq
    };
}

//display DB info inside side panel
function displayDBInfo() {
    let sidepanel = d3.select(".side-panel");
    sidepanel.selectAll("*").remove();
    sidepanel.append("div")
    sidepanel.append("h1").text("Welcom to the Ultimate Movie Data Viz");
    sidepanel.append("p").classed('justified', true).text("This DB contains information on " + movies.length.toString() + " movies.");
    sidepanel.append("p").classed("justified", true).text("With a total of " + people.length.toString() + " people.")
    sidepanel.append("p").classed("justified", true).text("The number of links between those movies and the crew is " + people_movies_links.length.toString() + ".")
    let stats = getDBStats();
    sidepanel.append("p").classed("justified", true).text("The movie with the best score is " + stats.max_vote_title + " with a score of " + stats.max_vote + "/10.")
    sidepanel.append("p").classed("justified", true).text("The movie with the best revenue is " + stats.max_rev_title + " with a revenue of " + stats.max_rev + "$.");
    sidepanel.append("p").classed("justified", true).text("The oldest movie is " + stats.oldest_title + ", released in " + stats.oldest.toDateString() + ".");
    sidepanel.append("p").classed("justified", true).text("The youngest movie is " + stats.youngest_title + ", released in " + stats.youngest.toDateString() + ".");

    let svg_width = parseInt(d3.select(".side-panel").style("width"));
    let svg = sidepanel.append("svg").attr("width", svg_width),
        margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = +svg.attr("width") - margin.left - margin.right,
        height = +svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    g.selectAll(".bar")
        .data(stats.movie_freq)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) {return d;})
        .attr("y", function(d) {return stats.movie_freq[d];})
        .attr("width", 2)
        .attr("height", function(d){return height - stats.movie_freq[d];});
}

//returns all the crew ids and all the movies that share someone.
function getCrewAndMovieLinks(movie) {
    let crew = [];
    let related_movies = [];
    for(let link in people_movies_links) {
        if(movie.id_movie == link.id_movie) {
            crew.push(link.id_person);
        }
    }
    for(let link in people_movies_links) {
        if(link.id_movie != movie.id_movie && crew.includes(link.id_person)) {
            related_movies.push(link.id_movie);
        }
    }
    return {crew: crew, links: related_movies};
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

    // let link = dataVizLayer.append("g")
    // .attr("class", "links show")
    // .selectAll("link")
    // .data(graph.links)
    // .enter().append("line")

    let node = dataVizLayer.append("g")
    .attr("class", "nodes show")
    .selectAll("circle")
    .data(movies)
    .enter().append("circle")
    .attr("r", 5)
    .attr("fill", function (d) { return color(d.vote_average); })
    .on("click", function (d) { click(d, this); })
    // .call(d3.drag()
    // .on("start", dragstarted)
    // .on("drag", dragged)
    // .on("end", dragended));

    // node.append("title")
    // .text(function (d) { return d.id; });

    // let simulation = d3.forceSimulation()
    // .force("link", d3.forceLink().id(function (d) { return d.id; }))
    // .force("charge", d3.forceManyBody())
    // .force("center", d3.forceCenter(width / 2, height /2));
    //
    // simulation.nodes(graph.nodes).on("tick", ticked);
    //
    // simulation.force("link").links(graph.links);
    //
    // function ticked() {
    //     link
    //     .attr("x1", function (d) { return d.source.x; })
    //     .attr("y1", function (d) { return d.source.y; })
    //     .attr("x2", function (d) { return d.target.x; })
    //     .attr("y2", function (d) { return d.target.y; });
    //
    //     node
    //     .attr("cx", function (d) { return d.x; })
    //     .attr("cy", function (d) { return d.y; });
    // }

    function resetView() {
        //link.attr("class", "links show");

        node.attr("class", "nodes show")
        .attr("r", 5)
        .attr("fill", function (d) { return color(d.group); })
    }

    function click(d, s) {
        showSidePanel(d);

        node.filter(function(n) { return d.id != n.id })
            .attr("class",  "nodes hide");

        // link.attr("class", function (x) {
        //     if (x.source.id == d.id || x.target.id == d.id) {
        //
        //         node.filter(function (n) {
        //             return (x.source.id == n.id || x.target.id == n.id);
        //         }).attr("class", "nodes show");
        //
        //         return "links show";
        //     }
        //     else return "links hide";
        // });
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

function showSidePanel(d) {
    let sidepanel = d3.select(".side-panel");
    sidepanel.selectAll("*").remove();
    let src = "http://2.bp.blogspot.com/-baqmxAt8YHg/UMRuNx6uNdI/AAAAAAAAD1s/TzmvfnYyP8E/s1600/rick-astely.gif"
    sidepanel.append("div")
    sidepanel.append("img").attr("src", src).attr("width", Math.max(parseInt(d3.select(".side-panel").style("width")),width*0.3));
    sidepanel.append("h1").text(d.id);
    sidepanel.append("span").classed('justified', true).text("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac nibh ut ligula faucibus tempus. Nunc maximus a nisl eu ultricies. Phasellus quam sapien, vestibulum a purus ac, ullamcorper eleifend nulla. Nullam vel felis finibus, porta est ac, dapibus urna. Nulla dapibus rhoncus est, ut euismod odio maximus et. Suspendisse ac odio quis arcu egestas posuere ut a elit. Morbi posuere maximus accumsan. Aenean nunc massa, volutpat nec maximus sit amet, egestas eget orci. Donec vehicula blandit erat, ac venenatis massa.");
}

// dropdown selection
d3.select('#opts')
.on('change', function() {
    let selectValue = d3.select('#opts').property('value')
    console.log(selectValue);
    read(selectValue);
});
