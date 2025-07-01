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

// Animation and display constants
const CANVAS_WIDTH = 330;
const CANVAS_HEIGHT = 280;
const SVG_WIDTH = 330;
const SVG_HEIGHT = 280;
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

// Radial Kinetic Energy Plot
const radialKineticEnergyPlot = createPlot({
    divID: "#kinetic-graph",
    svgID: "svg-for-kinetic-energy-plot",
    domain: { lower: 0, upper: 10 },
    range: { lower: 0, upper: 10 },
    xLabel: "Radius (AU)",
    yLabel: "Radial Kinetic Energy (J × 10^32)"
});

// Orbital Kinetic Energy Plot
const orbitalKineticEnergyPlot = createPlot({
    divID: "#orbital-kinetic-graph",
    svgID: "svg-for-orbital-kinetic-energy-plot",
    domain: { lower: 0, upper: 4 },
    range: { lower: 0, upper: 3 },
    xLabel: "Radius (AU)",
    yLabel: "Orbital Kinetic Energy (J × 10^32)"
});

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

// Potential energy moving point
const pePoint = potentialEnergyPlot.svg.append("circle")
    .attr("id", "potential-energy-point")
    .attr("r", 3)
    .attr("fill", "blue")
    .attr("visibility", "visible");

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
    .attr("fill", "yellow")
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

// Kinetic energy bars for individual plots
radialKineticEnergyPlot.svg.append("rect")
    .attr("id", "kinetic-energy-bar")
    .attr("x", 0)
    .attr("width", 20)
    .attr("y", radialKineticEnergyPlot.yScale(0))
    .attr("height", 0)
    .attr("fill", "orange");

orbitalKineticEnergyPlot.svg.append("rect")
    .attr("id", "orbital-kinetic-energy-bar")
    .attr("x", 0)
    .attr("width", 20)
    .attr("y", orbitalKineticEnergyPlot.yScale(0))
    .attr("height", 0)
    .attr("fill", "purple");

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

/**
 * Generates radial kinetic energy data for plotting
 */
function generateRadialKineticEnergyData() {
    radial_ke_data = [];
    let phi = 0;
    const maxPhi = 2 * Math.PI * 1.2;
    const dphi = 0.001;

    while (phi <= maxPhi) {
        const r = calculateRadius(phi);
        const dphidt = calculateAngularVelocity(r);
        const drdt = calculateRadialVelocity(r, phi, dphidt);
        const ke = calculateRadialKineticEnergy(drdt);

        radial_ke_data.push({
            x: r / SCALE_R,
            y: ke / SCALE_ENERGY
        });
        phi += dphi;
    }
}

/**
 * Generates orbital kinetic energy data for plotting
 */
function generateOrbitalKineticEnergyData() {
    orbital_ke_data = [];
    let phi = 0;
    const maxPhi = 2 * Math.PI * 1.2;
    const dphi = 0.001;

    while (phi <= maxPhi) {
        const r = calculateRadius(phi);
        const ke = calculateOrbitalKineticEnergy(r);
        
        orbital_ke_data.push({
            x: r / SCALE_R,
            y: ke / SCALE_ENERGY
        });
        phi += dphi;
    }
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

    plotLine(potentialEnergyPlot, pe_data, "green", "potential-energy-line");
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

    plotLine(totalEnergyPlot, pe_data, "green", "total-energy-pe-line");
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
    
    // Debug logging
    if (Math.abs(phi) < 0.1) {
        console.log(`Total Energy: ${energy.toExponential(2)} J, r: ${(r/SCALE_R).toFixed(2)} AU`);
        console.log(`Potential: ${Ueff.toExponential(2)} J, Radial KE: ${ke_radial.toExponential(2)} J, Orbital KE: ${ke_orbital.toExponential(2)} J`);
        console.log(`Sum: ${(Ueff + ke_radial + ke_orbital).toExponential(2)} J`);
    }
    
    // Update moving dot
    tePePoint
        .attr("cx", totalEnergyPlot.xScale(r / SCALE_R))
        .attr("cy", totalEnergyPlot.yScale(Ueff / SCALE_ENERGY));
    
    // Calculate bar positions
    const x_pos = totalEnergyPlot.xScale(r / SCALE_R);
    const bar_width = 15;
    const pe_y = totalEnergyPlot.yScale(Ueff / SCALE_ENERGY);
    const radial_ke_scaled = ke_radial / SCALE_ENERGY;
    const orbital_ke_scaled = ke_orbital / SCALE_ENERGY;
    
    // Update radial kinetic energy bar (yellow)
    // Position the bar above the potential energy dot
    const radial_bar_y = pe_y - Math.abs(radial_ke_scaled);
    teRadialBar
        .attr("x", x_pos - bar_width/2)
        .attr("y", radial_bar_y)
        .attr("width", bar_width)
        .attr("height", Math.abs(radial_ke_scaled));
    
    // Update orbital kinetic energy bar (purple)
    // Position the bar above the radial kinetic energy bar
    const orbital_bar_y = radial_bar_y - Math.abs(orbital_ke_scaled);
    teOrbitalBar
        .attr("x", x_pos - bar_width/2)
        .attr("y", orbital_bar_y)
        .attr("width", bar_width)
        .attr("height", Math.abs(orbital_ke_scaled));
    
    // Update total energy line - use the constant conserved energy
    const total_y = totalEnergyPlot.yScale(energy / SCALE_ENERGY);
    teTotalLine
        .attr("x1", 0)
        .attr("y1", total_y)
        .attr("x2", totalEnergyPlot.xScale.range()[1])
        .attr("y2", total_y);
    
    // DEBUG: Alternative total energy line using the sum (commented out for debugging)
    // const sum_total_y = totalEnergyPlot.yScale((Ueff + ke_radial + ke_orbital) / SCALE_U);
    // teTotalLine
    //     .attr("x1", 0)
    //     .attr("y1", sum_total_y)
    //     .attr("x2", totalEnergyPlot.xScale.range()[1])
    //     .attr("y2", sum_total_y);
    
    // Update display
    document.getElementById("print-total-energy").innerHTML = energy.toExponential(2);
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
    .attr("r", 5)
    .attr("fill", "yellow");

// Draw earth (orbiting body)
const earth = orbitSVG.append("circle")
    .attr("r", 2)
    .attr("fill", "blue");

/**
 * Updates the orbit visualization
 * @param {number} r - Radial distance (meters)
 * @param {number} phi - Angular position (radians)
 */
function updateOrbitVisualization(r, phi) {
    const x = CANVAS_WIDTH/2 + (r / SCALE_R) * 60 * Math.cos(phi);
    const y = CANVAS_HEIGHT/2 + (r / SCALE_R) * 60 * Math.sin(phi);
    
    earth.attr("cx", x).attr("cy", y);
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
    
    // Debug: Log angular velocity and radius to verify Kepler's Second Law
    if (Math.abs(phi) < 0.1 || Math.abs(phi - Math.PI) < 0.1) {
        console.log(`Phi: ${phi.toFixed(2)} rad, Radius: ${(r/SCALE_R).toFixed(2)} AU, Angular Velocity: ${dphidt.toExponential(2)} rad/s`);
    }
    
    // Update angular position using proper Kepler's Second Law
    // This ensures the Earth moves faster when closer to the Sun
    const deltaPhi = dphidt * DT;
    phi += deltaPhi;
    time += DT;

    // Update all visualizations
    updateOrbitVisualization(r, phi);
    updatePotentialEnergyPoint(r);
    updateKineticEnergyBars(r, phi, dphidt);
    updateTotalEnergyGraph(r, phi, dphidt);

    // Get speed from slider and continue animation with controlled timing
    const speed = parseInt(document.getElementById("speed-slider").value);
    setTimeout(animate, speed);
}

/////////////////////////////////////////////////
/* EVENT HANDLERS */
/////////////////////////////////////////////////

/**
 * Updates orbital parameters and regenerates all data
 */
function updateOrbitalParameters() {
    // Update parameters from sliders
    epsilon = parseFloat(document.getElementById("epsilon-slider").value);
    L = parseFloat(document.getElementById("L-slider").value) * 1e40;
    
    // Update displays
    document.getElementById("print-epsilon").innerHTML = epsilon.toFixed(2);
    document.getElementById("print-L").innerHTML = (L/1e40).toFixed(2);
    
    // Recalculate orbital properties
    energy = (epsilon ** 2 - 1) * ((G * SUN_MASS * EARTH_MASS * EARTH_MASS) / 2 / (L ** 2));
    r_min = (L) ** 2 / (G * SUN_MASS * EARTH_MASS * EARTH_MASS);
    r_max = (L) ** 2 / (G * SUN_MASS * EARTH_MASS * EARTH_MASS) * (1 / (1 - epsilon));
    
    // Regenerate all data
    generatePotentialEnergyData();
    generateRadialKineticEnergyData();
    generateOrbitalKineticEnergyData();
    
    // Update all plots
    updatePotentialEnergyPlot();
    updateTotalEnergyPotentialPlot();
    updateRadialKineticEnergyPlot();
    updateOrbitalKineticEnergyPlot();
    
    // Reset animation state
    phi = 0;
    time = 0;
}

// Attach event listeners
document.getElementById("epsilon-slider").oninput = updateOrbitalParameters;
document.getElementById("L-slider").oninput = updateOrbitalParameters;

// Speed slider event listener
document.getElementById("speed-slider").oninput = function() {
    const speed = this.value;
    document.getElementById("print-speed").innerHTML = speed;
};

/////////////////////////////////////////////////
/* INITIALIZATION */
/////////////////////////////////////////////////

/**
 * Initializes the application
 */
function initialize() {
    // Generate initial data
    generatePotentialEnergyData();
    generateRadialKineticEnergyData();
    generateOrbitalKineticEnergyData();
    
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
