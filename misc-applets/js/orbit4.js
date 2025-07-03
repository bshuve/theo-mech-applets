/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////

const CANVAS_WIDTH = 680;
const CANVAS_HEIGHT = 580;
const SVG_WIDTH = 330;
const SVG_HEIGHT = 280;
const dt = 1;
var FRAME_RATE = 10   // ms
const TRANSITION_TIME = 10; // ms

const G = 6.7 * 10 ** (-11);
const TOTAL_MASS = 3 * (10 ** 28); // Keep total mass constant
var massRatio = parseFloat(document.getElementById("mass-ratio-slider").getAttribute("value"));
var mass1 = TOTAL_MASS * massRatio / (massRatio + 1);
var mass2 = TOTAL_MASS / (massRatio + 1);
var mu = (mass1 * mass2) / (mass1 + mass2);
var epsilon = parseFloat(document.getElementById("epsilon-slider").getAttribute("value"));
var L = 2 * 1e40; // Fixed angular momentum
var energy = (epsilon ** 2 - 1) * ((G * mass1 * mass2 * mass2) / 2 / (L ** 2));
var r_max = (L) ** 2 / (G * (mass1 + mass2) * mu) * (1 / (1 - epsilon));

// Component visibility flags
var componentVisibility = {
    mass1: true,
    mass2: true,
    separation: true,
    com: true
};

const NUM_STARS = 50;
const stars = Array.from({ length: NUM_STARS }, () => ({
  x: Math.random() * CANVAS_WIDTH,
  y: Math.random() * CANVAS_HEIGHT,
  radius: Math.random() * 1.5 + 0.5 // random star size
}));

const hiPPICanvas = createHiPPICanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
const originalPanel = document.getElementById("orbit-canvas2");
originalPanel.replaceWith(hiPPICanvas);
hiPPICanvas.id = "orbit-canvas2";

/////////////////////////////////////////////////
/* CANVAS ANIMATIONS */
/////////////////////////////////////////////////

// wrapper function to start animations
function startAnimation() {
  // projectiles - Updated to use radius instead of width/height
  sat1 = new component(8, "green", transformXCoord(0), transformYCoord(0));
  sat2 = new component(8, "blue", transformXCoord(0), transformYCoord(0));
  sat_mid = new component(3, "red", transformXCoord(0), transformYCoord(0));
  sat_mid.phi = 0;
  com = new component(3, "pink", transformXCoord(0), transformYCoord(0));
  animArea.start();
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
  const low = -3e7; // -4 AU
  const high = 3e7;  // +4 AU
  return (270 + ((x - low) / (high - low)) * (150));
}

// parameterized coord -> canvas coord
function transformYCoord(y) {
  const low = -3e7; // -4 AU
  const high = 3e7;  // +4 AU
  return (210 + ((y - low) / (high - low)) * (150));
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

// to create projectiles - Updated to draw spheres instead of rectangles
function component(radius, color, x, y) {
  this.radius = radius;
  this.color = color;
  this.x = x; //in canvas
  this.y = y; //in canvas
  this.phi = 0; //physical
  this.r = 0; //physical
  this.visible = true; // visibility property

  let circles = [];

  this.update = function () {
    if (!this.visible) return; // Don't draw if not visible
    var ctx = animArea.context;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
  }

  this.newPos = function (t) {
    // Calculate separation distance (same for all objects)
    let r_separation = (L * L) / (G * (mass1 * mass2) * mu * (1 + epsilon * Math.cos(this.phi)));

    // Update phi using the separation distance
    let dphi = L / (mu * Math.pow(r_separation, 2)) * dt;
    this.phi += dphi;

    // Now set individual positions relative to center of mass
    if (this === sat1) {
      this.r = r_separation * mass2 / (mass1 + mass2);
    }
    else if (this === sat2) {
      this.r = -r_separation * mass1 / (mass1 + mass2);
    }
    else if (this === com) {
      this.r = 0; // Center of mass is at origin
    }
    else {
      this.r = r_separation; // sat_mid shows separation distance
    }
    
    // Convert polar (r, phi) to Cartesian (x, y)
    this.x = transformXCoord(this.r * Math.cos(this.phi));
    this.y = transformYCoord(this.r * Math.sin(this.phi));
  }

  this.generateEllipse = function () {
    for (let angle = 0; angle <= 2 * Math.PI; angle += 0.01) {
      let r = ((mass2 * L) ** 2) / (G * mass1 * mass2 * mass2 * (1 + epsilon * Math.cos(angle)));

      circles.push({
        x: transformXCoord(r * Math.cos(angle)),
        y: transformYCoord(r * Math.sin(angle)),
        radius: this.radius,
        color: this.color
      });
    }
    const drawCircle = (x, y, radius, color) => {
      ctx = animArea.context;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + radius, y + radius, radius, 0, 2 * Math.PI);
      ctx.fill();
    }
    for (let circle of circles) {
      drawCircle(circle.x, circle.y, circle.radius, circle.color);
    }
  }
}

// Function to update masses based on mass ratio
function updateMasses() {
  mass1 = TOTAL_MASS * massRatio / (massRatio + 1);
  mass2 = TOTAL_MASS / (massRatio + 1);
  mu = (mass1 * mass2) / (mass1 + mass2);
  
  // Update display values
  document.getElementById("print-mass1").innerHTML = mass1.toExponential(2);
  document.getElementById("print-mass2").innerHTML = mass2.toExponential(2);
}


function updateFrame() {
  // clear frame and move to next
  animArea.clear();

  // update positions
  sat_mid.newPos(animArea.time);
  sat2.newPos(animArea.time);
  sat1.newPos(animArea.time);
  com.newPos(animArea.time);
  
  sat1.visible = componentVisibility.mass1;
  sat2.visible = componentVisibility.mass2;
  sat_mid.visible = componentVisibility.separation;
  com.visible = componentVisibility.com;

  sat_mid.update();
  sat2.update();
  sat1.update();
  com.update();

  animArea.time += dt;


}

// run animation on load
runAnimation();
// Initialize display values on load
//updateMasses();

/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

// Component visibility toggle functions
function toggleComponent(componentName, buttonId) {
  componentVisibility[componentName] = !componentVisibility[componentName];
  const button = document.getElementById(buttonId);
  
  if (componentVisibility[componentName]) {
    button.textContent = button.textContent.replace('Show', 'Hide');
    button.classList.remove('hidden');
    button.classList.add('visible');
  } else {
    button.textContent = button.textContent.replace('Hide', 'Show');
    button.classList.remove('visible');
    button.classList.add('hidden');
  }
}

// Toggle button event listeners
document.getElementById("toggle-mass1").addEventListener("click", function() {
  toggleComponent('mass1', 'toggle-mass1');
});

document.getElementById("toggle-mass2").addEventListener("click", function() {
  toggleComponent('mass2', 'toggle-mass2');
});

document.getElementById("toggle-separation").addEventListener("click", function() {
  toggleComponent('separation', 'toggle-separation');
});

document.getElementById("toggle-com").addEventListener("click", function() {
  toggleComponent('com', 'toggle-com');
});

// Update curve when changing mass ratio
document.getElementById("mass-ratio-slider").oninput = function () {
  massRatio = parseFloat(document.getElementById("mass-ratio-slider").value);
  document.getElementById("print-mass-ratio").innerHTML = massRatio.toFixed(1);
  
  updateMasses();
  endAnimation();
  startAnimation();
}

// Update curve when changing epsilon
document.getElementById("epsilon-slider").oninput = function () {
  epsilon = parseFloat(document.getElementById("epsilon-slider").value);
  document.getElementById("print-epsilon").innerHTML = epsilon.toFixed(2);
  

  
  endAnimation();
  startAnimation();
}

// Run animation when mass ratio changes
document.getElementById("mass-ratio-slider").onmouseup = function () {
  massRatio = parseFloat(document.getElementById("mass-ratio-slider").value);
  updateMasses();
  runAnimation();
}

// Run animation when epsilon changes
document.getElementById("epsilon-slider").onmouseup = function () {
  
  epsilon = parseFloat(document.getElementById("epsilon-slider").value);
  runAnimation();
}

document.getElementById("speed-slider").oninput = function () {
  const newFrameRate = parseFloat(document.getElementById("speed-slider").value);
  document.getElementById("print-speed").innerHTML = newFrameRate.toFixed(0);
  
  // Update the frame rate without restarting animation
  updateFrameRate(newFrameRate);
}

document.getElementById("speed-slider").onchange = function () {
  const newFrameRate = parseFloat(document.getElementById("speed-slider").value);
  document.getElementById("print-speed").innerHTML = newFrameRate.toFixed(0);
  
  // Update the frame rate without restarting animation
  updateFrameRate(newFrameRate);
}

// Add this new function to handle frame rate updates
function updateFrameRate(newFrameRate) {
  // Clear the existing interval
  if (animArea.interval) {
    clearInterval(animArea.interval);
  }
  
  // Update the global FRAME_RATE variable
  FRAME_RATE = newFrameRate;
  
  // Start new interval with updated frame rate
  animArea.interval = setInterval(updateFrame, FRAME_RATE);
}

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

