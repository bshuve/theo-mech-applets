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
const omega = 1;
const END_TIME = 2 * Math.PI / omega;
const w_range = parseInt(document.getElementById("w-slider").getAttribute("max"));
var slider_w = parseInt(document.getElementById("w-slider").getAttribute("value"))/10;

/////////////////////////////////////////////////
/* CANVAS ANIMATIONS */
/////////////////////////////////////////////////

// wrapper function to start animations
function startAnimation(w) {
  mass1 = new component(20, 20, "blue", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20, w, 1);   // actual
  mass2 = new component(20, 20, "red", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20, w, 2);   // parameterized
  animArea.start();
}

function runAnimation(w) {
  startAnimation(w);
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
  parameterized_data: [],
  actual_data: [],
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
      this.parameterized_data = [];
      this.actual_data = [];
      clearInterval(this.interval); 
  },
}

// to create projectiles
function component(width, height, color, x, y, w, type) {
  this.width = width;
  this.height = height;
  this.color = color;
  this.x = x;
  this.y = y;
  this.w = w;
  this.type = type;

  this.update = function(){
      animArea.context.fillStyle = this.color;
      animArea.context.fillRect(transformXCoord(this.x), this.y, this.width, this.height);
  }

  this.newPos = function(t) {
    if (this.type == 1) { this.x = Math.cos(this.w * t); }
    else { this.x = Math.cos(this.w * t) + 0.1 * Math.sin(omega * t); }
  }
}

// helper to make the spring
function zigzag(x, startY, color) {
    const startX = 20;
    var zigzagSpacing = x / 7;

    animArea.context.lineWidth = 2;
    animArea.context.strokeStyle = color; // blue-ish color
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
  plotPosition(animArea.actual_data, animArea.parameterized_data);

  // update positions
  mass1.newPos(animArea.time);
  mass2.newPos(animArea.time);
  animArea.actual_data.push({x: animArea.time, y: mass1.x});
  animArea.parameterized_data.push({x: animArea.time, y: mass2.x});

  // add spring
  zigzag(transformXCoord(mass1.x), CANVAS_HEIGHT/2-15, "#0096FF");
  zigzag(transformXCoord(mass2.x), CANVAS_HEIGHT/2+25, "red");

  // add ground + wall
  animArea.context.fillStyle = "black";
  animArea.context.fillRect(20, CANVAS_HEIGHT/2+51, CANVAS_WIDTH-40, 3);
  animArea.context.fillRect(20, CANVAS_HEIGHT/2-19, 3, 70);

  // update plots
  mass1.update();
  mass2.update();

  // add text
  animArea.context.font = "20px Arial";
  animArea.context.fillStyle = "black";
  animArea.context.fillText("Spring Motion", 10, 30);

  // end animation
  if (animArea.time >= END_TIME) {
    // document.getElementById("debug").innerHTML = animArea.actual_data;
    endAnimation();}
}


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

// POSITION
const position_input = {
  divID: "#position-graph",
  svgID: "svg-for-position-plots",
  domain: {lower: 0, upper: END_TIME},
  xLabel: "Time",
  range: {lower: -1.1, upper: 1.1},
  yLabel: "Displacement"};
const position_plot = createPlot(position_input);
var x_actual_line = position_plot.svg.append("g").attr("id", "x-actual-line");
var x_parameterized_line = position_plot.svg.append("g").attr("id", "x-parameterized-line");


/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

// update position plot
function plotPosition(actual, parameterized) {

  // prepare input for actual displacement plot
  var input = {
    data: actual,
    svg: position_plot.svg,
    line: x_actual_line,
    xScale: position_plot.xScale,
    yScale: position_plot.yScale,
    color: "blue"};

  // plot the data
  plotData(input);

  // prepare input for parameterized displacement plot
  input = {
    data: parameterized,
    svg: position_plot.svg,
    line: x_parameterized_line,
    xScale: position_plot.xScale,
    yScale: position_plot.yScale,
    color: "red"};

  // plot the data
  plotData(input);
}

document.getElementById("w-slider").oninput = function() {
  // get new angular speed w
  slider_w = parseInt(document.getElementById("w-slider").value)/10;
  document.getElementById("print-w").innerHTML = slider_w;

  endAnimation();
  startAnimation(slider_w);
}

// run animation
document.getElementById("w-slider").onchange = function() {
  slider_w = parseInt(document.getElementById("w-slider").value)/10;
  runAnimation(slider_w);
}
