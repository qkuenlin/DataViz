function startHelp() {
    Reset();
    let intro = introJs();
    intro.setOptions(helper);
    intro.setOption("tooltipPosition", "top");
    intro.onafterchange(function(targetElement) {
        console.log(intro);
        if(intro._currentStep == 7) { //click on node in curcular view
            if(!hasClickedHelp) {
                intro.goToStep(7);
            }
            hasClickedHelp = false;
        }
        if(intro._currentStep == 8) { //click on node in bubble view
            if(!hasClickedHelp) {
                hasClickedHelp = true
                intro.goToStep(8);
            }
            hasClickedHelp = false;
        }
        if(intro._currentStep == 13) { //click on axis switch view
            if(!document.getElementById("CustomAxisSwitch").checked) {
                intro.goToStep(13);
            }
        }
        if(intro._currentStep == 15) { //do search
            if(!searchDoneHelp) {
                intro.goToStep(15);
            }
        }
    })
    intro.on
    intro.start()
}

let helper ={
    steps: [
        {
            hideprev: true,
            intro: "Welcome to our Movie Database visualisation.<br>"+
                "This short interaction will show you how to use it.<br>"+
                "You can navigate between the message with the buttons or using the keyboard arrows.<br>"+
                "You can close it by clicking outside of the focused area or hitting the ESC key.<br>"+
                "At any time you can restart it by clicking on the red Demo button on the top right of the window.<br>"+
                "Enjoy :)"
        },
        {
            element: document.querySelector("#info-panel"),
            disableInteraction: true,
            intro: "At first, here is some numbers about our dataset..."
        },
        {
            element: document.querySelector("#main-panel"),
            disableInteraction: true,
            intro: "This is the main visualisation panel where you will be able to see the movies (nodes) and the link between them! Two movies are linked if they have cast member or crew member in common.<br>" +
            " For now, you can see a general overview of the movies and their link. To know the movies, put your mouse over a node.<br>" +
            " Before we play with the viz... let's have a look at the filters!"
        },
        {
            element: document.querySelector("#filters"),
            disableInteraction: true,
            intro: "These are the filters - They narrow down the set of displayed movies based on several criterias."
        },
        {
            element: document.querySelector("#department-filter"),
            disableInteraction: true,
            intro: "Here you can specify the kind of link you want to visualize"
        },
        {
            element: document.querySelector("#CircularVizOptions"),
            disableInteraction: true,
            intro: "Here you can change the grouping type of the circular layout"
        },
        {
            element: document.querySelector("#main-panel"),
            intro: "Ok now, let's try to <strong><big>click on a node!</big></strong>"
        },
        {
            element: document.querySelector("#main-panel"),
            intro: "As you can see, the movie you selected is a bigger node and the movies linked to it are also shown.<br>" +
            "<strong><big>Click on another (small) node</big></strong> to add it to the selection and see his links too."
        },
        {
            element: document.querySelector("#info-panel"),
            intro: "When you select a movie, you can see his general info on the right.<br>"+
            "By clicking on a production company, you can filter the movies. The currently selected company will appear bellow the filters, you can click it again to remove the filters.<br>"+
            "Some companies have produced only a very small amount of movies, hence it can reduce the selection to only one movie."
        },
        {
            element: document.querySelector("#side-panel"),
            disableInteraction: true,
            intro: "Here you will see the cast and crew of the selected movie, and the other movies where they participated.<br>" +
            "You can click on a movie to select it.<br>" +
            "You click on a person to search all the movies related to him."
        },
        {
            element: document.querySelector("#filters"),
            disableInteraction: true,
            intro: "As you can see, the filters are slithly different."
        },
        {
            element: document.querySelector("#on-click-toggle"),
            intro: "By switching this toggle, we will be able to close nodes on the main visualization instead of displaying its informartion"
        },
        {
            element: document.querySelector("#MovieVizOptions"),
            intro: "By switching this toggle, you will change the layout for the main visualization to have a scatter plot!<br>" +
            "<strong><big>Try it!!</big><strong>"
        },
        {
            element: document.querySelector("#CustomAxisSelector"),
            intro: "You can set what you want for the X and Y axis!"
        },
        {
            element: document.querySelector("#SearchBar"),
            intro: "You can also search movies by title, keywords and person! Be careful to be precise enougth in the search and don't forget that the filters will be applied too!!<br>"+
            "<strong><big>Try it!</big></strong>"
        },
        {
            element: document.querySelector("#info-panel"),
            intro: "The result are displayed here!<br>"+
            "If you see no result at all, try to change the filters and/or remove the company filter."
        },
        {
            element: document.querySelector("#restButton"),
            intro: "You can go back to the circular view at any time by clicking this button."
        },
        {
            intro: "I think you saw the features!! Now just enjoy the Viz :)"
        },

    ]
};
