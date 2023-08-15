/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////

const CANVAS_WIDTH = 170;
const CANVAS_HEIGHT = 280;
// document.getElementById("projectile-motion-canvas").style.width = `${CANVAS_WIDTH}px`;
// document.getElementById("projectile-motion-canvas").style.height = `${CANVAS_HEIGHT}px`;

const SVG_WIDTH = 360;
const SVG_HEIGHT = 360;

const TRANSITION_TIME = 10; // ms
const FRAME_RATE = 0.1; // ms
const dt = 0.01;

const y0 = 0;

const g = 2;
const m = 1;

// required y coordinates for the plot to pass through
const min_y = parseInt(document.getElementById("y2-slider").min);
const max_y = parseInt(document.getElementById("y2-slider").max);

// corresponding t coordinates for each y coordinate above
var yList = [0, 
              0,
              parseInt(document.getElementById("y2-slider").value), 
              parseInt(document.getElementById("y3-slider").value), 
              parseInt(document.getElementById("y4-slider").value),  
              0,
              0];

const tList = [0, 3, 6, 10, 14, 17, 20];


/////////////////////////////////////////////////
/* CANVAS ANIMATIONS */
/////////////////////////////////////////////////

// wrapper function to start animations
function startAnimation() {
    // 1D projectiles
    param1D = new component(10, 10, "orange", CANVAS_WIDTH/3, transformYCoord(y0), 1);
    actual1D = new component(10, 10, "purple", 2 * CANVAS_WIDTH/3, transformYCoord(y0), 2);
    local1D = new component(10, 10, "green", 2 * CANVAS_WIDTH/3, transformYCoord(y0), 3);
    document.getElementById("print-action").innerHTML = Math.floor(action(yList));
    animArea.start();
}

// wrapper function to end animations
function endAnimation() {
    animArea.stop();
}

// parameterized coord -> canvas coord
function transformXCoord(x) {
    // 0 -> 20
    // 20 -> CANVAS_WIDTH - 20
    return 20 + x * (CANVAS_WIDTH - 40) / 20;
}

// parameterized coord -> canvas coord
function transformYCoord(y) {
    // -500 -> CANVAS_HEIGHT
    // 1000 -> 0
    return CANVAS_HEIGHT - (y + 500) * CANVAS_HEIGHT / 1500;
}

// JS object for both canvases
var animArea = {
    parameterized_data: [],
    actual_data: [],
    local_data: [],
    // panel: document.getElementById("projectile-motion-canvas"),
    start: function(){
        this.time = 0;   
        this.interval = setInterval(updateFrame, FRAME_RATE);
        },
    clear : function() {
        this.context.clearRect(0, 0, this.panel.width, this.panel.height);
        }, 
    stop : function() {
        this.time = 0;
        this.parameterized_data = [];
        this.actual_data = [];
        this.local_data = [];
        clearInterval(this.interval); 
      }
}

// to create projectiles
function component(width, height, color, x, y, type) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.color = color;
    this.x = x;
    this.y = y;

    this.newPos = function(t) {
        if (this.type == 1) {   // param 1D
            // figure out what time interval the object is in
            // if the object is at one of the "required" points, use that y coordinate
            var i;
            if (t < tList[1]) {
              i = 1;
            } else if (t == tList[1]) {
              this.y = yList[1];
              return; 
            } else if (t < tList[2]) {
              i = 2;
            } else if (t == tList[2]) {
              this.y = yList[2];
              return;
            } else if (t < tList[3]) {
              i = 3;
            } else if (t == tList[3]) {
              this.y = yList[3];
              return;
            } else if (t < tList[4]) {
              i = 4;
            } else if (t == tList[4]) {
              this.y = yList[4];
              return;
            } else if (t < tList[5]) {
              i = 5;
            } else if (t == tList[5]) {
              this.y = yList[5];
              return;
            } else if (t < tList[6]) {
              i = 6;
            } else if (t >= tList[6]) {
              this.y = yList[6];
              return;
            }
            /* if the object is not currently at one of the required points, find its y
            position using this parametrization */
            this.y = yList[i-1] + ((yList[i] - yList[i-1] + 0.5 * g * (tList[i] - tList[i-1]) ** 2) / (tList[i] - tList[i-1])) * (t - tList[i-1]) - 0.5 * g * (t - tList[i-1]) ** 2;

        } else if (this.type == 2) {   // actual 1D
            this.y = t * (20 - t);
        } else if (this.type == 3) {   // local 1D
          // for this local plot, the required values will form
          // a path of least action between points 2 and 4
          yList = [0, 
            0,
            33, 
            49, 
            33,  
            0,
            0];
            var i;
            if (t < tList[1]) {
              i = 1;
            } else if (t == tList[1]) {
              this.y = yList[1];
              return; 
            } else if (t < tList[2]) {
              i = 2;
            } else if (t == tList[2]) {
              this.y = yList[2];
              return;
            } else if (t < tList[3]) {
              i = 3;
            } else if (t == tList[3]) {
              this.y = yList[3];
              return;
            } else if (t < tList[4]) {
              i = 4;
            } else if (t == tList[4]) {
              this.y = yList[4];
              return;
            } else if (t < tList[5]) {
              i = 5;
            } else if (t == tList[5]) {
              this.y = yList[5];
              return;
            } else if (t < tList[6]) {
              i = 6;
            } else if (t >= tList[6]) {
              this.y = yList[6];
              return;
            }

            this.y = yList[i-1] + ((yList[i] - yList[i-1] + 0.5 * g * (tList[i] - tList[i-1]) ** 2) / (tList[i] - tList[i-1])) * (t - tList[i-1]) - 0.5 * g * (t - tList[i-1]) ** 2;
            yList = [0, 
              0,
              parseInt(document.getElementById("y2-slider").value), 
              parseInt(document.getElementById("y3-slider").value), 
              parseInt(document.getElementById("y4-slider").value),  
              0,
              0];
          }
    }
}

// create frames for animation
function updateFrame() {
    animArea.time += dt;


    // update projectile positions
    param1D.newPos(animArea.time);
    actual1D.newPos(animArea.time);
    local1D.newPos(animArea.time);
    animArea.parameterized_data.push({x: animArea.time, y: param1D.y});
    animArea.actual_data.push({x: animArea.time, y: actual1D.y});
    animArea.local_data.push({x: animArea.time, y: local1D.y});

    plotPosition(animArea.local_data, animArea.actual_data, animArea.parameterized_data);

    // end animation when t = 20
    if (animArea.time >= tList[6]) {endAnimation();}
}

// run on load
startAnimation();

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
    // .attr("stroke", input.color)
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
  domain: {lower: 0, upper: tList[tList.length - 1]},
  xLabel: "Time",
  range: {lower: 0, upper: 200},
  yLabel: "Displacement"};
const position_plot = createPlot(position_input);
var x_local_line = position_plot.svg.append("g").attr("id", "x-local-line").attr("stroke", "gray");
var x_actual_line = position_plot.svg.append("g").attr("id", "x-actual-line").attr("stroke", "black");
var x_parameterized_line = position_plot.svg.append("g").attr("id", "x-parameterized-line").attr("stroke", "white");

y1_point = position_plot.svg.append("circle")
.attr("id", "fixed-point").attr("r", 3).attr("fill", "red")
.attr("cx", position_plot.xScale(tList[1])).attr("cy", position_plot.yScale(yList[1]));

y2_point = position_plot.svg.append("circle")
.attr("id", "fixed-point").attr("r", 3).attr("fill", "orange")
.attr("cx", position_plot.xScale(tList[2])).attr("cy", position_plot.yScale(yList[2]));

y3_point = position_plot.svg.append("circle")
.attr("id", "fixed-point").attr("r", 3).attr("fill", "green")
.attr("cx", position_plot.xScale(tList[3])).attr("cy", position_plot.yScale(yList[3]));

y4_point = position_plot.svg.append("circle")
.attr("id", "fixed-point").attr("r", 3).attr("fill", "blue")
.attr("cx", position_plot.xScale(tList[4])).attr("cy", position_plot.yScale(yList[4]));

y5_point = position_plot.svg.append("circle")
.attr("id", "fixed-point").attr("r", 3).attr("fill", "purple")
.attr("cx", position_plot.xScale(tList[5])).attr("cy", position_plot.yScale(yList[5]));

// update position plot
function plotPosition(local, actual, parameterized) {

  var input = {
    data: local,
    svg: position_plot.svg,
    line: x_local_line,
    xScale: position_plot.xScale,
    yScale: position_plot.yScale};

  // plot the data
  plotData(input);
    
  // prepare input for actual displacement plot
    var input = {
      data: actual,
      svg: position_plot.svg,
      line: x_actual_line,
      xScale: position_plot.xScale,
      yScale: position_plot.yScale};
  
    // plot the data
    plotData(input);
  
    // prepare input for parameterized displacement plot
    input = {
      data: parameterized,
      svg: position_plot.svg,
      line: x_parameterized_line,
      xScale: position_plot.xScale,
      yScale: position_plot.yScale};
  
    // plot the data
    plotData(input);
}

// calculate action
function action(yList) {
  var ki = 0;
  var pi = 0;
  for (let i=1; i < yList.length; i++) {
    let kConst = (yList[i]-yList[i-1]+0.5*g*(tList[i]-tList[i-1])**2)/(tList[i]-tList[i-1]);
    ki += (kConst - g*(tList[i]-tList[i-1]))**3 - kConst**3;

    let pConst = (yList[i]-yList[i-1]+0.5*g*(tList[i]-tList[i-1])**2)/(tList[i]-tList[i-1]);
    pi += yList[i-1]*tList[i] + pConst*(tList[i]-tList[i-1])**2/2-g*(tList[i]-tList[i-1])**3/6 - yList[i-1]*tList[i-1];
  }
  return -m*ki/(6*g) - m*g*pi;
}

// integral data
function integralData(idx) {
  var s_data = [];
  const initialY = yList[idx];
  for (let cy = min_y; cy <= max_y; cy++) {
      yList[idx] = cy;
      s_data.push({x: cy, y: action(yList)});
  }
  yList[idx] = initialY;
  return s_data;
}

// INTEGRAL OF ENERGY
const integral_input = {
  divID: "#integral-graph",
  svgID: "svg-for-integral-plots",
  domain: {lower: min_y, upper: max_y},
  xLabel: "y coord",
  range: {lower: -2500, upper: 10000},
  yLabel: "Global Action"};

const integral_plot = createPlot(integral_input);
const colors = ["red", "orange", "green", "blue", "purple"];

// plot each line and point on the integral graph
var si_line_1 = integral_plot.svg.append("g").attr("id", "action-line-1").attr("stroke", colors[0]).attr("visibility", "hidden");
var si_point_1 = integral_plot.svg.append("circle").attr("id", "action-point-1").attr("r", 3).attr("fill", colors[0]).attr("visibility", "hidden");

var si_line_2 = integral_plot.svg.append("g").attr("id", "action-line-2").attr("stroke", colors[1]).attr("visibility", "visible");
var si_point_2 = integral_plot.svg.append("circle").attr("id", "action-point-2").attr("r", 3).attr("fill", colors[1]).attr("visibility", "visible");

var si_line_3 = integral_plot.svg.append("g").attr("id", "action-line-3").attr("stroke", colors[2]).attr("visibility", "visible");
var si_point_3 = integral_plot.svg.append("circle").attr("id", "action-point-3").attr("r", 3).attr("fill", colors[2]).attr("visibility", "visible");

var si_line_4 = integral_plot.svg.append("g").attr("id", "action-line-4").attr("stroke", colors[3]).attr("visibility", "visible");
var si_point_4 = integral_plot.svg.append("circle").attr("id", "action-point-4").attr("r", 3).attr("fill", colors[3]).attr("visibility", "visible");

var si_line_5 = integral_plot.svg.append("g").attr("id", "action-line-5").attr("stroke", colors[4]).attr("visibility", "hidden");
var si_point_5 = integral_plot.svg.append("circle").attr("id", "action-point-5").attr("r", 3).attr("fill", colors[4]).attr("visibility", "hidden");

// integral plot + point
var lines = [si_line_1, si_line_2, si_line_3, si_line_4, si_line_5];
var points = [si_point_1, si_point_2, si_point_3, si_point_4, si_point_5];

function plotIntegral() {
  var input;
  for (let i = 1; i <= 5; i++) {
    input = {
      data: integralData(i),
      svg: integral_plot.svg,
      line: lines[i-1],
      xScale: integral_plot.xScale,
      yScale: integral_plot.yScale};
    plotData(input);
  }
}

function plotIntegralPoint() {
  for (let i = 1; i <= 5; i++) {
    // x-axis is control point cy
    points[i-1].attr("cx", integral_plot.xScale(yList[i]));

    // set the circle's y-coord as the data y value
    points[i-1].attr("cy", integral_plot.yScale(action(yList)));
  }
}

plotIntegral();
// plotIntegral(1, integralData(1));
plotIntegralPoint();


/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////


document.getElementById("reset-button").onclick = function() {
    const vals = [0, 0, 33, 49, 33, 0]; // change to minimize with y1 and y5 at 0 33,49,33
    for (let i = 2; i <= 4; i++) {
      document.getElementById(`y${i}-slider`).value = vals[i];
      updateSliderInfo(i);
    }
    plotIntegral();
    plotIntegralPoint();
}

document.getElementById("randomize-button").onclick = function() {
  for (let i = 2; i <= 4; i++) {
    document.getElementById(`y${i}-slider`).value = Math.floor(max_y*Math.random());
    updateSliderInfo(i);
  }
  plotIntegral();
  plotIntegralPoint();
}

function updateSliderInfo(x) {
    yList[x] = parseInt(document.getElementById(`y${x}-slider`).value);
    document.getElementById(`print-y${x}`).innerHTML = yList[x];
    if (x == 1) {y1_point.attr("cy", position_plot.yScale(yList[x]));}
    else if (x == 2) {y2_point.attr("cy", position_plot.yScale(yList[x]));}
    else if (x == 3) {y3_point.attr("cy", position_plot.yScale(yList[x]));}
    else if (x == 4) {y4_point.attr("cy", position_plot.yScale(yList[x]));}
    else if (x == 5) {y5_point.attr("cy", position_plot.yScale(yList[x]));}
    endAnimation();
    startAnimation();
}

document.getElementById("y2-slider").oninput = function() {
  plotIntegral();
  plotIntegralPoint();
  // plotIntegral(2, integralData(2));
  updateSliderInfo(2);
}

document.getElementById("y3-slider").oninput = function() {
  plotIntegral();
  plotIntegralPoint();
  // plotIntegral(3, integralData(3));
  updateSliderInfo(3);
}

document.getElementById("y4-slider").oninput = function() {
  plotIntegral();
  plotIntegralPoint();
  // plotIntegral(4, integralData(4));
  updateSliderInfo(4);
}

function hide(id, point, line) {
  let on = document.getElementById(id).value;
  if (on == "off") {
      document.getElementById(id).value = "on";
      point.attr("visibility", "visible");
      line.attr("visibility", "visible");
  } else {
      document.getElementById(id).value = "off";
      point.attr("visibility", "hidden");
      line.attr("visibility", "hidden");
  }
}

document.getElementById("show-action-1").onchange = function() {
  hide("show-action-1", si_point_1, si_line_1);
}

document.getElementById("show-action-2").onchange = function() {
  hide("show-action-2", si_point_2, si_line_2);
}

document.getElementById("show-action-3").onchange = function() {
  hide("show-action-3", si_point_3, si_line_3);
}

document.getElementById("show-action-4").onchange = function() {
  hide("show-action-4", si_point_4, si_line_4);
}

document.getElementById("show-action-5").onchange = function() {
  hide("show-action-5", si_point_5, si_line_5);
}

