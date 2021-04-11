//Geog575 d3 lab April 11, 2021; Cherie Bryant//

//wrap everything into a self-executing anonymous function to move attribute variables to local scope
(function(){

var attrArray = ["Fast Food Restaurants per Million People", "Vegan Restaurants per Million People", "Vegetarian Restaurants per Million People", "Restaurants with Vegetarian Options per Million People", "Total Vegan/Vegetarian/Vegetarian Option Restaurants per Million People", "Percentage of Population that is Obese", "Heart Disease Deaths per Million People"];

var expressed = attrArray[0]; //initial attribute

//chart frame dimensions
var chartWidth = window.innerWidth * 0.45,
    chartHeight = 490,
    leftPadding = 33,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")"; 

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
        height = 473;    
    
    //create SVG container block
    var container = d3.select("body") //get the <body> element from the DOM
        .append("svg") //put a new svg in the body
        .attr("width", width) //assign the width
        .attr("height", height) //assign the height
        .attr("class", "container"); //assigning a class (same as the block name) for styling and future selection
        //.style("border", "rgba(0,0,0,0.2)");
    
    //create Albers equal area conic projection centered on the US
	var projection = d3.geoAlbersUsa()
        //.center([-6, 40 ])
        //.rotate([90.09, 0.00, 0])
        //.parallels([34.05, 32.37])
        .scale(1000)
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
        
        //console.log(restCDCdata);
        //console.log(states);

        //translate states TopoJson to GeoJson
        var usStates = topojson.feature(states, states.objects.states19).features;
        
        //console.log(usStates);
        
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
    //console.log(usStates);
    return usStates;
}; //end joinData()

    
//create color scale generator
function makeColorScale(data){
    //set color classes
    var colorClasses =[
        "#edf8fb",
        "#b3cde3",
        "#8c96c6",
        "#8856a7",
        "#810f7c"        
    ];
    
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
            return choropleth(d.properties, colorScale)
        })
        .on("mouseover", function(d){
            highlight(d.currentTarget.__data__.properties);
        })
        .on("mouseout", function(d){
            dehighlight(d.currentTarget.__data__.properties);
        })
        .on("mousemove", moveLabel);

    //add style descriptor for each path to be used by dehighlight()
    var desc = stateGeog.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
}; //end setEnumerationUnits()  
    
    
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
    
    //set bars for each state
    var bars = chart.selectAll(".bar")
        .data(restCDCdata)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.STUSPS;
        })
        .attr("width", chartInnerWidth / restCDCdata.length - 1)
        .on("mouseover", function(d){
            highlight(d.currentTarget.__data__);
        })
        .on("mouseout", function(d){
            dehighlight(d.currentTarget.__data__);
        })
        .on("mousemove", moveLabel);    

    //add style descriptor to each rectangle to be used by dehighlight()
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');
    
    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    
    //create a text element for the dynamic chart title
    var chartTitle = chart.append("text")
        .attr("x", "50%")
        .attr("text-anchor", "middle")
        .attr("y", 15)
        .attr("class", "chartTitle")
        .text(expressed);     
    
    //set bar positions, heights, and colors
    updateChart(bars, restCDCdata.length, colorScale);
}; //end setChart()
    
    
//***CAN MOVE LOCATION IN style.css    
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
    
    //change yscale dynamically
    csvmax = d3.max(restCDCdata, function(d) {
        return parseFloat(d[expressed]);
    });
    yScale = d3.scaleLinear()
        .range([chartHeight - 10, 0])
        .domain(([0, csvmax]));  //CHANGE UPPER ySCALE NUMBER HERE
    
    //update vertical axis
    d3.select(".axis").remove();
    var yAxis = d3.axisLeft()
        .scale(yScale);
    
    //place axis
    var axis = d3.select(".chart")
        .append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);
    
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
    var bars = d3.selectAll(".bar")
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
}; //end changeAttributes()
    

//set position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
        return i * (chartInnerWidth / n) +leftPadding;
    })
        //size/resize bars
        .attr("height", function(d, i) {
            return (chartHeight - 10) - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function (d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
    });
    
    var chartTitle = d3.select(".chartTitle")
        .text(expressed);
    
}; //end updateChart()

    
//highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.STUSPS)
        .style("stroke", "red")
        .style("stroke-width", "3");
    
    setLabel(props);
};
    
    
//reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.STUSPS)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });
    
    //remove info label
    d3.select(".infolabel")
        .remove();
    
    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();
        
        var styleObject = JSON.parse(styleText);
        
        return styleObject[styleName];
    };
}; //end dehighlight()
    

//create a dynamic label on mouseover
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] + "</h1><b>" + expressed + "</b>";
    
    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.STUSPS + "_label")
        .html(labelAttribute);
    
    var stateName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.NAME);
}; //end setLabel()
    

//move info label with mouse
function moveLabel(event){
    
    //get wideth of the label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;
    
    //use coordinates of mousemove event to set label coordinates
    var x1 = event.clientX + 10,
        y1 = event.clientY - 75,
        x2 = event.clientX - labelWidth - 10,
        y2 = event.clientY + 25;
    
    //horizontal label coordinate, testing for overflow
    var y = event.clientY < 223 ? y2 : y1; //it appears "? y2 : y1" is shorthand for 'if/then'; if the statement before "?" is true then "y" value is y2, if the statement is false then "y" value is y1    
    var x = event.clientX > window.innerWidth - labelWidth - 30 ? x2 : x1;
    
    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
}; //end moveLabel()
    
})(); //end anonymous wrapper function





































