/* Parameters */
const CANVAS_WIDTH = parseInt(document.getElementById("ball-launch").getAttribute("width"));
const CANVAS_HEIGHT = parseInt(document.getElementById("ball-launch").getAttribute("height"));
const SVG_WIDTH = 445;
const SVG_HEIGHT = 300;
const TRANSITION_TIME = 10; // ms
const dt = 0.002;
const end_time = 2;
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
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

// generate Euler-Lagrange data
function ELData() {
  // create arrays of data for each plot
  // for y param
  var dL_dy_data = [];
  var dt_dL_dydot_data = [];

  // for w param, where w = y^2
  var dL_dw_data = [];
  var dt_dL_dwdot_data = [];

  var t = -3;

  while (t <= 3) {
    // parametrize graphs
    // for y param
    let y = 1 / 2 * a * t ** 2 + h;
    let v = a * t;
    let KE = 1 / 2 * (m * (v) ** 2); // kinetic energy T
    let PE = -m * a * y; // potential energy U
    let dKEdy = 0; // dT/dy = 0 because no y dependence
    let dPEdy = -m * a; // dU/dy
    let dKEdydot = m * v; // dT/dydot
    let dtKEy = m * a; // d/dt(dT/dydot)
    let dPEdydot = 0; // dU/dydot = 0 because no ydot dependence
    let dtPEy = 0; // d/dt(dU/dydot) = 0
    let dLdy = dKEdy - dPEdy; // dL/dy = dT/dy - dU/dy
    let dtdLdydot = dtKEy - dtPEy; // d/dt(dL/dydot) = d/dt(dT/dydot - dU/dydot)

    // for w param, where w = y^2;
    let w = y**2;
    let wdot = 2 * y * v;
    let wdotdot = 2 * (v * v + y * a)
    let KEw = 1 / 2 * (m * (wdot ** 2)/(4 * w)); // kinetic energy T
    let PEw = -m * a * Math.sqrt(w); // potential energy U
    let dKEdw = - 1 / 2 * m * ((wdot ** 2)/(4 * w ** 2)); // dT/dw
    let dPEdw = - 1 / 2 * m * a * (1 / Math.sqrt(w)); // dU/dw
    let dKEdwdot = (m * wdot)/(4 * w); // dT/dwdot
    let dtKEw = 1 / 4 * m * ((wdotdot * w - wdot ** 2) / w ** 2); // d/dt(dT/dwdot)
    let dPEdwdot = 0; // dU/dwdot = 0 because no wdot dependence
    let dtPEw = 0; // d/dt(dU/dwdot) = 0
    let dLdw = dKEdw - dPEdw; // dL/dw = dT/dw - dU/dw
    let dtdLdwdot = dtKEw - dtPEw; // d/dt(dL/dwdot) = d/dt(dT/dwdot - dU/dwdot)

    // push all data into arrays
    // for y param
    dL_dy_data.push({ "x": Math.round(t * 10000) / 10000, "y": dLdy });
    dt_dL_dydot_data.push({ "x": Math.round(t * 10000) / 10000, "y": dtdLdydot });

    // for w param
    if (dtdLdwdot > -10000) { // don't graph at the asymptote to avoid errors
      dL_dw_data.push({ "x": Math.round(t * 10000) / 10000, "y": dLdw });
      dt_dL_dwdot_data.push({ "x": Math.round(t * 10000) / 10000, "y": dtdLdwdot });
    }
    t += dt;

  }

  return {
    // for y param
    y: dL_dy_data,
    ydot: dt_dL_dydot_data,

    // for w param
    w: dL_dw_data,
    wdot: dt_dL_dwdot_data

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

// y param
// dL/dy GRAPH
// this input format will be followed by each plot after this
const dL_dy_input = {
  divID: "#dL-dy-graph", // the id of the <div> element in your HTML file where the plot will go
  svgID: "svg-for-dL-dy-plot", // what you want the svg element to be named (not super important)
  domain: { lower: -3, upper: 3 }, // domain of the plot
  xLabel: "Time (s)", // x-axis label
  range: { lower: -25, upper: -15 }, // range of the plot
  yLabel: "\u2202L/\u2202y (N)"// y-axis label
};              

// the svg element is essentially saved as this const variable
const dL_dy_plot = createPlot(dL_dy_input);

// graph each line on the plot
// dL/dy
var dLdy_line = dL_dy_plot.svg.append("g").attr("id", "dL-dy-line").attr("visibility", "visible");

// d/dt(dL/dydot) GRAPH
const dt_dL_dydot_input = {
  divID: "#dt-dL-dydot-graph",
  svgID: "svg-for-dt-dL-dydot-plot",
  domain: { lower: -3, upper: 3 },
  xLabel: "Time (s)",
  range: { lower: -25, upper: -15 },
  yLabel: "d/dt(\u2202L/\u2202\u1E8F) (N)"
};              

const dt_dL_dydot_plot = createPlot(dt_dL_dydot_input);

// d/dt(dL/dydot)
var dtdLdydot_line = dt_dL_dydot_plot.svg.append("g").attr("id", "dt-dL-dydot-line").attr("visibility", "visible");

// w param
// dL/dw GRAPH
const dL_dw_input = {
  divID: "#dL-dw-graph", 
  svgID: "svg-for-dL-dw-plot", 
  domain: { lower: -3, upper: 3 }, 
  xLabel: "Time (s)", 
  range: { lower: -1000, upper: 0 }, 
  yLabel: "\u2202L/\u2202w (N)"
};              

const dL_dw_plot = createPlot(dL_dw_input);

// dL/dw
var dLdw_line = dL_dw_plot.svg.append("g").attr("id", "dL-dw-line").attr("visibility", "visible");

// d/dt(dL/dwdot) GRAPH
const dt_dL_dwdot_input = {
  divID: "#dt-dL-dwdot-graph",
  svgID: "svg-for-dt-dL-dwdot-plot",
  domain: { lower: -3, upper: 3 },
  xLabel: "Time (s)",
  range: { lower: -1000, upper: 0 },
  yLabel: "d/dt(\u2202L/\u2202\u1E87) (N)"
};              

const dt_dL_dwdot_plot = createPlot(dt_dL_dwdot_input);

// d/dt(dL/dwdot)
var dtdLdwdot_line = dt_dL_dwdot_plot.svg.append("g").attr("id", "dt-dL-dwdot-line").attr("visibility", "visible");

// update plots
function plot(data) {
  // dL/dy
  var input = {
    data: data.y,
    svg: dL_dy_plot.svg,
    line: dLdy_line,
    xScale: dL_dy_plot.xScale,
    yScale: dL_dy_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  // d/dt(dL/dydot)
  var input = {
    data: data.ydot,
    svg: dt_dL_dydot_plot.svg,
    line: dtdLdydot_line,
    xScale: dt_dL_dydot_plot.xScale,
    yScale: dt_dL_dydot_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  // dL/dw
  input = {
    data: data.w,
    svg: dL_dw_plot.svg,
    line: dLdw_line,
    xScale: dL_dw_plot.xScale,
    yScale: dL_dw_plot.yScale,
    color: "green"
  };

  // plot the data
  plotData(input);

  // d/dt(dL/dwdot)
  input = {
    data: data.wdot,
    svg: dt_dL_dwdot_plot.svg,
    line: dtdLdwdot_line,
    xScale: dt_dL_dwdot_plot.xScale,
    yScale: dt_dL_dwdot_plot.yScale,
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
    document.getElementById("answer1").innerHTML = "<br><br>Answer<br>";
  }
  if (showAnswer2) { // checks if the answer is being shown before updating it
    document.getElementById("answer2").style.display = "block";
  }
  const data = ELData();
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
    document.getElementById("show-q1").innerHTML = "Hide Answers";
    slider_update();
  } else {
    showAnswer1 = false;
    document.getElementById("show-q1").innerHTML = "Show Answers";
    document.getElementById("answer1").innerHTML = "";
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
