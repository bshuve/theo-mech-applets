/* Parameters */
const CANVAS_WIDTH = parseInt(document.getElementById("ball-launch").getAttribute("width"));
const CANVAS_HEIGHT = parseInt(document.getElementById("ball-launch").getAttribute("height"));
const SVG_WIDTH = 300;
const SVG_HEIGHT = 300;
const TRANSITION_TIME = 10; // ms
const dt = 0.002;
const end_time = 2;
const FRAME_RATE = 1; // ms
const x_initial = 20;
var h = 50
var a = -9.8
var m = 10.0

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

// generate energy data
function energyAndDerivativeData() {
  // create arrays of data for each plot
  // for y param
  var kinetic_energy_data = [];
  var potential_energy_data = [];
  var minus_potential_energy_data = [];
  var kinetic_derivative_data = [];
  var potential_derivative_data = [];
  var n_potential_derivative_data = [];

  // for w param, where w = y^2
  var kinetic_energy_data_w = [];
  var potential_energy_data_w = [];
  var minus_potential_energy_data_w = [];
  var kinetic_derivative_data_w = [];
  var potential_derivative_data_w = [];
  var n_potential_derivative_data_w = [];

  var t = -3;

  while (t <= 3) {
    // parametrize graphs
    // for y param
    let KE = 1 / 2 * (m * (a * t) ** 2); // kinetic energy T
    let PE = -m * a * (1 / 2 * a * t ** 2 + h); // potential energy U
    let nPE = -PE; // negative potential energy -U
    let dKE = m * a * t; // dT/dv
    let dPE = -m * a; // -dU/dy
    let dnPE = -dPE; // dU/dy

    // for w param
    let KEw = 1 / 2 * (m * (a * t) ** 2); // kinetic energy T
    let PEw = -m * a * (1 / 2 * a * t ** 2 + h); // potential energy U
    let nPEw = -PEw; // negative potential energy -U
    let dKEw = m * a * t; // dT/dv
    let dPEw = -m * a; // -dU/dy
    let dnPEw = -dPEw; // dU/dy

    // push all data into arrays
    // for y param
    kinetic_energy_data.push({ "x": (a * t), "y": KE / 1000 });
    if (1 / 2 * a * t ** 2 + h >= 0) { // this condition prevents the PE from being graphed for -y positions
      potential_energy_data.push({ "x": 1 / 2 * a * t ** 2 + h, "y": PE / 1000 });
      minus_potential_energy_data.push({ "x": 1 / 2 * a * t ** 2 + h, "y": nPE / 1000 });
    }
    kinetic_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": dKE });
    potential_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": dPE });
    n_potential_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": dnPE });

    // for w param
    kinetic_energy_data_w.push({ "x": (a * t), "y": KEw / 1000 });
    if (1 / 2 * a * t ** 2 + h >= 0) { // this condition prevents the PE from being graphed for -y positions
      potential_energy_data_w.push({ "x": 1 / 2 * a * t ** 2 + h, "y": PEw / 1000 });
      minus_potential_energy_data_w.push({ "x": 1 / 2 * a * t ** 2 + h, "y": nPEw / 1000 });
    }
    kinetic_derivative_data_w.push({ "x": Math.round(t * 10000) / 10000, "y": dKEw });
    potential_derivative_data_w.push({ "x": Math.round(t * 10000) / 10000, "y": dPEw });
    n_potential_derivative_data_w.push({ "x": Math.round(t * 10000) / 10000, "y": dnPEw });
    t += dt;

  }

  return {
    // for y param
    k: kinetic_energy_data, np: minus_potential_energy_data, p: potential_energy_data,
    kd: kinetic_derivative_data, pd: potential_derivative_data, npd: n_potential_derivative_data,

    // for w param
    kw: kinetic_energy_data_w, npw: minus_potential_energy_data_w, pw: potential_energy_data_w, 
    kdw: kinetic_derivative_data_w, pdw: potential_derivative_data_w, npdw: n_potential_derivative_data_w
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

// POTENTIAL ENERGY GRAPH
// this input format will be followed by each plot after this
const potential_energy_input = {
  divID: "#PE-y-energy-graph", // the id of the <div> element in your HTML file where the plot will go
  svgID: "svg-for-PE-y-plot", // what you want the svg element to be named (not super important)
  domain: { lower: 0, upper: 100 }, // domain of the plot
  xLabel: "y Position (m)", // x-axis label
  range: { lower: -15, upper: 15 }, // range of the plot
  yLabel: "Potential Energy (kJ)"// y-axis label
};              

// the svg element is essentially saved as this const variable
const potential_energy_plot = createPlot(potential_energy_input);

// graph each line on the plot
// potential energy U
var pe_line = potential_energy_plot.svg.append("g").attr("id", "potential-energy-line").attr("visibility", "visible");
// negative potential energy -U
var npe_line = potential_energy_plot.svg.append("g").attr("id", "minus-potential-energy-line").attr("visibility", "visible");

// w POTENTIAL ENERGY GRAPH
const potential_energy_input_w = {
  divID: "#PE-w-energy-graph",
  svgID: "svg-for-PE-w-plot",
  domain: { lower: 0, upper: 100 },
  xLabel: "w Position (m)",
  range: { lower: -15, upper: 15 },
  yLabel: "Potential Energy (kJ)"
};              

const potential_energy_plot_w = createPlot(potential_energy_input_w);

// potential energy U
var pew_line = potential_energy_plot_w.svg.append("g").attr("id", "potential-energy-line-w").attr("visibility", "visible");
// negative potential energy -U
var npew_line = potential_energy_plot_w.svg.append("g").attr("id", "minus-potential-energy-line-w").attr("visibility", "visible");

// PE DERIVATIVE OF ENERGY
const potential_derivative_input = {
  divID: "#PE-y-derivative-graph",
  svgID: "svg-for-PE-y-derivative",
  domain: { lower: 0, upper: 2 },
  xLabel: "Time (s)",
  range: { lower: -175, upper: 175 },
  yLabel: "Potential Derivative (∂U/∂y)"
};

const potential_derivative_plot = createPlot(potential_derivative_input);

// -dU/dy
var npd_line = potential_derivative_plot.svg.append("g").attr("id", "n_potential-derivative-line").attr("visibility", "visible");
// dU/dy
var pd_line = potential_derivative_plot.svg.append("g").attr("id", "potential-derivative-line").attr("visibility", "visible");

// w PE DERIVATIVE OF ENERGY
const potential_derivative_input_w = {
  divID: "#PE-w-derivative-graph",
  svgID: "svg-for-PE-w-derivative",
  domain: { lower: 0, upper: 2 },
  xLabel: "Time (s)",
  range: { lower: -175, upper: 175 },
  yLabel: "Potential Derivative (∂U/∂y)"
};

const potential_derivative_plot_w = createPlot(potential_derivative_input_w);

// -dU/dw
var npdw_line = potential_derivative_plot_w.svg.append("g").attr("id", "n_potential-derivative-line-w").attr("visibility", "visible");
// dU/dw
var pdw_line = potential_derivative_plot_w.svg.append("g").attr("id", "potential-derivative-line-w").attr("visibility", "visible");

// KINETIC ENERGY GRAPH
const kinetic_energy_input = {
  divID: "#KE-y-energy-graph",
  svgID: "svg-for-KE-y-plot",
  domain: { lower: -30, upper: 30 },
  xLabel: "ẏ Velocity (m/s)",
  range: { lower: 0, upper: 4.5 },
  yLabel: "Kinetic Energy (kJ)"
};

const kinetic_energy_plot = createPlot(kinetic_energy_input);

// kinetic energy T
var ke_line = kinetic_energy_plot.svg.append("g").attr("id", "kinetic-energy-line").attr("visibility", "visible");

// w KINETIC ENERGY GRAPH
const kinetic_energy_input_w = {
  divID: "#KE-w-energy-graph",
  svgID: "svg-for-KE-w-plot",
  domain: { lower: -30, upper: 30 },
  xLabel: "ẇ Velocity (m/s)",
  range: { lower: 0, upper: 4.5 },
  yLabel: "Kinetic Energy (kJ)"
};

const kinetic_energy_plot_w = createPlot(kinetic_energy_input_w);

// kinetic energy T
var kew_line = kinetic_energy_plot_w.svg.append("g").attr("id", "kinetic-energy-line-w").attr("visibility", "visible");

// KE DERIVATIVE OF ENERGY
const kinetic_derivative_input = {
  divID: "#KE-y-derivative-graph",
  svgID: "svg-for-KE-derivative",
  domain: { lower: 0, upper: 2 },
  xLabel: "Time (s)",
  range: { lower: -300, upper: 300 },
  yLabel: "Kinetic Derivative (∂T/∂ẏ)"
};

const kinetic_derivative_plot = createPlot(kinetic_derivative_input);

// dT/dv
var kd_line = kinetic_derivative_plot.svg.append("g").attr("id", "kinetic-derivative-line");

// w KE DERIVATIVE OF ENERGY
const kinetic_derivative_input_w = {
  divID: "#KE-w-derivative-graph",
  svgID: "svg-for-KE-w-derivative",
  domain: { lower: 0, upper: 2 },
  xLabel: "Time (s)",
  range: { lower: -300, upper: 300 },
  yLabel: "Kinetic Derivative (∂T/∂ẇ)"
};

const kinetic_derivative_plot_w = createPlot(kinetic_derivative_input_w);

// dT/dv
var kdw_line = kinetic_derivative_plot_w.svg.append("g").attr("id", "kinetic-derivative-line-w");

// update energy plots
function plotEnergy(data) {
  // kinetic energy
  var input = {
    data: data.k,
    svg: kinetic_energy_plot.svg,
    line: ke_line,
    xScale: kinetic_energy_plot.xScale,
    yScale: kinetic_energy_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  // w kinetic energy
  var input = {
    data: data.kw,
    svg: kinetic_energy_plot_w.svg,
    line: kew_line,
    xScale: kinetic_energy_plot_w.xScale,
    yScale: kinetic_energy_plot_w.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  // potential energy
  input = {
    data: data.p,
    svg: potential_energy_plot.svg,
    line: pe_line,
    xScale: potential_energy_plot.xScale,
    yScale: potential_energy_plot.yScale,
    color: "green"
  };

  // plot the data
  plotData(input);

  // w potential energy
  input = {
    data: data.pw,
    svg: potential_energy_plot_w.svg,
    line: pew_line,
    xScale: potential_energy_plot_w.xScale,
    yScale: potential_energy_plot_w.yScale,
    color: "green"
  };

  // plot the data
  plotData(input);

  // negative potential energy
  input = {
    data: data.np,
    svg: potential_energy_plot.svg,
    line: npe_line,
    xScale: potential_energy_plot.xScale,
    yScale: potential_energy_plot.yScale,
    color: "grey"
  };

  // plot the data
  plotData(input);

  // w negative potential energy
  input = {
    data: data.npw,
    svg: potential_energy_plot_w.svg,
    line: npew_line,
    xScale: potential_energy_plot_w.xScale,
    yScale: potential_energy_plot_w.yScale,
    color: "grey"
  };

  // plot the data
  plotData(input);
}

// update derivative plots
function plotDerivative(data) {

  // dT/dv
  var input = {
    data: data.kd,
    svg: kinetic_derivative_plot.svg,
    line: kd_line,
    xScale: kinetic_derivative_plot.xScale,
    yScale: kinetic_derivative_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  // dT/dẇ
  var input = {
    data: data.kdw,
    svg: kinetic_derivative_plot_w.svg,
    line: kdw_line,
    xScale: kinetic_derivative_plot_w.xScale,
    yScale: kinetic_derivative_plot_w.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  // dU/dy
  var input = {
    data: data.pd,
    svg: potential_derivative_plot.svg,
    line: pd_line,
    xScale: potential_derivative_plot.xScale,
    yScale: potential_derivative_plot.yScale,
    color: "green"
  };

  // plot the data
  plotData(input);

  // dU/dw
  var input = {
    data: data.pdw,
    svg: potential_derivative_plot_w.svg,
    line: pdw_line,
    xScale: potential_derivative_plot_w.xScale,
    yScale: potential_derivative_plot_w.yScale,
    color: "green"
  };

  // plot the data
  plotData(input);

  // -dU/dy
  var input = {
    data: data.npd,
    svg: potential_derivative_plot.svg,
    line: npd_line,
    xScale: potential_derivative_plot.xScale,
    yScale: potential_derivative_plot.yScale,
    color: "gray"
  };

  // plot the data
  plotData(input);

  // -dU/dw
  var input = {
    data: data.npdw,
    svg: potential_derivative_plot_w.svg,
    line: npdw_line,
    xScale: potential_derivative_plot_w.xScale,
    yScale: potential_derivative_plot_w.yScale,
    color: "gray"
  };

  // plot the data
  plotData(input);
}

// create some initial data when page loads
const initial_data = energyAndDerivativeData();

// initialize energy lines
plotEnergy(initial_data);

// initialize energy lines
plotDerivative(initial_data);



/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

/* This section holds the functions that I call when something happens
on the HTML page (ex. button click, slider change, etc). */

// these booleans store whether answers are being shown
// by default, all answers are hidden
var showAnswer1 = false;
var showAnswer2 = false;
var showAnswer3 = false;

function slider_update() {
  // updates global values for m, a, h
  if (showAnswer1) { // checks if the answer is being shown before updating it
    document.getElementById("answer1").innerHTML = "<br><br>Force = " + (m * a).toFixed(2) + " N"
      + "<br><br>Yes, this is a conservative force because the work done is independent of the path taken and only depends on the initial and final position.<br>";
  }
  if (showAnswer2) { // checks if the answer is being shown before updating it
    document.getElementById("answer2").style.display = "block";
  }
  if (showAnswer3) { // checks if the answer is being shown before updating it
    document.getElementById("answer3").style.display = "block";
  }
  const data = energyAndDerivativeData();
  // update plots
  plotEnergy(data);
  plotDerivative(data);
  endAnimation();
  startAnimation(h, m, a);
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
