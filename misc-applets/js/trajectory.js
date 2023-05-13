/* JavaScript is a pretty easy to learn language. 
Some common mistakes I ran into:
    - Don't forget semicolons and brackets!
    - Sometimes HTML sliders will give you strings instead of numbers, 
    so you might have to use the parseInt() function to convert a 
    slider's value into an integer
    - Use console.log() to print things to the console for debugging.
    I use Google Chrome on a Mac and can view lots of important things
    like the console and errors in the inspector (command + option + i). You should
    always leave the inspector open so you can see what errors are happening
    - Almost always declare variables with "var" (if the variable can change) or 
    "const" (if the value will stay constant). Don't use "let" unless you actually 
    know what it means */

/* SVG (scalable graphics vector) and CANVAS are types of HTML elements used for drawing.
SVGs images are sharp no matter how zoomed in you are, 
but they cannot handle as much data as a canvas.
A canvas draws pixel by pixel and is suited to handle lots of image data.
Here I use SVGs for graphing smooth curves (with the help of the library d3) 
and canvases for creating animations of physical systems.
You can also look at the HTML file to see where the canvases are. */


/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////

/* Keep your code organized! "Magic Numbers" are numbers in your code 
that would not make sense to someone who is not familiar with your code. 
Keep parameters like sizes of HTML elements, initial positions, 
etc in this section */

const CANVAS_WIDTH_1 = 170;
const CANVAS_WIDTH_2 = 380;
const CANVAS_HEIGHT = 280;
const SVG_WIDTH = 270;
const SVG_HEIGHT = 300;
const TRANSITION_TIME = 10; // ms
const dt = 0.01;
const FRAME_RATE = 10; // ms
const x_initial = 20;
const y_initial = 100;
const g = 2;
const p_initial = parseInt(document.getElementById("p-slider").value);
const range_p = parseInt(document.getElementById("p-slider").max);


/////////////////////////////////////////////////
/* CANVAS ANIMATIONS */
/////////////////////////////////////////////////

/* This section deals with all of the things that make the animations run
Back in the day, I used this website: https://www.w3schools.com/graphics/game_intro.asp
to learn how to animate a Canvas. Feel free to take a look */

/* This is the function we call to start an animation (in this case,
when the slider is moved on the HTML page). We want to create new projectiles 
that follow a path with the given p value and then start the animation */
function startAnimation(p) {
    // 1D projectiles
    param1D = new component(10, 10, "orange", CANVAS_WIDTH_1/3, y_initial, 1, p);
    actual1D = new component(10, 10, "purple", 2*CANVAS_WIDTH_1/3, y_initial, 2, p);

    // 2D projectiles
    param2D = new component(3, 3, "orange", x_initial, y_initial, 3, p);
    actual2D = new component(3, 3, "purple", x_initial, y_initial, 4, p);

    // start the animation
    animArea.start();
}

// wrapper function to end animations
function endAnimation() {
    animArea.stop();
}


/* Canvases plot pixel by pixel on an x-y grid where the origin is 
the upper left corner. To make things more convenient for us, we will
create transformation functions to allow us to work in a more normal 
convenient coordinate systems (maybe have the origin in the center of 
the canvas for example. These functions should take in coordinates in your 
coordinate system and transform them into the Canvas coordinate system 
Remember that the canvas x coordinate increases from left to right (which is normal),
but the y coordinates increase from top to bottom (which is the opposite 
of cartesian coordinates) */
function transformXCoord(x) {
    return x_initial + (x+1) * (CANVAS_WIDTH_2 - 3 * x_initial) / 2;
}

// parameterized coord -> canvas coord
function transformYCoord(y) {
    return CANVAS_HEIGHT - y_initial - y * (CANVAS_HEIGHT/2 - 2 * x_initial) / (2 * range_p/100);
}

/* This is the bulk of the information for the canvases. The animArea variable
is an Object in JavaScript (similar to a hashmap or a dictionary in Python). 
We can define variables and functions inside it */
var animArea = {
    panel1: document.getElementById("projectile-motion-canvas-1"),  // canvas element in HTML file
    panel2: document.getElementById("projectile-motion-canvas-2"),  // canvas element in HTML file
    start: function(){ // function to start the animation

        this.panel1.width = CANVAS_WIDTH_1;
        this.panel1.height = CANVAS_HEIGHT;
        this.context1 = this.panel1.getContext("2d");

        /* This "context" thing is just what you use to actually 
        render the 2D image drawing on the canvas
        Follow the code and it should not be a problem! */

        this.panel2.width = CANVAS_WIDTH_2;
        this.panel2.height = CANVAS_HEIGHT;
        this.context2 = this.panel2.getContext("2d");

        /* In this example, time is parameterized from -1 
        to 1, so we will set the initial time to -1 */
        this.time = -1;   

        /* The built-in setInterval() function takes in a function f (updateFrame) 
        and a number n (FRAME_RATE) and runs runs f every n milliseconds. This is how we 
        actually simulate the "animation". updateFrame updates the position of everything
        on the canvas a little and then redraws everything. */
        this.interval = setInterval(updateFrame, FRAME_RATE);


        // add text and ground to panel 2
        this.context2.font = "20px Arial";
        this.context2.fillText("Height vs Time", 10, 30);
        this.context2.fillStyle = "black";
        this.context2.fillRect(x_initial, transformYCoord(-0.05), CANVAS_WIDTH_2-40, 3);
        },
    clear : function() {

        /* clearRect(x,y,width,height) is essentially the erase function for a canvas. 
        It erases everything in the box from x to x+width and y to y+height (remember 
        that the +y direction is down!) */

        this.context1.clearRect(0, 0, this.panel1.width, this.panel1.height);
        // this.context2.clearRect(0, 0, this.panel2.width, this.panel2.height);
        }, 

    stop : function() {
        this.time = -1;

        /* The built-in clearInterval() function basically terminates the setInterva() function */
        clearInterval(this.interval); 
    },
}

/* This component thing is similar to defining a class in Python or Java.
We use it to create the objects that will move in our animation */
function component(width, height, color, x, y, type, p) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.color = color;
    this.x = x;
    this.y = y;
    this.p = p;

    /* This is the function that draws the projectiles using 
    the built-in fillRect() function. Notice how we set the context 
    to specify which canvas to draw on */
    this.update = function(){
        var ctx;
        if (this.type <= 2) {ctx = animArea.context1;}
        else {ctx = animArea.context2;}
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    /* This is the function that updates the projectile positions. 
    Notice how we use the transform() functions from above in order to
    plot things correctly on the canvas */
    this.newPos = function(t) {
        if (type == 1) {   // 1D parameterized path
            this.y = transformYCoord((1 + this.p) * (1 - t**2));
        } else if (this.type == 2) {   // 1D Newton's Laws path
            // y = v0 t - 0.5 g t**2     v0 = -2t(1+p) at t=-1
            t += 1
            this.y = transformYCoord(2 * (1 + this.p) * t - 0.5 * g * t ** 2);
        } else if (this.type == 3) {   // 2D parameterized path
            this.x = transformXCoord(t);
            this.y = transformYCoord((1 + this.p) * (1 - t**2));
        } else if (this.type == 4) {   // 2D Newton's Laws path
            this.x = transformXCoord(t);
            t += 1
            this.y = transformYCoord(2 * (1 + this.p) * t - 0.5 * g * t ** 2);
        }
    }
}

/* This updateFrame function is very important. It updates the position 
of everything on the canvas a little and then redraws everything */
function updateFrame() {
    // clear frame and update time
    // Note that the clear() function only erases the 1D panel
    animArea.clear();
    animArea.time += dt;

    // re-draw the ground on the left panel (1D)
    animArea.context1.fillStyle = "black";
    animArea.context1.fillRect(x_initial, transformYCoord(-0.05), CANVAS_WIDTH_1-40, 3);

    // update projectile positions (internally)
    param1D.newPos(animArea.time);
    actual1D.newPos(animArea.time);
    param2D.newPos(animArea.time)
    actual2D.newPos(animArea.time);

    // draw projectiles  with updated positions on the canvas
    param1D.update();
    actual1D.update();
    param2D.update();
    actual2D.update();

    // re-draw the text on the left panel (1D)
    animArea.context1.font = "20px Arial";
    animArea.context1.fillStyle = "black";
    animArea.context1.fillText("Projectile Motion", 10, 30);

    // end animation when t = 1
    if (animArea.time >= 1) {endAnimation();}
}

// run animation on load
startAnimation(p_initial);


/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

/* Here are the functions that generate the data used in various graphs.

IMPORTANT: the functions that actually create the graphs take data as an
Array of Objects i.e. [{x:0, y:0}, {x:1, y:2}, {x:2, y:4}]

Please use x and y as the keys in the Object, otherwise the graphing 
functions may not work

You can use the push() method to push an Object to an array

I like to generate all of the data in a single function (so we only need
one loop) and return all the data arrays in an object for easy access later
but how you approach it is up to you */

// generate energy data
function energyAndDerivativeData(p){
    var kinetic_energy_data = [];
    var potential_energy_data = [];
    var kinetic_derivative_data = [];
    var potential_derivative_data = [];
    var t = -1;
    while (t <= 1) {
        let KE = 2 * ((1 + p) * t) ** 2;
        let PE = -g * (1 + p) * (1 - t**2)
        let dKE = 4 * t * (1 + p) ** 2;
        let dPE = 2 * g * t * (1 + p);
        kinetic_energy_data.push({"x": Math.round(t * 10000) / 10000, "y": KE});
        potential_energy_data.push({"x": Math.round(t * 10000) / 10000, "y": PE});
        kinetic_derivative_data.push({"x": Math.round(t * 10000) / 10000, "y": dKE});
        potential_derivative_data.push({"x": Math.round(t * 10000) / 10000, "y": dPE});

        t += dt;
    }
    return {k: kinetic_energy_data, p: potential_energy_data, 
            kd: kinetic_derivative_data, pd: potential_derivative_data};
}

// generate integral data
function integralData(){
    var ke = [];
    var pe = [];
    var nke = [];
    var npe = [];
    var k_minus_p = [];
    var p_minus_k = [];
    var k_plus_p = [];
    var nk_minus_p = [];
    for (let p = -range_p; p < range_p + 1; p++) {
        let pv = p / 100;

        let integral_KE = 4 * (1 + pv)**2 / 3;
        let integral_PE = 8 * (1 + pv) / 3;

        ke.push({"x": pv, "y": integral_KE});
        pe.push({"x": pv, "y": integral_PE});
        nke.push({"x": pv, "y": -integral_KE});
        npe.push({"x": pv, "y": -integral_PE});
        k_minus_p.push({"x": pv, "y": integral_KE - integral_PE});
        k_plus_p.push({"x": pv, "y": integral_KE + integral_PE});
        p_minus_k.push({"x": pv, "y": integral_PE - integral_KE});
        nk_minus_p.push({"x": pv, "y": -integral_PE - integral_KE});
    }
    return {k: ke, p: pe, nk: nke, np: npe, kmp: k_minus_p,
            kpp: k_plus_p, pmk: p_minus_k, nkmp: nk_minus_p};
}

/* Since each integral data point is simply associated with a single slider value,
it is wise to precompute the integral data and store it in a constant variale */
const integral_data = integralData();


/////////////////////////////////////////////////
/* MASTER GRAPHING CAPABILITY */
/////////////////////////////////////////////////

/* This section consists of wrapper functions to help you graph easily.
It uses the d3 library, but you don't need to know how they work in order 
to get basic graphs */

// set the dimensions and margins of the graph
var margin = { top: 20, right: 20, bottom: 50, left: 50 },
  width = SVG_WIDTH - margin.left - margin.right,
  height = SVG_HEIGHT - margin.top - margin.bottom;

/* The plotData() function will update the lines on a graph with data.
It takes a single Object as an input, and that object contains all the information
necessary to update a plot (i.e. which plot to update, which line to update, color, etc.)
An example input is shown below:
var input = {
    data: integral_data.k,         // the data of the form [{x,y}, {x,y}, {x,y}]
    svg: integral_plot.svg,        // the svg element where the plot should go
    line: ki_line,                 // which line to update
    xScale: integral_plot.xScale,  // a function that converts the x data into svg coordinates
    yScale: integral_plot.yScale,  // a function that converts the y data into svg coordinates
    color: "red"}; */              // color for the line
function plotData(input) {

  // Update the line
  var u = input.line.selectAll(".line").data([input.data], d => input.xScale(d.x));

  u.enter()
    .append("path")
    .attr("class", "line")
    .merge(u)
    .transition()
    .duration(TRANSITION_TIME)
    .attr("d", d3.line()
        .x((d) => input.xScale(d.x))
        .y((d) => input.yScale(d.y))
    )
    .attr("fill", "none")
    .attr("stroke", input.color)
    .attr("stroke-width", 1.5);
}

/* The createPlot() function initializes the svg element for a graph 

*** All you need to do is create a <div> element in your HTML file ***

You can see some example inputs to the function below. I would just recommend
following this example code to see how everything works */
function createPlot(input) {
  // append the svg object to the body of the page
  var svg = d3
    .select(input.divID)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("id", input.divID)
    .attr("class", "plot")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // initialize an x-axis scaling function
  var xScale = d3.scaleLinear().domain([input.domain.lower, input.domain.upper]).range([0, width]);

  // add x-axis
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .attr("class", "myXaxis")
    .call(d3.axisBottom(xScale));

  // add x-axis label
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin.top + 20)
    .text(input.xLabel);

  // initialize a y-axis scaling function
  var yScale = d3.scaleLinear().domain([ input.range.lower, input.range.upper ]).range([height, 0]);
  
  // add y-axis
  svg.append("g")
    .attr("class","myYaxis")
    .call(d3.axisLeft(yScale));

  // add y-axis label
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -margin.top)
    .text(input.yLabel)

  return {svg: svg, xScale: xScale, yScale: yScale};
}

// ENERGY
const energy_input = {
  divID: "#energy-graph",         // the id of the <div> element in your HTML file where the plot will go
  svgID: "svg-for-energy-plots",  // what you want the svg element to be named (not super important)
  domain: {lower: -1, upper: 1},  // domain of the plot
  xLabel: "Time",                 // x-axis label
  range: {lower: -4, upper: 8},   // range of the plot
  yLabel: "Energy"};              // y-axis label

// the svg element is essentially saved as this const variable
const energy_plot = createPlot(energy_input);

// you can create new lines on the plot by following this template
var ke_line = energy_plot.svg.append("g").attr("id", "kinetic-energy-line");
var pe_line = energy_plot.svg.append("g").attr("id", "potential-energy-line");

// DERIVATIVE OF ENERGY
const derivative_input = {
    divID: "#derivative-graph",
    svgID: "svg-for-derivative-plots",
    domain: {lower: -1, upper: 1},
    xLabel: "Time",
    range: {lower: -8, upper: 8},
    yLabel: "Derivative of Energy (dt)"};
const derivative_plot = createPlot(derivative_input);
var kd_line = derivative_plot.svg.append("g").attr("id", "kinetic-derivative-line");
var pd_line = derivative_plot.svg.append("g").attr("id", "potential-derivative-line");

// INTEGRAL OF ENERGY
const integral_input = {
    divID: "#integral-graph",
    svgID: "svg-for-integral-plots",
    domain: {lower: -1, upper: 1},
    xLabel: "p",
    range: {lower: -12, upper: 12},
    yLabel: "Integral of Energy (dt)"};
const integral_plot = createPlot(integral_input);
var ki_line = integral_plot.svg.append("g").attr("id", "kinetic-integral-line").attr("visibility", "visible");
var pi_line = integral_plot.svg.append("g").attr("id", "potential-integral-line").attr("visibility", "visible");
var nki_line = integral_plot.svg.append("g").attr("id", "negative-kinetic-integral-line").attr("visibility", "hidden");
var npi_line = integral_plot.svg.append("g").attr("id", "negative-potential-integral-line").attr("visibility", "hidden");
var kmp_line = integral_plot.svg.append("g").attr("id", "k-minus-p-integral-line").attr("visibility", "hidden");
var pmk_line = integral_plot.svg.append("g").attr("id", "p-minus-k-integral-line").attr("visibility", "hidden");
var kpp_line = integral_plot.svg.append("g").attr("id", "k-plus-p-integral-line").attr("visibility", "hidden");
var nkmp_line = integral_plot.svg.append("g").attr("id", "minus-k-minus-p-integral-line").attr("visibility", "hidden");

// You can also create points on plots by following these templates
var ki_point = integral_plot.svg.append("circle")
.attr("id", "kinetic-integral-point").attr("r", 3).attr("fill", "red").attr("visibility", "visible");

var pi_point = integral_plot.svg.append("circle")
.attr("id", "potential-integral-point").attr("r", 3).attr("fill", "green").attr("visibility", "visible");

var nki_point = integral_plot.svg.append("circle")
.attr("id", "kinetic-integral-point").attr("r", 3).attr("fill", "red").attr("visibility", "hidden");

var npi_point = integral_plot.svg.append("circle")
.attr("id", "potential-integral-point").attr("r", 3).attr("fill", "green").attr("visibility", "hidden");

var kmpi_point = integral_plot.svg.append("circle")
.attr("id", "sum-integral-point").attr("r", 3).attr("fill", "blue").attr("visibility", "hidden");

var pmki_point = integral_plot.svg.append("circle")
.attr("id", "sum-integral-point").attr("r", 3).attr("fill", "blue").attr("visibility", "hidden");

var kppi_point = integral_plot.svg.append("circle")
.attr("id", "sum-integral-point").attr("r", 3).attr("fill", "purple").attr("visibility", "hidden");

var nkmpi_point = integral_plot.svg.append("circle")
.attr("id", "sum-integral-point").attr("r", 3).attr("fill", "purple").attr("visibility", "hidden");

/* This function plots my individual integral points on the 
integral graph. The xScale() and yScale() functions are automatically 
generated for you when you call the createPlot() function. */
function plotIntegralPoints(p) {
    // x-axis is control point cy
    ki_point.attr("cx", integral_plot.xScale(p));
    pi_point.attr("cx", integral_plot.xScale(p));
    nki_point.attr("cx", integral_plot.xScale(p));
    npi_point.attr("cx", integral_plot.xScale(p));
    kmpi_point.attr("cx", integral_plot.xScale(p));
    pmki_point.attr("cx", integral_plot.xScale(p));
    kppi_point.attr("cx", integral_plot.xScale(p));
    nkmpi_point.attr("cx", integral_plot.xScale(p));

    // y-axis is integral energy which we can access from our precomputed data
    p = Math.round(p * 100);
    let ki = integral_data["k"][p + range_p].y;
    let pi = integral_data["p"][p + range_p].y;
    let nki = integral_data["nk"][p + range_p].y;
    let npi = integral_data["np"][p + range_p].y;
    let kmpi = integral_data["kmp"][p + range_p].y;
    let pmki = integral_data["pmk"][p + range_p].y;
    let kppi = integral_data["kpp"][p + range_p].y;
    let nkmpi = integral_data["nkmp"][p + range_p].y;

    // set the circle's y-coord as the data y value
    ki_point.attr("cy", integral_plot.yScale(ki));
    pi_point.attr("cy", integral_plot.yScale(pi));
    nki_point.attr("cy", integral_plot.yScale(nki));
    npi_point.attr("cy", integral_plot.yScale(npi));
    kmpi_point.attr("cy", integral_plot.yScale(kmpi));
    pmki_point.attr("cy", integral_plot.yScale(pmki));
    kppi_point.attr("cy", integral_plot.yScale(kppi));
    nkmpi_point.attr("cy", integral_plot.yScale(nkmpi));
}

/////////////////////////////////////////////////
/* EVENT LISTENER FUNCTIONS */
/////////////////////////////////////////////////

/* This section holds a lot of the functions that I call when something happens
on the HTML page (ex. button click, slider change, etc). For example, when the slider
is moved, I want to update the energy plots, move the integral points, etc, and it's 
helpful to do these in nicely-named functions. Most of them are pretty self-explanatory 
and simply call the plotData() function from above */

// update energy plots
function plotEnergy(data) {

    // kinetic energy
    var input = {
      data: data.k,
      svg: energy_plot.svg,
      line: ke_line,
      xScale: energy_plot.xScale,
      yScale: energy_plot.yScale,
      color: "red"};
  
    // plot the data
    plotData(input);
  
    // potential energy
    input = {
      data: data.p,
      svg: energy_plot.svg,
      line: pe_line,
      xScale: energy_plot.xScale,
      yScale: energy_plot.yScale,
      color: "green"};
  
    // plot the data
    plotData(input);
}

// update derivative plots
function plotDerivative(data) {

    // prepare input
    var input = {
      data: data.kd,
      svg: derivative_plot.svg,
      line: kd_line,
      xScale: derivative_plot.xScale,
      yScale: derivative_plot.yScale,
      color: "red"};
  
    // plot the data
    plotData(input);
  
    // prepare input
    input = {
      data: data.pd,
      svg: derivative_plot.svg,
      line: pd_line,
      xScale: derivative_plot.xScale,
      yScale: derivative_plot.yScale,
      color: "green"};
  
    // plot the data
    plotData(input);
}

// create some initial data when page loads
const initial_data = energyAndDerivativeData(p_initial);

// initialize energy lines
plotEnergy(initial_data);

// initialize energy lines
plotDerivative(initial_data);

// integral plots initialized only on load
function plotIntegral() {
    // K
    var input = {
        data: integral_data.k,
        svg: integral_plot.svg,
        line: ki_line,
        xScale: integral_plot.xScale,
        yScale: integral_plot.yScale,
        color: "red"};
    plotData(input);

    // -K
    var input = {
        data: integral_data.nk,
        svg: integral_plot.svg,
        line: nki_line,
        xScale: integral_plot.xScale,
        yScale: integral_plot.yScale,
        color: "red"};
    plotData(input);

    // P
    var input = {
        data: integral_data.p,
        svg: integral_plot.svg,
        line: pi_line,
        xScale: integral_plot.xScale,
        yScale: integral_plot.yScale,
        color: "green"}
    plotData(input);

    // -P
    var input = {
        data: integral_data.np,
        svg: integral_plot.svg,
        line: npi_line,
        xScale: integral_plot.xScale,
        yScale: integral_plot.yScale,
        color: "green"}
    plotData(input);

    // K-P
    var input = {
        data: integral_data.kmp,
        svg: integral_plot.svg,
        line: kmp_line,
        xScale: integral_plot.xScale,
        yScale: integral_plot.yScale,
        color: "blue"};
    plotData(input);

    // P-K
    var input = {
        data: integral_data.pmk,
        svg: integral_plot.svg,
        line: pmk_line,
        xScale: integral_plot.xScale,
        yScale: integral_plot.yScale,
        color: "blue"};
    plotData(input);

    // K+P
    var input = {
        data: integral_data.kpp,
        svg: integral_plot.svg,
        line: kpp_line,
        xScale: integral_plot.xScale,
        yScale: integral_plot.yScale,
        color: "purple"};
    plotData(input);

    // -K-P
    var input = {
        data: integral_data.nkmp,
        svg: integral_plot.svg,
        line: nkmp_line,
        xScale: integral_plot.xScale,
        yScale: integral_plot.yScale,
        color: "purple"};
    plotData(input);
}

// initialize integral lines
plotIntegral();

// initialize integral points
plotIntegralPoints(p_initial);

/* This function changes the visibility of certain lines on the integral
graph when the check marks are clicked. It is relatively simple to understand */
function hide(id, point, line) {
    let on = document.getElementById(id).value;
    if (on == "off") {
        document.getElementById(id).value = "on";
        point.attr("visibility", "visible");
        line.attr("visibility", "visible");
    } else {
        document.getElementById(id).value = "off";
        point.attr("visibility", "hidden");
        line.attr("visibility", "hidden");
    }
}

/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

/* EVENT LISTENERS are built-in functions that monitor activity on an HTML page
Follow the templates and put function calls inside them for dynamic updating! */

// update energy curves when slider moves (on input)
document.getElementById("p-slider").oninput = function() {

    // get the new slider value AS A NUMBER using parseInt()
    let p = parseInt(document.getElementById("p-slider").value)/100;

    // print the value on the HTML page
    document.getElementById("print-p").innerHTML = p.toFixed(2);

    // generate new energy data
    const data = energyAndDerivativeData(p);

    // update plots
    plotEnergy(data);
    plotDerivative(data);
    plotIntegralPoints(p);
}

// run the animation the the slider stops moving (on change)
document.getElementById("p-slider").onchange = function() {

    // get the new slider value AS A NUMBER using parseInt()
    let p = parseInt(document.getElementById("p-slider").value)/100;

    // (if the user is moving the slider too much)
    // make sure to end any previously running animation before starting a new one
    endAnimation();
    startAnimation(p);
}

// show/hide integral lines when a checkmark is clicked
document.getElementById("show-k").onchange = function() {
    hide("show-k", ki_point, ki_line);
}

document.getElementById("show-nk").onchange = function() {
    hide("show-nk", nki_point, nki_line);
}

document.getElementById("show-p").onchange = function() {
    hide("show-p", pi_point, pi_line);
}

document.getElementById("show-np").onchange = function() {
    hide("show-np", npi_point, npi_line);
}

document.getElementById("show-kpp").onchange = function() {
    hide("show-kpp", kppi_point, kpp_line);
}

document.getElementById("show-nkmp").onchange = function() {
    hide("show-nkmp", nkmpi_point, nkmp_line);
}

document.getElementById("show-kmp").onchange = function() {
    hide("show-kmp", kmpi_point, kmp_line);
}

document.getElementById("show-pmk").onchange = function() {
    hide("show-pmk", pmki_point, pmk_line);
}

