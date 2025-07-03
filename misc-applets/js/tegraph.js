/**
 * Total Energy Graph Module
 * 
 * This module provides functionality for creating and updating a total energy graph
 * that shows potential energy, kinetic energy components, and total energy.
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

// Animation and display constants
const SVG_WIDTH = 300;
const SVG_HEIGHT = 300;
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

/////////////////////////////////////////////////
/* TOTAL ENERGY PLOT INSTANCE */
/////////////////////////////////////////////////

// Total Energy Plot
const totalEnergyPlot = createPlot({
  divID: "#total-energy-graph",
  svgID: "svg-for-total-energy-plot",
  domain: { lower: 0, upper: 10 },
  range: { lower: -40, upper: 2 },
  xLabel: "Radius (AU)",
  yLabel: "Energy (J × 10^32)"
});

/////////////////////////////////////////////////
/* VISUAL ELEMENTS */
/////////////////////////////////////////////////

// Total energy graph elements
const tePePoint = totalEnergyPlot.svg.append("circle")
    .attr("id", "total-energy-pe-point")
    .attr("r", 4)
    .attr("fill", "green")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("visibility", "visible");

const teRadialBar = totalEnergyPlot.svg.append("rect")
    .attr("id", "total-energy-radial-bar")
    .attr("x", 0)
    .attr("width", 15)
    .attr("y", 0)
    .attr("height", 0)
    .attr("fill", "orange")
    .attr("opacity", 0.8);

const teOrbitalBar = totalEnergyPlot.svg.append("rect")
    .attr("id", "total-energy-orbital-bar")
    .attr("x", 0)
    .attr("width", 15)
    .attr("y", 0)
    .attr("height", 0)
    .attr("fill", "purple")
    .attr("opacity", 0.8);

const teTotalLine = totalEnergyPlot.svg.append("line")
    .attr("id", "total-energy-line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", 0)
    .attr("stroke", "red")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5,5");

/////////////////////////////////////////////////
/* ENERGY CALCULATIONS */
/////////////////////////////////////////////////

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
 * @param {number} L - Angular momentum (kg·m²/s)
 * @param {number} epsilon - Eccentricity
 * @returns {Array} Array of potential energy data points
 */
function generatePotentialEnergyData(L, epsilon) {
    const pe_data = [];
    
    // Calculate orbital properties
    const r_min = (L) ** 2 / (G * SUN_MASS * EARTH_MASS * EARTH_MASS);
    const r_max = (L) ** 2 / (G * SUN_MASS * EARTH_MASS * EARTH_MASS) * (1 / (1 - epsilon));
    
    if (!isFinite(r_min) || !isFinite(r_max) || r_max <= r_min) {
        return pe_data;
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
    
    return pe_data;
}

/////////////////////////////////////////////////
/* PLOT UPDATES */
/////////////////////////////////////////////////

/**
 * Updates the total energy potential plot
 * @param {Array} pe_data - Potential energy data array
 */
function updateTotalEnergyPotentialPlot(pe_data) {
    const zeroY = totalEnergyPlot.yScale(0);
    totalEnergyPlot.svg.select(".myXaxis")
        .transition()
        .duration(TRANSITION_TIME)
        .attr("transform", `translate(0, ${zeroY})`)
        .call(d3.axisBottom(totalEnergyPlot.xScale));

    plotLine(totalEnergyPlot, pe_data, "green", "total-energy-pe-line");
}

/**
 * Updates the total energy graph with current orbital state
 * @param {number} r - Radial distance (meters)
 * @param {number} phi - Angular position (radians)
 * @param {number} dphidt - Angular velocity (radians/second)
 * @param {number} L - Angular momentum (kg·m²/s)
 * @param {number} energy - Total energy (Joules)
 */
function updateTotalEnergyGraph(r, phi, dphidt, L, energy) {
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
}

/**
 * Calculates the radial velocity component
 * @param {number} r - Radial distance (meters)
 * @param {number} phi - Angular position (radians)
 * @param {number} dphidt - Angular velocity (radians/second)
 * @param {number} epsilon - Eccentricity
 * @returns {number} Radial velocity (meters/second)
 */
function calculateRadialVelocity(r, phi, dphidt, epsilon) {
    const dr_dphi = (r * epsilon * Math.sin(phi)) / (1 + epsilon * Math.cos(phi));
    return dr_dphi * dphidt;
}

/////////////////////////////////////////////////
/* PUBLIC API */
/////////////////////////////////////////////////

// Export functions for use in other modules
window.TotalEnergyGraph = {
    createPlot,
    plotLine,
    totalEnergyPlot,
    generatePotentialEnergyData,
    updateTotalEnergyPotentialPlot,
    updateTotalEnergyGraph,
    calculatePotentialEnergy,
    calculateRadialKineticEnergy,
    calculateOrbitalKineticEnergy,
    calculateRadialVelocity
};
