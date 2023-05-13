/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////

const CANVAS_WIDTH = 330;
const CANVAS_HEIGHT = 280;
const SVG_WIDTH = 330;
const SVG_HEIGHT = 280;
const dt = 0.01;
const FRAME_RATE = 10   // ms
const TRANSITION_TIME = 10; // ms
const p_initial = parseInt(document.getElementById("p-slider").getAttribute("value"));
const p_range = parseInt(document.getElementById("p-slider").getAttribute("max"));
const k = 3;
const m = 1;
const w = Math.sqrt(k/m);


/////////////////////////////////////////////////
/* CANVAS ANIMATIONS */
/////////////////////////////////////////////////

// wrapper function to start animations
function startAnimation(p) {
  mass = new component(20, 20, "blue", CANVAS_WIDTH/2, CANVAS_HEIGHT/2, p);
  animArea.start();
}

function runAnimation(p) {
  startAnimation(p);
  animArea.run();
}

// wrapper function to end animations
function endAnimation() {
  animArea.stop();
}

// parameterized coord -> canvas coord
function transformXCoord(x) {
  // -1 -> 50
  // 1 -> CANVAS_WIDTH - 50
  // y - 50 = (x+1)*(CANVAS_WIDTH - 100)/2
  return (x + 1) * (CANVAS_WIDTH - 100) / 2 + 50
}

// parameterized coord -> canvas coord
function transformYCoord(y) {
  // 0 -> CANVAS_HEIGHT - 20
  // CANVAS_HEIGHT -> 20
  // y - 20 = (x-CANVAS_HEIGHT)*(40-CANVAS_HEIGHT)/CANVAS_HEIGHT
  return (y-CANVAS_HEIGHT)*(40-CANVAS_HEIGHT)/CANVAS_HEIGHT + 20
}

// JS object for both canvases
var animArea = {
  panel: document.getElementById("spring-canvas"),
  start: function(){
      this.panel.width = CANVAS_WIDTH;
      this.panel.height = CANVAS_HEIGHT;
      this.context = this.panel.getContext("2d");
      this.time = 0; 
      updateFrame();
      },
      
  run: function() {
      this.interval = setInterval(updateFrame, FRAME_RATE);
      },

  clear : function() {
      this.context.clearRect(0, 0, this.panel.width, this.panel.height);
      }, 

  stop : function() {
      this.time = 0;
      clearInterval(this.interval); 
  },
}

// to create projectiles
function component(width, height, color, x, y, p) {
  this.width = width;
  this.height = height;
  this.color = color;
  this.x = x;
  this.y = y;
  this.p = p * Math.PI/180;

  this.update = function(){
      animArea.context.fillStyle = this.color;
      animArea.context.fillRect(this.x, this.y, this.width, this.height);
  }

  this.newPos = function(t) {
      this.x = transformXCoord(Math.cos(w * t + this.p));
  }
}

// helper to make the spring
function zigzag(x) {
    const startX = 20;
    const startY = CANVAS_HEIGHT/2+5;
    var zigzagSpacing = x / 7;

    animArea.context.lineWidth = 2;
    animArea.context.strokeStyle = "#0096FF"; // blue-ish color
    animArea.context.beginPath();
    animArea.context.moveTo(startX, startY);

    // draw seven lines
    for (var n = 0; n < 7; n++) {
      var x = startX + ((n + 1) * zigzagSpacing);
      var y;
      
      if (n % 2 == 0) { // if n is even...
          y = startY + 10;
      }
      else { // if n is odd...
          y = startY;
      }
      animArea.context.lineTo(x, y);
  }
  animArea.context.stroke();
};

// create frames for animation
function updateFrame() {
  // clear frame and move to next
  animArea.clear();
  animArea.time += dt;

  // update positions
  mass.newPos(animArea.time);

  // add spring
  zigzag(mass.x);

  // add ground + wall
  animArea.context.fillStyle = "black";
  animArea.context.fillRect(20, CANVAS_HEIGHT/2+21, CANVAS_WIDTH-40, 3);
  animArea.context.fillRect(20, CANVAS_HEIGHT/2-19, 3, 40);

  // update plots
  mass.update();

  // add text
  animArea.context.font = "20px Arial";
  animArea.context.fillStyle = "black";
  animArea.context.fillText("Spring Motion", 10, 30);

  // end animation when t = 1
  if (animArea.time >= 4) {endAnimation();}
}

// run animation on load
startAnimation(p_initial);


/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

// generate energy data
function energyData(p){
    var position_data = [];
    var velocity_data = [];
    var kinetic_energy_data = [];
    var potential_energy_data = [];
    var t = 0;
    let pv = p * Math.PI/180
    while (t <= 4) {
        let x = Math.cos(w * t + pv);
        let v = -w * Math.sin(w * t + pv);
        let KE = 0.5 * m * v ** 2;
        let PE = 0.5 * k * x ** 2;

        position_data.push({x: Math.round(t * 10000) / 10000, y: x});
        velocity_data.push({x: Math.round(t * 10000) / 10000, y: v});
        kinetic_energy_data.push({x: Math.round(t * 10000) / 10000, y: KE});
        potential_energy_data.push({x: Math.round(t * 10000) / 10000, y: PE});

        t += dt;
    }
    return {x: position_data, v: velocity_data, k: kinetic_energy_data, p: potential_energy_data};
}

// generate integral data
function integralData(){
    var kinetic_integral_data = [];
    var potential_integral_data = [];
    var total_integral_data = [];
    for (let p = 0; p < p_range + 1; p++) {
        let pv = p * Math.PI / 180   // convert to rads
        let integral_KE =  (m * w / 8) * (8 * w - Math.sin(2 * (4 * w + pv)) + Math.sin(2 * pv));
        let integral_PE = -(k / (8 * w)) * (8 * w + Math.sin(2 * (4 * w + pv)) - Math.sin(2 * pv));

        kinetic_integral_data.push({x: p, y: integral_KE});
        potential_integral_data.push({x: p, y: integral_PE});
        total_integral_data.push({x: p, y: integral_KE + integral_PE});
    }
    return {k: kinetic_integral_data, p: potential_integral_data, s: total_integral_data};
}

// CALCULATE ALL DATA ON LOAD
const integral_data = integralData();


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

// ENERGY
const energy_input = {
  divID: "#energy-graph",
  svgID: "svg-for-energy-plots",
  domain: {lower: 0, upper: 4},
  xLabel: "Time",
  range: {lower: 0, upper: 2},
  yLabel: "Energy"};
const energy_plot = createPlot(energy_input);
var ke_line = energy_plot.svg.append("g").attr("id", "kinetic-energy-line");
var pe_line = energy_plot.svg.append("g").attr("id", "potential-energy-line");

// POSITION AND VELOCITY
const position_input = {
  divID: "#position-graph",
  svgID: "svg-for-position-plots",
  domain: {lower: 0, upper: 4},
  xLabel: "Time",
  range: {lower: -2, upper: 2},
  yLabel: "Position/Velocity"};
const position_plot = createPlot(position_input);
var x_line = position_plot.svg.append("g").attr("id", "position-line");
var v_line = position_plot.svg.append("g").attr("id", "velocity-line");

// INTEGRAL OF ENERGY
const integral_input = {
  divID: "#integral-graph",
  svgID: "svg-for-integral-plots",
  domain: {lower: 0, upper: 360},
  xLabel: "Phase (degrees)",
  range: {lower: -4, upper: 4},
  yLabel: "Integral of Energy (dt)"};
const integral_plot = createPlot(integral_input);
var ki_line = integral_plot.svg.append("g").attr("id", "kinetic-integral-line");
var pi_line = integral_plot.svg.append("g").attr("id", "potential-integral-line");
var si_line = integral_plot.svg.append("g").attr("id", "sum-integral-line");

// points on plot
var ki_point = integral_plot.svg.append("circle")
.attr("id", "kinetic-integral-point").attr("r", 3).attr("fill", "red");

var pi_point = integral_plot.svg.append("circle")
.attr("id", "potential-integral-point").attr("r", 3).attr("fill", "green");

var si_point = integral_plot.svg.append("circle")
.attr("id", "sum-integral-point").attr("r", 3).attr("fill", "blue");

// updates integral points
function plotIntegralPoints(p) {
  // x-axis is control point cy
  ki_point.attr("cx", integral_plot.xScale(p));
  pi_point.attr("cx", integral_plot.xScale(p));
  si_point.attr("cx", integral_plot.xScale(p));

  // y-axis is integral energy
  let ki = integral_data["k"][p].y;
  let pi = integral_data["p"][p].y;
  let si = integral_data["s"][p].y;

  ki_point.attr("cy", integral_plot.yScale(ki));
  pi_point.attr("cy", integral_plot.yScale(pi));
  si_point.attr("cy", integral_plot.yScale(si));
}


/////////////////////////////////////////////////
/* EVENT LISTENER FUNCTIONS */
/////////////////////////////////////////////////

// update position/velocity plot
function plotPosition(data) {

  // prepare input
  var input = {
    data: data.x,
    svg: position_plot.svg,
    line: x_line,
    xScale: position_plot.xScale,
    yScale: position_plot.yScale,
    color: "orange"};

  // plot the data
  plotData(input);

  // prepare input
  input = {
    data: data.v,
    svg: position_plot.svg,
    line: v_line,
    xScale: position_plot.xScale,
    yScale: position_plot.yScale,
    color: "purple"};

  // plot the data
  plotData(input);
}

// update energy plots
function plotEnergy(data) {

  // prepare input
  var input = {
    data: data.k,
    svg: energy_plot.svg,
    line: ke_line,
    xScale: energy_plot.xScale,
    yScale: energy_plot.yScale,
    color: "red"};

  // plot the data
  plotData(input);

  // prepare input
  input = {
    data: data.p,
    svg: energy_plot.svg,
    line: pe_line,
    xScale: energy_plot.xScale,
    yScale: energy_plot.yScale,
    color: "green"};

  // plot the data
  plotData(input);
}

const initial_data = energyData(p_initial);

// initialize energy lines
plotPosition(initial_data);

// initialize energy lines
plotEnergy(initial_data);

// integral plots initialized only on load
function plotIntegral() {
  // prepare input
  var input = {
      data: integral_data.k,
      svg: integral_plot.svg,
      line: ki_line,
      xScale: integral_plot.xScale,
      yScale: integral_plot.yScale,
      color: "red"};
  
  // plot the data
  plotData(input);

  // prepare input
  var input = {
      data: integral_data.p,
      svg: integral_plot.svg,
      line: pi_line,
      xScale: integral_plot.xScale,
      yScale: integral_plot.yScale,
      color: "green"};
  
  // plot the data
  plotData(input);

  // prepare input
  var input = {
      data: integral_data.s,
      svg: integral_plot.svg,
      line: si_line,
      xScale: integral_plot.xScale,
      yScale: integral_plot.yScale,
      color: "blue"};
  
  // plot the data
  plotData(input);
}

// initialize integral lines
plotIntegral();

// initialize integral points
plotIntegralPoints(p_initial);


/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

// update curve when changing p
document.getElementById("p-slider").oninput = function() {
    // get new angular speed w
    let p = parseInt(document.getElementById("p-slider").value);
    document.getElementById("print-p").innerHTML = p;

    // generate data
    const data = energyData(p);

    // update plots
    plotEnergy(data);
    plotPosition(data);
    plotIntegralPoints(p);

    endAnimation();
    startAnimation(p);
}

// run animation
document.getElementById("p-slider").onchange = function() {
  let p = parseInt(document.getElementById("p-slider").value);
  runAnimation(p);
}
