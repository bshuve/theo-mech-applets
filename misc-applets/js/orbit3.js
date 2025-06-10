/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////

const CANVAS_WIDTH = 330;
const CANVAS_HEIGHT = 280;
const dt = 315600;
const FRAME_RATE = 10   // ms
const TRANSITION_TIME = 10; // ms

const G = 6.7 * 10 ** (-11);
const sunMass = 2 * (10 ** 30);
const earthMass = 6 * (10 ** 24);
var epsilon = parseFloat(document.getElementById("epsilon-slider").getAttribute("value")); 
var L = parseFloat(document.getElementById("L-slider").getAttribute("value"))*1e40; // kg·m²/s
var energy = (epsilon ** 2 - 1) * ((G * sunMass * earthMass * earthMass) / 2 / (L ** 2));
var r_min = (L) ** 2 / (G * sunMass * earthMass * earthMass); 



/////////////////////////////////////////////////
/* CANVAS ANIMATIONS */
/////////////////////////////////////////////////

// wrapper function to start animations
function startAnimation() {
  // projectiles
  
  earth = new component(2, 2, "purple", transformXCoord(0), transformYCoord(0));
  earth.phi = 0;
  sun = new component(5, 5, "blue", transformXCoord(0), transformYCoord(0));
  animArea.start();
  //animArea.context.clearRect(0, 0, animArea.panel.width, animArea.panel.height);
  //earth.generateEllipse();
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
  return 100 + ((x - low) / (high - low)) * (CANVAS_WIDTH - 100);
}

// parameterized coord -> canvas coord
function transformYCoord(y) {
  
  const low = -6e11; // -4 AU
  const high = 6e11;  // +4 AU
  return (50 + ((y - low) / (high - low)) * (CANVAS_HEIGHT - 100));
}

// JS object for both canvases
var animArea = {
  panel: document.getElementById("orbit-canvas"),
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
  },
  stop: function () {
    clearInterval(this.interval);
    this.time = 0;
  },
}

// to create projectiles
function component(width, height, color, x, y) {
  this.width = width;
  this.height = height;
  this.color = color;
  this.x = x; //in canvas
  this.y = y; //in cavas
  this.phi = 0; //physical
  this.r = 0; //physical
  
  let rectangles = [];

  this.update = function () {
    var ctx = animArea.context;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  this.newPos = function (t) {
    
    // Calculate radial distance at current phi
    this.r = (L * L) / (G * sunMass * earthMass * earthMass * (1 + epsilon * Math.cos(this.phi)));
    // Update phi using dphi/dt = L / (earthMass * r^2)
    let dphi = L / (earthMass * Math.pow(this.r, 2))*dt;
    
    this.phi += dphi;
    console.log(this.r);
    // Convert polar (r, phi) to Cartesian (x, y)
    this.x = transformXCoord(this.r * Math.cos(this.phi));
    this.y = transformYCoord(this.r * Math.sin(this.phi));
    console.log(this.x);
    console.log(this.y);
  }

  this.generateEllipse = function () {
    for (let angle = 0; angle <= 2 * Math.PI; angle += 0.01) {
      let r = ((earthMass*L) ** 2) / (G * sunMass * earthMass * earthMass * (1 + epsilon * Math.cos(angle)));

      //console.log(r);
      rectangles.push({
        x: transformXCoord(r * Math.cos(angle)),
        y: transformYCoord(r * Math.sin(angle)),
        width: this.width,
        height: this.height,
        color: this.color
      });
    }
    const drawRectangle = (x, y, width, height, color) => {
      ctx = animArea.context
      ctx.fillStyle = color;
      ctx.fillRect(x, y, width, height);
    }
    for (let rectangle of rectangles) {
      drawRectangle(rectangle.x, rectangle.y, rectangle.width, rectangle.height, rectangle.color);
    }
  }
}

// create frames for animation
var position_data = [];
var angle_data = [];
var potential_time_data = [];  // Store potential energy over time

function updateFrame() {
  // clear frame and move to next
  animArea.clear();

  // update positions
  earth.newPos(animArea.time);

  //let t = Math.round(animArea.time * 100) / 100;


  // Store position data
  //position_data.push({ x: t, y: r_physical });

  // Calculate and store potential energy
  //let Ueff = A / (r_physical ** 2) - B / r_physical;
  //potential_time_data.push({ x: t, y: Ueff });

  // Update potential energy point
  //plotPotentialPoint(r_physical);

  // Store angle data
  // if (earth.x == satellite.x) {
  //   if (satellite.y > earth.y) { angle_data.push({ x: t, y: 90 }); }
  //   else { angle_data.push({ x: t, y: 270 }); }
  // } else {
  //   let angle = Math.atan((b * Math.sin(t)) / (a * Math.cos(t) - d));
  //   angle_data.push({ x: t, y: angle });
  // }

  // Update plots
  //satellite.update();
  earth.update();
  sun.update();

  animArea.time += dt;
  

  // end animation when t = 1
  if (earth.phi >= 10 * Math.PI) {
    endAnimation();
  }
  
}

// run animation on load
runAnimation();


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
  //epsilon = Math.sqrt(1 - b ** 2 / a ** 2);
  //document.getElementById("print-epsilon").innerHTML = epsilon.toFixed(2);

  // f = a * epsilon;
  // document.getElementById("print-focus").innerHTML = f.toFixed(2);

  endAnimation();
  startAnimation();
}

// update curve when changing d
document.getElementById("L-slider").oninput = function () {
  epsilon = parseFloat(document.getElementById("epsilon-slider").value);
  document.getElementById("print-epsilon").innerHTML = epsilon.toFixed(2);

  L = parseFloat(document.getElementById("L-slider").value)*1e40;
  document.getElementById("print-L").innerHTML = L.toFixed(2);
  r_min = (L) ** 2 / (G * sunMass * earthMass * earthMass); 
  // epsilon = Math.sqrt(1 - b ** 2 / a ** 2);
  // document.getElementById("print-epsilon").innerHTML = epsilon.toFixed(2);

  // f = a * epsilon;
  // document.getElementById("print-focus").innerHTML = f.toFixed(2);

  endAnimation();
  startAnimation();
}

// run animation
document.getElementById("epsilon-slider").onchange = function () {
  epsilon = parseFloat(document.getElementById("epsilon-slider").value);
  r_min = (L) ** 2 / (G * sunMass * earthMass * earthMass); 
  runAnimation();
}

// run animation
document.getElementById("L-slider").onchange = function () {
  L = parseFloat(document.getElementById("L-slider").value)*1e40;
  r_min = (L) ** 2 / (G * sunMass * earthMass * earthMass); 
  runAnimation();
}