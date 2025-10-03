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

// Orbital parameters (will be initialized from HTML sliders)
let epsilon = 0.7; // Default value, will be updated from HTML
let L = 3 * 1e40; // Default value, will be updated from HTML

// Calculated orbital properties
let energy = (epsilon ** 2 - 1) * ((G * SUN_MASS * EARTH_MASS * EARTH_MASS) / 2 / (L ** 2));
let r_min = (L) ** 2 / (G * SUN_MASS * EARTH_MASS * EARTH_MASS) * (1 / (1 + epsilon));
let r_max = (L) ** 2 / (G * SUN_MASS * EARTH_MASS * EARTH_MASS) * (1 / (1 - epsilon));

// Animation state
let phi = 0;                          // Current angular position (radians)

// Data arrays for plotting
let pe_data = [];                     // Potential energy data
let effective_pe_data = [];           // Effective potential energy data
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
  domain: { lower: 0, upper: 20 },
  range: { lower: -80, upper: 4 },
  xLabel: "Radius (AU × 10³)",
  yLabel: "Potential Energy (J × 10^32)"
});
styleAxes(potentialEnergyPlot);

// Radial Kinetic Energy Plot
const radialKineticEnergyPlot = createPlot({
  divID: "#radial-kinetic-graph",
  svgID: "svg-for-kinetic-energy-plot",
  domain: { lower: 0, upper: 20 },
  range: { lower: 0, upper: 20 },
  xLabel: "Radius (AU)",
  yLabel: "Radial Kinetic Energy (J × 10^32)"
});
styleAxes(radialKineticEnergyPlot);

// Orbital Kinetic Energy Plot
const orbitalKineticEnergyPlot = createPlot({
  divID: "#orbital-kinetic-graph",
  svgID: "svg-for-orbital-kinetic-energy-plot",
  domain: { lower: 0, upper: 8 },
  range: { lower: 0, upper: 6 },
  xLabel: "Radius (AU)",
  yLabel: "Orbital Kinetic Energy (J × 10^32)"
});
styleAxes(orbitalKineticEnergyPlot);

// Effective Potential Energy Plot
const effectivePotentialEnergyPlot = createPlot({
  divID: "#effective-potential-graph",
  svgID: "svg-for-effective-potential-energy-plot",
  domain: { lower: 0, upper: 20 },
  range: { lower: -40, upper: 40 },
  xLabel: "Radius (AU × 10³)",
  yLabel: "Effective Potential (J × 10^32)"
});
styleAxes(effectivePotentialEnergyPlot);

// Total Energy Plot
const totalEnergyPlot = createPlot({
  divID: "#total-energy-graph",
  svgID: "svg-for-total-energy-plot",
  domain: { lower: 0, upper: 20 },
  range: { lower: -80, upper: 4 },
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

// Effective potential energy moving point
const effectivePePoint = effectivePotentialEnergyPlot.svg.append("circle")
    .attr("id", "effective-potential-energy-point")
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

/**
 * Calculates effective potential energy at a given radius
 * The effective potential combines centrifugal potential and gravitational potential:
 * U_eff(r) = L²/(2μr²) - Gm₁m₂/r
 * @param {number} r - Radial distance (meters)
 * @returns {number} Effective potential energy (Joules)
 */
function calculateEffectivePotentialEnergy(r) {
    const centrifugalTerm = (L * L) / (2 * MU * r * r);
    const gravitationalTerm = -(G * SUN_MASS * EARTH_MASS) / r;
    return centrifugalTerm + gravitationalTerm;
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
        const r = r_start + (8 * r_max - r_start) * (i / N);
        const Ueff = calculatePotentialEnergy(r);
        
    pe_data.push({ 
            x: r / SCALE_R,
            y: Ueff / SCALE_ENERGY
        });
    }
    
    // Update plot scales
    potentialEnergyPlot.xScale.domain([0, 20]);
    potentialEnergyPlot.yScale.domain([-80, 4]);
    
    potentialEnergyPlot.svg.select(".myXaxis")
      .transition()
      .duration(TRANSITION_TIME)
        .call(d3.axisBottom(potentialEnergyPlot.xScale));
        
    potentialEnergyPlot.svg.select(".myYaxis")
    .transition()
    .duration(TRANSITION_TIME)
        .call(d3.axisLeft(potentialEnergyPlot.yScale));
}

/**
 * Generates effective potential energy data for plotting
 * Uses the same radius range as potential energy for consistency
 */
function generateEffectivePotentialEnergyData() {
    effective_pe_data = [];
    
    if (!isFinite(r_min) || !isFinite(r_max) || r_max <= r_min) {
        return;
    }
    
    const N = 400;
    const r_start = Math.max(0.1 * r_max, 1e9); // Avoid zero
    
    for (let i = 0; i <= N; i++) {
        const r = r_start + (8 * r_max - r_start) * (i / N);
        const Ueff = calculateEffectivePotentialEnergy(r);
        
        effective_pe_data.push({ 
            x: r / SCALE_R,
            y: Ueff / SCALE_ENERGY
        });
    }
    
    // Update plot scales
    effectivePotentialEnergyPlot.xScale.domain([0, 20]);
    effectivePotentialEnergyPlot.yScale.domain([-40, 40]);
    
    effectivePotentialEnergyPlot.svg.select(".myXaxis")
        .transition()
        .duration(TRANSITION_TIME)
        .call(d3.axisBottom(effectivePotentialEnergyPlot.xScale));
        
    effectivePotentialEnergyPlot.svg.select(".myYaxis")
        .transition()
        .duration(TRANSITION_TIME)
        .call(d3.axisLeft(effectivePotentialEnergyPlot.yScale));
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


// Generate and update all plots
function regenerateAllDataAndPlots() {
  generatePotentialEnergyData();
  generateEffectivePotentialEnergyData();
  radial_ke_data = generateKineticEnergyData('radial');
  orbital_ke_data = generateKineticEnergyData('orbital');
  updatePotentialEnergyPlot();
  updateEffectivePotentialEnergyPlot();
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
 * Updates the effective potential energy plot with new data
 */
function updateEffectivePotentialEnergyPlot() {
    // Position x-axis at y=0 (zero line) for both positive and negative values
    const zeroY = effectivePotentialEnergyPlot.yScale(0);
    effectivePotentialEnergyPlot.svg.select(".myXaxis")
        .transition()
        .duration(TRANSITION_TIME)
        .attr("transform", `translate(0, ${zeroY})`)
        .call(d3.axisBottom(effectivePotentialEnergyPlot.xScale));

    plotLine(effectivePotentialEnergyPlot, effective_pe_data, "#00BFFF", 
        "effective-potential-energy-line");
    styleAxes(effectivePotentialEnergyPlot);
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
 * Updates the effective potential energy point position
 * @param {number} r - Radial distance (meters)
 */
function updateEffectivePotentialEnergyPoint(r) {
    const Ueff = calculateEffectivePotentialEnergy(r);
    
    effectivePePoint
        .attr("cx", effectivePotentialEnergyPlot.xScale(r / SCALE_R))
        .attr("cy", effectivePotentialEnergyPlot.yScale(Ueff / SCALE_ENERGY));
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
    const y_pe_plus_radial_orbital = totalEnergyPlot.yScale(
        (Ueff + ke_radial + ke_orbital) / SCALE_ENERGY);
    const orbital_bar_y = Math.min(y_pe_plus_radial, y_pe_plus_radial_orbital);
    const orbital_bar_height = Math.abs(y_pe_plus_radial - y_pe_plus_radial_orbital);
    teOrbitalBar
        .attr("x", x_pos - bar_width/2)
        .attr("y", orbital_bar_y)
        .attr("width", bar_width)
        .attr("height", orbital_bar_height);
    
    // Update total energy line - use the sum of all energy components
    const total_energy = Ueff + ke_radial + ke_orbital;
    const total_y = totalEnergyPlot.yScale(total_energy / SCALE_ENERGY);
    teTotalLine
        .attr("x1", 0)
        .attr("y1", total_y)
        .attr("x2", totalEnergyPlot.xScale.range()[1])
        .attr("y2", total_y);
    
}

/////////////////////////////////////////////////
/* ORBIT VISUALIZATION */
/////////////////////////////////////////////////

// Create orbit SVG
const orbitSVG = d3.select("#orbit-animation")
  .append("svg")
  .attr("width", CANVAS_WIDTH)
  .attr("height", CANVAS_HEIGHT);

// Change sun and orbit center - positioned far to the right for elliptical orbits
const ORBIT_CENTER_X = CANVAS_WIDTH * 0.95;
const ORBIT_CENTER_Y = CANVAS_HEIGHT / 2;

// Draw sun (central body)
const sun = orbitSVG.append("circle")
  .attr("cx", ORBIT_CENTER_X)
  .attr("cy", ORBIT_CENTER_Y)
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
    const x = ORBIT_CENTER_X + (r / SCALE_R) * 60 * Math.cos(angle);
    const y = ORBIT_CENTER_Y + (r / SCALE_R) * 60 * Math.sin(angle);
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

function updateOrbitVisualization(r, phi) {
    const x = ORBIT_CENTER_X + (r / SCALE_R) * 60 * Math.cos(phi);
    const y = ORBIT_CENTER_Y + (r / SCALE_R) * 60 * Math.sin(phi);
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
    // const deltaPhi = dphidt * DT;
    // phi += deltaPhi;
    
    // Use constant angular velocity for smooth, consistent animation
    // This makes all orbits complete one revolution in the same time regardless of shape
    const CONSTANT_ANGULAR_SPEED = 0.02; // radians per frame
    phi += CONSTANT_ANGULAR_SPEED;
    
    // Update all visualizations
    updateOrbitVisualization(r, phi);
    updatePotentialEnergyPoint(r);
    updateEffectivePotentialEnergyPoint(r);
    updateKineticEnergyBars(r, phi, dphidt);
    updateTotalEnergyGraph(r, phi, dphidt);
    // Continue animation with consistent frame rate
    setTimeout(animate, 5);
}

/////////////////////////////////////////////////
/* SCROLL-BASED UX EFFECTS */
/////////////////////////////////////////////////

/**
 * Handles scroll-based scaling effects for different sections
 */
function handleScrollEffects() {
  const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  
  if (scrollPercent < 0.05) {
    scaleAnimation(1.0);
    scaleGraphs(1.0);
  }
  // Zone 1 (5-25%): Animation fills screen, graphs minimal
  else if (scrollPercent < 0.25) {
    scaleAnimation(1.5);
    scaleGraphs(0.7);
  }
  // Zone 2 (25-75%): Animation shrinks, kinetic graphs prominent
  else if (scrollPercent < 0.75) {
    scaleAnimation(0.8);
    scaleKineticGraphs(1.2);
    scalePotentialGraphs(0.9);
  }
  // Zone 3 (75-100%): Potential graphs fill screen
  else {
    scaleAnimation(0.6);
    scaleKineticGraphs(0.8);
    scalePotentialGraphs(1.3);
  }
}

/**
 * Scales the animation container
 */
function scaleAnimation(scale) {
  const animation = document.getElementById('animation-container');
  if (animation) {
    animation.style.transform = `scale(${scale})`;
  }
}

/**
 * Scales all graphs
 */
function scaleGraphs(scale) {
  const graphs = document.querySelectorAll('#kinetic-row > div, #potential-row > div');
  graphs.forEach(graph => {
    graph.style.transform = `scale(${scale})`;
  });
}

/**
 * Scales kinetic energy graphs
 */
function scaleKineticGraphs(scale) {
  const kineticGraphs = document.querySelectorAll('#kinetic-row > div');
  kineticGraphs.forEach(graph => {
    graph.style.transform = `scale(${scale})`;
  });
}

/**
 * Scales potential energy graphs
 */
function scalePotentialGraphs(scale) {
  const potentialGraphs = document.querySelectorAll('#potential-row > div');
  potentialGraphs.forEach(graph => {
    graph.style.transform = `scale(${scale})`;
  });
}

/////////////////////////////////////////////////
/* EVENT HANDLERS */
/////////////////////////////////////////////////

window.addEventListener("load", drawStars);
window.addEventListener("resize", drawStars);
window.addEventListener("scroll", handleScrollEffects);


/**
 * Updates orbital parameters and regenerates all data
 */
function updateOrbitalParameters() {
    epsilon = parseFloat(document.getElementById("epsilon-slider").value);
    L = parseFloat(document.getElementById("L-slider").value) * 1e40;
    document.getElementById("print-epsilon").innerHTML = epsilon.toFixed(2);
    document.getElementById("print-L").innerHTML = (L/1e40).toFixed(2);
    energy = (epsilon ** 2 - 1) * ((G * SUN_MASS * EARTH_MASS * EARTH_MASS) / 2 / (L ** 2));
    r_min = (L) ** 2 / (G * SUN_MASS * EARTH_MASS * EARTH_MASS) * (1 / (1 + epsilon));
    r_max = (L) ** 2 / (G * SUN_MASS * EARTH_MASS * EARTH_MASS) * (1 / (1 - epsilon));
    regenerateAllDataAndPlots();
    drawOrbitTrace(L, epsilon);
    phi = 0;
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
    // Read initial values from HTML sliders
    epsilon = parseFloat(document.getElementById("epsilon-slider").value);
    L = parseFloat(document.getElementById("L-slider").value) * 1e40;
    
    // Update display values
    document.getElementById("print-epsilon").innerHTML = epsilon.toFixed(2);
    document.getElementById("print-L").innerHTML = (L/1e40).toFixed(2);
    
    // Recalculate orbital properties with actual values
    energy = (epsilon ** 2 - 1) * ((G * SUN_MASS * EARTH_MASS * EARTH_MASS) / 2 / (L ** 2));
    r_min = (L) ** 2 / (G * SUN_MASS * EARTH_MASS * EARTH_MASS) * (1 / (1 + epsilon));
    r_max = (L) ** 2 / (G * SUN_MASS * EARTH_MASS * EARTH_MASS) * (1 / (1 - epsilon));
    
    // Generate initial data
    generatePotentialEnergyData();
    generateEffectivePotentialEnergyData();
    radial_ke_data = generateKineticEnergyData('radial');
    orbital_ke_data = generateKineticEnergyData('orbital');
    
    // Create initial plots
    updatePotentialEnergyPlot();
    updateEffectivePotentialEnergyPlot();
    updateTotalEnergyPotentialPlot();
    updateRadialKineticEnergyPlot();
    updateOrbitalKineticEnergyPlot();
    
    // Draw initial orbit trace
    drawOrbitTrace(L, epsilon);
    
    // Start animation
    animate();
}


// Start the application when the page loads
initialize();


// Guided Tour of Page


// Tutorial positioning functions - content is now stored in HTML
const tutorialSteps = [
  {
    position: () => {
      const sun = document.querySelector("#orbit-animation svg circle");
      const rect = sun.getBoundingClientRect();
      return { top: rect.top + window.scrollY - 20, left: rect.left + window.scrollX + 40 };
    },
  },
  {
    position: () => {
      const sliders = document.getElementById("slider-row");
      const rect = sliders.getBoundingClientRect();
      return { top: rect.top + window.scrollY - 20, left: rect.left + window.scrollX + 20 };
    },
  },
  {
    position: () => {
      const graph = document.getElementById("radial-kinetic-graph");
      const rect = graph.getBoundingClientRect();
      return { top: rect.top + window.scrollY + 20, left: rect.left + window.scrollX + 20};
    },
    positionElement: () => document.getElementById("radial-kinetic-graph")
  },
  {
    position: () => {
      const graph = document.getElementById("orbital-kinetic-graph");
      const rect = graph.getBoundingClientRect();
      return { top: rect.top + window.scrollY + 20, left: rect.left + window.scrollX + 20 };
    },
    positionElement: () => document.getElementById("orbital-kinetic-graph")
  },
  {
    position: () => {
      const graph = document.getElementById("potential-energy-graph");
      const rect = graph.getBoundingClientRect();
      return { top: rect.top + window.scrollY + 20, left: rect.left + window.scrollX + 20 };
    },
    positionElement: () => document.getElementById("potential-energy-graph")
  },
  {
    position: () => {
      const graph = document.getElementById("effective-potential-graph");
      const rect = graph.getBoundingClientRect();
      return { top: rect.top + window.scrollY + 20, left: rect.left + window.scrollX + 20 };
    },
    positionElement: () => document.getElementById("effective-potential-graph")
  },
  {
    position: () => {
      const graph = document.getElementById("total-energy-graph");
      const rect = graph.getBoundingClientRect();
      return { top: rect.top + window.scrollY + 20, left: rect.left + window.scrollX + 20 };
    },
    positionElement: () => document.getElementById("total-energy-graph")
  }];

// iterating through tutorial
let tutorialStep = 0;
let rocket = document.getElementById("tutorial-rocket");
let lastRocketPos = null; // {top, left}

function showTutorialStep(step) {
  const overlay = document.getElementById("tutorial-overlay");
  const box = document.getElementById("tutorial-box");
  const text = document.getElementById("tutorial-text");
  const elem = tutorialSteps[step] && tutorialSteps[step].positionElement && 
    tutorialSteps[step].positionElement();

  if (step >= tutorialSteps.length) {
    overlay.style.display = "none";
    rocket.style.display = "none";
    return;
  }

  overlay.style.display = "block";
  // Get HTML content directly from tutorial step element
  const contentElement = document.getElementById(`tutorial-step-${step}`);
  text.innerHTML = contentElement ? contentElement.innerHTML : "Tutorial step not found";
  box.style.visibility = "visible";

  // If there's an element to scroll to, do it, then position after a delay
  if (elem) {
    elem.scrollIntoView({ behavior: "smooth", block: "center" });
    // Wait for scroll to complete before positioning
    setTimeout(() => positionTutorialBoxAndRocket(step, box), 600); // Increased delay
  } else {
    // For elements without positionElement, still try to scroll to the general area
    const pos = tutorialSteps[step].position();
    // Scroll to bring the target position into view
    window.scrollTo({ 
      top: pos.top - window.innerHeight / 2, 
      behavior: "smooth" 
    });
    setTimeout(() => positionTutorialBoxAndRocket(step, box), 600);
  }
}

// Position tutorial box with improved viewport handling
function positionTutorialBoxAndRocket(step, box) {
  const pos = tutorialSteps[step].position();
  const padding = 16;
  const boxWidth = box.offsetWidth;
  const boxHeight = box.offsetHeight;
  
  // Calculate position relative to current viewport
  let top = pos.top - window.scrollY;
  let left = pos.left - window.scrollX;
  
  // If the tutorial box would be too low, position it above the target
  if (top + boxHeight > window.innerHeight - padding) {
    top = pos.top - window.scrollY - boxHeight - 20; // 20px gap above target
  }
  
  // If the tutorial box would be too high, position it below the target
  if (top < padding) {
    top = pos.top - window.scrollY + 40; // 40px gap below target
  }
  
  // Clamp horizontal position to viewport
  left = Math.max(padding, Math.min(left, window.innerWidth - boxWidth - padding));
  
  box.style.top = top + "px";
  box.style.left = left + "px";
  // Tutorial box is now shown immediately by the calling function
}

// Animate rocket movement
function animateRocket(start, end, duration, callback) {
  let startTime = null;
  function animateStep(timestamp) {
    if (!startTime) startTime = timestamp;
    let progress = Math.min((timestamp - startTime) / duration, 1);
    let top = start.top + (end.top - start.top) * progress;
    let left = start.left + (end.left - start.left) * progress;
    rocket.style.top = top + "px";
    rocket.style.left = left + "px";
    if (progress < 1) {
      requestAnimationFrame(animateStep);
    } else {
      if (callback) callback();
    }
  }
  requestAnimationFrame(animateStep)
}

// button handlers
document.getElementById("tutorial-next").onclick = function() {
  tutorialStep++;
  if (tutorialStep >= tutorialSteps.length) {
    document.getElementById("tutorial-overlay").style.display = "none";
    rocket.style.display = "none";
    return;
  }
  // Hide the box while rocket moves
  const box = document.getElementById("tutorial-box");
  box.style.visibility = "hidden";
  
  // Check if this step has a specific element to scroll to
  const elem = tutorialSteps[tutorialStep] && tutorialSteps[tutorialStep].positionElement && 
    tutorialSteps[tutorialStep].positionElement();
  
  // Update text content from HTML element
  const text = document.getElementById("tutorial-text");
  const contentElement = document.getElementById(`tutorial-step-${tutorialStep}`);
  text.innerHTML = contentElement ? contentElement.innerHTML : "Tutorial step not found";
  
  // Scroll to target element first, then position tutorial
  if (elem) {
    elem.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      positionTutorialBoxAndRocket(tutorialStep, box);
      // Position rocket and show both simultaneously
      const pos = tutorialSteps[tutorialStep].position();
      const rocketTarget = { 
        top: pos.top - window.scrollY + 20, 
        left: pos.left - window.scrollX - 60 
      };
      
      // If this is the first step or no previous position, show immediately
      if (tutorialStep === 0 || !lastRocketPos) {
        rocket.style.top = rocketTarget.top + "px";
        rocket.style.left = rocketTarget.left + "px";
        rocket.style.display = "block";
        rocket.classList.add("hovering");
        box.style.visibility = "visible";
        lastRocketPos = rocketTarget;
      } else {
        // Animate rocket while showing tutorial box immediately
        rocket.style.display = "block";
        box.style.visibility = "visible";
        animateRocket(lastRocketPos, rocketTarget, 700, () => {
          lastRocketPos = rocketTarget;
          rocket.classList.add("hovering");
        });
      }
    }, 600);
  } else {
    // For elements without positionElement, scroll to general area
    const pos = tutorialSteps[tutorialStep].position();
    window.scrollTo({ 
      top: pos.top - window.innerHeight / 2, 
      behavior: "smooth" 
    });
    setTimeout(() => {
      positionTutorialBoxAndRocket(tutorialStep, box);
      // Position rocket and show both simultaneously
      const rocketTarget = { 
        top: pos.top - window.scrollY + 20, 
        left: pos.left - window.scrollX - 60 
      };
      
      // If this is the first step or no previous position, show immediately
      if (tutorialStep === 0 || !lastRocketPos) {
        rocket.style.top = rocketTarget.top + "px";
        rocket.style.left = rocketTarget.left + "px";
        rocket.style.display = "block";
        rocket.classList.add("hovering");
        box.style.visibility = "visible";
        lastRocketPos = rocketTarget;
      } else {
        // Animate rocket while showing tutorial box immediately
        rocket.style.display = "block";
        box.style.visibility = "visible";
        animateRocket(lastRocketPos, rocketTarget, 700, () => {
          lastRocketPos = rocketTarget;
          rocket.classList.add("hovering");
        });
      }
    }, 600);
  }
};
document.getElementById("tutorial-skip").onclick = function() {
  document.getElementById("tutorial-overlay").style.display = "none";
  rocket.style.display = "none";
}

// Show tutorial on first visit only
window.addEventListener("load", function() {
    // Start tutorial at the top to show overview, then move to first step
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
        showTutorialStep(0);
    }, 500); // Wait for scroll to complete
});

// Add this function to restart the tutorial from the beginning
function restartTutorial() {
  tutorialStep = 0;
  lastRocketPos = null;
  rocket.style.display = "none";
  rocket.classList.remove("hovering");
  // Start at the top to show overview, then begin tutorial
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => {
    showTutorialStep(0);
  }, 500); // Wait for scroll to complete
}

// Add this event listener for the button when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("show-tutorial-btn").onclick = restartTutorial;
});
