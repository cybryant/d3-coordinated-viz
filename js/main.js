//Geog575 d3 lab April 11, 2021; Cherie Bryant//

//wrap everything into a self-executing anonymous function to move attribute variables to local scope
(function(){

//pseudo-global attribute variables; create list to hold attributes
var attrArray = ["fastFdPerMil", "veganPerMil", "vegetPerMil", "vegetOptPerMil", "totVegPerMil", "obesityPerc", "heartDisDthsPerMil"];
var expressed = attrArray[0]; //initial attribute

//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 473,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")"; 

    //YSCALE DEFINITION FROM SETCHART FUNCTION
    //create a scale to size bars proportional to frame
    //var csvMax = d3.max(restCDCdata, function(d){
    //    return parseFloat(d[expressed]);
    //});
    //var yScale = d3.scaleLinear()
        //.range([0, chartHeight])
    //    .range([chartHeight - 10, 0])    
    //    .domain([0, csvMax + 20]);  

//create a scale to size bars proportional to frame and for axis    
var yScale = d3.scaleLinear()
    .range([463, 0]) //chart height minus 10   
    .domain([0, 650]); //zero to maximum csv value (rounded)    
    
//execute script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    
    //set map dimensions
    var width = window.innerWidth * 0.5, 
        height = 460;    
    
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
        .scale(700)
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
        setChart(restCDCdata, colorScale);
        
        //create dropdown menu
        createDropdown(restCDCdata);
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

    
//***NEED DIFFERENT/TOGGLE VIEW & SCALE WITH ALASKA & HAWAII
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
            return choropleth(d.properties, colorScale);
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
 //***INVESTIGATE IF THIS IS THE BEST SCALE TO USE
    
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
    

//test for data value and return color (helps if there is some features in the dataset do not have values)
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
}; //end choropleth()
    
//create coordinated bar chart
function setChart(restCDCdata, colorScale){
    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
    .append("svg")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("class", "chart");
    
    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);    
    
    //create a scale to size bars proportional to frame
    //var csvMax = d3.max(restCDCdata, function(d){
    //    return parseFloat(d[expressed]);
    //});
    //var yScale = d3.scaleLinear()
    //    //.range([0, chartHeight])
    //    .range([chartHeight - 10, 0])    
    //    .domain([0, csvMax + 20]);
    
    //set bars for each state
    var bars = chart.selectAll(".bars")
        .data(restCDCdata)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bars " + d.STUSPS;
        })
        .attr("width", chartInnerWidth / restCDCdata.length - 1);
    
        /*   
        .attr("x", function(d, i){
            return i * (chartInnerWidth / restCDCdata.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return chartHeight - 10 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })  
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });  
        */    
    
    
    //annotate bars with attribute value text (state abbreviations)
//UPDATE THIS TO ANGLE STATE ABBREVIATIONS
    var abbr = chart.selectAll(".abbr")
        .data(restCDCdata)
        .enter()
        .append("text")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "abbr " + d.STUSPS;
        })
//***ADD OR AMEND ATTRIBUTE TO ANGLE TEXT
        .attr("text-anchor", "middle");
    
        /*   
        .attr("x", function(d, i){
            var fraction = (chartInnerWidth / restCDCdata.length);
            return (i * fraction + (fraction -1) / 2) + leftPadding;
        })    
    
        .attr("y", function(d, i){
            return (yScale(parseFloat(d[expressed])) + topBottomPadding) + 10;
        })
        .text(function(d){
            return d.STUSPS; 
        });
        */    

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);
    
    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);    
    
    //create a text element for the dynamic chart title
//***NEED TO ADJUST VARIABLES TO MAKE SENSE
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Variable Name " + expressed + " per million people in each state");     
    
    //set bar positions, heights, and colors
    updateChart(bars, restCDCdata.length, colorScale);

}; //end setChart()
    
    
//***MOVE TO CORRECT LOCATION IN style.css    
//create dropdown for attribute selection
function createDropdown(restCDCdata){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, restCDCdata)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

//***UPDATE TO MORE USEFUL NAMES    
    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
}; //end createDropdown()

    
//dropdown change listener handler
function changeAttribute(attribute, restCDCdata){
    //change the expressed value
    expressed = attribute;
    
    //recreate the colorscale
    var colorScale = makeColorScale(restCDCdata);
    
    //recolor enumeration units
    var stateGeog = d3.selectAll(".stateGeog")
        .transition() //add animation
        .duration(1000) //specify animation duration
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });
    
    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bars")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){ 
            return i * 20 //20 ms delay for each bar to make them appear to rearrange themselves
        })
        .duration(500) //gives each bar 1/2 second to rearrange itself
    
    //set bar positions, heights, and colors
    updateChart(bars, restCDCdata.length, colorScale);    
    
    
        /*
        .attr("x", function(d, i){
            return i * (chartInnerWidth / restCDCdata.length) + leftPadding;
        })
        //resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
        */
}; //end changeAttributes()
    

//set position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
        return i * (chartInnerWidth / n) +leftPadding;
    })
        //size/resize bars
        .attr("height", function(d, i) {
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function (d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
    })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
    });
    
    var chartTitle = d3.select(".chartTitle")
        .text("Number of Variable " + expressed + " in each region");
    
}; //end updateChart()
    
    
})(); //end anonymous wrapper function


//*** CHECK MISSISSIPPI DATA FOR FAST FOOD RESTAURANTS
//***CHECK VEGAN VS VEGETARIAN DATA; OREGON SHOWING MORE VEGAN THAN VEGETARIAN










































