/////////////////////////////////////////////////
/* PARAMETERS */
/////////////////////////////////////////////////

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const SVG_WIDTH = 300;
const SVG_HEIGHT = 300;
const TRANSITION_TIME = 10; // ms
const TIME_INTERVAL = 5.0;
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


function calculateAction(data) {
 if (!data || data.k.length === 0 || data.p.length === 0) return 0;
  
  let action = 0;
  const n = data.k.length;
  
  // For brachistochrone, we want to minimize time, so action = ∫ dt
  // This is equivalent to ∫ ds/v where ds is path element and v is speed
  
  for (let i = 0; i < n - 1; i++) {
    // Get path length element
    const dx = (data.x[i+1].y - data.x[i].y) * COORD_SCALE;
    const dy = (data.y[i+1].y - data.y[i].y) * COORD_SCALE;
    const ds = Math.sqrt(dx*dx + dy*dy);
    
    // Get speed from kinetic energy: v = √(2T/m)
    const T_avg = (data.k[i].y + data.k[i+1].y) / 2;
    const v_avg = Math.sqrt(2 * T_avg / m);
    
    // Action element: dt = ds/v
    if (v_avg > 0.01) { // Avoid division by zero
      action += ds / v_avg;
    } else {
      action += 99999999999999999999999; // Heavy penalty for near-zero velocity
    }
  }
  
  return action;
}

function drawingData(raw_data, isSolution){
  var smoothed_data;
  //smoothing the brachistochrone data leads to error
  if(!isSolution){
    smoothed_data = smoothPath(raw_data);
  }
  else{
    smoothed_data = (raw_data);
  }
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
    const dx_dt = time_data[i].dx_dt;
    const dy_dt = -time_data[i].dy_dt; // Y is flipped
    
    // Calculate energy using proper velocities
    const KE = 0.5 * m * (dx_dt ** 2 + dy_dt ** 2);
    const PE = m * g * y; // Positive PE since we're measuring from bottom
    const total_energy = KE + PE;
    //console.log(`t=${t.toFixed(2)}s: KE=${KE.toFixed(1)}J, PE=${PE.toFixed(1)}J, Total=${total_energy.toFixed(1)}J`);
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
  const physicalY = position_data.map(pt => transformYCoord(pt.y));
  const y_start = physicalY[0];

  // First point
  time_data.push({
    dt: 0,
    dx_dt: 0,
    dy_dt: 0,
    v: 0,
    height_diff: 0
  });

  for (let i = 0; i < position_data.length - 1; i++) {
    const y_i = physicalY[i];
    const y_i1 = physicalY[i+1];
    
    const drop_i = y_start - y_i;
    const drop_i1 = y_start - y_i1;
    
    const v_i = Math.sqrt(2 * g * Math.max(drop_i, 0.01));
    const v_i1 = Math.sqrt(2 * g * Math.max(drop_i1, 0.01));
    
    const ds = ds_data[i].ds / COORD_SCALE;
    
    // TRAPEZOIDAL RULE FIX: Average of start/end velocities
    const dt_segment = ds * 2 / (v_i + v_i1); 

    // Use velocity at next point for derivatives
    const dx_dt_next = ds_data[i+1]?.dx_ds * v_i1 || ds_data[i].dx_ds * v_i1;
    const dy_dt_next = ds_data[i+1]?.dy_ds * v_i1 || ds_data[i].dy_ds * v_i1;

    time_data.push({
      dt: dt_segment,
      dx_dt: dx_dt_next,
      dy_dt: dy_dt_next,
      v: v_i1,
      height_diff: drop_i1
    });
  }
  
  return time_data;
}

function smoothPath(data, windowSize = 45, sigma = 10) {
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

// Define boundary box
const BOUNDARY_BOX = {
  left: Math.min(startX, endX),
  right: Math.max(startX, endX),
  top: Math.min(startY, endY),
  bottom: Math.max(startY, endY)
};

// Function to constrain coordinates within boundary box
function constrainToBoundary(x, y) {
  return {
    x: Math.max(BOUNDARY_BOX.left, Math.min(BOUNDARY_BOX.right, x)),
    y: Math.max(BOUNDARY_BOX.top, Math.min(BOUNDARY_BOX.bottom, y))
  };
}

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

 

  c.fillStyle = "pink";
  c.fillRect(startX,startY,10,10);
  c.fillRect(endX,endY,10,10);
  
  // Draw boundary box
  c.strokeStyle = "rgba(255, 0, 0, 0.3)";
  c.lineWidth = 2;
  c.strokeRect(BOUNDARY_BOX.left, BOUNDARY_BOX.top, 
               BOUNDARY_BOX.right - BOUNDARY_BOX.left, 
               BOUNDARY_BOX.bottom - BOUNDARY_BOX.top);
  
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
  // Constrain both points to boundary
  const start = constrainToBoundary(x0, y0);
  const end = constrainToBoundary(x1, y1);
  
  // Bresenham's line algorithm to get all pixels between two points
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const sx = start.x < end.x ? 1 : -1;
  const sy = start.y < end.y ? 1 : -1;
  let err = dx - dy;
  
  let x = start.x;
  let y = start.y;
  const endX = end.x;
  const endY = end.y;
  
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
  
  // Get the current mouse position and constrain it
  const constrained = constrainToBoundary(e.offsetX, e.offsetY);
  
  // Draw line from start to current position using drawLineWithPixels
  drawLineWithPixels(startX, startY, constrained.x, constrained.y);
}

function end(e) {
  // Get current mouse position and constrain it
  const constrained = constrainToBoundary(e.offsetX, e.offsetY);
  
  // Draw line from current position to end point using drawLineWithPixels
  drawLineWithPixels(constrained.x, constrained.y, endX, endY);

  drawing_data = drawingData(position_data, false);
  
  console.log(drawing_data)

  plotEnergy(drawing_data);
  plotCoord(drawing_data);
  plotCoordDeriv(drawing_data)

  const action = calculateAction(drawing_data);
 
   const totalTime = calculateTotalTime(position_data)
     document.getElementById("time-details").innerText = 
      `Path completed in ${totalTime.toFixed(3)} seconds with action value ${action.toFixed(2)}`;
    
  position_data = [];
}

// new position from mouse event
function setPosition(e) {
  const constrained = constrainToBoundary(e.offsetX, e.offsetY);
  pos.x = constrained.x;
  pos.y = constrained.y;
}

function draw(e) {
  // mouse left button must be pressed
  if (e.buttons !== 1) return;

  // Constrain the new position to boundary
  const constrained = constrainToBoundary(e.offsetX, e.offsetY);
  
  // Draw line from previous position to current position using drawLineWithPixels
  drawLineWithPixels(pos.x, pos.y, constrained.x, constrained.y);
  
  // Update position
  pos.x = constrained.x;
  pos.y = constrained.y;
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
canvas.addEventListener("mouseup", endWithFullValidation);
document.getElementById("clear-canvas").addEventListener("click", clear);


function calculateTotalTime(raw_data) {
  const smoothed_data = smoothPath(raw_data);
  const ds_data = calculateArcLengthDerivatives(smoothed_data);
  const time_data = calculateProperTimeIntervals(smoothed_data, ds_data);
  
  // Sum all the dt values
  let totalTime = 0;
  for (let i = 0; i < time_data.length; i++) {
    totalTime += time_data[i].dt;
  }
  
  console.log(`Total time: ${totalTime.toFixed(3)} seconds`);
  return totalTime;
}

/////////////////////////////////////////////////
/* BRACHISTOCHRONE CALCULATION AND DRAWING */
/////////////////////////////////////////////////



// Final corrected brachistochrone function
function drawBrachistochrone() {
  clear();
  startingState(ctx);
  
  // COORDINATE SYSTEM SETUP
  // Convert canvas coordinates to physical coordinates for calculation
  // Canvas: (0,0) at top-left, y increases downward
  // Physics: (0,0) at bottom-left, y increases upward
  const x1 = startX / COORD_SCALE;  // Start x in physical units
  const y1 = (CANVAS_HEIGHT - startY) / COORD_SCALE;  // Start y (flipped from canvas)
  const x2 = endX / COORD_SCALE;    // End x in physical units
  const y2 = (CANVAS_HEIGHT - endY) / COORD_SCALE;    // End y (flipped from canvas)
  
  // PROBLEM GEOMETRY
  const dx = x2 - x1;  // Horizontal displacement (can be positive or negative)
  const dy = y1 - y2;  // Vertical drop (must be positive for physical solution)
  
  // EDGE CASE: No gravitational potential energy available
  // If end point is at same height or higher, brachistochrone doesn't exist
  if (dy <= 0) {
    // Fall back to straight line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 3;
    ctx.stroke();
    document.getElementById("time-details").innerText = 
        "End point must be below start point. Using straight line.";
    return;
  }
  
  // BRACHISTOCHRONE MATHEMATICS
  // The brachistochrone is a cycloid: the curve traced by a point on a circle rolling along a line
  // Parametric equations: x(t) = R(t - sin(t)), y(t) = R(1 - cos(t))
  // where R is the radius and t is the parameter (angle)
  
  const Dx = Math.abs(dx);      // Absolute horizontal distance
  const x_sign = Math.sign(dx); // Direction of horizontal movement (+1 right, -1 left)
  
  // SOLVING FOR THE CYCLOID PARAMETER
  // For a cycloid connecting two specific points, we need to solve:
  // (θ - sin(θ)) / (1 - cos(θ)) = Dx/dy
  // This equation comes from the constraint that the curve must pass through both endpoints
  // θ is the total angle parameter at the end point
  
  let theta = Math.PI;  // Initial guess (semicircle)
  const tolerance = 1e-10;  // Numerical precision
  
  // Newton-Raphson iteration to solve the transcendental equation
  for (let iter = 0; iter < 100; iter++) {
    // f(θ) = (θ - sin(θ)) - (Dx/dy)(1 - cos(θ)) = 0
    const f = (theta - Math.sin(theta)) - (Dx/dy) * (1 - Math.cos(theta));
    
    // f'(θ) = (1 - cos(θ)) - (Dx/dy)sin(θ)
    const df = 1 - Math.cos(theta) - (Dx/dy) * Math.sin(theta);
    
    // Check for convergence
    if (Math.abs(f) < tolerance) break;
    if (Math.abs(df) < 1e-12) break;  // Avoid division by zero
    
    // Newton-Raphson step: θ_new = θ_old - f(θ)/f'(θ)
    const step = f / df;
    theta = Math.max(0.1, Math.min(2*Math.PI - 0.1, theta - step));
  }
  
  // CALCULATE CYCLOID RADIUS
  // Once we have θ, we can find R from the constraint equation
  // R = dy / (1 - cos(θ))
  const R = dy / (1 - Math.cos(theta));
  
  // GENERATE CURVE POINTS
  // Create discrete points along the brachistochrone curve
  const points = [];
  const steps = 200;  // Number of points for smooth curve
  
  for (let i = 0; i <= steps; i++) {
    // Parameter t goes from 0 to θ
    const t = (i / steps) * theta;
    
    // CYCLOID PARAMETRIC EQUATIONS
    // x(t) = x1 + sign(dx) * R * (t - sin(t))
    // y(t) = y1 - R * (1 - cos(t))
    const x_phys = x1 + x_sign * R * (t - Math.sin(t));
    const y_phys = y1 - R * (1 - Math.cos(t));
    
    // Convert back to canvas coordinates for drawing
    const x_canvas = x_phys * COORD_SCALE;
    const y_canvas = CANVAS_HEIGHT - (y_phys * COORD_SCALE);  // Flip y-axis back
    
    points.push({x: x_canvas, y: y_canvas});
  }
  
  // DRAW THE BRACHISTOCHRONE CURVE
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // PHYSICS ANALYSIS
  // Calculate the time using energy conservation and numerical integration
  const cycloidData = drawingData(points, true);  // Generate physics data
  const trueTime = calculateTotalTime(points);    // Integrate dt = ds/v
  const action = calculateAction(cycloidData);    // Calculate action integral
  
  // Store for comparison with user-drawn paths
  window.trueBrachistochroneTime = trueTime;
  
  // Display results
  document.getElementById("time-details").innerText = 
    `True Brachistochrone: ${trueTime.toFixed(4)}s, Action = ${action.toFixed(2)}`;
  
  // Update all physics plots
  plotEnergy(cycloidData);
  plotCoord(cycloidData);
  plotCoordDeriv(cycloidData);
}

function endWithComparison(e) {
  // Get current mouse position and constrain it
  const constrained = constrainToBoundary(e.offsetX, e.offsetY);
  
  // Draw line from current position to end point using drawLineWithPixels
  drawLineWithPixels(constrained.x, constrained.y, endX, endY);

  drawing_data = drawingData(position_data, false);
  
  plotEnergy(drawing_data);
  plotCoord(drawing_data);
  plotCoordDeriv(drawing_data);
  validateManualPath(drawing_data);
  const action = calculateAction(drawing_data);
  const totalTime = calculateTotalTime(position_data);
  
  // Compare with true brachistochrone time
  let comparison = "";
  if (window.trueBrachistochroneTime) {
    const timeDiff = totalTime - window.trueBrachistochroneTime;
    if (timeDiff < -0.00000001) {
      comparison = ` (${Math.abs(timeDiff).toFixed(3)}s FASTER than brachistochrone - check physics!)`;
    } else if (timeDiff > 0.00000001) {
      comparison = ` (${timeDiff.toFixed(3)}s slower than brachistochrone)`;
    } else {
      comparison = ` (matches brachistochrone!)`;
    }
  }
  
  document.getElementById("time-details").innerText = 
    `Your path: ${totalTime.toFixed(4)}s, Action = ${action.toFixed(2)}${comparison}`;
  
  position_data = [];
}

function validateManualPath(data) {
  console.log("=== VALIDATING MANUAL PATH ===");
  
  let energyViolations = 0;
  let initialEnergy = null;
  
  for (let i = 0; i < data.k.length; i++) {
    const KE = data.k[i].y;
    const PE = data.p[i].y;
    const totalE = KE + PE;
    
    if (initialEnergy === null) {
      initialEnergy = totalE;
    } else {
      const energyError = Math.abs(totalE - initialEnergy);
      if (energyError > 1.0) { // Allow for some numerical error
        energyViolations++;
      }
    }
    
    // Check for negative kinetic energy
    if (KE < -0.01) {
      console.log(`WARNING: Negative KE at t=${data.k[i].x}: ${KE}`);
    }
  }
  
  console.log(`Energy violations: ${energyViolations}/${data.k.length}`);
  
  if (energyViolations > data.k.length * 0.1) {
    console.log("WARNING: Significant energy conservation violations!");
    console.log("Manual path may be violating physics.");
  }
  
  return energyViolations;
}

// The issue: Your brachistochrone has discretization errors!
// From the Stanford paper, we learn that:
// 1. Linear interpolation introduces significant errors
// 2. Uniform sampling in parameter space is suboptimal
// 3. The optimal sampling should follow curvature (equal angles φ)


// Modified end function with comprehensive validation
function endWithFullValidation(e) {
  const constrained = constrainToBoundary(e.offsetX, e.offsetY);
  drawLineWithPixels(constrained.x, constrained.y, endX, endY);


  
  drawing_data = drawingData(position_data, false);
  
  plotEnergy(drawing_data);
  plotCoord(drawing_data);
  plotCoordDeriv(drawing_data);
  
  const action = calculateAction(drawing_data);
  const totalTime = calculateTotalTime(position_data);
  
  // Compare with brachistochrone
  let comparison = "";
  if (window.trueBrachistochroneTime) {
    const timeDiff = totalTime - window.trueBrachistochroneTime;
    if (timeDiff < -0.001) {
      comparison = ` ⚠️ FASTER than brachistochrone by ${Math.abs(timeDiff).toFixed(4)}s - PHYSICS VIOLATION!`;
    } else if (timeDiff > 0.001) {
      comparison = ` (${timeDiff.toFixed(4)}s slower)`;
    } else {
      comparison = ` (≈ brachistochrone)`;
    }
  }
  
 
  
  document.getElementById("time-details").innerText = 
    `Your path: ${totalTime.toFixed(4)}s, Action = ${action.toFixed(2)}${comparison}`;
  
  position_data = [];
}

// Add button event listener
document.getElementById("draw-brachistochrone").addEventListener("click", drawBrachistochrone);