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
  var yScale = d3.scaleLinear().domain([ input.range.lower, input.range.upper ]).range([height, 0]);
  
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
var pe_line = potential_energy_plot.svg.append("g").attr("id", "potential-energy-line");
var pe_point = potential_energy_plot.svg.append("circle")
.attr("id", "potential-energy-point").attr("r", 3).attr("fill", "blue").attr("visibility", "visible");

// RADIAL KINETIC ENERGY
const radial_kinetic_energy_input = {
  divID: "#kinetic-graph",
  svgID: "svg-for-kinetic-energy-plot",
  domain: {lower: 0, upper: 10},
  xLabel:  "Radius (AU)",
  range: {lower: 0, upper: 10},
  yLabel:  "Radial Kinetic Energy (J)"};
const radial_kinetic_energy_plot = createPlot(radial_kinetic_energy_input);
var radial_ke_line = radial_kinetic_energy_plot.svg.append("g").attr("id", "kinetic-energy-line");
var radial_ke_point = radial_kinetic_energy_plot.svg.append("circle")
.attr("id", "kinetic-energy-point").attr("r", 3).attr("fill", "black").attr("visibility", "visible");

/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

// generate energy data
var pe_data = [];
function potentialEnergyData(){
  pe_data.length = 0;
  
  for (let r = 1; r <= 4*r_max; r+=r_max/400) {
      //console.log(r/SCALE_R); 
      let Ueff = (L**2)/(2*earthMass*r**2) - (G*earthMass*sunMass)/r
      //console.log(Ueff);
      pe_data.push({ 
      x: r / SCALE_R,  // Scaled radius
      y: Ueff / SCALE_U  // Scaled energy});
  });}
  }

function plotPotentialEnergy(data) {
  // potential energy
  input = {
    data: data,
    svg: potential_energy_plot.svg,
    line: pe_line,
    xScale: potential_energy_plot.xScale,
    yScale: potential_energy_plot.yScale,
    color: "green"};

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
    
    // Tangential velocity component
    //let v_phi = r * dphidt;
    
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
    color: "red"};

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
   // Calculate velocity components
  let dphidt = L / (earthMass * r * r);
  let dr_dphi = (r * epsilon * Math.sin(phi)) / (1 + epsilon * Math.cos(phi));
  let drdt = dr_dphi * dphidt;
  //let v_phi = r * dphidt;
  
  // Total kinetic energy
  let ke = 0.5 * earthMass * (drdt * drdt);
  
  // Update point position
  radial_ke_point.attr("cx", radial_kinetic_energy_plot.xScale(r / 1.496e11)); // Convert to AU
  radial_ke_point.attr("cy", radial_kinetic_energy_plot.yScale(ke / SCALE_KE));
}

// initialize plots
potentialEnergyData();
plotPotentialEnergy(pe_data);
radialKineticEnergyData();
plotRadialKineticEnergy(radial_ke_data);

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
    // Convert polar (r, phi) to Cartesian (x, y)
    this.x = transformXCoord(this.r * Math.cos(this.phi));
    this.y = transformYCoord(this.r * Math.sin(this.phi));
 
  }

  this.generateEllipse = function () {
    for (let angle = 0; angle <= 2 * Math.PI; angle += 0.01) {
      let r = ((earthMass*L) ** 2) / (G * sunMass * earthMass * earthMass * (1 + epsilon * Math.cos(angle)));

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
      ctx.fillRect(x, y, width, height, color);
    }
    for (let rectangle of rectangles) {
      drawRectangle(rectangle.x, rectangle.y, rectangle.width, rectangle.height, rectangle.color);
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

  earth.update();
  sun.update();

  animArea.time += dt;
  

  // end animation when t = 1
  if (earth.phi >= 10 * Math.PI) {
    //endAnimation();
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
  r_max = (L) ** 2 / (G * sunMass * earthMass * earthMass) * (1/(1-epsilon)); 
 
  potentialEnergyData();  // Regenerate data
  plotPotentialEnergy(pe_data);  // Replot
  radialKineticEnergyData();  // Regenerate KE data
  plotRadialKineticEnergy(radial_ke_data);  // Replot KE
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
  r_max = (L) ** 2 / (G * sunMass * earthMass * earthMass) * (1/(1-epsilon)); 

  potentialEnergyData();  // Regenerate data
  plotPotentialEnergy(pe_data);  // Replot
  radialKineticEnergyData();  // Regenerate KE data
  plotRadialKineticEnergy(radial_ke_data);  // Replot KE
  endAnimation();
  startAnimation();
}

// run animation
document.getElementById("epsilon-slider").onchange = function () {
  epsilon = parseFloat(document.getElementById("epsilon-slider").value);
  r_min = (L) ** 2 / (G * sunMass * earthMass * earthMass); 
  r_max = (L) ** 2 / (G * sunMass * earthMass * earthMass) * (1/(1-epsilon)); 
  runAnimation();
}

// run animation
document.getElementById("L-slider").onchange = function () {
  L = parseFloat(document.getElementById("L-slider").value)*1e40;
  r_min = (L) ** 2 / (G * sunMass * earthMass * earthMass); 
  r_max = (L) ** 2 / (G * sunMass * earthMass * earthMass) * (1/(1-epsilon)); 
  runAnimation();
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