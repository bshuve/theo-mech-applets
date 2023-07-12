/* Parameters */
const CANVAS_WIDTH = 380;
const CANVAS_HEIGHT = 280;
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
var p = parseInt(document.getElementById("p-slider").value); // 0.0
// create action variable
var S = 0;

/* Canvas Animation */
function startAnimation(p) {
  projectile = new component(3, 3, "purple", x_initial, y_initial, p);
  animArea.start();
}

// wrapper function to end animations
function endAnimation() {
  animArea.stop();
}

/* Coordinate transformations */
function transformXCoord(x) {
  return x_initial + x * (CANVAS_WIDTH / 1.2);
}

function transformYCoord(y) {
  return (y_initial * 2.3) - y * (CANVAS_HEIGHT / 1.8);
}

var animArea = {
  panel: document.getElementById("ball-launch"),
  start: function () {
    this.panel.width = CANVAS_WIDTH;
    this.panel.height = CANVAS_HEIGHT;
    this.context = this.panel.getContext("2d");

    /* Set the initial time to 0.01 */
    this.time = 0.01;

    this.interval = setInterval(updateFrame, FRAME_RATE);

    // add text to panel
    this.context.font = "18px Verdana";
    this.context.fillStyle = "black";
    this.context.fillText("Height vs Time", 10, 30);
  },
  stop: function () {
    this.time = 0.01;
    // Terminate setInterval
    clearInterval(this.interval);
  },
}

/* Define component Objects */
function component(width, height, color, x, y, p) {
  this.width = width;
  this.height = height;
  this.color = color;
  this.x = x;
  this.y = y;
  this.p = p;

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
    this.y = transformYCoord(1-t**this.p);
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
startAnimation(p);

/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

// generate energy data
function energyAndDerivativeData() {
  // create arrays of data for each plot
  var kinetic_energy_data = [];
  var potential_energy_data = [];
  var minus_potential_energy_data = [];
  var kinetic_derivative_data = [];
  var potential_derivative_data = [];
  var n_potential_derivative_data = [];
  var derivative_kinetic_derivative_data = [];
  var t = 0.0001;
  // reset action
  S = 0;

  while (t <= end_time) {
    //parametrize graphs
    // when p is equal to 4, we can see the graphs over the full domain
    let y = 1-t**p;
    let v = -p*t**(p-1);
    let a = -p*(p-1)*t**(p-2);
    let KE = 1/2 * m * ((-4*t**(4-1))**2); // graph kinetic energy T when p=4 to get the full graph since graph doesn't change with path
    let PE = m * g * (1-t**4); // graph potential energy U when p=4 to get the full graph since graph doesn't change with path
    let nPE = -PE; // negative potential energy -U
    let dKE = m * v; // dT/dv
    let dPE = m * g; // dU/dy
    let dnPE = -dPE; // -dU/dy
    let ddKE = m * a; // d/dt(dT/dv)
    S += dt * (KE - PE);

    // push all data into arrays
    kinetic_energy_data.push({ "x": -4*t**(4-1), "y": KE });
    potential_energy_data.push({ "x": 1-t**4, "y": PE });
    minus_potential_energy_data.push({ "x": 1-t**4, "y": nPE });
    kinetic_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": dKE });
    potential_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": dPE });
    n_potential_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": dnPE });
    derivative_kinetic_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": ddKE });

    t += dt;
  }

  return {
    k: kinetic_energy_data, p: potential_energy_data, np: minus_potential_energy_data, kd: kinetic_derivative_data,
    pd: potential_derivative_data, npd: n_potential_derivative_data, kdd: derivative_kinetic_derivative_data
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

// POTENTIAL ENERGY GRAPH
// this input format will be followed by each plot after this
const potential_energy_input = {
  divID: "#PE-energy-graph", // the id of the <div> element in your HTML file where the plot will go
  svgID: "svg-for-PE-plot", // what you want the svg element to be named (not super important)
  domain: { lower: 0, upper: 1 }, // domain of the plot
  xLabel: "y Position (m)", // x-axis label
  range: { lower: -2, upper: 2 }, // range of the plot
  yLabel: "Potential Energy (J)"// y-axis label
};

// the svg element is essentially saved as this const variable
const potential_energy_plot = createPlot(potential_energy_input);

// graph each line on the plot
// potential energy U
var pe_line = potential_energy_plot.svg.append("g").attr("id", "potential-energy-line").attr("visibility", "visible");
// negative potential energy -U 
var npe_line = potential_energy_plot.svg.append("g").attr("id", "minus-potential-energy-line").attr("visibility", "visible");


// PE DERIVATIVE OF ENERGY
const potential_derivative_input = {
  divID: "#PE-derivative-graph",
  svgID: "svg-for-PE-derivative",
  domain: { lower: 0, upper: 1 },
  xLabel: "Time (s)",
  range: { lower: -4, upper: 4 },
  yLabel: "Potential Derivative (\u2202U/\u2202y)"
};

const potential_derivative_plot = createPlot(potential_derivative_input);

// dU/dy
var pd_line = potential_derivative_plot.svg.append("g").attr("id", "potential-derivative-line").attr("visibility", "visible");

// nPE DERIVATIVE OF ENERGY
const npotential_derivative_input = {
  divID: "#nPE-derivative-graph",
  svgID: "svg-for-nPE-derivative",
  domain: { lower: 0, upper: 1 },
  xLabel: "Time (s)",
  range: { lower: -4, upper: 4 },
  yLabel: "Potential Derivative (\u2202U/\u2202y)"
};

const npotential_derivative_plot = createPlot(npotential_derivative_input);

// -dU/dy
var npd_line = npotential_derivative_plot.svg.append("g").attr("id", "n_potential-derivative-line").attr("visibility", "visible");

// KINETIC ENERGY GRAPH
const kinetic_energy_input = {
  divID: "#KE-energy-graph",
  svgID: "svg-for-KE-plot",
  domain: { lower: -5, upper: 0},
  xLabel: "\u1E8F Velocity (m/s)",
  range: { lower: 0, upper: 8 },
  yLabel: "Kinetic Energy (J)"
};

const kinetic_energy_plot = createPlot(kinetic_energy_input);

// kinetic energy T left side
var ke_line = kinetic_energy_plot.svg.append("g").attr("id", "kinetic-energy-line").attr("visibility", "visible");
// kinetic energy T right side
// var ke_r_line = kinetic_energy_plot.svg.append("g").attr("id", "kinetic-energy-r-line").attr("visibility", "visible");

// KE DERIVATIVE OF ENERGY
const kinetic_derivative_input = {
  divID: "#KE-derivative-graph",
  svgID: "svg-for-KE-derivative",
  domain: { lower: 0, upper: 1 },
  xLabel: "Time (s)",
  range: { lower: -10, upper: 10 },
  yLabel: "Kinetic Derivative (\u2202T/\u2202\u1E8F)"
};

const kinetic_derivative_plot = createPlot(kinetic_derivative_input);

// dT/dv
var kd_line = kinetic_derivative_plot.svg.append("g").attr("id", "kinetic-derivative-line");

// d/dt KE DERIVATIVE OF ENERGY
const derivative_kinetic_derivative_input = {
  divID: "#dKE-derivative-graph",
  svgID: "svg-for-dKE-derivative",
  domain: { lower: 0, upper: 1 },
  xLabel: "Time (s)",
  range: { lower: -4, upper: 4 },
  yLabel: "d/dt Kinetic Derivative (d/dt(\u2202T/\u2202\u1E8F))"
};

const derivative_kinetic_derivative_plot = createPlot(derivative_kinetic_derivative_input);

// d/dt(dT/dv)
var kdd_line = derivative_kinetic_derivative_plot.svg.append("g").attr("id", "derivative-kinetic-derivative-line");

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

  // d/dt(dT/dv)
  var input = {
    data: data.kdd,
    svg: derivative_kinetic_derivative_plot.svg,
    line: kdd_line,
    xScale: derivative_kinetic_derivative_plot.xScale,
    yScale: derivative_kinetic_derivative_plot.yScale,
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

  // -dU/dy
  var input = {
    data: data.npd,
    svg: npotential_derivative_plot.svg,
    line: npd_line,
    xScale: npotential_derivative_plot.xScale,
    yScale: npotential_derivative_plot.yScale,
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

// calculate action on load
document.getElementById("print-S").innerHTML = S.toFixed(4);

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
  // updates global value for p
  p = parseFloat(document.getElementById("p-slider").value);
  document.getElementById("print-p").innerHTML = p.toFixed(1);
  if (showAnswer1) { // checks if the answer is being shown before updating it
    document.getElementById("answer1").innerHTML = "<br><br>Force = " + (-m * g).toFixed(2) + " N"
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
  document.getElementById("print-S").innerHTML = S.toFixed(4);
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

// shows the answer if the q3 button is clicked
document.getElementById("show-q3").addEventListener("click", function () {
  if (!showAnswer3) {
    showAnswer3 = true;
    document.getElementById("show-q3").innerHTML = "Hide Answer";
    slider_update();
  } else {
    showAnswer3 = false;
    document.getElementById("show-q3").innerHTML = "Show Answer";
    document.getElementById("answer3").style.display = "none";
  }
});