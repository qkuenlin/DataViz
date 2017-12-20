let graph;
let simulation = d3.forceSimulation();

let MovieLink, MovieNode;

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
    AxisChange()
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

function addingToGraph(movie) {
    let movieSet = new Set();

    graph.nodes.forEach(function (m) {
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

function drawMovieViz(_movies, recalculate, adding) {
    if (!loaded) {
        return;
    }

    document.getElementById('on-click-toggle').style.display = "inline-block";
    document.getElementById('CircularVizOptions').style.display = "none";
    document.getElementById('MovieVizOptions').style.display = "inline";
    document.getElementById('button-reset').style.display = "inline";

    resizeContainers();
    //change svg height
    resizeSVG();

    simulation.force("center", null).force("link", null).force("charge", null).force("posX", null).force("posY", null);

    if (document.getElementById("CustomAxisSwitch").checked && !recalculate) {
        switcForceMode();
    }
    else if (!document.getElementById("CustomAxisSwitch").checked && !recalculate) {
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

        width = parseInt(d3.select("#main-panel").style("width"));
        CircularVizLayer.selectAll("*").remove();
        MovieVizLayer.selectAll("*").remove();
        UILayer.selectAll("*").remove();
        svg.attr("width", width)

        if (adding) {
            addingToGraph(_movies);
            movieVizSet.add(_movies);
        }
        else {
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
        .attr("r", function (d) { if (movieVizSet.has(d)) return d.radius = 15; else return d.radius = 6 })
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

        simulation.nodes(graph.nodes).on("tick", ticked);
    }

    function switcForceMode() {
        let maxWidth = width - 50;
        let maxHeight = height - 50;

        let minWidth = 0;
        let minHeight = 60;

        let xAxisType = d3.select('#XAxis').property('value');
        let yAxisType = d3.select('#YAxis').property('value');

        let xAxis;
        let yAxis;

        let strength = 10;

        if (yAxisType == "Release Date") {
            minWidth = 120;
            let max = new Date("1900-1-1");
            let min = new Date("2100-1-1");
            MovieNode.each(function (d) {
                if (new Date(d.release_date) > max) max = new Date(d.release_date);
                else if (new Date(d.release_date) < min) min = new Date(d.release_date);
            })

            min = new Date(min.getFullYear(), 0, 1);
            max = new Date(max.getFullYear(), 11, 31);

            yAxis = d3.scaleLinear().domain([min, max]).range([maxHeight, minHeight]);
            simulation.force("posY", d3.forceY(function (d) { return yAxis(new Date(d.release_date)); }).strength(strength))

        }
        else if (yAxisType == "Reviews") {
            minWidth = 50;

            yAxis = d3.scaleLinear().domain([0, 10]).range([maxHeight, minHeight]);
            simulation.force("posY", d3.forceY(function (d) { return yAxis(d.vote_average); }).strength(strength))

        }
        else if (yAxisType == "Budget") {
            minWidth = 100;

            let max = 0;
            MovieNode.each(function (d) {
                if (max < d.Budget) max = d.Budget;
            })
            let min = 0;
            max = Math.ceil(max / 20000000) * 20000000;
            yAxis = d3.scaleLinear().domain([min, max]).range([maxHeight, minHeight]);
            simulation.force("posY", d3.forceY(function (d) { return yAxis(d.Budget); }).strength(strength))

        }
        else if (yAxisType == "Revenue") {
            minWidth = 115;

            let max = 0;
            MovieNode.each(function (d) {
                if (max < d.revenue) max = d.revenue;
            })
            let min = 0;
            max = Math.ceil(max / 50000000) * 50000000;
            yAxis = d3.scaleLinear().domain([min, max]).range([maxHeight, minHeight]);
            simulation.force("posY", d3.forceY(function (d) { return yAxis(d.revenue); }).strength(strength))
        }

        if (xAxisType == "Release Date") {
            let max = new Date("1900-1-1");
            let min = new Date("2100-1-1");
            MovieNode.each(function (d) {
                if (new Date(d.release_date) > max) max = new Date(d.release_date);
                else if (new Date(d.release_date) < min) min = new Date(d.release_date);
            })

            min = new Date(min.getFullYear(), 0, 1);
            max = new Date(max.getFullYear(), 11, 31);

            xAxis = d3.scaleLinear().domain([min, max]).range([minWidth, maxWidth]);

            simulation.force("posX", d3.forceX(function (d) { return xAxis(new Date(d.release_date)); }).strength(strength))

        }
        else if (xAxisType == "Reviews") {
            xAxis = d3.scaleLinear().domain([0, 10]).range([minWidth, maxWidth]);

            simulation.force("posX", d3.forceX(function (d) { return xAxis(d.vote_average); }).strength(strength))
        }
        else if (xAxisType == "Budget") {
            let max = 0;
            MovieNode.each(function (d) {
                if (max < d.Budget) max = d.Budget;
            })
            let min = 0;
            max = Math.ceil(max / 20000000) * 20000000;
            xAxis = d3.scaleLinear().domain([min, max]).range([minWidth, maxWidth]);
            simulation.force("posX", d3.forceX(function (d) { return xAxis(d.Budget); }).strength(strength))

        }
        else if (xAxisType == "Revenue") {
            let max = 0;
            MovieNode.each(function (d) {
                if (max < d.revenue) max = d.revenue;
            })
            let min = 0;
            max = Math.ceil(max / 20000000) * 20000000;
            xAxis = d3.scaleLinear().domain([min, max]).range([minWidth, maxWidth]);
            simulation.force("posX", d3.forceX(function (d) { return xAxis(d.revenue); }).strength(strength))
        }

        simulation.alphaTarget(0.01).restart();

        MovieLink.classed("link--hidden", true);

        UILayer.selectAll("*").remove();

        let xAxisSVG = d3.axisTop().scale(xAxis).ticks(4);


        if (xAxisType == "Release Date") {
            xAxisSVG.tickFormat(d3.timeFormat("%B %Y"));
        }

        UILayer.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + minHeight + ")")
        .call(xAxisSVG);


        let yAxisSVG = d3.axisLeft().scale(yAxis);

        if (yAxisType == "Release Date") {
            yAxisSVG.tickFormat(d3.timeFormat("%B %Y"));
        }

        UILayer.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + minWidth + ",0)")
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
            .each(function (d) {
                if (d.y < d.radius+1) d.y = d.radius+1;
                else if (d.y > height - 15 - d.radius) d.y = height - 15 - d.radius;
                if (d.x < d.radius+1) d.x = d.radius+1;
                else if (d.x > width - 25 - d.radius) d.x = width - 25 - d.radius;
            })
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
        if (!checkIfSearched(d)) {
            cleanSearch()
        }
        if (movieVizSet.has(d)) {
            if (!document.getElementById('on-click-toggle-switch').checked) {
                showMovieInfo(d);
            } else {
                movieVizSet.delete(d);
                if (movieVizSet.size == 0) {
                    drawCircularViz();
                    displayDBInfo();
                    return;
                } else {
                    drawMovieViz(movieVizSet, true);
                    if (d.id_movie == currentMovie.id_movie) {
                        showMovieInfo([...movieVizSet][0]);
                    }
                }
            }
        }
        else {
            drawMovieViz(d, true, true);
            showMovieInfo(d);
        }
    }

    function mouseovered(d) {
        tooltipDiv
        .style("opacity", 9);
        tooltipDiv.html(d.title)
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 10) + "px");

        MovieNode.each(function (n) { n.source = false; });

        MovieLink.classed("link--highlight", function (l) {
            if (l.target.id_movie == d.id_movie) return l.source.source = l.target.source = true;
            else if (l.source.id_movie == d.id_movie) return l.target.source = l.source.source = true;
        })

        if (document.getElementById("CustomAxisSwitch").checked) {
            MovieLink.classed("link--hidden", function (l) {
                return !(l.target.id_movie == d.id_movie || l.source.id_movie == d.id_movie);
            });
        }
        else {
            MovieLink.classed("link--fade", function (l) {
                return !(l.target.id_movie == d.id_movie || l.source.id_movie == d.id_movie);
            });
        }

        MovieNode.classed("node--highlight", function (n) { return n.source; })
        .classed("node--fade", function (n) { return !(n.source); });

    }

    function mouseouted(d) {
        tooltipDiv.style("opacity", 0)
        .style("left", (0) + "px")
        .style("top", (0) + "px");
        MovieNode.classed("node--highlight", false).classed("node--fade", false);

        if (document.getElementById("CustomAxisSwitch").checked) {
            MovieLink.classed("link--highlight", false).classed("link--hidden", true);
        }
        else {
            MovieLink.classed("link--highlight", false).classed("link--fade", false);

        }
    }

}

