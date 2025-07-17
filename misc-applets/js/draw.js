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
const startX = 20;
const startY = 20;
const endX = 480;
const endY = 480

/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

// function drawingData(raw_data){
//   const smoothed_data = smoothPath(raw_data);
//   console.log(smoothed_data);
  
//   const dt = TIME_INTERVAL / (smoothed_data.length - 1);
//   var t = 0;
//   x_data = [];
//   y_data = [];
//   dx_data = [];
//   dy_data = [];
//   ke_data = [];
//   pe_data = [];
  
//   // First pass: calculate derivatives in original coordinate space
//   var dx_raw = [];
//   var dy_raw = [];
  
//   for (var i = 0; i < smoothed_data.length; i++) {
//     var dx, dy;
    
//     if (i == 0) {
//       // Forward difference - use more stable 2-point formula
//       dx = (smoothed_data[i+1].x - smoothed_data[i].x) / dt;
//       dy = (smoothed_data[i+1].y - smoothed_data[i].y) / dt;
//     } else if (i == smoothed_data.length - 1) {
//       // Backward difference - use more stable 2-point formula
//       dx = (smoothed_data[i].x - smoothed_data[i-1].x) / dt;
//       dy = (smoothed_data[i].y - smoothed_data[i-1].y) / dt;
//     } else {
//       // Central difference for middle points
//       dx = (smoothed_data[i+1].x - smoothed_data[i-1].x) / (2 * dt);
//       dy = (smoothed_data[i+1].y - smoothed_data[i-1].y) / (2 * dt);
//     }
    
//     dx_raw.push(dx);
//     dy_raw.push(dy);
//   }
  
//   // Second pass: transform coordinates and apply coordinate scaling to derivatives
//   for (var i = 0; i < smoothed_data.length; i++) {
//     // Transform coordinates for display
//     var x = transformXCoord(smoothed_data[i].x);
//     var y = transformYCoord(smoothed_data[i].y);
    
//     // Transform derivatives (apply same scaling as coordinates)
//     var dx = dx_raw[i] / COORD_SCALE;  // dx in transformed space
//     var dy = -dy_raw[i] / COORD_SCALE; // dy in transformed space (note: Y is flipped)
    
//     // Calculate energy using transformed derivatives
//     var KE = 0.5 * m * (dx ** 2 + dy ** 2);
//     var PE = -1 * m * g * y;
    
//     x_data.push({x: Math.round(t * 1000) / 1000, y: x});
//     y_data.push({x: Math.round(t * 1000) / 1000, y: y});
//     dx_data.push({x: Math.round(t * 1000) / 1000, y: dx});
//     dy_data.push({x: Math.round(t * 1000) / 1000, y: dy});
//     ke_data.push({x: Math.round(t * 1000) / 1000, y: KE});
//     pe_data.push({x: Math.round(t * 1000) / 1000, y: Math.round(PE)});
    
//     t += dt;
//   }
  
//   return {x: x_data, y: y_data, dx: dx_data, dy: dy_data, k: ke_data, p: pe_data};
// }

function drawingData(raw_data){
  const smoothed_data = smoothPath(raw_data);
  console.log(smoothed_data);
  
  // Calculate arc length derivatives first
  const ds_data = calculateArcLengthDerivatives(smoothed_data);
  
  // Calculate proper time intervals using energy conservation
  const time_data = calculateProperTimeIntervals(smoothed_data, ds_data);
  
  let t = 0;
  const x_data = [];
  const y_data = [];
  const dx_data = [];
  const dy_data = [];
  const ke_data = [];
  const pe_data = [];
  
  for (let i = 0; i < smoothed_data.length; i++) {
    // Transform coordinates for display
    const x = transformXCoord(smoothed_data[i].x);
    const y = transformYCoord(smoothed_data[i].y);
    
    // Get time derivatives (velocities)
    const dx_dt = time_data[i].dx_dt / COORD_SCALE;
    const dy_dt = -time_data[i].dy_dt / COORD_SCALE; // Y is flipped
    
    // Calculate energy using proper velocities
    const KE = 0.5 * m * (dx_dt ** 2 + dy_dt ** 2);
    const PE = m * g * y; // Positive PE since we're measuring from bottom
    
    x_data.push({x: Math.round(t * 1000) / 1000, y: x});
    y_data.push({x: Math.round(t * 1000) / 1000, y: y});
    dx_data.push({x: Math.round(t * 1000) / 1000, y: dx_dt});
    dy_data.push({x: Math.round(t * 1000) / 1000, y: dy_dt});
    ke_data.push({x: Math.round(t * 1000) / 1000, y: KE});
    pe_data.push({x: Math.round(t * 1000) / 1000, y: PE});
    
    t += time_data[i].dt;
  }
  
  return {x: x_data, y: y_data, dx: dx_data, dy: dy_data, k: ke_data, p: pe_data};
}

function calculateArcLengthDerivatives(data) {
  const ds_data = [];
  
  for (let i = 0; i < data.length; i++) {
    let dx_ds, dy_ds;
    
    if (i === 0) {
      dx_ds = data[i+1].x - data[i].x;
      dy_ds = data[i+1].y - data[i].y;
    } else if (i === data.length - 1) {
      dx_ds = data[i].x - data[i-1].x;
      dy_ds = data[i].y - data[i-1].y;
    } else {
      dx_ds = (data[i+1].x - data[i-1].x) / 2;
      dy_ds = (data[i+1].y - data[i-1].y) / 2;
    }
    
    const ds = Math.sqrt(dx_ds ** 2 + dy_ds ** 2);
    
    ds_data.push({
      dx_ds: ds > 0 ? dx_ds / ds : 0,
      dy_ds: ds > 0 ? dy_ds / ds : 0,
      ds: ds
    });
  }
  
  return ds_data;
}

function calculateProperTimeIntervals(position_data, ds_data) {
  const time_data = [];
  
  // Starting height in transformed coordinates
  const y_start = transformYCoord(position_data[0].y);
  
  for (let i = 0; i < position_data.length; i++) {
    const y_current = transformYCoord(position_data[i].y);
    
    // Energy conservation: v² = 2g(y_start - y_current)
    // Note: y_start should be higher than y_current for energy to be positive
    const height_diff = y_start - y_current;
    
    let v_squared;
    if (height_diff > 0) {
      v_squared = 2 * g * height_diff;
    } else {
      // If we're at or above starting height, use minimum velocity
      v_squared = 0.1; // Small non-zero value to avoid division by zero
    }
    
    const v = Math.sqrt(v_squared);
    
    // Calculate dt = ds/v
    const ds = ds_data[i].ds / COORD_SCALE; // Convert to physical units
    const dt = ds > 0 ? ds / v : 0;
    
    // Calculate velocity components: dx/dt = (dx/ds) * (ds/dt) = (dx/ds) * v
    const dx_dt = ds_data[i].dx_ds * v;
    const dy_dt = ds_data[i].dy_ds * v;
    
    time_data.push({
      dt: dt,
      dx_dt: dx_dt,
      dy_dt: dy_dt,
      v: v,
      height_diff: height_diff
    });
  }
  
  return time_data;
}

function smoothPath(data, windowSize = 75, sigma = 10) {
  if (data.length < 3) return data;

  const halfWindow = Math.floor(windowSize / 2);
  
  // Pad the data at both ends
  const paddedData = [];
  
  // Add padding at the beginning (reflect the data)
  for (let i = halfWindow; i > 0; i--) {
    const idx = Math.min(i, data.length - 1);
    paddedData.push({
      x: 2 * data[0].x - data[idx].x,
      y: 2 * data[0].y - data[idx].y
    });
  }
  
  // Add original data
  paddedData.push(...data);
  
  // Add padding at the end (reflect the data)
  for (let i = 1; i <= halfWindow; i++) {
    const idx = Math.max(data.length - 1 - i, 0);
    const lastIdx = data.length - 1;
    paddedData.push({
      x: 2 * data[lastIdx].x - data[idx].x,
      y: 2 * data[lastIdx].y - data[idx].y
    });
  }

  // Generate Gaussian weights
  const weights = [];
  for (let i = -halfWindow; i <= halfWindow; i++) {
    weights.push(Math.exp(-(i ** 2) / (2 * sigma ** 2)));
  }

  const smoothed = [];

  // Apply smoothing to the original data range
  for (let i = halfWindow; i < halfWindow + data.length; i++) {
    let sumX = 0;
    let sumY = 0;
    let sumW = 0;

    for (let j = -halfWindow; j <= halfWindow; j++) {
      const idx = i + j;
      const weight = weights[j + halfWindow];
      sumX += paddedData[idx].x * weight;
      sumY += paddedData[idx].y * weight;
      sumW += weight;
    }

    smoothed.push({
      x: sumX / sumW,
      y: sumY / sumW,
    });
  }
  
  return smoothed;
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
  c.fillStyle = "black";
  c.fillRect(offset, CANVAS_HEIGHT - offset, CANVAS_WIDTH-2*offset, thickness);   // x axis
  c.fillRect(offset, offset, thickness, CANVAS_HEIGHT-2*offset);   // y axis

  c.fillStyle = "blue";
  c.fillRect(CANVAS_WIDTH/2, CANVAS_HEIGHT - offset - thickness, 9, 9);   // startPoint

  c.fillStyle = "pink";
  c.fillRect(startX,startY,10,10);
  c.fillRect(endX,endY,10,10);
  c.fillStyle = "black";
}

// draw axes on load
startingState(ctx);

function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  startingState(ctx);
  
  // Clear all existing plots
  d3.selectAll(".plot").remove();
  
  // Recreate plots
  createAllPlots();
}

// Modified drawLineWithPixels function to also draw on canvas
function drawLineWithPixels(x0, y0, x1, y1) {
  // Bresenham's line algorithm to get all pixels between two points
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  
  let x = (x0);
  let y = (y0);
  const endX = (x1);
  const endY = (y1);
  
  // Set drawing style
  ctx.fillStyle = "#c0392b";
  
  while (true) {
    // Draw pixel on canvas (make it slightly thicker for visibility)
    ctx.fillRect(Math.round(x-1), Math.round(y-1), 3, 3);
    
    // Add current pixel to position_data (skip if it's the starting point we already added)
    if (!(x === startX && y === startY)) {
      position_data.push({x: x, y: y});
    }
    
    // Check if we've reached the end point
    if (x === endX && y === endY) break;
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

var drawing_data;

function start(e) {
  clear();
  startingState(ctx);
  setPosition(e);
  
  // Clear position_data and add starting point
  position_data = [];
  position_data.push({x: startX, y: startY});
  
  // Get the current mouse position
  const currentX = e.offsetX;
  const currentY = e.offsetY;
  
  // Draw line from start to current position using drawLineWithPixels
  drawLineWithPixels(startX, startY, currentX, currentY);
}

function end(e) {
  // Get current mouse position
  const currentX = e.offsetX;
  const currentY = e.offsetY;
  
  // Draw line from current position to end point using drawLineWithPixels
  drawLineWithPixels(currentX, currentY, endX, endY);

  drawing_data = drawingData(position_data);
  
  console.log(drawing_data)

  plotEnergy(drawing_data);
  plotCoord(drawing_data);
  plotCoordDeriv(drawing_data)

  position_data = [];
}

// new position from mouse event
function setPosition(e) {
  pos.x = e.offsetX;
  pos.y = e.offsetY;
}

function draw(e) {
  // mouse left button must be pressed
  if (e.buttons !== 1) return;

  const newX = e.offsetX;
  const newY = e.offsetY;
  
  // Draw line from previous position to current position using drawLineWithPixels
  drawLineWithPixels(pos.x, pos.y, newX, newY);
  
  // Update position
  pos.x = newX;
  pos.y = newY;
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

// Global plot variables
var coord_plot, dxdy_plot, energy_plot;
var x_coord_line, y_coord_line, dx_line, dy_line, ke_line, pe_line;

function createAllPlots() {
  // X COORDINATES
  const coord_input = {
    divID: "#coord-graph",
    svgID: "svg-for-coords",
    domain: {lower: 0, upper: TIME_INTERVAL},
    xLabel: "Time",
    range: {lower: 0, upper: 500/COORD_SCALE},
    yLabel: "Coord"};
  coord_plot = createPlot(coord_input);
  x_coord_line = coord_plot.svg.append("g").attr("id", "x-coord-line");
  y_coord_line = coord_plot.svg.append("g").attr("id", "y-coord-line");

  // X DERIVATIVES
  const dxdy_input = {
    divID: "#coord-dxdy-graph",
    svgID: "svg-for-dxdy",
    domain: {lower: 0, upper: TIME_INTERVAL},
    xLabel: "Time",
    range: {lower: -300/COORD_SCALE, upper: 300/COORD_SCALE},
    yLabel: "Derivative"};
  dxdy_plot = createPlot(dxdy_input);
  dx_line = dxdy_plot.svg.append("g").attr("id", "dx-line");
  dy_line = dxdy_plot.svg.append("g").attr("id", "dy-line");

  // ENERGY
  const energy_input = {
    divID: "#energy-graph",
    svgID: "svg-for-energy-plots",
    domain: {lower: 0, upper: TIME_INTERVAL},
    xLabel: "Time",
    range: {lower: -100000/COORD_SCALE**2, upper: 100000/COORD_SCALE**2},
    yLabel: "Energy"};
  energy_plot = createPlot(energy_input);
  ke_line = energy_plot.svg.append("g").attr("id", "ke-line");
  pe_line = energy_plot.svg.append("g").attr("id", "pe-line");
}

// Initialize plots
createAllPlots();

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