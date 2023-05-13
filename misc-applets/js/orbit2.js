/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////

const CANVAS_WIDTH = 330;
const CANVAS_HEIGHT = 280;
const SVG_WIDTH = 330;
const SVG_HEIGHT = 280;
const dt = 0.01;
var FRAME_RATE = 5;   // ms
const TRANSITION_TIME = 10; // ms
const MAX_FRAME_RATE = parseInt(document.getElementById("speed-slider").getAttribute("max"));

// const G = 6.7 * 10 ** (-11);
// const m1 = 1;  // Earth
// const m2 = 200;  // Sun
// const l = 400;

const b = 2;   // ellipse semi-minor axis
const A = 1000;
const B = 1400;
var d = parseInt(document.getElementById("earth-slider").getAttribute("value"))/1000;   // Earth's position relative to center of orbit
var a = parseInt(document.getElementById("a-slider").getAttribute("value"))/100;   // ellipse semi-major axis
var epsilon = Math.sqrt(1 - b ** 2 / a ** 2);   // eccentricity
var c = b ** 2 / a;   // r(pi/2)
var f = a * epsilon;   // focus of ellipse


/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

// generate energy data
var pe_data = [];
function potentialEnergyData(){
  pe_data.length = 0;
  for (let r = 1; r <= 100; r++) {
      let ra = r/10;
      let Ueff = A / (ra**2) - B / ra;
      pe_data.push({x: ra, y: Ueff});
  }
}
potentialEnergyData();

// generate angle data
var angle_data = [];
var position_data = [];
function polarData() {
  angle_data.length = 0;
  position_data.length = 0;
  var phi = 0;
  var r = c/(1+epsilon);
  var t = 0;
  while (phi <= 2*Math.PI) {
    angle_data.push({x: t, y: phi});
    position_data.push({x: t, y: r});

    phi += (2 / r ** 2) * dt;
    r = c/(1 + epsilon * Math.cos(phi));
    t += dt;
  }
}
polarData();


/////////////////////////////////////////////////
/* MASTER GRAPHING CAPABILITY */
/////////////////////////////////////////////////

// set the dimensions and margins of the graph
var margin = { top: 20, right: 20, bottom: 50, left: 60 },
  width = SVG_WIDTH - margin.left - margin.right,
  height = SVG_HEIGHT - margin.top - margin.bottom;

// plots some data
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

// creates svg element for a plot
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

// POTENTIAL ENERGY
const potential_energy_input = {
  divID: "#potential-energy-graph",
  svgID: "svg-for-potential-energy-plot",
  domain: {lower: 0, upper: 10},
  xLabel: "Radius (r)",
  range: {lower: -600, upper: 600},
  yLabel: "Potential"};
const potential_energy_plot = createPlot(potential_energy_input);
var pe_line = potential_energy_plot.svg.append("g").attr("id", "potential-energy-line");
var pe_point = potential_energy_plot.svg.append("circle")
.attr("id", "potential-energy-point").attr("r", 3).attr("fill", "blue").attr("visibility", "visible");

// POSITION
const position_input = {
  divID: "#position-graph",
  svgID: "svg-for-position-plots",
  domain: {lower: 0, upper: 27},
  xLabel: "Time",
  range: {lower: 0, upper: 10},
  yLabel: "Distance from Earth"};
const position_plot = createPlot(position_input);
var r_line = position_plot.svg.append("g").attr("id", "r-line");

// ANGLE
const angle_input = {
  divID: "#angle-graph",
  svgID: "svg-for-angle-plots",
  domain: {lower: 0, upper: 27},
  xLabel: "Time",
  range: {lower: 0, upper: 2*Math.PI},
  yLabel: "Angle about Earth"};
const angle_plot = createPlot(angle_input);
var theta_line = angle_plot.svg.append("g").attr("id", "theta-line");


/////////////////////////////////////////////////
/* EVENT LISTENER FUNCTIONS */
/////////////////////////////////////////////////

// update position plot
function plotPosition(data) {

  // prepare input for position plot
  var input = {
    data: data,
    svg: position_plot.svg,
    line: r_line,
    xScale: position_plot.xScale,
    yScale: position_plot.yScale,
    color: "red"};

  // plot the data
  plotData(input);
}

// update angle plot
function plotAngle(data) {

  // prepare input for position plot
  var input = {
    data: data,
    svg: angle_plot.svg,
    line: theta_line,
    xScale: angle_plot.xScale,
    yScale: angle_plot.yScale,
    color: "blue"};

  // plot the data
  plotData(input);
}

// update energy plots
function plotPotentialEnergy(data) {

  // potential energy
  input = {
    data: data,
    svg: potential_energy_plot.svg,
    line: pe_line,
    xScale: potential_energy_plot.xScale,
    yScale: potential_energy_plot.yScale,
    color: "green"};

  // plot the data
  plotData(input);
}

function plotPotentialPoint(r) {

  // x-axis is distance from Earth
  pe_point.attr("cx", potential_energy_plot.xScale(r));

  // y-axis is potential energy
  pe_point.attr("cy", potential_energy_plot.yScale(A/r**2 - B/r));
}

// initialize potential plot
plotPotentialEnergy(pe_data);


/////////////////////////////////////////////////
/* CANVAS ANIMATIONS */
/////////////////////////////////////////////////

// wrapper function to start animations
function startAnimation(a, d) {
  // projectiles
  polarData();
  satellite = new component(5, 5, "purple", transformXCoord(a), transformYCoord(0));
  earth = new component(10, 10, "blue", transformXCoord(d), transformYCoord(0));
  animArea.start();
}

function runAnimation(a, d) {
  startAnimation(a, d);
  animArea.run();
}

// wrapper function to end animations
function endAnimation() {
  animArea.stop();
}

// distance between two points
function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2-x1)**2 + (y2-y1)**2)
}

// parameterized coord -> canvas coord
function transformXCoord(x) {
  // 4 -> WIDTH-40
  // -4 -> 40
  return 40 + (CANVAS_WIDTH-80)/(2*4) * (x+4);
}

// parameterized coord -> canvas coord
function transformYCoord(y) {
  // 4 -> 40
  // -4 -> HEIGHT-40
  return 20 + (80-CANVAS_WIDTH)/(2*4) * (y-4);
}

// JS object for both canvases
var animArea = {
  panel: document.getElementById("orbit-canvas"),
  start: function() {
      this.panel.width = CANVAS_WIDTH;
      this.panel.height = CANVAS_HEIGHT;
      this.context = this.panel.getContext("2d");
      this.time = 0;
      this.step = 0;
      updateFrame();
      },
  run: function() {
      this.interval = setInterval(updateFrame, FRAME_RATE);
    },
  clear : function() {
      this.context.clearRect(0, 0, this.panel.width, this.panel.height);
      }, 
  stop : function() {
      clearInterval(this.interval); 
      this.time = 0;
      this.step = 0;
  },
}

// to create projectiles
function component(width, height, color, x, y) {
  this.width = width;
  this.height = height;
  this.color = color;
  this.x = x;
  this.y = y;

  this.update = function() {
      var ctx = animArea.context;
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  this.newPos = function(t) {
    // dot(phi) = l/(mu r^2)
    // r = c/(1+epsilon cos(phi))
      // this.phi += (A / this.r ** 2) * dt;
      // this.r = c/(1 + epsilon * Math.cos(this.phi));
      this.x = transformXCoord(position_data[t].y * Math.cos(angle_data[t].y) + f);
      this.y = transformYCoord(position_data[t].y * Math.sin(angle_data[t].y));
      // document.getElementById("debug").innerHTML += ` ${Math.round(this.x)} ${Math.round(this.y)}` ;
  }
}

function canvas_arrow(t) {
  let fromx = a * Math.cos(t) - d;
  let fromy = b * Math.sin(t);
  var headlen = 10; // length of head in pixels
  var dx = tox - fromx;
  var dy = toy - fromy;
  var angle = Math.atan2(dy, dx);
  animArea.context.moveTo(fromx, fromy);
  animArea.context.lineTo(tox, toy);
  animArea.context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
  animArea.context.moveTo(tox, toy);
  animArea.context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
}

// create frames for animation
function updateFrame() {
  // clear frame and move to next
  animArea.clear();

  // update positions
  satellite.newPos(animArea.step);

  // update plots
  satellite.update();
  earth.update();

  plotPosition(position_data.slice(0, animArea.step+1));
  plotAngle(angle_data.slice(0, animArea.step+1));
  plotPotentialPoint(position_data[animArea.step].y);
  animArea.time += dt;
  animArea.step += 1;

  // end animation when t = 1
  if (animArea.step >= position_data.length) {
      endAnimation();}
}

// run animation on load
runAnimation(a, d);


/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

// update curve when changing a
document.getElementById("a-slider").oninput = function() {
    a = parseInt(document.getElementById("a-slider").value)/100;
    document.getElementById("print-a").innerHTML = a.toFixed(2);

    d = parseInt(document.getElementById("earth-slider").value)/100;
    document.getElementById("print-earth").innerHTML = d.toFixed(2);

    epsilon = Math.sqrt(1 - b ** 2 / a ** 2);
    document.getElementById("print-epsilon").innerHTML = epsilon.toFixed(2);

    f = a * epsilon;
    document.getElementById("print-focus").innerHTML = f.toFixed(2);

    polarData();
    endAnimation();
    startAnimation(a, d);
}

// update curve when changing d
document.getElementById("earth-slider").oninput = function() {
  a = parseInt(document.getElementById("a-slider").value)/100;
  document.getElementById("print-a").innerHTML = a.toFixed(2);

  d = parseInt(document.getElementById("earth-slider").value)/100;
  document.getElementById("print-earth").innerHTML = d.toFixed(2);

  epsilon = Math.sqrt(1 - b ** 2 / a ** 2);
  document.getElementById("print-epsilon").innerHTML = epsilon.toFixed(2);

  f = a * epsilon;
  document.getElementById("print-focus").innerHTML = f.toFixed(2);

  polarData();
  endAnimation();
  startAnimation(a, d);
}

// run animation
document.getElementById("a-slider").onchange = function() {
  a = parseInt(document.getElementById("a-slider").value)/100;
  runAnimation(a, d);
}

// run animation
document.getElementById("earth-slider").onchange = function() {
  d = parseInt(document.getElementById("earth-slider").value)/100;
  runAnimation(a, d);
}

// run animation
document.getElementById("speed-slider").oninput = function() {
  FRAME_RATE = MAX_FRAME_RATE+1-parseInt(document.getElementById("speed-slider").value);
  document.getElementById("print-speed").innerHTML = FRAME_RATE;
}