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


//display DB info inside side panel
function displayDBInfo() {
    tooltipDiv.style("opacity", 0)
    .style("left", (0) + "px")
    .style("top", (0) + "px");
    let stats = getDBStats();
    let div = d3.select(".TextZone");
    div.selectAll("*").remove();
    d3.select(".TitleZone").selectAll("*").remove()
    d3.select(".TitleZone")
    .append("h2").text("A few numbers ...");
    let list = div.append("ul").classed("justified", true);
    let elem = list.append("li");
    elem.append("span").classed("bigtext", true).text(all_movies.length.toString());
    elem.append("span").text(" movies.");
    elem = list.append("li");
    elem.append("span").classed("bigtext", true).text(people.length.toString());
    elem.append("span").text(" people.");
    elem = list.append("li");
    elem.append("span").classed("bigtext", true).text(all_people_movies_links.length.toString());
    elem.append("span").text(" links between movies and crews.");
    elem = list.append("li");
    elem.append("span").classed("bigtext", true).text(stats.vote_count.toString());
    elem.append("span").text(" votes.");
    elem = list.append("li");
    elem.append("span").classed("bigtext", true).text("Best score " + stats.max_vote.vote_average + "/10 ");
    elem.append("span").classed("textWithLink", true).text(stats.max_vote.title).on("click", function (d) {
        drawMovieViz(new Set().add(stats.max_vote), true);
        showMovieInfo(stats.max_vote);
    });
    elem = list.append("li");
    elem.append("span").classed("bigtext", true).text("" + (stats.max_rev.revenue).toLocaleString() + "$ ");
    elem.append("span").classed("textWithLink", true).text(stats.max_rev.title).on("click", function (d) {
        drawMovieViz(new Set().add(stats.max_rev), true);
        showMovieInfo(stats.max_rev);
    });
    elem.append("span").text(" : best revenues.")
    elem = list.append("li");
    elem.append("span").classed("bigtext", true).text("" + stats.max_budget.Budget.toLocaleString() + "$ ");
    elem.append("span").classed("textWithLink", true).text(stats.max_budget.title).on("click", function (d) {
        drawMovieViz(new Set().add(stats.max_budget), true);
        showMovieInfo(stats.max_budget);
    });
    elem.append("span").text(" : highest budget.")
    elem = list.append("li");
    elem.append("span").classed("bigtext", true).text(DateParse(new Date(stats.oldest.release_date)) + " ");
    elem.append("span").classed("textWithLink", true).text(stats.oldest.title).on("click", function (d) {
        drawMovieViz(new Set().add(stats.oldest), true);
        showMovieInfo(stats.oldest);
    });
    elem.append("span").text(" : oldest movie");
    elem = list.append("li");
    elem.append("span").classed("bigtext", true).text(DateParse(new Date(stats.youngest.release_date)) + " ");
    elem.append("span").classed("textWithLink", true).text(stats.youngest.title).on("click", function (d) {
        drawMovieViz(new Set().add(stats.youngest), true);
        showMovieInfo(stats.youngest);
    });
    elem.append("span").text(" : youngest movie");
    elem = list.append("li");
    elem.append("span").classed("bigtext", true).text("" + stats.longuest.runtime + " minutes.");
    elem.append("span").classed("textWithLink", true).text(stats.longuest.title).on("click", function (d) {
        drawMovieViz(new Set().add(stats.longuest), true);
        showMovieInfo(stats.longuest);
    });
    elem.append("span").text(" : longuest movie.");
    elem = list.append("li");
    elem.append("span").classed("bigtext", true).text((stats.tot_rev).toLocaleString() + "$")
    elem.append("span").text(" : the total revenue of the DB");
    elem = list.append("li");
    elem.append("span").classed("bigtext", true).text(minutes2String(stats.tot_runtime))
    elem.append("span").text(" : total length of the DB");

    Zoneheight = getHeight("#info-panel") - getHeight(".TitleZone")
    div.style("height", Zoneheight + 'px');
    div.style("overflow-y", "scroll");

    resizeContainers()

    // d3.select(".TitleZone2"),selectAll("*").remove();
    d3.select(".TitleZone2").select("h3").text("Number of movies by year!")

    let sidepanel2 = d3.select(".DrawZone");
    let svg = sidepanel2.select("#side-svg");
    svg.selectAll("*").remove();
    let svg_width = parseInt(d3.select("#side-panel").style("width")) - 30; //col padding is 2*15
    let svg_height = getHeight("#side-panel")*0.6;
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


function overCompany(company) {
    MovieNode.classed("node--highlight", function (d) {
        return d.production_companies.includes(company)
    });
    MovieNode.classed("node--fade", function (d) {
        return !d.production_companies.includes(company)
    });
    MovieLink.classed("link--highlight", function (d) {
        return d.source.production_companies.includes(company) && d.target.production_companies.includes(company);
    });
    MovieLink.classed("link--fade", function (d) {
        return !d.source.production_companies.includes(company) || !d.target.production_companies.includes(company);
    });
}

function outCompany(company) {
    MovieLink.classed("link--highlight", false).classed("link--fade", false);
    MovieNode.classed("node--highlight", false).classed("node--fade", false);
}

function getArrayFromString(str) {
    return str.substr(1, str.length - 2).replace(/'/g, "").split(", ")
}
function addRow(table, row1, row2) {
    let newRow = table.append("tr");
    newRow.append("th").attr("scope", "row").html(row1);
    newRow.append("td").classed("justified", true).html(row2);
}
function addRowArrWithOnClick(table, row, array, onclick) {
    let newRow = table.append("tr");
    newRow.append("th").attr("scope", "row").text(row);
    let td = newRow.append("td");
    for (let i = 0; i < array.length; i++) {
        if (i > 0) {
            td.append("span").text(", ");
        }
        td.append("span").classed("textWithLink", true)
        .text(array[i]).on("click", x=> onclick(array[i]))
        .on("mouseover", x=>overCompany(array[i]))
        .on("mouseout", x=>outCompany());
    }
}

let currentMovie;


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


function showMovieInfo(d) {
    currentMovie = d;

    MovieNode.classed("node--selected", function (n) {
        return n.id_movie == d.id_movie;
    });

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
    addRow(table, "URL", "<a href=\"https://www.themoviedb.org/movie/"+d.id_movie+"\"target=\"_blank\">"+d.title+" on tmdb</a>")
    let newRow = table.append("tr");
    newRow.append("td").classed("justified", true).attr("colspan", "2").text(d.overview);

    Zoneheight = getHeight("#info-panel") - getHeight(".TitleZone")


    textZone.style("height", Zoneheight + 'px');
    textZone.style("overflow-y", "scroll");

    d3.select(".TitleZone2").select("h3").text("Movies linked using crew members!")

    //resize draw zone
    resizeContainers();
    div = d3.select(".DrawZone")
        .style("height", getHeight("#main-viz")-getHeight(".TitleZone2")+"px")

    let tmp = getLinksForMovie(d);
    let crewIDs = tmp.crew;
    let moviesIDs = tmp.movies;
    let links = tmp.links;


    let margin = { top: 20, right: 10, bottom: 20, left: 5 };
    //svg legerement plus petit que ce que pourrait car enleve deja marges
    // let width = parseInt(div.style("width")) - 30 - margin.left - margin.right; //div.col has 2*15 of pad
    let height = getHeight("#side-panel") - margin.top - margin.bottom;

    let min_height = Math.max(crewIDs.length, moviesIDs.length) * 16; //text = 12, 4 margin
    if (height < min_height) {
        height = min_height;
    }

    let testDiv = d3.select(".TestDiv");
    let linkWidth = 200;
    let longuestCrewName = 0;
    crewIDs.forEach(function(d) {
        let crew = crewByID(d)
        testDiv.html(crew.name);
        let width = testDiv.node().getBoundingClientRect().width
        if (width > longuestCrewName) {
            longuestCrewName = width
        }
    })
    longuestCrewName = longuestCrewName +10

    let longuestMovieName = 0;
    moviesIDs.forEach(function(d) {
        let movie = mapMovie.get(d)
        testDiv.html(movie.title);
        let width = testDiv.node().getBoundingClientRect().width
        if (width > longuestMovieName) {
            longuestMovieName = width
        }
    })
    longuestMovieName = longuestMovieName +10

    let crewScale = d3.scaleLinear().range([0, height]).domain([0, crewIDs.length]);
    let crewX = longuestCrewName;
    let movieX = longuestCrewName + linkWidth;
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
    let width = longuestCrewName + linkWidth + longuestMovieName;
    svgcontainer//.attr("class", "background")
    .attr("width", width)
    .attr("height", height + margin.top + margin.bottom);

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
        MovieNode.classed("node--highlight", function (l) {
            return l.id_movie == currentMovie.id_movie || l.id_movie == d.target.id;
        })
        tooltipDiv
        .style("opacity", 9);
        tooltipDiv.text(d.value)
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 10) + "px");
        drawnLinks.classed("side-links--highlight", function (l) {
            return l.source.id == d.source.id && l.target.id == d.target.id;
        })
        crewNames.classed("text_highlight", function (l) {
            return l.id == d.source.id
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
    .on("mouseover", function (d) {
        tooltipDiv
        .style("opacity", 0)
        .style("left", (0) + "px")
        .style("top", (0) + "px");
        MovieLink.classed("link--fade", true);
        MovieNode.classed("node--fade", true);
        moviesName.classed("text_fade", true);
        drawnLinks.classed("side-links--highlight", function (l) {
            if (l.source.id == d.id) {
                MovieLink._groups[0].forEach(function (l2) {
                    if (l.target.id == l2.__data__.target.id_movie && currentMovie.id_movie == l2.__data__.source.id_movie ||
                        l.target.id == l2.__data__.source.id_movie && currentMovie.id_movie == l2.__data__.target.id_movie) {
                        MovieLink.filter(function (x) {
                            return x.target.id_movie == l2.__data__.target.id_movie &&
                            x.source.id_movie == l2.__data__.source.id_movie;
                        }).classed("link--highlight", true).classed("link--fade", false);
                    }
                })
                MovieNode._groups[0].forEach(function (n) {
                    if (l.target.id == n.__data__.id_movie || n.__data__.id_movie == currentMovie.id_movie) {
                        MovieNode.filter(function (x) {
                            return x.id_movie == n.__data__.id_movie;
                        }).classed("node--highlight", true).classed("node--fade", false);
                    }
                })
                moviesName.classed("text_highlight", function (m) {
                    if (m.id == l.target.id) {
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
        drawnLinks.classed("side-links--fade", function (l) {
            return l.source.id != d.id
        })
        crewNames.classed("text_highlight", function (l) {
            return l.id == d.id
        })
        crewNames.classed("text_fade", function (l) {
            return l.id != d.id
        })
    })
        .on("mouseout", function (d) {
            MovieLink.classed("link--highlight", false).classed("link--fade", false);
            MovieNode.classed("node--highlight", false).classed("node--fade", false);
            moviesName.classed("text_highlight", false).classed("text_fade", false);
            crewNames.classed("text_highlight", false).classed("text_fade", false);
            drawnLinks.classed("side-links--highlight", false).classed("side-links--fade", false);
        })
        .on("click", function (d) {
            cleanSearch();
            searchCrewID(d.id);
            tooltipDiv.style("opacity", 0)
            .style("left", (0) + "px")
            .style("top", (0) + "px");
        });

    moviesName = svg.append("g")
    .selectAll("text")
    .data(movies)
    .enter().append("text")
    .attr("text-anchor", "start")
    .attr("x", function (d) { return d.x; })
    .attr("y", function (d) { return d.y + 6; })
    .attr("class", "text_default")
    .text(function (d) { return mapMovie.get(d.id).title; })
    .on("click", function (d) {
        cleanSearch();
        let movie = mapMovie.get(d.id)
        tooltipDiv.style("opacity", 0);
        showMovieInfo(movie);
        drawMovieViz(new Set().add(movie), true);
    })
    .on("mouseover", function (d) {
        MovieNode.classed("node--fade", true);
        MovieLink.classed("link--highlight", function (l) {
            if (l.source.id_movie == d.id || l.target.id_movie == d.id) {
                MovieNode.filter(x=> x.id_movie == l.source.id_movie || x.id_movie == l.target.id_movie).classed("node--highlight", true).classed("node--fade", false);
                return true;
            } else {
                return false;
            }
        })
        MovieLink.classed("link--fade", function (l) {
            return !(l.source.id_movie == d.id || l.target.id_movie == d.id);
        })

        tooltipDiv
        .style("opacity", 0)
        .style("left", (0) + "px")
        .style("top", (0) + "px");
        crewNames.classed("text_fade", true)
        drawnLinks.classed("side-links--highlight", function (l) {
            if (l.target.id == d.id) {
                crewNames.classed("text_highlight", function (m) {
                    if (m.id == l.source.id) {
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
        drawnLinks.classed("side-links--fade", function (l) {
            return l.target.id != d.id
        })
        moviesName.classed("text_highlight", function (l) {
            return l.id == d.id
        })
        moviesName.classed("text_fade", function (l) {
            return l.id != d.id
        })
    })
    .on("mouseout", function (d) {
        MovieLink.classed("link--highlight", false).classed("link--fade", false);
        MovieNode.classed("node--highlight", false).classed("node--fade", false);
        moviesName.classed("text_highlight", false).classed("text_fade", false);
        crewNames.classed("text_highlight", false).classed("text_fade", false);
        drawnLinks.classed("side-links--highlight", false).classed("side-links--fade", false);
    });

    div.style("max-height", getHeight("#main-viz") + 'px');
    div.style("overflow-y", "scroll");
    div.style("overflow-x", "scroll")
}
