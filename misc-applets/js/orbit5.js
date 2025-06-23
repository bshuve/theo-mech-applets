/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////

const CANVAS_WIDTH = 330;
const CANVAS_HEIGHT = 280;
const SVG_WIDTH = 330;
const SVG_HEIGHT = 280;
const dt = 31560;
const FRAME_RATE = 10   // ms
const TRANSITION_TIME = 10; // ms

const G = 6.7 * 10 ** (-11);
const sunMass = 2 * (10 ** 30);
const earthMass = 6 * (10 ** 24);
const mu = (sunMass*earthMass)/(sunMass+earthMass);
var epsilon = parseFloat(document.getElementById("epsilon-slider").getAttribute("value")); 
var L = parseFloat(document.getElementById("L-slider").getAttribute("value"))*1e40; // kg·m²/s
var energy = (epsilon ** 2 - 1) * ((G * sunMass * earthMass * earthMass) / 2 / (L ** 2));
var r_min = (L) ** 2 / (G * sunMass * earthMass * earthMass); 
var r_max = (L) ** 2 / (G * sunMass * earthMass * earthMass) * (1/(1-epsilon)); 
var radial_ke_data = [];
const SCALE_R = 1e11; // Scale factor for radius (m to AU) for graphing
const SCALE_U = 5e32; // Scale factor for energy for graphing
const SCALE_KE = 1e32; // Scale factor for kinetic energy for graphing

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

  // initialize a y-axis scaling function
  var yScale = d3.scaleLinear().domain([ input.range.lower, input.range.upper ]).range([height, 0]);

  // add x-axis
  const initialZeroY = yScale(0);

  svg.append("g")
    .attr("transform", `translate(0, ${initialZeroY})`)
    .attr("class", "myXaxis")
    .call(d3.axisBottom(xScale));

  // add x-axis label
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin.top + 20)
    .text(input.xLabel);

  
  
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
  domain: {lower: 0, upper: 10},
  xLabel:  "Radius (AU × 10³)",
  range: {lower: -20, upper: 5},
  yLabel:  "Potential (J × 10^34)"};
const potential_energy_plot = createPlot(potential_energy_input);
var pe_point = potential_energy_plot.svg.append("circle")
.attr("id", "potential-energy-point").attr("r", 3).attr("fill", "blue").attr("visibility", "visible");

// Restore the line for potential energy
var pe_line = potential_energy_plot.svg.select('#potential-energy-line').empty() ? potential_energy_plot.svg.append('g').attr('id', 'potential-energy-line') : potential_energy_plot.svg.select('#potential-energy-line');

// RADIAL KINETIC ENERGY
const radial_kinetic_energy_input = {
  divID: "#kinetic-graph",
  svgID: "svg-for-kinetic-energy-plot",
  domain: {lower: 0, upper: 10},
  xLabel:  "Radius (AU)",
  range: {lower: 0, upper: 10},
  yLabel:  "Radial Kinetic Energy (J)"};
const radial_kinetic_energy_plot = createPlot(radial_kinetic_energy_input);
// Create the kinetic energy bar once so it can be updated in updateFrame
radial_kinetic_energy_plot.svg.append("rect")
  .attr("id", "kinetic-energy-bar")
  .attr("x", 0)
  .attr("width", 20)
  .attr("y", radial_kinetic_energy_plot.yScale(0))
  .attr("height", 0)
  .attr("fill", "orange");

// ORBITAL KINETIC ENERGY
const orbital_kinetic_energy_input = {
  divID: "#orbital-kinetic-graph",
  svgID: "svg-for-orbital-kinetic-energy-plot",
  domain: {lower: 0, upper: 4},
  xLabel:  "Radius (AU)",
  range: {lower: 0, upper: 3},
  yLabel:  "Orbital Kinetic Energy (J)"};
const orbital_kinetic_energy_plot = createPlot(orbital_kinetic_energy_input);
// Create the orbital kinetic energy bar once so it can be updated in updateFrame
orbital_kinetic_energy_plot.svg.append("rect")
  .attr("id", "orbital-kinetic-energy-bar")
  .attr("x", 0)
  .attr("width", 20)
  .attr("y", orbital_kinetic_energy_plot.yScale(0))
  .attr("height", 0)
  .attr("fill", "purple");

/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

// generate energy data
var pe_data = [];
function potentialEnergyData(){
  pe_data.length = 0;
  if (!isFinite(r_min) || !isFinite(r_max) || r_max <= r_min) {
    return;
  }
  const N = 400;
  // Start r at a small value (e.g., 0.1 * r_max) to extend the curve closer to the y axis
  const r_start = Math.max(0.1 * r_max, 1e9); // avoid zero
  for (let i = 0; i <= N; i++) {
    let r = r_start + (4 * r_max - r_start) * (i / N);
    let Ueff =  - (G*earthMass*sunMass)/r;
    pe_data.push({ 
      x: r / SCALE_R,  // Scaled radius
      y: Ueff / SCALE_U  // Scaled energy
    });
  }
  // Set axes to fixed, reasonable ranges for smoothness
  potential_energy_plot.xScale.domain([0, 10]); // Fixed x-axis
  potential_energy_plot.yScale.domain([-20, 5]); // Fixed y-axis
  potential_energy_plot.svg.select(".myXaxis")
    .transition()
    .duration(TRANSITION_TIME)
    .call(d3.axisBottom(potential_energy_plot.xScale));
  potential_energy_plot.svg.select(".myYaxis")
    .transition()
    .duration(TRANSITION_TIME)
    .call(d3.axisLeft(potential_energy_plot.yScale));
}

function plotPotentialEnergy(data) {
  // get x-axis to be at y=0
  const zeroY = potential_energy_plot.yScale(0);
  potential_energy_plot.svg.select(".myXaxis")
      .transition()
      .duration(TRANSITION_TIME)
      .attr("transform", `translate(0, ${zeroY})`)
      .call(d3.axisBottom(potential_energy_plot.xScale));

  // Draw the potential energy line
  var u = pe_line.selectAll(".line").data([data], d => potential_energy_plot.xScale(d.x));
  u.enter()
    .append("path")
    .attr("class", "line")
    .merge(u)
    .transition()
    .duration(TRANSITION_TIME)
    .attr("d", d3.line()
        .x((d) => potential_energy_plot.xScale(d.x))
        .y((d) => potential_energy_plot.yScale(d.y))
    )
    .attr("fill", "none")
    .attr("stroke", "green")
    .attr("stroke-width", 1.5);
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
    
    // Tangential velocity component
    //let v_phi = r * dphidt;
    
    // Total kinetic energy (both components)
    let ke = 0.5 * earthMass * (drdt * drdt);

    radial_ke_data.push({ 
      x: r / SCALE_R, // Convert to AU
      y: ke / SCALE_KE  // Scale energy
    });
    phi += dphi;
  }
}

function plotRadialKineticEnergy(data) {
  // Only update the axes, do not draw a line or area
  const xExtent = d3.extent(data, d => d.x);
  const yExtent = d3.extent(data, d => d.y);
  radial_kinetic_energy_plot.xScale.domain(xExtent);
  radial_kinetic_energy_plot.yScale.domain([0, yExtent[1]]);
  radial_kinetic_energy_plot.svg.select(".myXaxis")
    .transition()
    .duration(TRANSITION_TIME)
    .call(d3.axisBottom(radial_kinetic_energy_plot.xScale));
  radial_kinetic_energy_plot.svg.select(".myYaxis")
    .transition()
    .duration(TRANSITION_TIME)
    .call(d3.axisLeft(radial_kinetic_energy_plot.yScale));
}

function plotPotentialPoint(r) { 
  // Calculating only the potential energy ** not effective
  let Ueff = -(G * earthMass * sunMass) / r;
  
  // Update point position
  pe_point.attr("cx", potential_energy_plot.xScale(r / SCALE_R));
  pe_point.attr("cy", potential_energy_plot.yScale(Ueff / SCALE_U));
}

// Add orbital kinetic energy data array
var orbital_ke_data = [];

function orbitalKineticEnergyData() {
  orbital_ke_data = [];
  let phi = 0;
  const maxPhi = 2 * Math.PI * 1.2;
  const dphi = 0.001;

  while (phi <= maxPhi) {
    let r = (L * L) / (G * sunMass * earthMass * earthMass * (1 + epsilon * Math.cos(phi)));
    let ke = 0.5 * L * L / (earthMass * r * r);
    orbital_ke_data.push({
      x: r / SCALE_R, // Convert to AU
      y: ke / SCALE_KE // Scaled energy
    });
    phi += dphi;
  }
}

function setOrbitalKineticEnergyScale() {
  // Set the x and y scales based on the full data range
  const xExtent = d3.extent(orbital_ke_data, d => d.x);
  const yExtent = d3.extent(orbital_ke_data, d => d.y);
  orbital_kinetic_energy_plot.xScale.domain(xExtent);
  orbital_kinetic_energy_plot.yScale.domain([0, yExtent[1] * 1.1]); // 10% headroom
  orbital_kinetic_energy_plot.svg.select(".myXaxis")
    .transition()
    .duration(TRANSITION_TIME)
    .call(d3.axisBottom(orbital_kinetic_energy_plot.xScale));
  orbital_kinetic_energy_plot.svg.select(".myYaxis")
    .transition()
    .duration(TRANSITION_TIME)
    .call(d3.axisLeft(orbital_kinetic_energy_plot.yScale));
}

// initialize plots
potentialEnergyData();
plotPotentialEnergy(pe_data);
radialKineticEnergyData();
plotRadialKineticEnergy(radial_ke_data);
orbitalKineticEnergyData();
setOrbitalKineticEnergyScale();

// Set up SVG
const orbitSVG = d3.select("#orbit-animation")
  .append("svg")
  .attr("width", CANVAS_WIDTH)
  .attr("height", CANVAS_HEIGHT);

// Draw sun
const sun = orbitSVG.append("circle")
  .attr("cx", CANVAS_WIDTH/2)
  .attr("cy", CANVAS_HEIGHT/2)
  .attr("r", 5)
  .attr("fill", "yellow");

// Draw earth (initial position)
const earth = orbitSVG.append("circle")
  .attr("r", 2)
  .attr("fill", "blue");

// Optionally, draw the orbit path as an ellipse or path

// Animation state for D3-based orbit animation
let phi = 0;
let time = 0;

function d3Animate() {
  // Advance phi and compute r for the orbit
  let r = (L * L) / (G * sunMass * earthMass * earthMass * (1 + epsilon * Math.cos(phi)));
  let dphidt = L / (earthMass * Math.pow(r, 2));
  phi += dphidt * dt;
  time += dt;

  // Update the orbit SVG
  updateOrbitSVG(r, phi);

  // Update the potential energy point
  plotPotentialPoint(r);

  // Update the radial kinetic energy bar
  let dr_dphi = (r * epsilon * Math.sin(phi)) / (1 + epsilon * Math.cos(phi));
  let drdt = dr_dphi * dphidt;
  let ke = 0.5 * earthMass * (drdt * drdt);
  let x = radial_kinetic_energy_plot.xScale(r / SCALE_R);
  let y = radial_kinetic_energy_plot.yScale(ke / SCALE_KE);
  let y0 = radial_kinetic_energy_plot.yScale(0);
  let barWidth = 20;
  let barHeight = y0 - y;
  d3.select('#kinetic-energy-bar')
    .attr('x', x - barWidth/2)
    .attr('width', barWidth)
    .attr('y', y)
    .attr('height', barHeight > 0 ? barHeight : 0);

  // Update the orbital kinetic energy bar
  let ke_orbital = 0.5 * L * L / (earthMass * r * r);
  let x_orbital = orbital_kinetic_energy_plot.xScale(r / SCALE_R);
  let y_orbital = orbital_kinetic_energy_plot.yScale(ke_orbital / SCALE_KE);
  let y0_orbital = orbital_kinetic_energy_plot.yScale(0);
  let barWidth_orbital = 20;
  let barHeight_orbital = y0_orbital - y_orbital;
  d3.select('#orbital-kinetic-energy-bar')
    .attr('x', x_orbital - barWidth_orbital/2)
    .attr('width', barWidth_orbital)
    .attr('y', y_orbital)
    .attr('height', barHeight_orbital > 0 ? barHeight_orbital : 0);

  // Loop
  requestAnimationFrame(d3Animate);
}

// Start the D3 animation loop
requestAnimationFrame(d3Animate);

/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

// update curve when changing a
document.getElementById("epsilon-slider").oninput = function () {
  epsilon = parseFloat(document.getElementById("epsilon-slider").value);
  document.getElementById("print-epsilon").innerHTML = epsilon.toFixed(2);

  L = parseFloat(document.getElementById("L-slider").value)*1e40;
  document.getElementById("print-L").innerHTML = L.toFixed(2);
  r_min = (L) ** 2 / (G * sunMass * earthMass * earthMass); 
  r_max = (L) ** 2 / (G * sunMass * earthMass * earthMass) * (1/(1-epsilon)); 
 
  potentialEnergyData();  // Regenerate data
  plotPotentialEnergy(pe_data);  // Replot
  radialKineticEnergyData();  // Regenerate KE data
  plotRadialKineticEnergy(radial_ke_data);  // Replot KE
  orbitalKineticEnergyData();
  setOrbitalKineticEnergyScale();
  phi = 0;
  time = 0;
}

// update curve when changing d
document.getElementById("L-slider").oninput = function () {
  epsilon = parseFloat(document.getElementById("epsilon-slider").value);
  document.getElementById("print-epsilon").innerHTML = epsilon.toFixed(2);

  L = parseFloat(document.getElementById("L-slider").value)*1e40;
  document.getElementById("print-L").innerHTML = L.toFixed(2);
  r_min = (L) ** 2 / (G * sunMass * earthMass * earthMass); 
  r_max = (L) ** 2 / (G * sunMass * earthMass * earthMass) * (1/(1-epsilon)); 

  potentialEnergyData();  // Regenerate data
  plotPotentialEnergy(pe_data);  // Replot
  radialKineticEnergyData();  // Regenerate KE data
  plotRadialKineticEnergy(radial_ke_data);  // Replot KE
  orbitalKineticEnergyData();
  setOrbitalKineticEnergyScale();
  phi = 0;
  time = 0;
}

// run animation
document.getElementById("epsilon-slider").onchange = function () {
  epsilon = parseFloat(document.getElementById("epsilon-slider").value);
  r_min = (L) ** 2 / (G * sunMass * earthMass * earthMass); 
  r_max = (L) ** 2 / (G * sunMass * earthMass * earthMass) * (1/(1-epsilon)); 
}

// run animation
document.getElementById("L-slider").onchange = function () {
  L = parseFloat(document.getElementById("L-slider").value)*1e40;
  r_min = (L) ** 2 / (G * sunMass * earthMass * earthMass); 
  r_max = (L) ** 2 / (G * sunMass * earthMass * earthMass) * (1/(1-epsilon)); 
}

// Animation update function
function updateOrbitSVG(r, phi) {
  // Convert polar to cartesian (centered)
  const x = CANVAS_WIDTH/2 + (r / SCALE_R) * 60 * Math.cos(phi);
  const y = CANVAS_HEIGHT/2 + (r / SCALE_R) * 60 * Math.sin(phi);
  earth.attr("cx", x).attr("cy", y);
}
