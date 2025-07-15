/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////

const dt = 315600;
const FRAME_RATE = 10; // ms
const TRANSITION_TIME = 10; // ms

const G = 6.7 * 10 ** (-11);
const sunMass = 2 * (10 ** 30);
const earthMass = 6 * (10 ** 24);
const mu = (sunMass * earthMass) / (sunMass + earthMass);
var r_min = parseFloat(document.getElementById("rmin-slider").getAttribute("value")) * 1.496e+11;
var L = parseFloat(document.getElementById("L-slider").getAttribute("value")) * 1e40; // kg·m²/s
var energy, epsilon;



function calculateDerivedQuantities() {
  // From the relation: r_min = L²/(G*sunMass*earthMass²) * 1/(1+ε)
  // Solving for ε: ε = L²/(G*sunMass*earthMass²*r_min) - 1
  const numerator = L * L;
  const denominator = G * sunMass * earthMass * earthMass * r_min;
  epsilon = Number(Math.max(0, (numerator / denominator) - 1).toFixed(3));
  epsilon = Math.min(epsilon, 0.999);
  if (!epsilon) {
    epsilon = 0;
  }

  // Calculate and display total energy
  energy = (epsilon ** 2 - 1) * ((G * sunMass * earthMass)**2 * mu / 2 / (L ** 2));
}

function updateRminLimits() {
  // Calculate r_min limits based on current L
  // For ε = 1: r_min_min = L²/(2*G*sunMass*earthMass²)
  // For ε = 0: r_min_max = L²/(G*sunMass*earthMass²)
  
  const r_min_for_eps_1 = (L * L) / (1.98 * G * sunMass * earthMass * earthMass);
  const r_min_for_eps_0 = (L * L) / (G * sunMass * earthMass * earthMass);
  
  // Convert to AU for slider
  const r_min_min_AU = r_min_for_eps_1 / 1.496e+11;
  const r_min_max_AU = r_min_for_eps_0 / 1.496e+11;
  
  // Update slider attributes
  const slider = document.getElementById("rmin-slider");
  slider.setAttribute("min", r_min_min_AU.toFixed(2));
  slider.setAttribute("max", r_min_max_AU.toFixed(2));
  
  // Ensure current value is within new limits
  const currentValue = parseFloat(slider.value);
  if (currentValue < r_min_min_AU) {
    slider.value = r_min_min_AU.toFixed(2);
    r_min = r_min_min_AU * 1.496e+11;
    document.getElementById("print-rmin").innerHTML = r_min_min_AU.toFixed(2);
  } else if (currentValue > r_min_max_AU) {
    slider.value = r_min_max_AU.toFixed(2);
    r_min = r_min_max_AU * 1.496e+11;
    document.getElementById("print-rmin").innerHTML = r_min_max_AU.toFixed(2);
  }
  
  // Update step size to be reasonable for the range
  const range = r_min_max_AU - r_min_min_AU;
  const step = Math.min(0.01, range / 100);
  slider.setAttribute("step", step.toFixed(3));
}

const SCALE_R = 1.496e+11; // Scale factor for radius (m to AU) for graphing
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

/////////////////////////////////////////////////
/* D3 ORBIT ANIMATION */
/////////////////////////////////////////////////

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

function drawOrbitTrace(L, epsilon) {
  const orbitSVG = window._orbitSVG;
  const ORBIT_CENTER_X = window._ORBIT_CENTER_X;
  const ORBIT_CENTER_Y = window._ORBIT_CENTER_Y;
  const ORBIT_SCALE = window._ORBIT_SCALE;
  const points = [];
  for (let angle = 0; angle <= 2 * Math.PI; angle += 0.01) {
    const r = (L * L) / (G * sunMass * earthMass * earthMass * (1 + epsilon * Math.cos(angle)));
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
  
  // Calculate initial planet position (at phi = 0)
  const initialR = (L * L) / (G * sunMass * earthMass * earthMass * (1 + epsilon * Math.cos(0)));
  const initialX = ORBIT_CENTER_X + (initialR / SCALE_R) * ORBIT_SCALE * Math.cos(0);
  const initialY = ORBIT_CENTER_Y + (initialR / SCALE_R) * ORBIT_SCALE * Math.sin(0);
  
  orbitSVG.append('circle')
    .attr('id', 'planet-orbit')
    .attr('cx', initialX)
    .attr('cy', initialY)
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

// Animation state
let phi = 0;
let time = 0;

function animate() {
  const r = (L * L) / (G * sunMass * earthMass * earthMass * (1 + epsilon * Math.cos(phi)));
  const dphidt = L / (earthMass * r * r);
  const deltaPhi = dphidt * dt;
  phi += deltaPhi;
  time += dt;
  updateOrbitVisualization(r, phi);
  plotPotentialPoint(r);
  plotRadialKineticPoint(r, phi);
  plotOrbitalKineticPoint(r, phi);
  setTimeout(animate, 5);
}

/////////////////////////////////////////////////
/* MASTER GRAPHING CAPABILITY */
/////////////////////////////////////////////////

// set the dimensions and margins of the graph
var margin = { top: 20, right: 20, bottom: 50, left: 60 },
  width = 400 - margin.left - margin.right,
  height = 300 - margin.top - margin.bottom;

// Global data arrays
var pe_data = [];
var radial_ke_data = [];
var orbital_ke_data = [];

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

/////////////////////////////////////////////////
/* ENERGY DATA AND PLOTTING */
/////////////////////////////////////////////////

function potentialEnergyData() {
  pe_data.length = 0;
  for (let r = 0.5 * 1.496e+11; r <= 3 * 1.496e+11; r += 0.01 * 1.496e+11) {
    const effectivePotential = ((L ** 2) / (2 * mu * (r ** 2))) - ((G * sunMass * earthMass) / r);
    pe_data.push({
      x: r / SCALE_R,
      y: effectivePotential / SCALE_U
    });
  }
}

function plotPotentialEnergy(data) {
  try {
    // Check if plot already exists
    let plot = window._potential_energy_plot;
    if (!plot) {
      plot = createPlot({
        divID: "#potential-energy-graph",
        domain: { lower: 0.5, upper: 3 },
        range: { lower: -5, upper: 2 },
        xLabel: "r (AU)",
        yLabel: "U_eff (10³³ J)"
      });
      window._potential_energy_plot = plot;
    }

    plotData({
      line: plot.svg,
      data: data,
      xScale: plot.xScale,
      yScale: plot.yScale,
      color: "#FF6B6B"
    });
  } catch (error) {
    console.error('Error plotting potential energy:', error);
  }
}

function radialKineticEnergyData() {
  radial_ke_data.length = 0;
  for (let r = 0.5 * 1.496e+11; r <= 3 * 1.496e+11; r += 0.01 * 1.496e+11) {
    const radialKE = 0; // At r_min, radial velocity is zero
    radial_ke_data.push({
      x: r / SCALE_R,
      y: radialKE / SCALE_KE
    });
  }
}

function plotRadialKineticEnergy(data) {
  try {
    // Check if plot already exists
    let plot = window._radial_kinetic_plot;
    if (!plot) {
      plot = createPlot({
        divID: "#kinetic-graph",
        domain: { lower: 0.5, upper: 3 },
        range: { lower: 0, upper: 5 },
        xLabel: "r (AU)",
        yLabel: "K_radial (10³³ J)"
      });
      window._radial_kinetic_plot = plot;
    }

    plotData({
      line: plot.svg,
      data: data,
      xScale: plot.xScale,
      yScale: plot.yScale,
      color: "#51CF66"
    });
  } catch (error) {
    console.error('Error plotting radial kinetic energy:', error);
  }
}

function orbitalKineticEnergyData() {
  orbital_ke_data.length = 0;
  for (let r = 0.5 * 1.496e+11; r <= 3 * 1.496e+11; r += 0.01 * 1.496e+11) {
    const orbitalKE = (L ** 2) / (2 * mu * (r ** 2));
    orbital_ke_data.push({
      x: r / SCALE_R,
      y: orbitalKE / SCALE_KE
    });
  }
}

function plotOrbitalKineticEnergy(data) {
  try {
    // Check if plot already exists
    let plot = window._orbital_kinetic_plot;
    if (!plot) {
      plot = createPlot({
        divID: "#kinetic-graph2",
        domain: { lower: 0.5, upper: 3 },
        range: { lower: 0, upper: 5 },
        xLabel: "r (AU)",
        yLabel: "K_orbital (10³³ J)"
      });
      window._orbital_kinetic_plot = plot;
    }

    plotData({
      line: plot.svg,
      data: data,
      xScale: plot.xScale,
      yScale: plot.yScale,
      color: "#339AF0"
    });
  } catch (error) {
    console.error('Error plotting orbital kinetic energy:', error);
  }
}

function plotPotentialPoint(r) {
  const effectivePotential = ((L ** 2) / (2 * mu * (r ** 2))) - ((G * sunMass * earthMass) / r);
  const plot = window._potential_energy_plot;
  if (!plot) return;
  
  plot.svg.selectAll(".current-point").remove();
  
  plot.svg.append("circle")
    .attr("class", "current-point")
    .attr("cx", plot.xScale(r / SCALE_R))
    .attr("cy", plot.yScale(effectivePotential / SCALE_U))
    .attr("r", 4)
    .attr("fill", "#FFD700");
}

function plotRadialKineticPoint(r, phi) {
  const radialKE = 0; // Simplified for this example
  const plot = window._radial_kinetic_plot;
  if (!plot) return;
  
  plot.svg.selectAll(".current-point").remove();
  
  // Use a small positive value instead of 0 to avoid scale issues
  const yValue = Math.max(radialKE / SCALE_KE, 0.001);
  
  plot.svg.append("circle")
    .attr("class", "current-point")
    .attr("cx", plot.xScale(r / SCALE_R))
    .attr("cy", plot.yScale(yValue))
    .attr("r", 4)
    .attr("fill", "#FFD700");
}

function plotOrbitalKineticPoint(r, phi) {
  const orbitalKE = (L ** 2) / (2 * mu * (r ** 2));
  const plot = window._orbital_kinetic_plot;
  if (!plot) return;
  
  plot.svg.selectAll(".current-point").remove();
  
  plot.svg.append("circle")
    .attr("class", "current-point")
    .attr("cx", plot.xScale(r / SCALE_R))
    .attr("cy", plot.yScale(orbitalKE / SCALE_KE))
    .attr("r", 4)
    .attr("fill", "#FFD700");
}

function updateDisplayedValues() {
  document.getElementById("print-epsilon").innerHTML = epsilon.toFixed(3);
  document.getElementById("print-energy").innerHTML = (energy / 1e33).toFixed(2);
}

/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

function updateOrbitalParameters() {
  r_min = parseFloat(document.getElementById("rmin-slider").value) * 1.496e+11;
  document.getElementById("print-rmin").innerHTML = (r_min/1.496e+11).toFixed(2);

  L = parseFloat(document.getElementById("L-slider").value) * 1e40;
  document.getElementById("print-L").innerHTML = (L/1e40).toFixed(1);
  
  updateRminLimits();
  
  calculateDerivedQuantities();
  updateDisplayedValues();
  potentialEnergyData();
  plotPotentialEnergy(pe_data);
  radialKineticEnergyData();
  plotRadialKineticEnergy(radial_ke_data);
  orbitalKineticEnergyData();
  plotOrbitalKineticEnergy(orbital_ke_data);
  setupOrbitSVG();
  drawOrbitTrace(L, epsilon);
  phi = 0;
  time = 0;
}

document.getElementById("rmin-slider").oninput = updateOrbitalParameters;
document.getElementById("L-slider").oninput = updateOrbitalParameters;



// Question toggle
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

window.addEventListener('resize', function() {
  setupOrbitSVG();
  drawOrbitTrace(L, epsilon);
});

window.addEventListener('DOMContentLoaded', function() {
  try {
    // Initialize orbital parameters first
    calculateDerivedQuantities();
    updateDisplayedValues();
    
    // Setup orbit visualization
    setupOrbitSVG();
    drawOrbitTrace(L, epsilon);
    
    // Generate and plot data
    potentialEnergyData();
    plotPotentialEnergy(pe_data);
    radialKineticEnergyData();
    plotRadialKineticEnergy(radial_ke_data);
    orbitalKineticEnergyData();
    plotOrbitalKineticEnergy(orbital_ke_data);
    
    // Start animation
    animate();
  } catch (error) {
    console.error('Error during initialization:', error);
  }
});

// Initialize star background
window.addEventListener("load", drawStars);
