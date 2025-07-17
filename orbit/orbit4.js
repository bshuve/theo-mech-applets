/////////////////////////////////////////////////
/* PARAMETERS */
/////////////////////////////////////////////////

const G = 6.7e-11;
const TOTAL_MASS = 3e28; // Keep total mass constant
const SCALE_R = 1e7; // Scale factor for radius (m to display units)
const DT = 0.1; // Time step for animation (increased for visibility)
const TRANSITION_TIME = 10; // ms

// Initialize parameters from sliders
var massRatio = parseFloat(document.getElementById("mass-ratio-slider").getAttribute("value"));
var mass1 = TOTAL_MASS * massRatio / (massRatio + 1);
var mass2 = TOTAL_MASS / (massRatio + 1);
var mu = (mass1 * mass2) / (mass1 + mass2);
var epsilon = parseFloat(document.getElementById("epsilon-slider").getAttribute("value"));
var L = 2e40; // Fixed angular momentum
var energy = (epsilon ** 2 - 1) * ((G * mass1 * mass2 * mass2) / 2 / (L ** 2));

// Component visibility flags
var componentVisibility = {
    mass1: true,
    mass2: true,
    separation: true,
    com: true
};

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
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.5 + 0.5
    });
  }

  function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#182030";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const now = performance.now() / 1000;
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
/* D3 ORBIT VISUALIZATION */
/////////////////////////////////////////////////

function setupOrbitSVG() {
  // Remove any existing SVG
  d3.select('#orbit-animation').selectAll('svg').remove();

  // Get actual container size
  const container = document.getElementById('orbit-animation');
  const ORBIT_SVG_WIDTH = container.offsetWidth;
  const ORBIT_SVG_HEIGHT = container.offsetHeight;
  const ORBIT_CENTER_X = ORBIT_SVG_WIDTH / 2;
  const ORBIT_CENTER_Y = ORBIT_SVG_HEIGHT / 2;
  const ORBIT_SCALE = Math.min(ORBIT_SVG_WIDTH, ORBIT_SVG_HEIGHT) * 0.25; // Increased scale factor

  // Create SVG
  const orbitSVG = d3.select('#orbit-animation')
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .style('overflow', 'visible'); // Allow content to extend beyond bounds

  // Store for use in animation
  window._orbitSVG = orbitSVG;
  window._ORBIT_CENTER_X = ORBIT_CENTER_X;
  window._ORBIT_CENTER_Y = ORBIT_CENTER_Y;
  window._ORBIT_SCALE = ORBIT_SCALE;
}

function drawOrbitTraces() {
  const orbitSVG = window._orbitSVG;
  const ORBIT_CENTER_X = window._ORBIT_CENTER_X;
  const ORBIT_CENTER_Y = window._ORBIT_CENTER_Y;
  const ORBIT_SCALE = window._ORBIT_SCALE;
  
  // Remove existing traces
  orbitSVG.selectAll('.orbit-trace').remove();
  orbitSVG.selectAll('.mass1-orbit').remove();
  orbitSVG.selectAll('.mass2-orbit').remove();
  orbitSVG.selectAll('.separation-point').remove();
  orbitSVG.selectAll('.com-point').remove();

  // Generate orbit points for separation distance
  const separationPoints = [];
  for (let angle = 0; angle <= 2 * Math.PI; angle += 0.01) {
    const r_separation = (L ** 2) / (G * (mass1 * mass2) * mu * (1 + epsilon * Math.cos(angle)));
    const x = ORBIT_CENTER_X + (r_separation / SCALE_R) * ORBIT_SCALE * Math.cos(angle);
    const y = ORBIT_CENTER_Y + (r_separation / SCALE_R) * ORBIT_SCALE * Math.sin(angle);
    separationPoints.push([x, y]);
  }

  // Draw separation trace (red) - only if separation is visible
  if (componentVisibility.separation) {
    orbitSVG.append('path')
      .datum(separationPoints)
      .attr('class', 'orbit-trace')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255, 100, 100, 0.3)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '2,4')
      .attr('d', d3.line());
  }

  // Generate orbit points for mass1 (green)
  const mass1Points = [];
  for (let angle = 0; angle <= 2 * Math.PI; angle += 0.01) {
    const r_separation = (L ** 2) / (G * (mass1 * mass2) * mu * (1 + epsilon * Math.cos(angle)));
    const r1 = r_separation * mass2 / (mass1 + mass2);
    const x = ORBIT_CENTER_X + (r1 / SCALE_R) * ORBIT_SCALE * Math.cos(angle);
    const y = ORBIT_CENTER_Y + (r1 / SCALE_R) * ORBIT_SCALE * Math.sin(angle);
    mass1Points.push([x, y]);
  }

  // Draw mass1 orbit trace (green) - only if mass1 is visible
  if (componentVisibility.mass1) {
    orbitSVG.append('path')
      .datum(mass1Points)
      .attr('class', 'mass1-orbit')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(100, 255, 100, 0.3)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '2,4')
      .attr('d', d3.line());
  }

  // Generate orbit points for mass2 (blue)
  const mass2Points = [];
  for (let angle = 0; angle <= 2 * Math.PI; angle += 0.01) {
    const r_separation = (L ** 2) / (G * (mass1 * mass2) * mu * (1 + epsilon * Math.cos(angle)));
    const r2 = -r_separation * mass1 / (mass1 + mass2);
    const x = ORBIT_CENTER_X + (r2 / SCALE_R) * ORBIT_SCALE * Math.cos(angle);
    const y = ORBIT_CENTER_Y + (r2 / SCALE_R) * ORBIT_SCALE * Math.sin(angle);
    mass2Points.push([x, y]);
  }

  // Draw mass2 orbit trace (blue) - only if mass2 is visible
  if (componentVisibility.mass2) {
    orbitSVG.append('path')
      .datum(mass2Points)
      .attr('class', 'mass2-orbit')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(100, 100, 255, 0.3)')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '2,4')
      .attr('d', d3.line());
  }

  // Create the moving objects
  orbitSVG.append('circle')
    .attr('id', 'mass1-point')
    .attr('r', Math.max(8, ORBIT_SCALE * 0.1))
    .attr('fill', '#51cf66')
    .attr('stroke', 'white')
    .attr('stroke-width', 2);

  orbitSVG.append('circle')
    .attr('id', 'mass2-point')
    .attr('r', Math.max(8, ORBIT_SCALE * 0.1))
    .attr('fill', '#339af0')
    .attr('stroke', 'white')
    .attr('stroke-width', 2);

  orbitSVG.append('circle')
    .attr('id', 'separation-point')
    .attr('r', Math.max(6, ORBIT_SCALE * 0.08))
    .attr('fill', '#ff6b6b')
    .attr('stroke', 'white')
    .attr('stroke-width', 2);

  orbitSVG.append('circle')
    .attr('id', 'com-point')
    .attr('r', Math.max(4, ORBIT_SCALE * 0.06))
    .attr('fill', '#cc5de8')
    .attr('stroke', 'white')
    .attr('stroke-width', 2);
}

function updateOrbitVisualization(phi) {
  const ORBIT_CENTER_X = window._ORBIT_CENTER_X;
  const ORBIT_CENTER_Y = window._ORBIT_CENTER_Y;
  const ORBIT_SCALE = window._ORBIT_SCALE;
  const orbitSVG = window._orbitSVG;

  // Calculate separation distance
  const r_separation = (L ** 2) / (G * (mass1 * mass2) * mu * (1 + epsilon * Math.cos(phi)));

  // Calculate individual positions
  const r1 = r_separation * mass2 / (mass1 + mass2);
  const r2 = -r_separation * mass1 / (mass1 + mass2);

  // Update mass1 position (green)
  if (componentVisibility.mass1) {
    const x1 = ORBIT_CENTER_X + (r1 / SCALE_R) * ORBIT_SCALE * Math.cos(phi);
    const y1 = ORBIT_CENTER_Y + (r1 / SCALE_R) * ORBIT_SCALE * Math.sin(phi);
    orbitSVG.select('#mass1-point')
      .attr('cx', x1)
      .attr('cy', y1)
      .style('display', 'block');
  } else {
    orbitSVG.select('#mass1-point').style('display', 'none');
  }

  // Update mass2 position (blue)
  if (componentVisibility.mass2) {
    const x2 = ORBIT_CENTER_X + (r2 / SCALE_R) * ORBIT_SCALE * Math.cos(phi);
    const y2 = ORBIT_CENTER_Y + (r2 / SCALE_R) * ORBIT_SCALE * Math.sin(phi);
    orbitSVG.select('#mass2-point')
      .attr('cx', x2)
      .attr('cy', y2)
      .style('display', 'block');
  } else {
    orbitSVG.select('#mass2-point').style('display', 'none');
  }

  // Update separation point (red)
  if (componentVisibility.separation) {
    const x_sep = ORBIT_CENTER_X + (r_separation / SCALE_R) * ORBIT_SCALE * Math.cos(phi);
    const y_sep = ORBIT_CENTER_Y + (r_separation / SCALE_R) * ORBIT_SCALE * Math.sin(phi);
    orbitSVG.select('#separation-point')
      .attr('cx', x_sep)
      .attr('cy', y_sep)
      .style('display', 'block');
  } else {
    orbitSVG.select('#separation-point').style('display', 'none');
  }

  // Update center of mass (pink) - always at center
  if (componentVisibility.com) {
    orbitSVG.select('#com-point')
      .attr('cx', ORBIT_CENTER_X)
      .attr('cy', ORBIT_CENTER_Y)
      .style('display', 'block');
  } else {
    orbitSVG.select('#com-point').style('display', 'none');
  }
}

/////////////////////////////////////////////////
/* ANIMATION LOOP */
/////////////////////////////////////////////////

let animationId = null;
let phi = 0; // Current angular position
let time = 0; // Elapsed time

/**
 * Main animation function that updates all visualizations
 */
function animate() {
  // Calculate current orbital state
  const r_separation = (L ** 2) / (G * (mass1 * mass2) * mu * (1 + epsilon * Math.cos(phi)));
  
  // Update angular position using proper orbital mechanics
  const dphidt = L / (mu * Math.pow(r_separation, 2));
  const deltaPhi = dphidt * DT;
  phi += deltaPhi;
  time += DT;
  
  // Update orbit visualization
  updateOrbitVisualization(phi);
  
  // Continue animation using setTimeout like orbit1
  setTimeout(animate, 5);
}

/////////////////////////////////////////////////
/* EVENT HANDLERS */
/////////////////////////////////////////////////

/**
 * Updates orbital parameters and regenerates all data
 */
function updateOrbitalParameters() {
  massRatio = parseFloat(document.getElementById("mass-ratio-slider").value);
  epsilon = parseFloat(document.getElementById("epsilon-slider").value);
  
  // Recalculate masses
  mass1 = TOTAL_MASS * massRatio / (massRatio + 1);
  mass2 = TOTAL_MASS / (massRatio + 1);
  mu = (mass1 * mass2) / (mass1 + mass2);
  
  // Update energy
  energy = (epsilon ** 2 - 1) * ((G * mass1 * mass2 * mass2) / 2 / (L ** 2));
  
  // Update displayed values
  document.getElementById("print-mass-ratio").innerHTML = massRatio.toFixed(1);
  document.getElementById("print-epsilon").innerHTML = epsilon.toFixed(2);
  document.getElementById("print-mass1").innerHTML = mass1.toExponential(2);
  document.getElementById("print-mass2").innerHTML = mass2.toExponential(2);

  // Restart animation with new parameters
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  phi = 0;
  time = 0;
  setupOrbitSVG();
  drawOrbitTraces();
  animate();
}

// Attach event listeners
document.getElementById("mass-ratio-slider").oninput = updateOrbitalParameters;
document.getElementById("epsilon-slider").oninput = updateOrbitalParameters;

// Component visibility toggles
function toggleComponent(componentName, buttonId) {
  componentVisibility[componentName] = !componentVisibility[componentName];
  const button = document.getElementById(buttonId);
  
  if (componentVisibility[componentName]) {
    button.classList.remove('hidden');
    button.classList.add('visible');
  } else {
    button.classList.remove('visible');
    button.classList.add('hidden');
  }
  
  // Redraw orbit traces to show/hide the appropriate traces
  drawOrbitTraces();
}

document.getElementById("toggle-mass1").onclick = () => toggleComponent('mass1', 'toggle-mass1');
document.getElementById("toggle-mass2").onclick = () => toggleComponent('mass2', 'toggle-mass2');
document.getElementById("toggle-separation").onclick = () => toggleComponent('separation', 'toggle-separation');
document.getElementById("toggle-com").onclick = () => toggleComponent('com', 'toggle-com');

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

/////////////////////////////////////////////////
/* INITIALIZATION */
/////////////////////////////////////////////////

/**
 * Initializes the application
 */
function initialize() {
  // Update displayed values
  document.getElementById("print-mass-ratio").innerHTML = massRatio.toFixed(1);
  document.getElementById("print-epsilon").innerHTML = epsilon.toFixed(2);
  document.getElementById("print-mass1").innerHTML = mass1.toExponential(2);
  document.getElementById("print-mass2").innerHTML = mass2.toExponential(2);
  
  // Setup orbit visualization
  setupOrbitSVG();
  drawOrbitTraces();
  
  // Start animation
  animate();
}

// Handle window resize
window.addEventListener('resize', function() {
  setupOrbitSVG();
  drawOrbitTraces();
});

// Initialize star background
window.addEventListener("load", drawStars);
window.addEventListener("resize", drawStars);

// Initialize the application when the page loads
document.addEventListener("DOMContentLoaded", initialize);

