let width = parseInt(d3.select(".wrapper").style("width"));
let height = parseInt(d3.select(".wrapper").style("height"));
let color = d3.scaleOrdinal(d3.schemeCategory20);

let graph;

let svg = d3.select("svg");
let backgroundLayer = svg.append('g');
let dataVizLayer = svg.append('g');
let UILayer = svg.append('g');

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
    .attr("class", "background")
    .on("click", function () { resetView(); });

    let link = dataVizLayer.append("g")
    .attr("class", "links show")
    .selectAll("link")
    .data(graph.links)
    .enter().append("line")

    let node = dataVizLayer.append("g")
    .attr("class", "nodes show")
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

    let simulation = d3.forceSimulation()
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
        link.attr("class", "links show");

        node.attr("class", "nodes show")
        .attr("r", 5)
        .attr("fill", function (d) { return color(d.group); })

        hideSidePanel();
    }

    function click(d, s) {
        showSidePanel(d);

        node.filter(function(n) { return d.id != n.id })
            .attr("class",  "nodes hide");

        link.attr("class", function (x) {
            if (x.source.id == d.id || x.target.id == d.id) {

                node.filter(function (n) {
                    return (x.source.id == n.id || x.target.id == n.id);
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

function showSidePanel(d) {
    let sidepanel = d3.select(".side-panel");
    sidepanel.selectAll("*").remove();
    let src = "http://2.bp.blogspot.com/-baqmxAt8YHg/UMRuNx6uNdI/AAAAAAAAD1s/TzmvfnYyP8E/s1600/rick-astely.gif"
    sidepanel.append("input").attr("type", "button")
    .attr("value", "X").attr("onclick", "hideSidePanel()");
    sidepanel.append("div")
    sidepanel.append("img").attr("src", src).attr("width", Math.max(parseInt(d3.select(".side-panel").style("width")),width*0.3));
    sidepanel.append("h1").text(d.id);
    sidepanel.append("span").classed('justified', true).text("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac nibh ut ligula faucibus tempus. Nunc maximus a nisl eu ultricies. Phasellus quam sapien, vestibulum a purus ac, ullamcorper eleifend nulla. Nullam vel felis finibus, porta est ac, dapibus urna. Nulla dapibus rhoncus est, ut euismod odio maximus et. Suspendisse ac odio quis arcu egestas posuere ut a elit. Morbi posuere maximus accumsan. Aenean nunc massa, volutpat nec maximus sit amet, egestas eget orci. Donec vehicula blandit erat, ac venenatis massa.");
}

function hideSidePanel() {
    let sidepanel = d3.select(".side-panel");
    sidepanel.selectAll("*").remove();
}

// dropdown selection
d3.select('#opts')
.on('change', function() {
    let selectValue = d3.select('#opts').property('value')
    console.log(selectValue);
    read(selectValue);
});
