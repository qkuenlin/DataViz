let CircularLink, CircularNode;

function ClusterChange() {
    ClusterType = d3.select('#ClusterOptions').property('value');
    drawCircularViz(true);
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
    resizeSVG();

    // if we go to this viz, we clean the search field
    cleanSearch();
    //if (update) return updateCircularViz();

    currentViz = 1;

    CircularVizLayer.selectAll("*").remove();
    MovieVizLayer.selectAll("*").remove();
    UILayer.selectAll("*").remove();

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
        tooltipDiv.text(d.data.title)
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

        CircularNode.classed("node--highlight", function (n) { return n.target || n.source; })
        .classed("node--fade", function (n) { return !(n.target || n.source); });
    }

    function mouseouted(d) {
        CircularLink.classed("link--highlight", false).classed("link--fade", false);
        CircularNode.classed("node--highlight", false).classed("node--fade", false);

        tooltipDiv
        .style("opacity", 0).style("left", (0) + "px")
        .style("top", (0) + "px");
        tooltipDiv.text(d.data.title)
    }



    function mouseoveredLink(d) {
        CircularNode.each(function (n) { n.target = n.source = false; });

        CircularLink.classed("link--highlight", function (l) {
            if (l === d) return l.source.source = true;
            else if (l === d) return l.target.target = true;
        })
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
