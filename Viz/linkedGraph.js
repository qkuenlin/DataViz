var width = parseInt(d3.select(".wrapper").style("width"));
var height = parseInt(d3.select(".wrapper").style("height"));
var color = d3.scaleOrdinal(d3.schemeCategory20);

var graph;

var svg = d3.select("svg");
var backgroundLayer = svg.append('g');
var dataVizLayer = svg.append('g');
var UILayer = svg.append('g');

read("movies.json");
function read(file) {
    d3.json(file, function (error, g) {
        if (error) throw error;
        graph = g;
        hideSidePanel();
        draw();
    })
};


d3.select(window).on("resize", function() {
    draw();
})

function draw() {
    width = parseInt(d3.select(".wrapper").style("width"))- parseInt(d3.select(".side-panel").style("width"));
    backgroundLayer.selectAll("*").remove();
    dataVizLayer.selectAll("*").remove();
    svg.attr("width", width)

    backgroundLayer.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("opacity", "0")
    .on("click", function () { resetView(); });

    var link = dataVizLayer.append("g")
    .selectAll("link")
    .data(graph.links)
    .enter().append("line")
    .attr("stroke", "#696969")
    .attr("stroke-width", 1);

    var node = dataVizLayer.append("g")
    .selectAll("circle")
    .data(graph.nodes)
    .enter().append("circle")
    .attr("r", 5)
    .attr("fill", function (d) { return color(d.group); })
    .on("click", function (d) { click(d, this); })
    .call(d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended));

    node.append("title")
    .text(function (d) { return d.id; });

    var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function (d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height /2));

    simulation.nodes(graph.nodes).on("tick", ticked);

    simulation.force("link").links(graph.links);

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
    function resetView() {
        link.attr("stroke", "#696969")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 1);

        node.attr("r", 5)
        .attr("fill", function (d) { return color(d.group); })
        .attr("opacity", 1);

        hideSidePanel();
    }

    function click(d, s) {
        showSidePanel(d);

        node.attr("opacity", function (n) {
            if (d.id != n.id) return 0.3;
        });


        link.attr("stroke", function (x) {
            if (x.source.id == d.id || x.target.id == d.id) {
                node.attr("opacity", function (n) {
                    if (x.source.id == n.id || x.target.id == n.id) return 1.0;
                    else return "opacity";
                });
                return "red";
            }
            else return "#696969";
        })
        .attr("stroke-opacity", function (x) {
            if (x.source.id == d.id || x.target.id == d.id) { return 1; }
            else return 0.3;
        })
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
    var sidepanel = d3.select(".side-panel");
    sidepanel.selectAll("*").remove();
    var src = "https://img.maximummedia.ie/her_ie/eyJkYXRhIjoie1widXJsXCI6XCJodHRwOlxcXC9cXFwvbWVkaWEtaGVyLm1heGltdW1tZWRpYS5pZS5zMy5hbWF6b25hd3MuY29tXFxcL3dwLWNvbnRlbnRcXFwvdXBsb2Fkc1xcXC8yMDE2XFxcLzA2XFxcLzIwMTAyNDM0XFxcL1JpY2tBc3RsZXkucG5nXCIsXCJ3aWR0aFwiOjY0NyxcImhlaWdodFwiOjM0MCxcImRlZmF1bHRcIjpcImh0dHBzOlxcXC9cXFwvd3d3Lmhlci5pZVxcXC9hc3NldHNcXFwvaW1hZ2VzXFxcL2hlclxcXC9uby1pbWFnZS5wbmc_dj00XCJ9IiwiaGFzaCI6ImMwMGFmYTY0MjVjZmVkZWE4MGE3ZWJkNjZkYjYyZWFlMmVmYzJkNGQifQ==/rickastley.png"
    sidepanel.append("input").attr("type", "button")
    .attr("value", "X").attr("onclick", "hideSidePanel()");
    sidepanel.append("div")
    sidepanel.append("img").attr("src", src).attr("width", Math.max(parseInt(d3.select(".side-panel").style("width")),width*0.3));
    sidepanel.append("h1").text(d.id);
    sidepanel.append("span").classed('justified', true).text("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac nibh ut ligula faucibus tempus. Nunc maximus a nisl eu ultricies. Phasellus quam sapien, vestibulum a purus ac, ullamcorper eleifend nulla. Nullam vel felis finibus, porta est ac, dapibus urna. Nulla dapibus rhoncus est, ut euismod odio maximus et. Suspendisse ac odio quis arcu egestas posuere ut a elit. Morbi posuere maximus accumsan. Aenean nunc massa, volutpat nec maximus sit amet, egestas eget orci. Donec vehicula blandit erat, ac venenatis massa.");
}

function hideSidePanel() {
    var sidepanel = d3.select(".side-panel");
    sidepanel.selectAll("*").remove();
}

// dropdown selection
d3.select('#opts')
.on('change', function() {
    var selectValue = d3.select('#opts').property('value')
    console.log(selectValue);
    read(selectValue);
});
