/**
 * Orbital Mechanics Visualization Applet
 * 
 * This application visualizes orbital motion with real-time energy analysis.
 * It demonstrates conservation of energy, kinetic energy components, and
 * the relationship between orbital parameters and energy.
 * 
 * @author Harvey Mudd College
 * @version 1.0
 */

/////////////////////////////////////////////////
/* CONSTANTS AND CONFIGURATION */
/////////////////////////////////////////////////

// Physical constants
const G = 6.7e-11;                    // Gravitational constant (m³/kg·s²)
const SUN_MASS = 2e30;                // Mass of the Sun (kg)
const EARTH_MASS = 6e24;              // Mass of the Earth (kg)
const MU = (SUN_MASS * EARTH_MASS) / (SUN_MASS + EARTH_MASS); // Reduced mass

// Visual constants
const NUM_STARS = 300;

// Animation and display constants
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;
const SVG_WIDTH = 300;
const SVG_HEIGHT = 300;
const DT = 31560;                     // Time step for animation
const FRAME_RATE = 100;               // Animation frame rate (ms) - much slower default
const TRANSITION_TIME = 10;           // D3 transition duration (ms)

// Scaling factors for visualization
const SCALE_R = 1e11;                 // Scale factor for radius (m to AU)
const SCALE_ENERGY = 1e32;            // Unified scale factor for all energy components

// Graph dimensions and margins
const GRAPH_MARGIN = { 
    top: 20, 
    right: 20, 
    bottom: 50, 
    left: 60 
};
const GRAPH_WIDTH = SVG_WIDTH - GRAPH_MARGIN.left - GRAPH_MARGIN.right;
const GRAPH_HEIGHT = SVG_HEIGHT - GRAPH_MARGIN.top - GRAPH_MARGIN.bottom;

/////////////////////////////////////////////////
/* GLOBAL STATE VARIABLES */
/////////////////////////////////////////////////

// Orbital parameters (initialized from HTML sliders)
let epsilon = parseFloat(document.getElementById("epsilon-slider").getAttribute("value"));
let L = parseFloat(document.getElementById("L-slider").getAttribute("value")) * 1e40; // Angular momentum (kg·m²/s)

// Calculated orbital properties
let energy = (epsilon ** 2 - 1) * ((G * SUN_MASS * EARTH_MASS * EARTH_MASS) / 2 / (L ** 2));
let r_min = (L) ** 2 / (G * SUN_MASS * EARTH_MASS * EARTH_MASS);
let r_max = (L) ** 2 / (G * SUN_MASS * EARTH_MASS * EARTH_MASS) * (1 / (1 - epsilon));

// Animation state
let phi = 0;                          // Current angular position (radians)
let time = 0;                         // Elapsed time

// Data arrays for plotting
let pe_data = [];                     // Potential energy data
let radial_ke_data = [];              // Radial kinetic energy data
let orbital_ke_data = [];             // Orbital kinetic energy data

/////////////////////////////////////////////////
/* STARS BACKGROUND */
/////////////////////////////////////////////////

function drawStars() {
  const canvas = document.getElementById("star-background");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext("2d");

  let stars = [];
  for (let i = 0; i < NUM_STARS; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      phase: Math.random() * Math.PI * 2,  // initial offset between 0 and 2pi (full sine wave)
      speed: Math.random() * 0.5 + 0.5  // how fast star twinkles 0.5 - 1.0 radians/second
    });
  }

  function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#182030";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const now = performance.now() / 1000; // returns time elapsed in seconds
    for (let star of stars) {
      const opacity = 0.3 + 0.7 * Math.abs(Math.sin(now * star.speed + star.phase));
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
      ctx.fill();
    }
    requestAnimationFrame(animateStars);
  }

  animateStars();
}

/////////////////////////////////////////////////
/* GRAPH CREATION AND MANAGEMENT */
/////////////////////////////////////////////////

/**
 * Creates a D3 plot with axes, labels, and basic styling
 * @param {Object} config - Plot configuration object
 * @param {string} config.divID - CSS selector for the container
 * @param {string} config.svgID - ID for the SVG element
 * @param {Object} config.domain - X-axis domain {lower, upper}
 * @param {Object} config.range - Y-axis range {lower, upper}
 * @param {string} config.xLabel - X-axis label
 * @param {string} config.yLabel - Y-axis label
 * @returns {Object} Plot object with SVG, xScale, and yScale
 */
function createPlot(config) {
    // Create SVG container
    const svg = d3
        .select(config.divID)
    .append("svg")
        .attr("width", GRAPH_WIDTH + GRAPH_MARGIN.left + GRAPH_MARGIN.right)
        .attr("height", GRAPH_HEIGHT + GRAPH_MARGIN.top + GRAPH_MARGIN.bottom)
        .attr("id", config.svgID)
    .attr("class", "plot")
    .append("g")
        .attr("transform", `translate(${GRAPH_MARGIN.left}, ${GRAPH_MARGIN.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
        .domain([config.domain.lower, config.domain.upper])
        .range([0, GRAPH_WIDTH]);

    const yScale = d3.scaleLinear()
        .domain([config.range.lower, config.range.upper])
        .range([GRAPH_HEIGHT, 0]);

    // Add X-axis
  const initialZeroY = yScale(0);
  svg.append("g")
    .attr("transform", `translate(0, ${initialZeroY})`)
    .attr("class", "myXaxis")
    .call(d3.axisBottom(xScale));

    // Add X-axis label
  svg.append("text")
    .attr("text-anchor", "end")
        .attr("x", GRAPH_WIDTH)
        .attr("y", GRAPH_HEIGHT + GRAPH_MARGIN.top + 20)
        .text(config.xLabel);

    // Add Y-axis
  svg.append("g")
        .attr("class", "myYaxis")
    .call(d3.axisLeft(yScale));

    // Add Y-axis label
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
        .attr("y", -GRAPH_MARGIN.left + 20)
        .attr("x", -GRAPH_MARGIN.top)
        .text(config.yLabel);

    return { svg: svg, xScale: xScale, yScale: yScale };
}

/**
 * Plots data as a line on a given plot
 * @param {Object} plot - Plot object with SVG and scales
 * @param {Array} data - Array of {x, y} data points
 * @param {string} color - Line color
 * @param {string} lineGroupId - ID for the line group
 */
function plotLine(plot, data, color, lineGroupId) {
    const lineGroup = plot.svg.select(`#${lineGroupId}`).empty() ? 
        plot.svg.append('g').attr('id', lineGroupId) : 
        plot.svg.select(`#${lineGroupId}`);

    const line = d3.line()
        .x(d => plot.xScale(d.x))
        .y(d => plot.yScale(d.y));

    const u = lineGroup.selectAll(".line").data([data], d => plot.xScale(d.x));
    
    u.enter()
        .append("path")
        .attr("class", "line")
        .merge(u)
        .transition()
        .duration(TRANSITION_TIME)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1.5);
}

// After plotLine function, add the styleAxes helper:
function styleAxes(plot) {
  plot.svg.selectAll(".domain, .tick line")
    .attr("stroke", "#EEEEEE");
  plot.svg.selectAll("text")
    .attr("fill", "#EEEEEE");
}

/////////////////////////////////////////////////
/* PLOT INSTANCES */
/////////////////////////////////////////////////

// Potential Energy Plot
const potentialEnergyPlot = createPlot({
  divID: "#potential-energy-graph",
  svgID: "svg-for-potential-energy-plot",
  domain: { lower: 0, upper: 10 },
  range: { lower: -40, upper: 2 },
  xLabel: "Radius (AU × 10³)",
  yLabel: "Potential Energy (J × 10^32)"
});
styleAxes(potentialEnergyPlot);

// Radial Kinetic Energy Plot
const radialKineticEnergyPlot = createPlot({
  divID: "#radial-kinetic-graph",
  svgID: "svg-for-kinetic-energy-plot",
  domain: { lower: 0, upper: 10 },
  range: { lower: 0, upper: 10 },
  xLabel: "Radius (AU)",
  yLabel: "Radial Kinetic Energy (J × 10^32)"
});
styleAxes(radialKineticEnergyPlot);

// Orbital Kinetic Energy Plot
const orbitalKineticEnergyPlot = createPlot({
  divID: "#orbital-kinetic-graph",
  svgID: "svg-for-orbital-kinetic-energy-plot",
  domain: { lower: 0, upper: 4 },
  range: { lower: 0, upper: 3 },
  xLabel: "Radius (AU)",
  yLabel: "Orbital Kinetic Energy (J × 10^32)"
});
styleAxes(orbitalKineticEnergyPlot);

// Total Energy Plot
const totalEnergyPlot = createPlot({
  divID: "#total-energy-graph",
  svgID: "svg-for-total-energy-plot",
  domain: { lower: 0, upper: 10 },
  range: { lower: -40, upper: 2 },
  xLabel: "Radius (AU)",
  yLabel: "Energy (J × 10^32)"
});
styleAxes(totalEnergyPlot);

/////////////////////////////////////////////////
/* VISUAL ELEMENTS */
/////////////////////////////////////////////////

// Potential energy moving point
const pePoint = potentialEnergyPlot.svg.append("circle")
    .attr("id", "potential-energy-point")
    .attr("r", 4)
    .attr("fill", "#00BFFF")
    .attr("visibility", "visible");

// Total energy graph elements
const tePePoint = totalEnergyPlot.svg.append("circle")
    .attr("id", "total-energy-pe-point")
    .attr("r", 4)
    .attr("fill", "#00BFFF")

    .attr("visibility", "visible");

const teRadialBar = totalEnergyPlot.svg.append("rect")
    .attr("id", "total-energy-radial-bar")
    .attr("x", 0)
    .attr("width", 15)
    .attr("y", 0)
    .attr("height", 0)
    .attr("fill", "#FFB347")
    .attr("opacity", 0.8);

const teOrbitalBar = totalEnergyPlot.svg.append("rect")
    .attr("id", "total-energy-orbital-bar")
    .attr("x", 0)
    .attr("width", 15)
    .attr("y", 0)
    .attr("height", 0)
    .attr("fill", "#B266FF")
    .attr("opacity", 0.8);

const teTotalLine = totalEnergyPlot.svg.append("line")
    .attr("id", "total-energy-line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", 0)
    .attr("stroke", "#FF1744")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5,5");

// Kinetic energy bars for individual plots
radialKineticEnergyPlot.svg.append("rect")
  .attr("id", "kinetic-energy-bar")
  .attr("x", 0)
  .attr("width", 20)
    .attr("y", radialKineticEnergyPlot.yScale(0))
  .attr("height", 0)
  .attr("fill", "#FFB347");

orbitalKineticEnergyPlot.svg.append("rect")
  .attr("id", "orbital-kinetic-energy-bar")
  .attr("x", 0)
  .attr("width", 20)
    .attr("y", orbitalKineticEnergyPlot.yScale(0))
  .attr("height", 0)
  .attr("fill", "#B266FF");

/////////////////////////////////////////////////
/* ORBITAL CALCULATIONS */
/////////////////////////////////////////////////

/**
 * Calculates the radial distance for a given angular position
 * @param {number} phi - Angular position (radians)
 * @returns {number} Radial distance (meters)
 */
function calculateRadius(phi) {
    return (L * L) / (G * SUN_MASS * EARTH_MASS * EARTH_MASS * (1 + epsilon * Math.cos(phi)));
}

/**
 * Calculates the angular velocity for a given radius
 * @param {number} r - Radial distance (meters)
 * @returns {number} Angular velocity (radians/second)
 */
function calculateAngularVelocity(r) {
    return L / (EARTH_MASS * r * r);
}

/**
 * Calculates the radial velocity component
 * @param {number} r - Radial distance (meters)
 * @param {number} phi - Angular position (radians)
 * @param {number} dphidt - Angular velocity (radians/second)
 * @returns {number} Radial velocity (meters/second)
 */
function calculateRadialVelocity(r, phi, dphidt) {
    const dr_dphi = (r * epsilon * Math.sin(phi)) / (1 + epsilon * Math.cos(phi));
    return dr_dphi * dphidt;
}

/**
 * Calculates potential energy at a given radius
 * @param {number} r - Radial distance (meters)
 * @returns {number} Potential energy (Joules)
 */
function calculatePotentialEnergy(r) {
    return -(G * EARTH_MASS * SUN_MASS) / r;
}

/**
 * Calculates radial kinetic energy
 * @param {number} drdt - Radial velocity (meters/second)
 * @returns {number} Radial kinetic energy (Joules)
 */
function calculateRadialKineticEnergy(drdt) {
    return 0.5 * EARTH_MASS * (drdt * drdt);
}

/**
 * Calculates orbital kinetic energy
 * @param {number} r - Radial distance (meters)
 * @returns {number} Orbital kinetic energy (Joules)
 */
function calculateOrbitalKineticEnergy(r) {
    return 0.5 * L * L / (EARTH_MASS * r * r);
}

/////////////////////////////////////////////////
/* DATA GENERATION */
/////////////////////////////////////////////////

/**
 * Generates potential energy data for plotting
 */
function generatePotentialEnergyData() {
    pe_data = [];
    
  if (!isFinite(r_min) || !isFinite(r_max) || r_max <= r_min) {
    return;
  }
    
  const N = 400;
    const r_start = Math.max(0.1 * r_max, 1e9); // Avoid zero
    
  for (let i = 0; i <= N; i++) {
        const r = r_start + (4 * r_max - r_start) * (i / N);
        const Ueff = calculatePotentialEnergy(r);
        
    pe_data.push({ 
            x: r / SCALE_R,
            y: Ueff / SCALE_ENERGY
        });
    }
    
    // Update plot scales
    potentialEnergyPlot.xScale.domain([0, 10]);
    potentialEnergyPlot.yScale.domain([-40, 2]);
    
    potentialEnergyPlot.svg.select(".myXaxis")
      .transition()
      .duration(TRANSITION_TIME)
        .call(d3.axisBottom(potentialEnergyPlot.xScale));
        
    potentialEnergyPlot.svg.select(".myYaxis")
    .transition()
    .duration(TRANSITION_TIME)
        .call(d3.axisLeft(potentialEnergyPlot.yScale));
}

// Helper to generate kinetic energy data (radial or orbital)
function generateKineticEnergyData(type) {
  const data = [];
  let phi = 0;
  const maxPhi = 2 * Math.PI * 1.2;
  const dphi = 0.001;
  while (phi <= maxPhi) {
    const r = calculateRadius(phi);
    let ke;
    if (type === 'radial') {
      const dphidt = calculateAngularVelocity(r);
      const drdt = calculateRadialVelocity(r, phi, dphidt);
      ke = calculateRadialKineticEnergy(drdt);
    } else if (type === 'orbital') {
      ke = calculateOrbitalKineticEnergy(r);
    }
    data.push({ x: r / SCALE_R, y: ke / SCALE_ENERGY });
    phi += dphi;
  }
  return data;
}

// Helper to update a D3 plot with new data
function updatePlot(plot, data, color, lineGroupId) {
  const zeroY = plot.yScale(0);
  plot.svg.select('.myXaxis')
    .transition()
    .duration(TRANSITION_TIME)
    .attr('transform', `translate(0, ${zeroY})`)
    .call(d3.axisBottom(plot.xScale));
  plotLine(plot, data, color, lineGroupId);
}

// Generate and update all plots
function regenerateAllDataAndPlots() {
  generatePotentialEnergyData();
  radial_ke_data = generateKineticEnergyData('radial');
  orbital_ke_data = generateKineticEnergyData('orbital');
  updatePotentialEnergyPlot();
  updateTotalEnergyPotentialPlot();
  updateRadialKineticEnergyPlot();
  updateOrbitalKineticEnergyPlot();
}

/////////////////////////////////////////////////
/* PLOT UPDATES */
/////////////////////////////////////////////////

/**
 * Updates the potential energy plot with new data
 */
function updatePotentialEnergyPlot() {
    const zeroY = potentialEnergyPlot.yScale(0);
    potentialEnergyPlot.svg.select(".myXaxis")
        .transition()
        .duration(TRANSITION_TIME)
        .attr("transform", `translate(0, ${zeroY})`)
        .call(d3.axisBottom(potentialEnergyPlot.xScale));

    plotLine(potentialEnergyPlot, pe_data, "#00BFFF", "potential-energy-line");
    styleAxes(potentialEnergyPlot);
}

/**
 * Updates the total energy potential plot
 */
function updateTotalEnergyPotentialPlot() {
    const zeroY = totalEnergyPlot.yScale(0);
    totalEnergyPlot.svg.select(".myXaxis")
        .transition()
        .duration(TRANSITION_TIME)
        .attr("transform", `translate(0, ${zeroY})`)
        .call(d3.axisBottom(totalEnergyPlot.xScale));

    plotLine(totalEnergyPlot, pe_data, "#00BFFF", "total-energy-pe-line");
    styleAxes(totalEnergyPlot);
}

/**
 * Updates the radial kinetic energy plot
 */
function updateRadialKineticEnergyPlot() {
    const xExtent = d3.extent(radial_ke_data, d => d.x);
    const yExtent = d3.extent(radial_ke_data, d => d.y);
    
    radialKineticEnergyPlot.xScale.domain(xExtent);
    radialKineticEnergyPlot.yScale.domain([0, yExtent[1]]);
    
    radialKineticEnergyPlot.svg.select(".myXaxis")
        .transition()
        .duration(TRANSITION_TIME)
        .call(d3.axisBottom(radialKineticEnergyPlot.xScale));
        
    radialKineticEnergyPlot.svg.select(".myYaxis")
        .transition()
        .duration(TRANSITION_TIME)
        .call(d3.axisLeft(radialKineticEnergyPlot.yScale));
    styleAxes(radialKineticEnergyPlot);
}

/**
 * Updates the orbital kinetic energy plot
 */
function updateOrbitalKineticEnergyPlot() {
  const xExtent = d3.extent(orbital_ke_data, d => d.x);
  const yExtent = d3.extent(orbital_ke_data, d => d.y);
    
    orbitalKineticEnergyPlot.xScale.domain(xExtent);
    orbitalKineticEnergyPlot.yScale.domain([0, yExtent[1] * 1.1]);
    
    orbitalKineticEnergyPlot.svg.select(".myXaxis")
    .transition()
    .duration(TRANSITION_TIME)
        .call(d3.axisBottom(orbitalKineticEnergyPlot.xScale));
        
    orbitalKineticEnergyPlot.svg.select(".myYaxis")
    .transition()
    .duration(TRANSITION_TIME)
        .call(d3.axisLeft(orbitalKineticEnergyPlot.yScale));
    styleAxes(orbitalKineticEnergyPlot);
}

/**
 * Updates the potential energy point position
 * @param {number} r - Radial distance (meters)
 */
function updatePotentialEnergyPoint(r) {
    const Ueff = calculatePotentialEnergy(r);
    
    pePoint
        .attr("cx", potentialEnergyPlot.xScale(r / SCALE_R))
        .attr("cy", potentialEnergyPlot.yScale(Ueff / SCALE_ENERGY));
}

/**
 * Updates the total energy graph with current orbital state
 * @param {number} r - Radial distance (meters)
 * @param {number} phi - Angular position (radians)
 * @param {number} dphidt - Angular velocity (radians/second)
 */
function updateTotalEnergyGraph(r, phi, dphidt) {
    // Calculate energies
    const Ueff = calculatePotentialEnergy(r);
    const drdt = calculateRadialVelocity(r, phi, dphidt);
    const ke_radial = calculateRadialKineticEnergy(drdt);
    const ke_orbital = calculateOrbitalKineticEnergy(r);
    
    // Update moving dot
    tePePoint
        .attr("cx", totalEnergyPlot.xScale(r / SCALE_R))
        .attr("cy", totalEnergyPlot.yScale(Ueff / SCALE_ENERGY));
    
    // Calculate bar positions
    const x_pos = totalEnergyPlot.xScale(r / SCALE_R);
    const bar_width = 15;
    // New stacking logic:
    // Radial bar: from Ueff to Ueff + ke_radial
    // Radial bar: from Ueff to Ueff + ke_radial
    const y_pe = totalEnergyPlot.yScale(Ueff / SCALE_ENERGY);
    const y_pe_plus_radial = totalEnergyPlot.yScale((Ueff + ke_radial) / SCALE_ENERGY);
    const radial_bar_y = Math.min(y_pe, y_pe_plus_radial);
    const radial_bar_height = Math.abs(y_pe - y_pe_plus_radial);
    teRadialBar
        .attr("x", x_pos - bar_width/2)
        .attr("y", radial_bar_y)
        .attr("width", bar_width)
        .attr("height", radial_bar_height);

    // Orbital bar: from Ueff + ke_radial to Ueff + ke_radial + ke_orbital
    const y_pe_plus_radial_orbital = totalEnergyPlot.yScale((Ueff + ke_radial + ke_orbital) / SCALE_ENERGY);
    const orbital_bar_y = Math.min(y_pe_plus_radial, y_pe_plus_radial_orbital);
    const orbital_bar_height = Math.abs(y_pe_plus_radial - y_pe_plus_radial_orbital);
    teOrbitalBar
        .attr("x", x_pos - bar_width/2)
        .attr("y", orbital_bar_y)
        .attr("width", bar_width)
        .attr("height", orbital_bar_height);
    
    // Update total energy line - use the constant conserved energy
    const total_y = totalEnergyPlot.yScale(energy / SCALE_ENERGY);
    teTotalLine
        .attr("x1", 0)
        .attr("y1", total_y)
        .attr("x2", totalEnergyPlot.xScale.range()[1])
        .attr("y2", total_y);
    
    // DEBUG: Alternative total energy line using the sum (commented out for debugging)
    const sum_total_y = totalEnergyPlot.yScale((Ueff + ke_radial + ke_orbital) / SCALE_ENERGY);
    teTotalLine
        .attr("x1", 0)
        .attr("y1", sum_total_y)
        .attr("x2", totalEnergyPlot.xScale.range()[1])
        .attr("y2", sum_total_y);
}

/////////////////////////////////////////////////
/* ORBIT VISUALIZATION */
/////////////////////////////////////////////////

// Create orbit SVG
const orbitSVG = d3.select("#orbit-animation")
  .append("svg")
  .attr("width", CANVAS_WIDTH)
  .attr("height", CANVAS_HEIGHT);


// Draw sun (central body)
const sun = orbitSVG.append("circle")
  .attr("cx", CANVAS_WIDTH/2)
  .attr("cy", CANVAS_HEIGHT/2)
  .attr("r", 10)
  .attr("fill", "#F5BF0F");

/**
 * Draws dotted orbit that earth follows
 * @param {number} L 
 * @param {number} epsilon 
 */
function drawOrbitTrace(L, epsilon) {
  const points = [];
  for (let angle = 0; angle <= 2 * Math.PI; angle += 0.01) {
    const r = (L * L) / (G * SUN_MASS * EARTH_MASS * EARTH_MASS * (1 + epsilon * Math.cos(angle)));
    const x = CANVAS_WIDTH/2 + (r / SCALE_R) * 60 * Math.cos(angle);
    const y = CANVAS_HEIGHT/2 + (r / SCALE_R) * 60 * Math.sin(angle);
    points.push([x, y]);
  }
  orbitSVG.selectAll(".orbit-trace").remove();  // clear existing trace
  // Draw trace
  orbitSVG.append("path")
    .datum(points)
    .attr("class", "orbit-trace")
    .attr("fill", "none")
    .attr("stroke", "#EEEEEE")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "2,4") // dotted line (dash len, gap len)
    .attr("d", d3.line());

  // Remove and re-append the earth so it is above the trace
  orbitSVG.selectAll("#earth-orbit").remove();
  orbitSVG.append("circle")
    .attr("id", "earth-orbit")
    .attr("r", 4)
    .attr("fill", "#00BFFF")
    .attr("stroke", "white")
    .attr("stroke-width", 1);
}

// Remove the original earth definition, and update updateOrbitVisualization to use #earth-orbit
function updateOrbitVisualization(r, phi) {
    const x = CANVAS_WIDTH/2 + (r / SCALE_R) * 60 * Math.cos(phi);
    const y = CANVAS_HEIGHT/2 + (r / SCALE_R) * 60 * Math.sin(phi);
    orbitSVG.select("#earth-orbit")
      .attr("cx", x)
      .attr("cy", y);
}

/**
 * Updates kinetic energy bars on individual plots
 * @param {number} r - Radial distance (meters)
 * @param {number} phi - Angular position (radians)
 * @param {number} dphidt - Angular velocity (radians/second)
 */
function updateKineticEnergyBars(r, phi, dphidt) {
    // Radial kinetic energy bar
    const drdt = calculateRadialVelocity(r, phi, dphidt);
    const ke_radial = calculateRadialKineticEnergy(drdt);
    const x_radial = radialKineticEnergyPlot.xScale(r / SCALE_R);
    const y_radial = radialKineticEnergyPlot.yScale(ke_radial / SCALE_ENERGY);
    const y0_radial = radialKineticEnergyPlot.yScale(0);
    const barWidth = 20;
    const barHeight = y0_radial - y_radial;
    
  d3.select('#kinetic-energy-bar')
        .attr('x', x_radial - barWidth/2)
    .attr('width', barWidth)
        .attr('y', y_radial)
    .attr('height', barHeight > 0 ? barHeight : 0);

    // Orbital kinetic energy bar
    const ke_orbital = calculateOrbitalKineticEnergy(r);
    const x_orbital = orbitalKineticEnergyPlot.xScale(r / SCALE_R);
    const y_orbital = orbitalKineticEnergyPlot.yScale(ke_orbital / SCALE_ENERGY);
    const y0_orbital = orbitalKineticEnergyPlot.yScale(0);
    const barHeight_orbital = y0_orbital - y_orbital;
    
  d3.select('#orbital-kinetic-energy-bar')
        .attr('x', x_orbital - barWidth/2)
        .attr('width', barWidth)
    .attr('y', y_orbital)
    .attr('height', barHeight_orbital > 0 ? barHeight_orbital : 0);
}

/////////////////////////////////////////////////
/* ANIMATION LOOP */
/////////////////////////////////////////////////

/**
 * Main animation function that updates all visualizations
 */
function animate() {
    // Calculate current orbital state
    const r = calculateRadius(phi);
    const dphidt = calculateAngularVelocity(r);
    // Update angular position using proper Kepler's Second Law
    const deltaPhi = dphidt * DT;
    phi += deltaPhi;
    time += DT;
    // Update all visualizations
    updateOrbitVisualization(r, phi);
    updatePotentialEnergyPoint(r);
    updateKineticEnergyBars(r, phi, dphidt);
    updateTotalEnergyGraph(r, phi, dphidt);
    // Hard code animation speed to 5 ms
    setTimeout(animate, 5);
}

/////////////////////////////////////////////////
/* EVENT HANDLERS */
/////////////////////////////////////////////////

window.addEventListener("load", drawStars);
window.addEventListener("resize", drawStars);


/**
 * Updates orbital parameters and regenerates all data
 */
function updateOrbitalParameters() {
    epsilon = parseFloat(document.getElementById("epsilon-slider").value);
    L = parseFloat(document.getElementById("L-slider").value) * 1e40;
    document.getElementById("print-epsilon").innerHTML = epsilon.toFixed(2);
    document.getElementById("print-L").innerHTML = (L/1e40).toFixed(2);
    energy = (epsilon ** 2 - 1) * ((G * SUN_MASS * EARTH_MASS * EARTH_MASS) / 2 / (L ** 2));
    r_min = (L) ** 2 / (G * SUN_MASS * EARTH_MASS * EARTH_MASS);
    r_max = (L) ** 2 / (G * SUN_MASS * EARTH_MASS * EARTH_MASS) * (1 / (1 - epsilon));
    regenerateAllDataAndPlots();
    drawOrbitTrace(L, epsilon);
    phi = 0;
    time = 0;
}

// Attach event listeners
document.getElementById("epsilon-slider").oninput = updateOrbitalParameters;
document.getElementById("L-slider").oninput = updateOrbitalParameters;

/////////////////////////////////////////////////
/* INITIALIZATION */
/////////////////////////////////////////////////

/**
 * Initializes the application
 */
function initialize() {
    // Generate initial data
    generatePotentialEnergyData();
    radial_ke_data = generateKineticEnergyData('radial');
    orbital_ke_data = generateKineticEnergyData('orbital');
    
    // Create initial plots
    updatePotentialEnergyPlot();
    updateTotalEnergyPotentialPlot();
    updateRadialKineticEnergyPlot();
    updateOrbitalKineticEnergyPlot();
    
    // Start animation
    animate();
}

// Start the application when the page loads
initialize();
