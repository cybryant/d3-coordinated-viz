//Geog575 d3 lab March, 2021; Cherie Bryant//

//execute script when window is loaded
window.onload = setMap();

//set up choropleth map
function setMap(){
    
    //set map dimensions
    var width = 900, height = 500;    
    
    //create SVG container block
    var container = d3.select("body") //get the <body> element from the DOM
        .append("svg") //put a new svg in the body
        .attr("width", width) //assign the width
        .attr("height", height) //assign the height
        .attr("class", "container") //assigning a class (same as the block name) for styling and future selection
        .style("background-color", "rgba(0,0,0,0.2)"); 
    
    //create Albers equal area conic projection centered on the US
	var projection = d3.geoAlbers()
        .center([-3.64, 38.15])
        .rotate([90.09, 0.00, 0])
        .parallels([34.05, 32.37])
        .scale(75)
        .translate([width / 2, height / 2]);
    
    var path = d3.geoPath()
        .projection(projection);
    
    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/restaurant_cdc_data.csv")); //load attribute data
    promises.push(d3.json("data/states_WGS84.topojson")); //load spatial data
    Promise.all(promises).then(callback);
    
	function callback(data){

        //create the attribute and spatial variables from 'promises'
		restCDCdata = data[0];
		states = data[1];
        
        console.log(restCDCdata);
        console.log(states);
        
        //translate states TopoJson to GeoJson
        var usStates = topojson.feature(states, states.objects.states_WGS84).features;
        
        console.log(usStates);
        
        //add US States to the map
        var stateGeog = container.selectAll(".stateGeog")
            .data(usStates)
            .enter()
            .append("path")
            .attr("class", function(d){
                return d.properties.STUSPS;
            })
            .attr("d", path);
    };

};  //End setMap function    