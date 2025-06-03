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

const SVG_WIDTH = 270;
const SVG_HEIGHT = 300;
const TRANSITION_TIME = 10; // ms
const m = 1;
const dt = 0.005;
const FRAME_RATE = 10; // ms
const x_initial = 20;
const y_initial = 100;
const h_i = 1;
const g = 9.8;
const end_time = Math.sqrt(2*h_i/g);
const p_initial = parseInt(document.getElementById("p-slider").value);
const range_pmin = parseInt(document.getElementById("p-slider").min);
const range_pmax = parseInt(document.getElementById("p-slider").max);



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
    var minus_kinetic_energy_data = [];
    var minus_potential_energy_data = [];
    var kinetic_minus_potential_energy_data = [];
    var kinetic_plus_potential_energy_data = [];
    var kinetic2_minus_potential2_energy_data = [];
    var kinetic2_plus_potential2_energy_data = [];
    var kinetic_derivative_data = [];
    var potential_derivative_data = [];
    var t = -end_time;
    while (t <= end_time) {
        let KE = (1/2) * m * ((1 + p) * (g * t)) ** 2;
        let PE = m * g * (1 + p) * (h_i - (1/2) * g * t**2)
	let nKE = -KE
        let nPE = -PE
        let KEmPE = KE - PE
        let KEpPE = KE + PE
        let KE2mPE2 = KE**2 - PE**2
        let KE2pPE2 = KE**2 + PE**2
        let dKE = m * ((1 + p) * (g * t));
        let dPE = m * g * (1 + p) * (-g * t);
        kinetic_energy_data.push({"x": Math.round(t * 10000) / 10000, "y": KE});
        potential_energy_data.push({"x": Math.round(t * 10000) / 10000, "y": PE});
	minus_kinetic_energy_data.push({"x": Math.round(t * 10000) / 10000, "y": nKE});
	minus_potential_energy_data.push({"x": Math.round(t * 10000) / 10000, "y": nPE});
        kinetic_minus_potential_energy_data.push({"x": Math.round(t * 10000) / 10000, "y": KEmPE});
        kinetic_plus_potential_energy_data.push({"x": Math.round(t * 10000) / 10000, "y": KEpPE});
        kinetic2_minus_potential2_energy_data.push({"x": Math.round(t * 10000) / 10000, "y": KE2mPE2});
        kinetic2_plus_potential2_energy_data.push({"x": Math.round(t * 10000) / 10000, "y": KE2pPE2});
        kinetic_derivative_data.push({"x": Math.round(t * 10000) / 10000, "y": dKE});
        potential_derivative_data.push({"x": Math.round(t * 10000) / 10000, "y": dPE});

        t += dt;
    }
    return {k: kinetic_energy_data, p: minus_potential_energy_data, 
	    nk: minus_kinetic_energy_data, np: potential_energy_data,
            kmp: kinetic_minus_potential_energy_data, k2mp2: kinetic2_minus_potential2_energy_data,
	    kpp: kinetic_plus_potential_energy_data, k2pp2: kinetic2_plus_potential2_energy_data,
            kd: kinetic_derivative_data, pd: potential_derivative_data};
}

// generate integral data
function integralData(){
    var ke = [];
    var pe = [];
    var nke = [];
    var npe = [];
    var k_minus_p = [];
    var k2_minus_p2 = [];
    var k_plus_p = [];
    var k2_plus_p2 = [];
    for (let p = range_pmin; p < range_pmax + 1; p++) {
        let pv = p / 100;

        let integral_KE = (1/6 * m * g**2 * (1 + pv)**2) * ((end_time)**3 - (-end_time)**3);
        let integral_PE = m * g * (1 + pv) * [h_i * (end_time - (-end_time)) - 1/6 * g * (end_time**3 - (-end_time)**3)];
        let integral_KE2 = 1/20 * m**2 * (1 + pv)**4 * g**4 * ((end_time)**5 - (-end_time)**5);
        let integral_PE2 = m**2 * g**2 * (1 + pv)**2 * (h_i ** 2 * ((end_time) - (-end_time)) - h_i * g * (1/3 * ((end_time)**3 - (-end_time)**3)) + 1/4 * g**2 * (1/5 * ((end_time)**5 - (-end_time)**5)));
        ke.push({"x": pv, "y": integral_KE});
        pe.push({"x": pv, "y": integral_PE});
        nke.push({"x": pv, "y": -integral_KE});
        npe.push({"x": pv, "y": -integral_PE});
        k_minus_p.push({"x": pv, "y": integral_KE - integral_PE});
        k_plus_p.push({"x": pv, "y": integral_KE + integral_PE});
        k2_minus_p2.push({"x": pv, "y": integral_KE2 - integral_PE2});
        k2_plus_p2.push({"x": pv, "y": integral_KE2 + integral_PE2});
    }
    return {k: ke, p: pe, nk: nke, np: npe, kmp: k_minus_p,
            kpp: k_plus_p, pmk: k2_minus_p2, nkmp: k2_plus_p2};
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
  domain: {lower: -0.4517, upper: 0.4517},  // domain of the plot
  xLabel: "Time",                 // x-axis label
  range: {lower: -40, upper: 40},   // range of the plot
  yLabel: "Energy (J)"};              // y-axis label

// the svg element is essentially saved as this const variable
const energy_plot = createPlot(energy_input);

// you can create new lines on the plot by following this template
var ke_line = energy_plot.svg.append("g").attr("id", "kinetic-energy-line").attr("visibility","visible");
var nke_line = energy_plot.svg.append("g").attr("id", "minus-kinetic-energy-line").attr("visibility","hidden");
var pe_line = energy_plot.svg.append("g").attr("id", "potential-energy-line").attr("visibility","visible");
var npe_line = energy_plot.svg.append("g").attr("id", "minus-potential-energy-line").attr("visibility","hidden");
var kmpe_line = energy_plot.svg.append("g").attr("id", "kinetic-minus-potential-energy-line").attr("visibility","hidden");
var kppe_line = energy_plot.svg.append("g").attr("id", "kinetic-plus-potential-energy-line").attr("visibility","hidden");
var k2mp2e_line = energy_plot.svg.append("g").attr("id", "kinetic2-minus-potential2-energy-line").attr("visibility","hidden");
var k2pp2e_line = energy_plot.svg.append("g").attr("id", "kinetic2-plus-potential2-energy-line").attr("visibility","hidden");

// DERIVATIVE OF ENERGY
const derivative_input = {
    divID: "#derivative-graph",
    svgID: "svg-for-derivative-plots",
    domain: {lower: -1, upper: 1},
    xLabel: "Time",
    range: {lower: -8, upper: 8},
    yLabel: "Derivative of Energy"};
const derivative_plot = createPlot(derivative_input);
var kd_line = derivative_plot.svg.append("g").attr("id", "kinetic-derivative-line");
var pd_line = derivative_plot.svg.append("g").attr("id", "potential-derivative-line");

// INTEGRAL OF ENERGY
const integral_input = {
    divID: "#integral-graph",
    svgID: "svg-for-integral-plots",
    domain: {lower: -2.5, upper: 1},
    xLabel: "p",
    range: {lower: -31, upper: 30},
    yLabel: "Integral of Energy (J/s)"};
const integral_plot = createPlot(integral_input);
var ki_line = integral_plot.svg.append("g").attr("id", "kinetic-integral-line").attr("visibility", "visible");
var pi_line = integral_plot.svg.append("g").attr("id", "potential-integral-line").attr("visibility", "hidden");
var nki_line = integral_plot.svg.append("g").attr("id", "negative-kinetic-integral-line").attr("visibility", "hidden");
var npi_line = integral_plot.svg.append("g").attr("id", "negative-potential-integral-line").attr("visibility", "visible");
var kmp_line = integral_plot.svg.append("g").attr("id", "k-minus-p-integral-line").attr("visibility", "hidden");
var pmk_line = integral_plot.svg.append("g").attr("id", "p-minus-k-integral-line").attr("visibility", "hidden");
var kpp_line = integral_plot.svg.append("g").attr("id", "k-plus-p-integral-line").attr("visibility", "hidden");
var nkmp_line = integral_plot.svg.append("g").attr("id", "minus-k-minus-p-integral-line").attr("visibility", "hidden");

// You can also create points on plots by following these templates
var ki_point = integral_plot.svg.append("circle")
.attr("id", "kinetic-integral-point").attr("r", 3).attr("fill", "red").attr("visibility", "visible");

var pi_point = integral_plot.svg.append("circle")
.attr("id", "potential-integral-point").attr("r", 3).attr("fill", "grey").attr("visibility", "hidden");

var nki_point = integral_plot.svg.append("circle")
.attr("id", "kinetic-integral-point").attr("r", 3).attr("fill", "lightsalmon").attr("visibility", "hidden");

var npi_point = integral_plot.svg.append("circle")
.attr("id", "potential-integral-point").attr("r", 3).attr("fill", "green").attr("visibility", "visible");

var kmpi_point = integral_plot.svg.append("circle")
.attr("id", "sum-integral-point").attr("r", 3).attr("fill", "blue").attr("visibility", "hidden");

var pmki_point = integral_plot.svg.append("circle")
.attr("id", "sum-integral-point").attr("r", 3).attr("fill", "cyan").attr("visibility", "hidden");

var kppi_point = integral_plot.svg.append("circle")
.attr("id", "sum-integral-point").attr("r", 3).attr("fill", "purple").attr("visibility", "hidden");

var nkmpi_point = integral_plot.svg.append("circle")
.attr("id", "sum-integral-point").attr("r", 3).attr("fill", "plum").attr("visibility", "hidden");

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
    let ki = integral_data["k"][p - range_pmin].y;
    let pi = integral_data["p"][p - range_pmin].y;
    let nki = integral_data["nk"][p - range_pmin].y;
    let npi = integral_data["np"][p - range_pmin].y;
    let kmpi = integral_data["kmp"][p - range_pmin].y;
    let pmki = integral_data["pmk"][p - range_pmin].y;
    let kppi = integral_data["kpp"][p - range_pmin].y;
    let nkmpi = integral_data["nkmp"][p - range_pmin].y;

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

    input = {
      data: data.nk,
      svg: energy_plot.svg,
      line: nke_line,
      xScale: energy_plot.xScale,
      yScale: energy_plot.yScale,
      color: "lightsalmon"};
 
    // plot the data
    plotData(input);

    input = {
      data: data.np,
      svg: energy_plot.svg,
      line: npe_line,
      xScale: energy_plot.xScale,
      yScale: energy_plot.yScale,
      color: "grey"};

    // plot the data
    plotData(input);

    input = {
      data: data.kmp,
      svg: energy_plot.svg,
      line: kmpe_line,
      xScale: energy_plot.xScale,
      yScale: energy_plot.yScale,
      color: "blue"};

    // plot the data
    plotData(input);

    input = {
      data: data.k2mp2,
      svg: energy_plot.svg,
      line: k2mp2e_line,
      xScale: energy_plot.xScale,
      yScale: energy_plot.yScale,
      color: "cyan"};

    // plot the data
    plotData(input);

    input = {
      data: data.kpp,
      svg: energy_plot.svg,
      line: kppe_line,
      xScale: energy_plot.xScale,
      yScale: energy_plot.yScale,
      color: "purple"};

    // plot the data
    plotData(input);


    input = {
      data: data.k2pp2,
      svg: energy_plot.svg,
      line: k2pp2e_line,
      xScale: energy_plot.xScale,
      yScale: energy_plot.yScale,
      color: "plum"};

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
        color: "lightsalmon"};
    plotData(input);

    // P
    var input = {
        data: integral_data.p,
        svg: integral_plot.svg,
        line: pi_line,
        xScale: integral_plot.xScale,
        yScale: integral_plot.yScale,
        color: "grey"}
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
        color: "cyan"};
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
        color: "plum"};
    plotData(input);
}

// initialize integral lines
plotIntegral();

// initialize integral points
plotIntegralPoints(p_initial);

/* This function changes the visibility of certain lines on the integral
graph when the check marks are clicked. It is relatively simple to understand */
function hide(id, point, line, otherline) {
    let on = document.getElementById(id).value;
    if (on == "off") {
        document.getElementById(id).value = "on";
        point.attr("visibility", "visible");
        line.attr("visibility", "visible");
        otherline.attr("visibility","visible");
    } else {
        document.getElementById(id).value = "off";
        point.attr("visibility", "hidden");
        line.attr("visibility", "hidden");
	otherline.attr("visibility","hidden");
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



document.addEventListener("DOMContentLoaded", function() {
    // Add event listeners for each solution button
    document.getElementById("solution-button-4").addEventListener("click", function() {
        toggleSolution("solution-container-4", this, "Show Solution", "Hide Solution");
    });

    document.getElementById("solution-button-5").addEventListener("click", function() {
        toggleSolution("solution-container-5", this, "Show Solution", "Hide Solution");
    });

    // Function to toggle solution visibility
    function toggleSolution(containerId, button, showText, hideText) {
        const solutionContainer = document.getElementById(containerId);
        if (solutionContainer.style.display === "none") {
            solutionContainer.style.display = "block";
            button.innerHTML = hideText;  // Change button text
        } else {
            solutionContainer.style.display = "none";
            button.innerHTML = showText;  // Change button text
        }
    }
});

// show/hide integral lines when a checkmark is clicked
document.getElementById("show-k").onchange = function() {
    hide("show-k", ki_point, ki_line,ke_line);
}

document.getElementById("show-nk").onchange = function() {
    hide("show-nk", nki_point, nki_line, nke_line);
}

document.getElementById("show-p").onchange = function() {
    hide("show-p", pi_point, pi_line,npe_line);
}

document.getElementById("show-np").onchange = function() {
    hide("show-np", npi_point, npi_line,pe_line);
}

document.getElementById("show-kpp").onchange = function() {
    hide("show-kpp", kppi_point, kpp_line,kppe_line);
}

document.getElementById("show-nkmp").onchange = function() {
    hide("show-nkmp", nkmpi_point, nkmp_line,k2pp2e_line);
}

document.getElementById("show-kmp").onchange = function() {
    hide("show-kmp", kmpi_point, kmp_line,kmpe_line);
}

document.getElementById("show-pmk").onchange = function() {
    hide("show-pmk", pmki_point, pmk_line,k2mp2e_line);
}

