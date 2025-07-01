/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////

const CANVAS_WIDTH = 330;
const CANVAS_HEIGHT = 280;
const SVG_WIDTH = 330;
const SVG_HEIGHT = 280;
const dt = 15600;
const FRAME_RATE = 10   // ms
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
const NUM_STARS = 50;
const stars = Array.from({ length: NUM_STARS }, () => ({
  x: Math.random() * CANVAS_WIDTH,
  y: Math.random() * CANVAS_HEIGHT,
  radius: Math.random() * 1.5 + 0.5 // random star size
}));

const hiPPICanvas = createHiPPICanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
const originalPanel = document.getElementById("orbit-canvas");
originalPanel.replaceWith(hiPPICanvas);
hiPPICanvas.id = "orbit-canvas";
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
    .text(input.yLabel)

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
/* CANVAS ANIMATIONS */
/////////////////////////////////////////////////

// wrapper function to start animations
function startAnimation() {
  // projectiles - changed from rectangles to circles with radius parameter

  earth = new component(4, "AliceBlue", transformXCoord(0), transformYCoord(0)); // radius = 2

  earth.phi = 0;
  sun = new component(8, "yellow", transformXCoord(0), transformYCoord(0)); // radius = 5
  animArea.start();
  earth.generateEllipse();
}

function runAnimation() {
  startAnimation();
  animArea.run();
}

// wrapper function to end animations
function endAnimation() {
  animArea.stop();
}

// distance between two points
function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

//parameterized coord -> canvas coord
function transformXCoord(x) {
  const low = -6e11; // -4 AU
  const high = 6e11;  // +4 AU
  return (90 + ((x - low) / (high - low)) * (150));
}

// parameterized coord -> canvas coord
function transformYCoord(y) {
  const low = -6e11; // -4 AU
  const high = 6e11;  // +4 AU
  return (65 + ((y - low) / (high - low)) * (150));
}

// JS object for both canvases
var animArea = {
  panel: hiPPICanvas,
  start: function () {
    this.panel.width = CANVAS_WIDTH;
    this.panel.height = CANVAS_HEIGHT;
    this.context = this.panel.getContext("2d");
    this.time = 0;
    updateFrame();
  },
  run: function () {
    this.interval = setInterval(updateFrame, FRAME_RATE);
  },
  clear: function () {
    this.context.clearRect(0, 0, this.panel.width, this.panel.height);
    this.context.fillStyle = "black";
    this.context.fillRect(0, 0, this.panel.width, this.panel.height);
    // Draw ellipse orbit path
    earth.generateEllipse();
    this.context.fillStyle = "rgba(255, 255, 255, 0.5)";
    for (let star of stars) {
      this.context.beginPath();
      this.context.arc(star.x, star.y, star.radius, 0, 2 * Math.PI);
      this.context.fill();
    }
  },
  stop: function () {
    clearInterval(this.interval);
    this.time = 0;
  },
}

// Modified component function to create circles instead of rectangles
function component(radius, color, x, y) {
  this.radius = radius;
  this.color = color;
  this.x = x; //in canvas
  this.y = y; //in canvas
  this.phi = 0; //physical
  this.r = 0; //physical

  let circles = [];

  this.update = function () {
    const ctx = animArea.context;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }
  this.newPos = function (t) {
    // Calculate radial distance at current phi
    this.r = (L * L) / (G * sunMass * earthMass * mu * (1 + epsilon * Math.cos(this.phi)));
    // Update phi using dphi/dt = L / (earthMass * r^2)
    let dphi = L / (earthMass * Math.pow(this.r, 2)) * dt;
    this.phi += dphi;
    // Convert polar (r, phi) to Cartesian (x, y)
    this.x = transformXCoord(this.r * Math.cos(this.phi));
    this.y = transformYCoord(this.r * Math.sin(this.phi));
  }

  this.generateEllipse = function () {
    // Clear the circles array to prevent memory leak
    circles = [];

    for (let angle = 0; angle <= 2 * Math.PI; angle += 0.1) {
      let r = ((L) ** 2) / (G * sunMass * earthMass * mu * (1 + epsilon * Math.cos(angle)));

      circles.push({
        x: transformXCoord(r * Math.cos(angle)),
        y: transformYCoord(r * Math.sin(angle)),
        radius: this.radius,
        color: this.color,
      });
    }

    const drawCircle = (x, y, radius, color) => {
      ctx = animArea.context;
      //console.log(ctx);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
    }

    for (let circle of circles) {
      drawCircle(circle.x, circle.y, 0.5, circle.color);
    }
  }
}

function updateFrame() {
  // clear frame and move to next
  animArea.clear();
  // update positions
  earth.newPos(animArea.time);
  // Update plots
  plotPotentialPoint(earth.r);
  plotRadialKineticPoint(earth.r, earth.phi);
  plotOrbitalKineticPoint(earth.r, earth.phi);

  earth.update();
  sun.update();

  animArea.time += dt;
}

// run animation on load
runAnimation();



/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

// Update system when changing Energy (E) slider
document.getElementById("E-slider").oninput = function () {
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
  endAnimation();
  startAnimation();
}

// Update system when changing Angular Momentum (L) slider
document.getElementById("L-slider").oninput = function () {
  L = parseFloat(document.getElementById("L-slider").value) * 1e40;
  E = parseFloat(document.getElementById("E-slider").value) * 1e33;

  updateEnergyLimits();
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
  endAnimation();
  startAnimation();
}

// Restart animation when Energy slider is released
document.getElementById("E-slider").onchange = function () {
  E = parseFloat(document.getElementById("E-slider").value) * 1e33;

  // Recalculate derived quantities
  calculateDerivedQuantities();

  // Update displayed values
  updateDisplayedValues();

  // Restart animation
  runAnimation();
}

// Restart animation when Angular Momentum slider is released
document.getElementById("L-slider").onchange = function () {
  L = parseFloat(document.getElementById("L-slider").value) * 1e40;

  // Recalculate derived quantities
  calculateDerivedQuantities();

  // Update displayed values
  updateDisplayedValues();

  // Restart animation
  runAnimation();
}

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

// Initialize the display on page load
document.addEventListener("DOMContentLoaded", function () {
  // Set initial slider display values
    // document.getElementById("print-L").innerHTML = (L / 1e40).toFixed(2);
    // document.getElementById("print-E").innerHTML = (E / 1e33).toFixed(2);
  document.getElementById("print-speed").innerHTML = "5";

  // Calculate and display initial derived values
  calculateDerivedQuantities();
  updateDisplayedValues();
  //runAnimation();
});

//https://stackoverflow.com/questions/15661339/how-do-i-fix-blurry-text-in-my-html5-canvas
function createHiPPICanvas(width, height) {
  const ratio = window.devicePixelRatio;
  const canvas = document.createElement("canvas");
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  canvas.getContext("2d").scale(ratio, ratio);
  return canvas;
}
