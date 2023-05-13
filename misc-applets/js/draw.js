/////////////////////////////////////////////////
/* PARAMETERS */
/////////////////////////////////////////////////

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const SVG_WIDTH = 300;
const SVG_HEIGHT = 300;
const TRANSITION_TIME = 10; // ms
const TIME_INTERVAL = 5;
const COORD_SCALE = 10;
const m = 1;
const g = 9.8;


/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

function drawingData(raw_data){
  // document.getElementById("debug").innerHTML = raw_data.length;
  const dt = TIME_INTERVAL / (raw_data.length-1);
  var t = 0;
  x_data = [];
  y_data = [];
  dx_data = [];
  dy_data = [];
  ke_data = [];
  pe_data = [];
  var dx, dy, prevX, prevY, x, y, nextX, nextY, KE, PE; 
  for (var i = 0; i < raw_data.length; i++) {
      // coords
      x = transformXCoord(raw_data[i].x);
      y = transformYCoord(raw_data[i].y);

      if (i == 0) {
        prevX = x;
        prevY = y; 
      } else {
        prevX = transformXCoord(raw_data[i-1].x);
        prevY = transformYCoord(raw_data[i-1].y); 
      }

      if (i == raw_data.length-1) {
        nextX = x;
        nextY = y;
      } else {
        nextX = transformXCoord(raw_data[i+1].x);
        nextY = transformYCoord(raw_data[i+1].y);
      }

      // first derivatives
      dx = (nextX - prevX)/ (2*dt);
      dy = (nextY - prevY)/ (2*dt);
      // dx = ((nextX - x)/ dt + (x - prevX)/ dt) / 2;
      // dy = ((nextY - y)/ dt + (y - prevY)/ dt) / 2;

      // energy
      KE = 0.5 * m * (dx ** 2 + dy ** 2);
      PE = -1 * m * g * y;

      x_data.push({x: Math.round(t * 1000) / 1000, y: x});
      y_data.push({x: Math.round(t * 1000) / 1000, y: y});
      dx_data.push({x: Math.round(t * 1000) / 1000, y: dx});
      dy_data.push({x: Math.round(t * 1000) / 1000, y: dy});
      ke_data.push({x: Math.round(t * 1000) / 1000, y: KE});
      pe_data.push({x: Math.round(t * 1000) / 1000, y: Math.round(PE)});

      t += dt;
  }
  return {x: x_data, y: y_data, dx: dx_data, dy: dy_data, k: ke_data, p: pe_data};
}


/////////////////////////////////////////////////
/* CANVAS DRAWING STUFF */
/////////////////////////////////////////////////

// get canvas element
var canvas = document.getElementById("canvas");
var save_image = document.getElementById("best-so-far");

// get canvas 2D context and set him correct size
var ctx = canvas.getContext("2d");
ctx.canvas.width = CANVAS_WIDTH;
ctx.canvas.height = CANVAS_HEIGHT;

// last known position
var pos = { x: 0, y: 0 };
var position_data = [];

// parameterized coord -> canvas coord
// function transformXCoord(x) {
//   return x;
// }

// parameterized coord -> canvas coord
function transformYCoord(y) {
  return (CANVAS_HEIGHT - y)/COORD_SCALE;
}

// parameterized coord -> canvas coord
function transformXCoord(x) {
  return x/COORD_SCALE;
}

function startingState(c) {
  const offset = 20;
  const thickness = 3;
  c.fillRect(offset, CANVAS_HEIGHT - offset, CANVAS_WIDTH-2*offset, thickness);   // x axis
  c.fillRect(offset, offset, thickness, CANVAS_HEIGHT-2*offset);   // y axis

  c.fillStyle = "blue";
  c.fillRect(CANVAS_WIDTH/2, CANVAS_HEIGHT - offset - thickness, 9, 9);   // startPoint

  c.fillStyle = "black";
}

// draw axes on load
startingState(ctx);

function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  startingState(ctx);
}

function start(e) {
  clear();
  startingState(ctx);
  setPosition(e);
}

var drawing_data;
function end(e) {
  drawing_data = drawingData(position_data);
  // document.getElementById("debug").innerHTML = JSON.stringify(drawing_data.k);

  setPosition(e);

  plotEnergy(drawing_data);
  plotCoord(drawing_data);
  plotCoordDeriv(drawing_data)

  position_data = [];
}

// new position from mouse event
function setPosition(e) {
  pos.x = e.offsetX;
  pos.y = e.offsetY;
  position_data.push({x: pos.x, y: pos.y});
}

function draw(e) {
  // mouse left button must be pressed
  if (e.buttons !== 1) return;

  ctx.beginPath(); // begin

  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#c0392b";

  ctx.moveTo(pos.x, pos.y); // from
  setPosition(e);
  ctx.lineTo(pos.x, pos.y); // to

  ctx.stroke(); // draw it!
}


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

// X COORDINATES
const coord_input = {
  divID: "#coord-graph",
  svgID: "svg-for-coords",
  domain: {lower: 0, upper: TIME_INTERVAL},
  xLabel: "Time",
  range: {lower: 0, upper: 500/COORD_SCALE},
  yLabel: "Coord"};
const coord_plot = createPlot(coord_input);
var x_coord_line = coord_plot.svg.append("g").attr("id", "x-coord-line");
var y_coord_line = coord_plot.svg.append("g").attr("id", "y-coord-line");

// X DERIVATIVES
const dxdy_input = {
  divID: "#coord-dxdy-graph",
  svgID: "svg-for-dxdy",
  domain: {lower: 0, upper: TIME_INTERVAL},
  xLabel: "Time",
  range: {lower: -300/COORD_SCALE, upper: 300/COORD_SCALE},
  yLabel: "Derivative"};
const dxdy_plot = createPlot(dxdy_input);
var dx_line = dxdy_plot.svg.append("g").attr("id", "dx-line");
var dy_line = dxdy_plot.svg.append("g").attr("id", "dy-line");

// ENERGY
const energy_input = {
  divID: "#energy-graph",
  svgID: "svg-for-energy-plots",
  domain: {lower: 0, upper: TIME_INTERVAL},
  xLabel: "Time",
  range: {lower: -100000/COORD_SCALE**2, upper: 100000/COORD_SCALE**2},
  yLabel: "Energy"};
const energy_plot = createPlot(energy_input);
var ke_line = energy_plot.svg.append("g").attr("id", "ke-line");
var pe_line = energy_plot.svg.append("g").attr("id", "pe-line");


/////////////////////////////////////////////////
/* EVENT LISTENER FUNCTIONS */
/////////////////////////////////////////////////

// update energy plots
function plotEnergy(data) {

  // prepare input
  var input = {
    data: data.k,
    svg: energy_plot.svg,
    line: ke_line,
    xScale: energy_plot.xScale,
    yScale: energy_plot.yScale,
    color: "red"};

  // plot the data
  plotData(input);

  // prepare input
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

// update coord plot
function plotCoord(data) {

  // prepare x inputs
  var input = {
    data: data.x,
    svg: coord_plot.svg,
    line: x_coord_line,
    xScale: coord_plot.xScale,
    yScale: coord_plot.yScale,
    color: "red"};

  // plot the data
  plotData(input);

  // prepare y inputs
  var input = {
    data: data.y,
    svg: coord_plot.svg,
    line: y_coord_line,
    xScale: coord_plot.xScale,
    yScale: coord_plot.yScale,
    color: "blue"};

  // plot the data
  plotData(input);
}

// update coord derivative plot
function plotCoordDeriv(data) {

  // prepare x inputs
  var input = {
    data: data.dx,
    svg: dxdy_plot.svg,
    line: dx_line,
    xScale: dxdy_plot.xScale,
    yScale: dxdy_plot.yScale,
    color: "red"};

  // plot the data
  plotData(input);

  // prepare y inputs
  var input = {
    data: data.dy,
    svg: dxdy_plot.svg,
    line: dy_line,
    xScale: dxdy_plot.xScale,
    yScale: dxdy_plot.yScale,
    color: "blue"};

  // plot the data
  plotData(input);
}

/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mousedown", start);
canvas.addEventListener("mouseup", end);
document.getElementById("clear-canvas").addEventListener("click", clear);
