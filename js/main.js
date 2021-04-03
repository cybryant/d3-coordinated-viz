//Geog575 d3 lab April 11, 2021; Cherie Bryant//

//wrap everything into a self-executing anonymous function to move attribute variables to local scope
(function(){

//pseudo-global attribute variables; create list to hold attributes
var attrArray = ["fastFdPerMil", "veganPerMil", "vegetPerMil", "vegetOptPerMil", "totVegPerMil", "obesityPerc", "heartDisDthsPerMil"];
var expressed = attrArray[0]; //initial attribute

//execute script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    
    //set map dimensions
    var width = 1200, height = 600;    
    
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
        .scale(400)
        .translate([width / 2, height / 2]);
    
    var path = d3.geoPath()
        .projection(projection);
    
    //use Promise.all to parallelize asynchronous data loading
    var promises = [];
    promises.push(d3.csv("data/restaurant_cdc_data.csv")); //load attribute data
    promises.push(d3.json("data/states19.topojson")); //load spatial data
    Promise.all(promises).then(callback);
    
	function callback(data){

        //create the attribute and spatial variables from 'promises'
		restCDCdata = data[0];
		states = data[1];
        
        console.log(restCDCdata);
        console.log(states);

        
        //translate states TopoJson to GeoJson
        var usStates = topojson.feature(states, states.objects.states19).features;
        
        console.log(usStates);
                        
        //place graticule on the map
        //function setGraticule(container, path)
        //PLACEHOLDER
        
        //join csv data to GeoJSON enumeration units (states)
        usStates = joinData(usStates, restCDCdata);

        //create the color scale
        var colorScale = makeColorScale(restCDCdata);

        //add enumeration units (states) to the map
        setEnumerationUnits(usStates, container, path, colorScale);

        //add coordinated visualization to the map
        //setChart(csvData, colorScale);
    };

};  //End of setMap()    


//join the attribute data to the spatial data
function joinData(usStates, restCDCdata){
    
    //loop through csv data to assign each set of attribute values to geojson state
    for (var i=0; i<restCDCdata.length; i++){
        var csvState = restCDCdata[i]; //the current state
        var csvKey = csvState.STUSPS; //the CSV primary key
        
        //loop through geojson state to find correct state
        for (var a=0; a<usStates.length; a++){
            var geojsonProps = usStates[a].properties; //the current state geojson properties
            var geojsonKey = geojsonProps.STUSPS; //the geojson primary key
            
            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){
                
                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvState[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    };
    console.log(usStates);
    
    return usStates;
}; //end joinData()
    

//add enumeration units (states) to the map
function setEnumerationUnits(usStates, container, path, colorScale){
    var stateGeog = container.selectAll(".stateGeog")
        .data(usStates)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "stateGeog " + d.properties.STUSPS;
        })
        .attr("d", path)
        .style("fill", function(d){
            return colorScale(d.properties[expressed]);
        });
}; //end setEnumerationUnits()

    
//create color scale generator
function makeColorScale(data){
    //set color classes
    var colorClasses =[
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"        
    ];
    
/*    //create color scale generator - NATURAL
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);
    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };
    //cluster data using ckmeans clustering algorith to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();
    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);
*/
    
    //create color scale generator - QUANTILE
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);
    //build two-value array of minimum and maximum expressed attribute values
    var minmax = [
        d3.min(data, function(d) { return parseFloat(d[expressed]); }),
        d3.max(data, function(d) { return parseFloat(d[expressed]); })
    ];
    //assign two-value array as scale domain
    colorScale.domain(minmax);    

    return colorScale;    
}; //end makeColorScale()
    
    
    
    
    
    
})(); //end anonymous wrapper function













































