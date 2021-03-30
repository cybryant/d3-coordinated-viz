//d3 demo main.js March 29, 2021//

//execute script when window is loaded
window.onload = function(){
    
    //SVG dimension variables
    var w = 900, h = 500;    
    
    //container block
    var container = d3.select("body") //get the <body> element from the DOM

        .append("svg") //put a new svg in the body
        .attr("width", w) //assign the width
        .attr("height", h) //assign the height
        .attr("class", "container") //assigning a class (same as the block name) for styling and future selection
        .style("background-color", "rgba(0,0,0,0.2)");    
    
    //innerRect block
    var innerRect = container.append("rect") //put a new rectangle in the svg
        .datum(400)
        .attr("width", function(d){ //rectangle width
            return d * 2; 
        }) 
        .attr("height", function (d){ //rectangle height
            return d; 
        }) 
    .attr("class", "innerRect") //class name
    .attr("x", 50) //position from the left on the horizontal axis
    .attr("y", 50) //position from the top on the y axis
    .style("fill", "#FFFFFF"); //fill color

    
/***** USING SIMPLE CIRCLES EXAMPLE DATA   
    //creating data array for building circles
    var dataArray = [10, 20, 30, 40, 50];
    
    //create circles container and feed it the data array
    var circles = container.selectAll(".circles") //creates an empty container to hold future circles
        .data(dataArray)
        .enter() //joins the data to the "circles" selection, creating an array of placeholders, one markup element per data value in the array; everything after here works like a loop for each datum
        .append("circle") //add a circle for each datum
        .attr("class", "circles") //apply class name to all circles
        .attr("r", function(d,i){ //circle radius
            console.log("d:", d, "i:", i); //let's take a look at d & i
            return d;
        })
        .attr("cx", function(d, i){ //x coordinate
            return 70 + (i * 180);
        })
        .attr("cy", function(d){ //y coordinate
            return 450 - (d * 5);
        });
****END SIMPLE CIRCLES EXAMPLE */

    
//USING CITYPOP DATA
    //creating data array for building circles
    var cityPop = [
        { 
            city: 'Madison',
            population: 233209
        },
        {
            city: 'Milwaukee',
            population: 594833
        },
        {
            city: 'Green Bay',
            population: 104057
        },
        {
            city: 'Superior',
            population: 27244
        }
    ];    
    
    //create linear scale based on min/max index values to space circles along horizontal axis
    var x = d3.scaleLinear() //create the scale; x is a 'scale generator'
        .range([90, 750]) //output min and max
        .domain([0, 3]); //input min and max
    
 
    //find the minimum value of the array
    var minPop = d3.min(cityPop, function(d){
        return d.population;
    });
    
    //find the maximum value of the array
    var maxPop = d3.max(cityPop, function(d){
        return d.population
    });
    
    //create scale for circles' center y coordinate based in min/max population
    var y = d3.scaleLinear()
        .range([450, 50]) //min & max are reversed since [0,0] is in upper left corner (was 440, 95, but adjusted to align y-axis label with graph)
        .domain([0, 700000]); //was minPop, maxPop; adjusted to make y-axis labels make sense
    
    //create a color scale generator based on min/max population
    var color = d3.scaleLinear()
        .range([
            "#FCBE85",
            "#D94701"
        ])
        .domain([
            minPop,
            maxPop
        ]);    
        
    //create circles variable and feed it the data array
    var circles = container.selectAll(".circles") //create an empty selection to hold future circles
        .data(cityPop) //feed in the array
        .enter() //join the data to the "circles" selection, creating an array of placeholders, one markup element per data value in the array; everything after here works like a loop for each datum
        .append("circle") //add a circle for each datum
        .attr("class", "circles") //apply class name to all circles
        .attr("id", function(d){
            return d.city;
        })
        .attr("r", function(d){ 
            //calculate the radius based on population value as circle area
            var area = d.population * 0.01;
            return Math.sqrt(area/Math.PI);
        })
        .attr("cx", function(d, i){ 
            //use scale generator with the index to place each circle horizontally
            return x(i);
        })
        .attr("cy", function(d){ 
            //reference 'y' scale variable to place circles along vertical scale access
            return y(d.population);
        })
        .style("fill", function(d,i){ //add a fill based on the color scale generator
            return color(d.population);
        })
        .style("stroke", "#000"); //black circle stroke
    
    //create y axis generator
    var yAxis = d3.axisLeft(y)
        .scale(y);
    
    //create axis g element and add axis
    var axis = container.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(50,0)")
        .call(yAxis); //shortcut for "yAxis(axis)"
    
    //create a text element and add the title
    var title = container.append("text")
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .attr("x", 450)
        .attr("y", 30)
        .text("City Populations");
    
    //create circle labels
    var labels = container.selectAll("labels")
        .data(cityPop)
        .enter()
        .append("text")
        .attr("class", "labels")
        .attr("y", function(d){
            //vertical position centered on each circle
            return y(d.population);    
        });    
    
    //first line of label
    var nameLine = labels.append("tspan")
        .attr("class", "nameLine")
        .attr("x", function(d,i){
            //horizontal position to the right of each circle
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) +5;
        })
        .text(function(d){
            return d.city;
        });
    
    //create format generator
    var format = d3.format(",");
    
    //second line of label
    var popLine = labels.append("tspan")
        .attr("class", "popLine")
        .attr("x", function(d,i){
            //horizontal position to the right of each circle
            return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) +5;
        })
    .attr("dy", "15") //vertical offset
        .text(function(d){
            return "Pop. " + format(d.population); //use format generator to format numbers with commas
        });    
    
}; //End window onload function



//        console.log(container);