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

        tot_rev += m.revenue;
    }

    movie_freq.sort(function(a,b) {return (a.year > b.year) ? 1 : ((b.year > a.year) ? -1 : 0);} );
    console.log(movie_freq);

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

function date2str(date) {
    return "" + (date.getYear()+1900) + "/" + date.getMonth().toLocaleString(undefined, {minimumIntegerDigits: 2}) +"/"+ date.getDay().toLocaleString(undefined, {minimumIntegerDigits: 2});
}


//display DB info inside side panel
function displayDBInfo() {
    let stats = getDBStats();
    let sidepanel = d3.select(".side-panel");
    sidepanel.selectAll("*").remove();
    sidepanel.append("hr");
    let div = sidepanel.append("div").classed("textInfo", true)
    div.append("h1").text("Welcom to the Ultimate Movie Data Viz");
    div.append("p").classed('justified', true).text("This DB contains information on " + movies.length.toString() + " movies.");
    div.append("p").classed("justified", true).text("With a total of " + people.length.toString() + " people.")
    div.append("p").classed("justified", true).text("The number of links between those movies and the crew is " + people_movies_links.length + ".")
    div.append("p").classed("justified", true).text("The movie with the best score is " + stats.max_vote_title + " with a score of " + stats.max_vote + "/10.")
    div.append("p").classed("justified", true).text("The movie with the best revenue is " + stats.max_rev_title + " with a revenue of " + (stats.max_rev).toLocaleString() + "$.");
    div.append("p").classed("justified", true).text("The oldest movie is " + stats.oldest_title + ", released in " + date2str(stats.oldest) + ".");
    div.append("p").classed("justified", true).text("The youngest movie is " + stats.youngest_title + ", released in " + date2str(stats.youngest) + ".");
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
    console.log(x.domain());
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
    let crew = [];
    let related_movies = [];
    people_movies_links.forEach( function(link){
        if (movie.id_movie == link.id_movie) {
            crew.push(link.id_person);
        }
    });
    people_movies_links.forEach(function (link) {
        if (link.id_movie != movie.id_movie && crew.includes(link.id_person)) {
            related_movies.push(link.id_movie);
        }
    });
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
    .on("click", function (d) { click(d, this); })
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

    function click(d, s) {
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
