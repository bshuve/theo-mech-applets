/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////

const CANVAS_WIDTH = 330;
const CANVAS_HEIGHT = 280;
const SVG_WIDTH = 330;
const SVG_HEIGHT = 280;
const dPhi = 0.01;
const dt = 0.01;
const FRAME_RATE = 10   // ms
const TRANSITION_TIME = 10; // ms

// const G = 6.7 * 10 ** (-11);
// const m1 = 6 * 10 ** 24;  // Earth
// const m2 = 2 * 10 ** 30;  // Sun
// const l = 2.7 * 10 ** 40;

const b = 2;
const A = 200000;
const B = 10000;
var d = parseInt(document.getElementById("earth-slider").getAttribute("value"))/1000;
var a = parseInt(document.getElementById("a-slider").getAttribute("value"))/100;
var epsilon = Math.sqrt(1 - b ** 2 / a ** 2);
var c = Math.sqrt(a ** 2 - b ** 2);
var f = a * epsilon;


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
  domain: {lower: 0, upper: 200},
  xLabel: "Radius (r)",
  range: {lower: -200, upper: 100},
  yLabel: "Potential"};
const potential_energy_plot = createPlot(potential_energy_input);
var pe_line = potential_energy_plot.svg.append("g").attr("id", "potential-energy-line");
var pe_point = potential_energy_plot.svg.append("circle")
.attr("id", "potential-energy-point").attr("r", 3).attr("fill", "blue").attr("visibility", "visible");

// POSITION
const position_input = {
  divID: "#position-graph",
  svgID: "svg-for-position-plots",
  domain: {lower: -1, upper: 23},
  xLabel: "Time",
  range: {lower: 0, upper: 160},
  yLabel: "Distance from Earth"};
const position_plot = createPlot(position_input);
var r_line = position_plot.svg.append("g").attr("id", "r-line");

// ANGLE
const angle_input = {
  divID: "#angle-graph",
  svgID: "svg-for-angle-plots",
  domain: {lower: -1, upper: 23},
  xLabel: "Time",
  range: {lower: -Math.PI, upper: Math.PI},
  yLabel: "Angle about Earth"};
const angle_plot = createPlot(angle_input);
var theta_line = angle_plot.svg.append("g").attr("id", "theta-line");


/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

// generate energy data
function potentialEnergyData(){
  var pe_data = [];
  for (let r = 1; r <= 200; r++) {
      let Ueff = A / (r**2) - B / r;
      pe_data.push({x: r, y: Ueff});
  }
  // document.getElementById("debug").innerHTML = JSON.stringify(potential_energy_data[5]);
  // document.getElementById("debug").innerHTML = potential_energy_data.length;
  return pe_data;
}


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
    color: "orange"};

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
const initial_potential_data = potentialEnergyData();
plotPotentialEnergy(initial_potential_data);


/////////////////////////////////////////////////
/* CANVAS ANIMATIONS */
/////////////////////////////////////////////////

// wrapper function to start animations
function startAnimation(a, d) {
  // projectiles
  satellite = new component(5, 5, "purple", transformXCoord(a), transformYCoord(0), 1);
  // polar = new component(3, 3, "orange", transformXCoord(a), transformYCoord(0), 2);
  earth = new component(10, 10, "blue", transformXCoord(d), transformYCoord(0));
  position_data = [];
  angle_data = [];
  animArea.start();
}

function runAnimation(a, d) {
  startAnimation(a, d);
  animArea.run();
}

// wrapper function to end animations
function endAnimation() {
  position_data = [];
  angle_data = [];
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
  // b -> 40
  // -b -> HEIGHT-40
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
  },
}

// to create projectiles
function component(width, height, color, x, y) {
  this.width = width;
  this.height = height;
  this.color = color;
  this.x = x;
  this.y = y;

  this.update = function(){
      var ctx = animArea.context;
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  this.newPos = function(t) {
      this.x = transformXCoord(a * Math.cos(t));
      this.y = transformYCoord(b * Math.sin(t));
  }
}

// draw arrows - https://stackoverflow.com/questions/808826/draw-arrow-on-canvas-tag
// function canvas_arrow(fromx, fromy, tox, toy) {
//   var headlen = 10; // length of head in pixels
//   var dx = tox - fromx;
//   var dy = toy - fromy;
//   var angle = Math.atan2(dy, dx);
//   animArea.context.moveTo(fromx, fromy);
//   animArea.context.lineTo(tox, toy);
//   animArea.context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
//   animArea.context.moveTo(tox, toy);
//   animArea.context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
// }

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
var position_data = [];
var angle_data = [];
// A / (r**2) - B / r;
function updateFrame() {
  // clear frame and move to next
  animArea.clear();

  // update positions
  satellite.newPos(animArea.time);

  let t = Math.round(animArea.time * 100) / 100;
  let dist = Math.round(distance(earth.x, earth.y, satellite.x, satellite.y) * 10000) / 10000;
  position_data.push({x: t, y: dist});
  // angle_data.push({x: t, y: 180*Math.acos((c/dist - 1)/epsilon)/Math.PI});
  if (earth.x == satellite.x) {
    if (satellite.y > earth.y) {angle_data.push({x: t, y: 90});}
    else {angle_data.push({x: t, y: 270});}
  } else {
    let angle = Math.atan((b * Math.sin(t))/(a * Math.cos(t) - d));
    // if (angle < 0) {angle += 180;}
    // if (satellite.y < earth.y) {angle += 180;}
    angle_data.push({x: t, y: angle});
  }
  // polar.newPos(animArea.time)

  // update plots
  satellite.update();
  // polar.update();

  earth.update();
  // document.getElementById("debug").innerHTML += ` `;
  // if (Math.round(animArea.time*100)/100 == 1.57) {
  //   document.getElementById("debug").innerHTML = `${transformXCoord(0)}, ${transformYCoord(b)} ${transformXCoord(d)}, ${transformYCoord(0)}`;

  //   animArea.context.beginPath();
  //   canvas_arrow(transformXCoord(0), transformYCoord(b), transformXCoord(d), transformYCoord(0));
  //   animArea.context.stroke();

  //   // x = acost -> x' = -asint -> x'' = -acost
  //   // y = bsint -> y' = bcost -> y'' = -bsint

  //   animArea.context.beginPath();
  //   canvas_arrow(transformXCoord(-d), transformYCoord(b), transformXCoord(0), transformYCoord(0));
  //   animArea.context.stroke();

  // }

  plotPosition(position_data);
  plotAngle(angle_data);
  plotPotentialPoint(dist);
  animArea.time += dt;

  // end animation when t = 1
  if (animArea.time >= 6*Math.PI) {
      // document.getElementById("debug").innerHTML = JSON.stringify(position_data);
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