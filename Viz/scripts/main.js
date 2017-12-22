
//Load the data and setup the data structures
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
            UISetup();
            displayDBInfo();
            ClusterType = d3.select('#ClusterOptions').property('value');
            document.getElementById('CustomAxisSelector').style.display = "none";
            filterAll();
            document.getElementById('demoButton').click();
        })
    });
});
