/* Parameters */
const CANVAS_WIDTH = parseInt(document.getElementById("ball-launch").getAttribute("width"));
const CANVAS_HEIGHT = parseInt(document.getElementById("ball-launch").getAttribute("height"));
const SVG_WIDTH = 445;
const SVG_HEIGHT = 300;
const TRANSITION_TIME = 10; // ms
const dt = 0.002;
const end_time = 10;
const FRAME_RATE = 1; // ms
const x_initial = 20;
var h = parseFloat(document.getElementById("h-slider").value); // 50
var a = -1 * parseFloat(document.getElementById("a-slider").value); // a = -g = -2
var m = parseFloat(document.getElementById("m-slider").value); // 10.0

/* Canvas Animation */
function startAnimation(y, m, a) {
  projectile = new component(3, 3, "purple", x_initial, y, m, a);
  animArea.start();
}

// wrapper function to end animations
function endAnimation() {
  animArea.stop();
}

/* Coordinate transformations */
function transformXCoord(x) {
  return (CANVAS_WIDTH * x) + 20;
}

function transformYCoord(y) {
  return -h - (CANVAS_HEIGHT / 2 * y) + 280;
}

var animArea = {
  panel: document.getElementById("ball-launch"),
  start: function () {
    this.panel.width = CANVAS_WIDTH;
    this.panel.height = CANVAS_HEIGHT;
    this.context = this.panel.getContext("2d");

    /* Set the initial time to 0 */
    this.time = 0;

    this.interval = setInterval(updateFrame, FRAME_RATE);

    // add text and ground to panel
    this.context.font = "18px Verdana";
    this.context.fillStyle = "black";
    this.context.fillText("Projectile Motion", 10, 30);
    this.context = this.panel.getContext("2d");
    this.context.fillStyle = "gray";
    this.context.fillRect(0, transformYCoord(0) - h, 25, 3);
    this.context.fillRect(25, transformYCoord(0) - h, -25, 300);
  },
  stop: function () {
    this.time = 0;
    // Terminate setInterval
    clearInterval(this.interval);
  },
}

/* Define component Objects */
function component(width, height, color, x, y, m, a) {
  this.width = width;
  this.height = height;
  this.color = color;
  this.x = x;
  this.y = y;
  this.m = m;
  this.a = a;

  /* This is the function that draws the projectiles using
  the built-in fillRect() function. */

  this.update = function () {
    var ctx = animArea.context;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  /* This is the function that updates the projectile positions.
  Notice the use of the transform() functions. */

  this.newPos = function (t) {
    this.x = transformXCoord(t);
    this.y = transformYCoord(0.5 * a * t ** 2) - y;
  }
}

/* This updateFrame function is very important. It updates the position
of everything on the canvas a little and then redraws everything */

function updateFrame() {
  animArea.time += dt;

  // update projectile position
  projectile.newPos(animArea.time)

  // draw projectile with updated position on the canvas
  projectile.update();

  // end animation when t = end_time
  if (animArea.time >= end_time) { endAnimation(); }
}

// run animation on load
startAnimation(h, m, a);

/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING ENERGY DATA */
/////////////////////////////////////////////////

// generate energy data
function EnergyData() {
  // create arrays of data for each plot
  // for y param
  var PE_y_data = [];
  var KE_ydot_data = [];
  var PE_yt_data = [];
  var KE_yt_data = [];

  // for w param, where w = y^2
  var PE_w_data = [];
  var KE_wdot_data = [];
  var PE_wt_data = [];
  var KE_wt_data = [];

  var t = 0;

  while (t <= end_time) {
    // parametrize graphs
    // for y param
    let y = 1 / 2 * a * t ** 2 + h;
    let v = a * t;
    let KE = 1 / 2 * (m * (v) ** 2); // kinetic energy T
    let PE = -m * a * y; // potential energy U
    let absPE = Math.abs(PE);

    // for w param, where w = y^2;
    let w = y**2;
    let wdot = 2 * y * v;
    let KEw = 1 / 2 * (m * (wdot ** 2)/(4 * w)); // kinetic energy T
    let PEw = -m * a * Math.sqrt(w); // potential energy U

    // push all data into arrays
    // for y param
    if (PE >= 0) {
      PE_y_data.push({ "x": y, "y": PE });
    }
    KE_ydot_data.push({ "x": v, "y": KE });
    PE_yt_data.push({ "x": Math.round(t * 10000) / 10000, "y": absPE });
    KE_yt_data.push({ "x": Math.round(t * 10000) / 10000, "y": KE });

    // for w param
    PE_w_data.push({ "x": w, "y": PEw });
    if (wdot <= 0) {
      KE_wdot_data.push({ "x": wdot, "y": KEw });
    }
    PE_wt_data.push({ "x": Math.round(t * 10000) / 10000, "y": PEw });
    KE_wt_data.push({ "x": Math.round(t * 10000) / 10000, "y": KEw });
    t += dt;

  }

  return {
    // for y param
    PEy: PE_y_data,
    KEy: KE_ydot_data,
    PEyt: PE_yt_data,
    KEyt: KE_yt_data,

    // for w param
    PEw: PE_w_data,
    KEw: KE_wdot_data,
    PEwt: PE_wt_data,
    KEwt: KE_wt_data

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
    .attr("x", -margin.top)
    .text(input.yLabel)

  return { svg: svg, xScale: xScale, yScale: yScale };
}

// PE vs. y GRAPH
// this input format will be followed by each plot after this
const PE_y_input = {
  divID: "#PE-y-graph", // the id of the <div> element in your HTML file where the plot will go
  svgID: "svg-for-PE-y-plot", // what you want the svg element to be named (not super important)
  domain: { lower: 0, upper: 10 }, // domain of the plot
  xLabel: "y Position (m)", // x-axis label
  range: { lower: 0, upper: 100 }, // range of the plot
  yLabel: "Potential Energy (J)"// y-axis label
};              

// the svg element is essentially saved as this const variable
const PE_y_plot = createPlot(PE_y_input);

// graph each line on the plot
// PE y param line
var PE_y_line = PE_y_plot.svg.append("g").attr("id", "PE-y-line").attr("visibility", "visible");

// PE vs. w GRAPH
const PE_w_input = {
  divID: "#PE-w-graph",
  svgID: "svg-for-PE-w-plot",
  domain: { lower: 0, upper: 10 },
  xLabel: "w Position (m)",
  range: { lower: 0, upper: 100 },
  yLabel: "Potential Energy (J)"
};              

const PE_w_plot = createPlot(PE_w_input);

// PE w param line
var PE_w_line = PE_w_plot.svg.append("g").attr("id", "PE-w-line").attr("visibility", "visible");

// KE vs. ydot GRAPH
const KE_ydot_input = {
  divID: "#KE-ydot-graph", 
  svgID: "svg-for-KE-ydot-plot", 
  domain: { lower: -20, upper: 0 }, 
  xLabel: "\u1E8F Velocity (m/s)", 
  range: { lower: 0, upper: 200 }, 
  yLabel: "Kinetic Energy (J)"
};              

const KE_ydot_plot = createPlot(KE_ydot_input);

// KE y param line
var KE_ydot_line = KE_ydot_plot.svg.append("g").attr("id", "KE-ydot-line").attr("visibility", "visible");

// KE vs. wdot GRAPH
const KE_wdot_input = {
  divID: "#KE-wdot-graph",
  svgID: "svg-for-KE-wdot-plot",
  domain: { lower: -1600, upper: 0 },
  xLabel: "\u1E87 Velocity (m/s)",
  range: { lower: 0, upper: 1000 },
  yLabel: "Kinetic Energy (J)"
};              

const KE_wdot_plot = createPlot(KE_wdot_input);

// KE w param line
var KE_wdot_line = KE_wdot_plot.svg.append("g").attr("id", "KE-wdot-line").attr("visibility", "visible");

// PE and KE y vs. time GRAPH
const y_input = {
  divID: "#yt-graph",
  svgID: "svg-for-yt-plot",
  domain: { lower: 0, upper: 10 },
  xLabel: "Time (s)",
  range: { lower: 0, upper: 2000 },
  yLabel: "Absolute Value of Energy (J)"
};              

const y_plot = createPlot(y_input);

// PE yt param line
var PE_yt_line = y_plot.svg.append("g").attr("id", "PE-yt-line").attr("visibility", "visible");

// KE yt param line
var KE_yt_line = y_plot.svg.append("g").attr("id", "KE-yt-line").attr("visibility", "visible");

// PE and KE w vs. time GRAPH
const w_input = {
  divID: "#wt-graph",
  svgID: "svg-for-wt-plot",
  domain: { lower: 0, upper: 10 },
  xLabel: "Time (s)",
  range: { lower: 0, upper: 2000 },
  yLabel: "Energy (J)"
};              

const w_plot = createPlot(w_input);

// PE wt param line
var PE_wt_line = w_plot.svg.append("g").attr("id", "PE-wt-line").attr("visibility", "visible");

// KE wt param line
var KE_wt_line = w_plot.svg.append("g").attr("id", "KE-wt-line").attr("visibility", "visible");

// update plots
function plot(data) {
  // PE vs. y
  var input = {
    data: data.PEy,
    svg: PE_y_plot.svg,
    line: PE_y_line,
    xScale: PE_y_plot.xScale,
    yScale: PE_y_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  // PE vs. w
  var input = {
    data: data.PEw,
    svg: PE_w_plot.svg,
    line: PE_w_line,
    xScale: PE_w_plot.xScale,
    yScale: PE_w_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  // KE vs. ydot
  input = {
    data: data.KEy,
    svg: KE_ydot_plot.svg,
    line: KE_ydot_line,
    xScale: KE_ydot_plot.xScale,
    yScale: KE_ydot_plot.yScale,
    color: "green"
  };

  // plot the data
  plotData(input);

  // KE vs. wdot
  input = {
    data: data.KEw,
    svg: KE_wdot_plot.svg,
    line: KE_wdot_line,
    xScale: KE_wdot_plot.xScale,
    yScale: KE_wdot_plot.yScale,
    color: "green"
  };

  // plot the data
  plotData(input);

  // PEy vs. time
  input = {
    data: data.PEyt,
    svg: y_plot.svg,
    line: PE_yt_line,
    xScale: y_plot.xScale,
    yScale: y_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  // KEy vs. time
  input = {
    data: data.KEyt,
    svg: y_plot.svg,
    line: KE_yt_line,
    xScale: y_plot.xScale,
    yScale: y_plot.yScale,
    color: "green"
  };

  // plot the data
  plotData(input);

  // PEw vs. time
  input = {
    data: data.PEwt,
    svg: w_plot.svg,
    line: PE_wt_line,
    xScale: w_plot.xScale,
    yScale: w_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  // KEw vs. time
  input = {
    data: data.KEwt,
    svg: w_plot.svg,
    line: KE_wt_line,
    xScale: w_plot.xScale,
    yScale: w_plot.yScale,
    color: "green"
  };

  // plot the data
  plotData(input);

}

// create some initial data when page loads
const initial_data = EnergyData();

// initialize energy lines
plot(initial_data);

/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

/* This section holds the functions that I call when something happens
on the HTML page (ex. button click, slider change, etc). */

// these booleans store whether answers are being shown
// by default, all answers are hidden
var showAnswer1 = false;
var showAnswer2 = false;

function slider_update() {
  // updates global values for m, a, h
  m = parseFloat(document.getElementById("m-slider").value);
  document.getElementById("print-m").innerHTML = m.toFixed(1);
  a = -1 * parseFloat(document.getElementById("a-slider").value); // a = -g
  document.getElementById("print-a").innerHTML = -1 * a.toFixed(1); // g is positive
  h = parseFloat(document.getElementById("h-slider").value);
  document.getElementById("print-h").innerHTML = h.toFixed(1);
  if (showAnswer1) { // checks if the answer is being shown before updating it
    document.getElementById("answer1").style.display = "block";
  }
  if (showAnswer2) { // checks if the answer is being shown before updating it
    document.getElementById("answer2").style.display = "block";
  }
  const data = EnergyData();
  // update plots
  plot(data);
  endAnimation();
  startAnimation(h, m, a);
}

// checks if any sliders have been changed
document.getElementById("m-slider").oninput = function () {
  slider_update();
}
document.getElementById("a-slider").oninput = function () {
  slider_update();
}
document.getElementById("h-slider").oninput = function () {
  slider_update();
}

// shows the answer if the q1 button is clicked
document.getElementById("show-q1").addEventListener("click", function () {
  if (!showAnswer1) {
    showAnswer1 = true;
    document.getElementById("show-q1").innerHTML = "Hide Answer";
    slider_update();
  } else {
    showAnswer1 = false;
    document.getElementById("show-q1").innerHTML = "Show Answer";
    document.getElementById("answer1").style.display = "none";
  }
});

// shows the answer if the q2 button is clicked
document.getElementById("show-q2").addEventListener("click", function () {
  if (!showAnswer2) {
    showAnswer2 = true;
    document.getElementById("show-q2").innerHTML = "Hide Answer";
    slider_update();
  } else {
    showAnswer2 = false;
    document.getElementById("show-q2").innerHTML = "Show Answer";
    document.getElementById("answer2").style.display = "none";
  }
});
