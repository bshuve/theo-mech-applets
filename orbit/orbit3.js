/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////

const CANVAS_WIDTH = 330;
const CANVAS_HEIGHT = 280;
const SVG_WIDTH = 330;
const SVG_HEIGHT = 280;
const dt = 315600;
var FRAME_RATE = 10   // ms
const TRANSITION_TIME = 10; // ms

const G = 6.7 * 10 ** (-11);
const sunMass = 2 * (10 ** 30);
const earthMass = 6 * (10 ** 24);
const mu = (sunMass * earthMass) / (sunMass + earthMass);

// Initialize with slider values
var L = parseFloat(document.getElementById("L-slider").getAttribute("value")) * 1e40; // kg·m²/s
var E = parseFloat(document.getElementById("E-slider").getAttribute("value")) * 1e33; // J

function updateEnergyLimits() {
  // Calculate energy limits based on current L
  const energy_for_eps_1 = -0.0009995 * (mu * (G * sunMass * earthMass) ** 2) / L / L;
  const energy_for_eps_0 = -0.5 * (mu * (G * sunMass * earthMass) ** 2) / L / L;

  // Convert to AU for slider
  const energy_min = energy_for_eps_0 / 1e33;
  const energy_max = energy_for_eps_1 / 1e33;

  // Update slider attributes
  const slider = document.getElementById("E-slider");
  slider.setAttribute("min", energy_min.toFixed(2));
  slider.setAttribute("max", energy_max.toFixed(2));

  // Ensure current value is within new limits
  const currentValue = parseFloat(slider.value);
  if (currentValue < energy_min) {
    slider.value = energy_min.toFixed(2);
    energy = energy_min * 1e33;
    document.getElementById("print-E").innerHTML = energy_min.toFixed(2);
  } else if (currentValue > energy_max) {
    slider.value = energy_max.toFixed(2);
    energy = energy_max * 1e33;
    document.getElementById("print-E").innerHTML = energy_max.toFixed(2);
  }

  // Update step size to be reasonable for the range
  const range = energy_max - energy_min;
  const step = Math.min(0.01, range / 100);
  slider.setAttribute("step", step.toFixed(3));
}

// Calculate derived quantities
var epsilon, r_min

function calculateDerivedQuantities() {
  epsilon = Math.sqrt(1 + (2 * E * L * L) / (mu * (G * sunMass * earthMass) ** 2));
  epsilon = Math.min(epsilon, 0.999);
  if (!epsilon) {
    epsilon = 0;
  }

  r_min = (L) ** 2 / (G * sunMass * earthMass * earthMass) * (1 / (1 + epsilon));
}

// Initialize derived quantities
calculateDerivedQuantities();

var radial_ke_data = [];
var orbital_ke_data = [];
const SCALE_R = 1e11; // Scale factor for radius (m to AU) for graphing
const SCALE_U = 1e33; // Scale factor for energy for graphing
const SCALE_KE = 1e33; // Scale factor for kinetic energy for graphing
const NUM_STARS = 300;

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

// D3 Orbit Animation Setup
function setupOrbitSVG() {
  // Remove any existing SVG
  d3.select('#orbit-animation').selectAll('svg').remove();

  // Get actual container size
  const container = document.getElementById('orbit-animation');
  const ORBIT_SVG_WIDTH = container.offsetWidth;
  const ORBIT_SVG_HEIGHT = container.offsetHeight;
  const ORBIT_CENTER_X = ORBIT_SVG_WIDTH * 0.7;
  const ORBIT_CENTER_Y = ORBIT_SVG_HEIGHT / 2;
  const ORBIT_SCALE = Math.min(ORBIT_SVG_WIDTH, ORBIT_SVG_HEIGHT) * 0.13; // Responsive scaling

  // Create SVG
  const orbitSVG = d3.select('#orbit-animation')
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%');

  // Draw sun at center
  orbitSVG.append('circle')
    .attr('cx', ORBIT_CENTER_X)
    .attr('cy', ORBIT_CENTER_Y)
    .attr('r', Math.max(16, ORBIT_SVG_WIDTH * 0.02))
    .attr('fill', 'yellow')
    .attr('stroke', 'white')
    .attr('stroke-width', 2);

  // Store for use in animation
  window._orbitSVG = orbitSVG;
  window._ORBIT_CENTER_X = ORBIT_CENTER_X;
  window._ORBIT_CENTER_Y = ORBIT_CENTER_Y;
  window._ORBIT_SCALE = ORBIT_SCALE;
}

// Animation variables
let animationId = null;
let currentTime = 0;
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
    .text(input.yLabel);

  return { svg: svg, xScale: xScale, yScale: yScale };
}

// POTENTIAL ENERGY
const potential_energy_input = {
  divID: "#potential-energy-graph",
  svgID: "svg-for-potential-energy-plot",
  domain: { lower: 0, upper: 10 },
  xLabel: "Radius (AU × 10³)",
  range: { lower: -20, upper: 5 },
  yLabel: "Potential (J × 10^34)"
};
const potential_energy_plot = createPlot(potential_energy_input);
var pe_line = potential_energy_plot.svg.append("g").attr("id", "potential-energy-line");
var pe_point = potential_energy_plot.svg.append("circle")
  .attr("id", "potential-energy-point").attr("r", 3).attr("fill", "blue").attr("visibility", "visible");

// RADIAL KINETIC ENERGY
const radial_kinetic_energy_input = {
  divID: "#kinetic-graph",
  svgID: "svg-for-radial-kinetic-energy-plot",
  domain: { lower: 0, upper: 10 },
  xLabel: "Radius (AU)",
  range: { lower: 0, upper: 10 },
  yLabel: "Radial Kinetic Energy (J)"
};
const radial_kinetic_energy_plot = createPlot(radial_kinetic_energy_input);
var radial_ke_line = radial_kinetic_energy_plot.svg.append("g").attr("id", "kinetic-energy-line");
var radial_ke_point = radial_kinetic_energy_plot.svg.append("circle")
  .attr("id", "kinetic-energy-point").attr("r", 3).attr("fill", "black").attr("visibility", "visible");

// Orbital KINETIC ENERGY
const orbital_kinetic_energy_input = {
  divID: "#kinetic-graph2",
  svgID: "svg-for-orbital-kinetic-energy-plot",
  domain: { lower: 0, upper: 10 },
  xLabel: "Radius (AU)",
  range: { lower: 0, upper: 10 },
  yLabel: "Orbital Kinetic Energy (J)"
};
const orbital_kinetic_energy_plot = createPlot(orbital_kinetic_energy_input);
var orbital_ke_line = orbital_kinetic_energy_plot.svg.append("g").attr("id", "kinetic-energy-line");
var orbital_ke_point = orbital_kinetic_energy_plot.svg.append("circle")
  .attr("id", "kinetic-energy-point").attr("r", 3).attr("fill", "black").attr("visibility", "visible");

/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

// generate energy data
var pe_data = [];
function potentialEnergyData() {
  pe_data.length = 0;

  for (let r = 1; r <= 1e12; r += 1e12 / 400) {
    let Ueff = (L ** 2) / (2 * earthMass * r ** 2) - (G * earthMass * sunMass) / r
    pe_data.push({
      x: r / SCALE_R,  // Scaled radius
      y: Ueff / SCALE_U  // Scaled energy});
    });
  }
}

function plotPotentialEnergy(data) {
  // potential energy
  input = {
    data: data,
    svg: potential_energy_plot.svg,
    line: pe_line,
    xScale: potential_energy_plot.xScale,
    yScale: potential_energy_plot.yScale,
    color: "green"
  };

  // plot the data
  plotData(input);
}

function radialKineticEnergyData() {
  radial_ke_data = [];
  let phi = 0;
  const maxPhi = 2 * Math.PI * 1.2;
  const dphi = 0.001;

  while (phi <= maxPhi) {
    // Calculate radial distance and velocities
    let r = (L * L) / (G * sunMass * earthMass * earthMass * (1 + epsilon * Math.cos(phi)));
    let dphidt = L / (earthMass * r * r);

    // Radial velocity component (dr/dt)
    let dr_dphi = (r * epsilon * Math.sin(phi)) / (1 + epsilon * Math.cos(phi));
    let drdt = dr_dphi * dphidt;

    // Total kinetic energy (both components)
    let ke = 0.5 * earthMass * (drdt * drdt);

    radial_ke_data.push({
      x: r / 1.496e11, // Convert to AU
      y: ke / SCALE_KE  // Scale energy
    });
    phi += dphi;
  }
}

function plotRadialKineticEnergy(data) {
  // Update domain and range based on data
  const xExtent = d3.extent(data, d => d.x);
  const yExtent = d3.extent(data, d => d.y);

  radial_kinetic_energy_plot.xScale.domain(xExtent);
  radial_kinetic_energy_plot.yScale.domain([0, yExtent[1]]);

  // Update axes
  radial_kinetic_energy_plot.svg.select(".myXaxis")
    .transition()
    .duration(TRANSITION_TIME)
    .call(d3.axisBottom(radial_kinetic_energy_plot.xScale));

  radial_kinetic_energy_plot.svg.select(".myYaxis")
    .transition()
    .duration(TRANSITION_TIME)
    .call(d3.axisLeft(radial_kinetic_energy_plot.yScale));

  // kinetic energy
  input = {
    data: data,
    svg: radial_kinetic_energy_plot.svg,
    line: radial_ke_line,
    xScale: radial_kinetic_energy_plot.xScale,
    yScale: radial_kinetic_energy_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);
}

function orbitalKineticEnergyData() {
  orbital_ke_data = [];
  let phi = 0;
  const maxPhi = 2 * Math.PI * 1.2;
  const dphi = 0.001;

  while (phi <= maxPhi) {
    // Calculate radial distance and velocities
    let r = (L * L) / (G * sunMass * earthMass * earthMass * (1 + epsilon * Math.cos(phi)));
    let dphidt = L / (earthMass * r * r);

    // Radial velocity component (dr/dt)
    let dr_dphi = (r * epsilon * Math.sin(phi)) / (1 + epsilon * Math.cos(phi));
    let drdt = dr_dphi * dphidt;

    // Total kinetic energy (both components)
    let ke = 0.5 * L * L / (earthMass * r * r);

    orbital_ke_data.push({
      x: r / 1.496e11, // Convert to AU
      y: ke / SCALE_KE  // Scale energy
    });
    phi += dphi;
  }
}

function plotOrbitalKineticEnergy(data) {
  // Update domain and range based on data
  const xExtent = d3.extent(data, d => d.x);
  const yExtent = d3.extent(data, d => d.y);

  orbital_kinetic_energy_plot.xScale.domain(xExtent);
  orbital_kinetic_energy_plot.yScale.domain([0, yExtent[1]]);

  // Update axes
  orbital_kinetic_energy_plot.svg.select(".myXaxis")
    .transition()
    .duration(TRANSITION_TIME)
    .call(d3.axisBottom(orbital_kinetic_energy_plot.xScale));

  orbital_kinetic_energy_plot.svg.select(".myYaxis")
    .transition()
    .duration(TRANSITION_TIME)
    .call(d3.axisLeft(orbital_kinetic_energy_plot.yScale));

  // kinetic energy
  input = {
    data: data,
    svg: orbital_kinetic_energy_plot.svg,
    line: orbital_ke_line,
    xScale: orbital_kinetic_energy_plot.xScale,
    yScale: orbital_kinetic_energy_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);
}

function plotPotentialPoint(r) {
  // Calculate effective potential at current radius
  let centrifugal_term = (L ** 2) / (2 * earthMass * r ** 2);
  let gravitational_term = -(G * earthMass * sunMass) / r;
  let Ueff = centrifugal_term + gravitational_term;

  // Update point position
  pe_point.attr("cx", potential_energy_plot.xScale(r / SCALE_R));
  pe_point.attr("cy", potential_energy_plot.yScale(Ueff / SCALE_U));
}

function plotRadialKineticPoint(r, phi) {
  // Find the closest data point in radial_ke_data based on radius
  const r_au = r / 1.496e11; // Convert to AU

  // Find closest point by radius
  let closest_point = radial_ke_data[0];
  let min_distance = Math.abs(radial_ke_data[0].x - r_au);

  for (let i = 1; i < radial_ke_data.length; i++) {
    let distance = Math.abs(radial_ke_data[i].x - r_au);
    if (distance < min_distance) {
      min_distance = distance;
      closest_point = radial_ke_data[i];
    }
  }

  // Use the y-value from the pre-calculated curve data
  radial_ke_point.attr("cx", radial_kinetic_energy_plot.xScale(r_au));
  radial_ke_point.attr("cy", radial_kinetic_energy_plot.yScale(closest_point.y));
}

function plotOrbitalKineticPoint(r, phi) {
  // Find the closest data point in orbital_ke_data based on radius
  const r_au = r / 1.496e11; // Convert to AU

  // Find closest point by radius
  let closest_point = orbital_ke_data[0];
  let min_distance = Math.abs(orbital_ke_data[0].x - r_au);

  for (let i = 1; i < orbital_ke_data.length; i++) {
    let distance = Math.abs(orbital_ke_data[i].x - r_au);
    if (distance < min_distance) {
      min_distance = distance;
      closest_point = orbital_ke_data[i];
    }
  }

  // Use the y-value from the pre-calculated curve data
  orbital_ke_point.attr("cx", orbital_kinetic_energy_plot.xScale(r_au));
  orbital_ke_point.attr("cy", orbital_kinetic_energy_plot.yScale(closest_point.y));
}

// Function to update displayed values
function updateDisplayedValues() {
  document.getElementById("print-L").innerHTML = (L / 1e40).toFixed(2);
  document.getElementById("print-E").innerHTML = (E / 1e33).toFixed(2);
  document.getElementById("print-rmin").innerHTML = (r_min / 1.496e11).toFixed(2);
  document.getElementById("print-epsilon").innerHTML = epsilon.toFixed(3);
}

updateEnergyLimits();
// initialize plots
potentialEnergyData();
plotPotentialEnergy(pe_data);
radialKineticEnergyData();
plotRadialKineticEnergy(radial_ke_data);
orbitalKineticEnergyData();
plotOrbitalKineticEnergy(orbital_ke_data);
updateDisplayedValues();

/////////////////////////////////////////////////
/* ORBIT VISUALIZATION */
/////////////////////////////////////////////////

function drawOrbitTrace() {
  const orbitSVG = window._orbitSVG;
  const ORBIT_CENTER_X = window._ORBIT_CENTER_X;
  const ORBIT_CENTER_Y = window._ORBIT_CENTER_Y;
  const ORBIT_SCALE = window._ORBIT_SCALE;
  const points = [];
  for (let angle = 0; angle <= 2 * Math.PI; angle += 0.01) {
    const r = (L ** 2) / (G * sunMass * earthMass * mu * (1 + epsilon * Math.cos(angle)));
    const x = ORBIT_CENTER_X + (r / SCALE_R) * ORBIT_SCALE * Math.cos(angle);
    const y = ORBIT_CENTER_Y + (r / SCALE_R) * ORBIT_SCALE * Math.sin(angle);
    points.push([x, y]);
  }
  orbitSVG.selectAll('.orbit-trace').remove();
  orbitSVG.append('path')
    .datum(points)
    .attr('class', 'orbit-trace')
    .attr('fill', 'none')
    .attr('stroke', '#EEEEEE')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '2,4')
    .attr('d', d3.line());

  // Remove and re-append the planet so it is above the trace
  orbitSVG.selectAll('#planet-orbit').remove();
  orbitSVG.append('circle')
    .attr('id', 'planet-orbit')
    .attr('r', Math.max(8, window._ORBIT_SCALE * 0.13))
    .attr('fill', '#00BFFF')
    .attr('stroke', 'white')
    .attr('stroke-width', 2);
}

function updateOrbitVisualization(r, phi) {
  const ORBIT_CENTER_X = window._ORBIT_CENTER_X;
  const ORBIT_CENTER_Y = window._ORBIT_CENTER_Y;
  const ORBIT_SCALE = window._ORBIT_SCALE;
  const x = ORBIT_CENTER_X + (r / SCALE_R) * ORBIT_SCALE * Math.cos(phi);
  const y = ORBIT_CENTER_Y + (r / SCALE_R) * ORBIT_SCALE * Math.sin(phi);
  window._orbitSVG.select('#planet-orbit')
    .attr('cx', x)
    .attr('cy', y);
}

/////////////////////////////////////////////////
/* ANIMATION LOOP */
/////////////////////////////////////////////////

/**
 * Main animation function that updates all visualizations
 */
function animate() {
  // Calculate current orbital state
  const r = (L ** 2) / (G * sunMass * earthMass * mu * (1 + epsilon * Math.cos(currentTime)));
  
  // Update all visualizations
  updateOrbitVisualization(r, currentTime);
  plotPotentialPoint(r);
  plotRadialKineticPoint(r, currentTime);
  plotOrbitalKineticPoint(r, currentTime);
  
  // Update time
  currentTime += 0.01;
  
  // Continue animation
  animationId = requestAnimationFrame(animate);
}

// distance between two points
function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}









/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

/////////////////////////////////////////////////
/* EVENT HANDLERS */
/////////////////////////////////////////////////

/**
 * Updates orbital parameters and regenerates all data
 */
function updateOrbitalParameters() {
  E = parseFloat(document.getElementById("E-slider").value) * 1e33;
  L = parseFloat(document.getElementById("L-slider").value) * 1e40;

  // Recalculate derived quantities
  calculateDerivedQuantities();

  // Update displayed values
  updateDisplayedValues();

  // Regenerate and replot all graphs
  potentialEnergyData();
  plotPotentialEnergy(pe_data);
  radialKineticEnergyData();
  plotRadialKineticEnergy(radial_ke_data);
  orbitalKineticEnergyData();
  plotOrbitalKineticEnergy(orbital_ke_data);

  // Restart animation with new parameters
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  currentTime = 0;
  setupOrbitSVG();
  drawOrbitTrace();
  animate();
}

// Attach event listeners
document.getElementById("E-slider").oninput = updateOrbitalParameters;
document.getElementById("L-slider").oninput = updateOrbitalParameters;








// Show/Hide answer toggle
var showAnswer1 = false;
document.getElementById("show-q1").addEventListener("click", function () {
  if (!showAnswer1) {
    showAnswer1 = true;
    document.getElementById("show-q1").innerHTML = "Hide Answer";
    document.getElementById("answer1").style.display = "block";
  } else {
    showAnswer1 = false;
    document.getElementById("show-q1").innerHTML = "Show Answer";
    document.getElementById("answer1").style.display = "none";
  }
});

var showAnswer2 = false;
document.getElementById("show-q2").addEventListener("click", function () {
  if (!showAnswer2) {
    showAnswer2 = true;
    document.getElementById("show-q2").innerHTML = "Hide Answer";
    document.getElementById("answer2").style.display = "block";
  } else {
    showAnswer2 = false;
    document.getElementById("show-q2").innerHTML = "Show Answer";
    document.getElementById("answer2").style.display = "none";
  }
});

/////////////////////////////////////////////////
/* INITIALIZATION */
/////////////////////////////////////////////////

/**
 * Initializes the application
 */
function initialize() {
  // Calculate and display initial derived values
  calculateDerivedQuantities();
  updateDisplayedValues();
  
  // Setup orbit visualization
  setupOrbitSVG();
  drawOrbitTrace();
  
  // Start animation
  animate();
}

// Handle window resize
window.addEventListener('resize', function() {
  setupOrbitSVG();
  drawOrbitTrace();
});

// Initialize the application when the page loads
document.addEventListener("DOMContentLoaded", initialize);



// Initialize star background
window.addEventListener("load", drawStars);
window.addEventListener("resize", drawStars);
