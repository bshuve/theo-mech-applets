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
  var kinetic_energy_data = [];
  var potential_energy_data = [];
  var dashed_potential_data = [];
  var minus_potential_energy_data = [];
  var dashed_n_potential_data = [];
  var kinetic_derivative_data = [];
  var potential_derivative_data = [];
  var n_potential_derivative_data = [];
  var dashed_kinetic_energy_pos_data = [];
  var dashed_kinetic_energy_neg_data = [];
  var t = 0;

  while (t <= 2) {
    //parametrize graphs
    let KE = 1 / 2 * (m * (a * t) ** 2); // kinetic energy T
    let KEdp = 1 / 2 * (m * (15 * t) ** 2); // dashed plot for kinetic energy T
    let PE = -m * a * (1 / 2 * a * t ** 2 + h); // potential energy U
    let nPE = -PE; // negative potential energy -U
    let dKE = m * a * t; // dT/dv
    let dPE = -m * a; // -dU/dy
    let dnPE = m * a; // dU/dy

    // push all data into arrays
    kinetic_energy_data.push({ "x": (a * t), "y": KE / 1000 });
    dashed_kinetic_energy_pos_data.push({ "x": (15 * t), "y": KEdp / 1000 });
    dashed_kinetic_energy_neg_data.push({ "x": (-15 * t), "y": KEdp / 1000 });
    if (1 / 2 * a * t ** 2 + h >= 0) { // this condition prevents the PE from being graphed for -y positions
      potential_energy_data.push({ "x": 1 / 2 * a * t ** 2 + h, "y": PE / 1000 });
      minus_potential_energy_data.push({ "x": 1 / 2 * a * t ** 2 + h, "y": nPE / 1000 });
    }
    kinetic_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": dKE });
    potential_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": dPE });
    n_potential_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": dnPE });
    t += dt;
  }
  // push data for dashed potential energy plots
  // note that this iterates for all values of h for each dt
  var ti = 0;
  var hi = 0;
  while (ti <= 2) {
    while (hi <= 100) {
      let dashPE = -m * a * (1 / 2 * a * ti ** 2 + hi); // dashed PE plot
      let dashnPE = -dashPE; // negative dashed PE plot
      dashed_potential_data.push({ "x": (1 / 2 * a * ti ** 2 + hi), "y": dashPE / 1000 });
      dashed_n_potential_data.push({ "x": (1 / 2 * a * ti ** 2 + hi), "y": dashnPE / 1000 });
      hi += 0.5;
    }
    ti += dt;
  }
  return {
    k: kinetic_energy_data, np: minus_potential_energy_data, dkp: dashed_kinetic_energy_pos_data, dkn: dashed_kinetic_energy_neg_data,
    p: potential_energy_data, dp: dashed_potential_data, dnp: dashed_n_potential_data, kd: kinetic_derivative_data, pd: potential_derivative_data, npd: n_potential_derivative_data
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

function dashplotData(input) {
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
    .attr("stroke-dasharray", 5)
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
  svgID: "svg-for-PE-plot", // what you want the svg element to be named (not super important)
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
// dashed plot for U
var dpe_line = potential_energy_plot.svg.append("g").attr("id", "dashed-potential-energy-line").attr("visibility", "visible");
// dashed plot for -U
var dnpe_line = potential_energy_plot.svg.append("g").attr("id", "dashed-n-potential-energy-line").attr("visibility", "visible");

// PE DERIVATIVE OF ENERGY
const potential_derivative_input = {
  divID: "#PE-y-derivative-graph",
  svgID: "svg-for-PE-derivative",
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

// KINETIC ENERGY GRAPH
const kinetic_energy_input = {
  divID: "#KE-y-energy-graph",
  svgID: "svg-for-KE-plot",
  domain: { lower: -30, upper: 30 },
  xLabel: "ẏ Velocity (m/s)",
  range: { lower: 0, upper: 4.5 },
  yLabel: "Kinetic Energy (kJ)"
};

const kinetic_energy_plot = createPlot(kinetic_energy_input);

// kinetic energy T
var ke_line = kinetic_energy_plot.svg.append("g").attr("id", "kinetic-energy-line").attr("visibility", "visible");
// dashed plot for T
var dkep_line = kinetic_energy_plot.svg.append("g").attr("id", "dashed-kinetic-energy-pos-line").attr("visibility", "visible");
// dashed plot for -T
var dken_line = kinetic_energy_plot.svg.append("g").attr("id", "dashed-kinetic-energy-neg-line").attr("visibility", "visible");

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

  // kinetic energy dashed
  var input = {
    data: data.dkp,
    svg: kinetic_energy_plot.svg,
    line: dkep_line,
    xScale: kinetic_energy_plot.xScale,
    yScale: kinetic_energy_plot.yScale,
    color: "red"
  };

  // plot the data
  dashplotData(input);

  // negative kinetic energy dashed
  var input = {
    data: data.dkn,
    svg: kinetic_energy_plot.svg,
    line: dken_line,
    xScale: kinetic_energy_plot.xScale,
    yScale: kinetic_energy_plot.yScale,
    color: "red"
  };

  // plot the data
  dashplotData(input);

  // potential energy dashed
  input = {
    data: data.dp,
    svg: potential_energy_plot.svg,
    line: dpe_line,
    xScale: potential_energy_plot.xScale,
    yScale: potential_energy_plot.yScale,
    color: "green"
  };

  // plot the data
  dashplotData(input);

  // negative potential energy dashed
  input = {
    data: data.dnp,
    svg: potential_energy_plot.svg,
    line: dnpe_line,
    xScale: potential_energy_plot.xScale,
    yScale: potential_energy_plot.yScale,
    color: "gray"
  };

  // plot the data
  dashplotData(input);

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
    svg: potential_derivative_plot.svg,
    line: npd_line,
    xScale: potential_derivative_plot.xScale,
    yScale: potential_derivative_plot.yScale,
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

// shows the proof if the proof button is clicked
document.getElementById("show-more").addEventListener("click", function () {
  if (!showAnswer3) {
    showAnswer3 = true;
    document.getElementById("show-more").innerHTML = "Hide Proof";
    slider_update();
  } else {
    showAnswer3 = false;
    document.getElementById("show-more").innerHTML = "Show Proof";
    document.getElementById("answer3").style.display = "none";
  }
});