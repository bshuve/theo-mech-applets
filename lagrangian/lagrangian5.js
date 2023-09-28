/* Parameters */
const SVG_WIDTH = 445;
const SVG_HEIGHT = 300;
const TRANSITION_TIME = 10; // ms
const dt = 0.002;
const end_time = 1;
const FRAME_RATE = 1; // ms
const x_initial = 20;
const y_initial = 100;
const m = 1;
const g = 2;
var p = parseFloat(document.getElementById("p-slider").value); // 0.0

/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

// generate Euler-Lagrange data
function ELData() {
  // create arrays of data for each plot

  // graph y and w param on same graph
  var y_data = [];
  var w_data = [];

  var t = 0.0001;

  while (t <= end_time) {
    // parametrize graphs
    let y = 1-t**p;
    let w = y**2;

    // push all data into arrays
    y_data.push({ "x": Math.round(t * 10000) / 10000, "y": y });
    w_data.push({ "x": Math.round(t * 10000) / 10000, "y": w });

    t += dt;
  }

  return {
    y: y_data,
    w: w_data,
    };
}

// set the dimensions and margins of the graph
var margin = { top: 20, right: 20, bottom: 50, left: 50 },
  width = SVG_WIDTH - margin.left - margin.right,
  height = SVG_HEIGHT - margin.top - margin.bottom;

function plotData(input) {
  // update the line
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

// initialize the svg element for a graph
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
  var yScale = d3.scaleLinear().domain([input.range.lower, input.range.upper]).range([height, 0]);

  // add y-axis
  svg.append("g")
    .attr("class", "myYaxis")
    .call(d3.axisLeft(yScale));

  // add y-axis label
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -margin.top + 15)
    .text(input.yLabel)
  
  return { svg: svg, xScale: xScale, yScale: yScale };
}

// y param
// dL/dy GRAPH
// this input format will be followed by each plot after this
const y_input = {
  divID: "#parameter-graph", // the id of the <div> element in your HTML file where the plot will go
  svgID: "svg-for-y-plot", // what you want the svg element to be named (not super important)
  domain: { lower: 0, upper: 1 }, // domain of the plot
  xLabel: "Time (s)", // x-axis label
  range: { lower: 0, upper: 1 }, // range of the plot
  yLabel: "y and w parameterization (Height)"// y-axis label
};              

// the svg element is essentially saved as this const variable
const y_plot = createPlot(y_input);

// graph each line on the plot
// dL/dy
var y_line = y_plot.svg.append("g").attr("id", "y-line").attr("visibility", "visible");

// d/dt(dL/dydot)
var w_line = y_plot.svg.append("g").attr("id", "w-line").attr("visibility", "visible");

// update plots
function plot(data) {
  // dL/dy
  var input = {
    data: data.y,
    svg: y_plot.svg,
    line: y_line,
    xScale: y_plot.xScale,
    yScale: y_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  // d/dt(dL/dydot)
  var input = {
    data: data.w,
    svg: y_plot.svg,
    line: w_line,
    xScale: y_plot.xScale,
    yScale: y_plot.yScale,
    color: "green"
  };

  // plot the data
  plotData(input);

}

// create some initial data when page loads
const initial_data = ELData();

// initialize Euler-Lagrange lines
plot(initial_data);

/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

/* This section holds the functions that I call when something happens
on the HTML page (ex. button click, slider change, etc). */

// these booleans store whether answers are being shown
// by default, all answers are hidden
var showAnswer1 = false;

function slider_update() {
  // updates global value for p
  p = parseFloat(document.getElementById("p-slider").value);
  document.getElementById("print-p").innerHTML = p.toFixed(1);
  const data = ELData();
  // update plots
  plot(data);
  endAnimation();
  startAnimation(p);
}

// checks if any sliders have been changed
document.getElementById("p-slider").oninput = function () {
  slider_update();
}
// shows the answer if the q1 button is clicked
document.getElementById("show-q1").addEventListener("click", function () {
  if (!showAnswer1) {
    showAnswer1 = true;
    document.getElementById("show-q1").innerHTML = "Hide Answer";
    document.getElementById("answer1").style.display = "block";
  } else {
    showAnswer1 = false;
    document.getElementById("show-q1").innerHTML = "Show Answer";
    document.getElementById("answer1").style.display = "none";
  }
});

document.getElementById(id)
    .addEventListener("mouseenter", function(event){
        //do stuff
    });