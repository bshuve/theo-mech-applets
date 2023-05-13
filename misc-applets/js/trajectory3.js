/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////

const CANVAS_WIDTH_1 = 170;
const CANVAS_WIDTH_2 = 300;
const CANVAS_HEIGHT = 280;
const SVG_WIDTH = 270;
const SVG_HEIGHT = 300;

const TRANSITION_TIME = 10; // ms
const FRAME_RATE = 1; // ms
const dt = 0.01;

const x_initial = 0;
const y_initial = 0;

const g = 2;
const m = 1;

const max_p = parseInt(document.getElementById("p-slider").max);
var p = parseInt(document.getElementById("p-slider").value)/max_p;

// var t1 = parseInt(document.getElementById("t1").value);
var t1 = 0;

var t2 = parseInt(document.getElementById("t2").value);

// var t3 = parseInt(document.getElementById("t3").value);
var t3 = 20;

const minT = parseInt(document.getElementById("t2").min);
const maxT = parseInt(document.getElementById("t2").max);


/////////////////////////////////////////////////
/* CANVAS ANIMATIONS */
/////////////////////////////////////////////////

// wrapper function to start animations
function startAnimation(p) {
    // 1D projectiles
    param1D = new component(10, 10, "orange", CANVAS_WIDTH_1/3, transformYCoord(y_initial), 1, p);
    actual1D = new component(10, 10, "purple", 2*CANVAS_WIDTH_1/3, transformYCoord(y_initial), 2, p);

    // 2D projectiles
    param2D = new component(3, 3, "orange", x_initial, y_initial, 3, p);
    actual2D = new component(3, 3, "purple", x_initial, y_initial, 4, p);

    animArea.start();
}

// wrapper function to end animations
function endAnimation() {
    animArea.stop();
}

// parameterized coord -> canvas coord
function transformXCoord(x) {
    // 0 -> 20
    // 20 -> CANVAS_WIDTH_2 - 20
    return 20 + x * (CANVAS_WIDTH_2 - 40) / 20;
}

// parameterized coord -> canvas coord
function transformYCoord(y) {
    // -500 -> CANVAS_HEIGHT
    // 1000 -> 0
    return CANVAS_HEIGHT - (y + 500) * CANVAS_HEIGHT / 1500;
}

// JS object for both canvases
var animArea = {
    panel1: document.getElementById("projectile-motion-canvas-1"),
    panel2: document.getElementById("projectile-motion-canvas-2"),
    start: function(){
        this.panel1.width = CANVAS_WIDTH_1;
        this.panel1.height = CANVAS_HEIGHT;
        this.context1 = this.panel1.getContext("2d");

        this.panel2.width = CANVAS_WIDTH_2;
        this.panel2.height = CANVAS_HEIGHT;
        this.context2 = this.panel2.getContext("2d");

        this.time = -1;   
        this.interval = setInterval(updateFrame, FRAME_RATE);

        // add text and ground to panel 2
        this.context2.font = "20px Arial";
        this.context2.fillText("Height vs Time", 10, 30);
        this.context2.fillStyle = "black";
        this.context2.fillRect(5, transformYCoord(-0.05), CANVAS_WIDTH_2-10, 3);
        },
    clear : function() {
        this.context1.clearRect(0, 0, this.panel1.width, this.panel1.height);
        // this.context2.clearRect(0, 0, this.panel2.width, this.panel2.height);
        }, 
    stop : function() {
        this.time = -1;
        clearInterval(this.interval); 
    },
}

// to create projectiles
function component(width, height, color, x, y, type, p) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.color = color;
    this.x = x;
    this.y = y;
    this.p = p;

    this.update = function(){
        var ctx;
        if (this.type == 1 || this.type == 2) {ctx = animArea.context1;}
        else {ctx = animArea.context2;}
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    this.newPos = function(t) {
        if (type == 1) {   // param 1D
            this.y = transformYCoord(t*(20-t) + this.p*(t-t1)*(t-t2)*(t-t3));
        } else if (this.type == 2) {   // actual 1D
            // y = v0 t - 0.5 g t**2     v0 = y'(0)
            this.y = transformYCoord(t*(20-t));
        } else if (this.type == 3) {    // param 2D
            this.x = transformXCoord(t);
            this.y = transformYCoord(t*(20-t) + this.p*(t-t1)*(t-t2)*(t-t3));
        } else if (this.type == 4) {   // actual 2D
            this.x = transformXCoord(t);
            this.y = transformYCoord(t*(20-t));
            // let v = 20+this.p*(t1*t2+t2*t3+t1*t3);
            // this.y = transformYCoord(v * t - 0.5 * g * t ** 2);
        }
    }
}

// create frames for animation
function updateFrame() {
    // clear frame and move to next
    animArea.clear();
    animArea.time += dt;

    // add ground
    animArea.context1.fillStyle = "black";
    animArea.context1.fillRect(20, transformYCoord(-0.05), CANVAS_WIDTH_1-40, 3);

    // update projectile positions
    param1D.newPos(animArea.time);
    actual1D.newPos(animArea.time);
    param2D.newPos(animArea.time)
    actual2D.newPos(animArea.time);

    // update plots
    param1D.update();
    actual1D.update();
    param2D.update();
    actual2D.update();

    // add text
    animArea.context1.font = "20px Arial";
    animArea.context1.fillStyle = "black";
    animArea.context1.fillText("Projectile Motion", 10, 30);

    // end animation when t = 20
    if (animArea.time >= 20) {endAnimation();}
}

// run animation on load
startAnimation(p);


/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

// generate energy data
function energyAndDerivativeData(p){
    var kinetic_energy_data = [];
    var potential_energy_data = [];
    var kinetic_derivative_data = [];
    var potential_derivative_data = [];
    var t = 0;

    var b = -1 - p * (t1 + t2 + t3);
    var c = p * (t1*t2 + t2*t3 + t1*t3) + 20;
    var d = -p * t1 * t2 * t3;
    while (t <= 20) {
        let v = 3 * p * t**2 + 2 * b * t + c;
        let KE = 0.5 * m * v ** 2;
        let PE = -m * g * (p * t**3 + b * t**2 + c * t + d);
        let dKE = m * v * (6 * p * t + b * t);
        let dPE = -m * g * (3 * p * t**2 + 2 * b * t + c)
        kinetic_energy_data.push({"x": Math.round(t * 10000) / 10000, "y": KE});
        potential_energy_data.push({"x": Math.round(t * 10000) / 10000, "y": PE});
        kinetic_derivative_data.push({"x": Math.round(t * 10000) / 10000, "y": dKE});
        potential_derivative_data.push({"x": Math.round(t * 10000) / 10000, "y": dPE});

        t += dt;
    }
    return {k: kinetic_energy_data, p: potential_energy_data, 
            kd: kinetic_derivative_data, pd: potential_derivative_data};
}

// helper for function below
function evaluateIntegral(a, t2) {
    let b = -1 - a * (t1 + t2 + t3);
    let c = a * (t1*t2 + t2*t3 + t1*t3) + 20;
    let d = -a * t1 * t2 * t3;

    let KE = 20**2 * b**2 / 5 + 20**4 * 2*b*c / 4 + 20**3 * (2*b*d + c**2)/3 + 20**2 * 2*c*d/2 + 20 * d**2;
    let PE = 20**4 * a/4 + 20**3 * b/3 + 20**2 * c/2 + 20 * d;
    return {k: 0.5 * m * KE, p: m * g * PE};
}

// generate integral data
function integralData() {
    res = [];
    for (let t = minT; t <= maxT; t ++) {
        var ke = [];
        var pe = [];
        var se = [];
        for (let p = 1; p <= max_p + 1; p++) {
            let pv = p / max_p;
            ob = evaluateIntegral(pv, t);
            ke.push({x: pv, y: ob.k});
            pe.push({x: pv, y: ob.p});
            se.push({x: pv, y: ob.k-ob.p});
        }
        res.push({k: ke, p: pe, s: se});
    }
    return res;
}

// CALCULATE ALL DATA ON LOAD
const integral_data = integralData();
// console.log(integral_data);


/////////////////////////////////////////////////
/* MASTER GRAPHING CAPABILITY */
/////////////////////////////////////////////////

// set the dimensions and margins of the graph
var margin = { top: 20, right: 20, bottom: 50, left: 50 },
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
  domain: {lower: 0, upper: 20},
  xLabel: "Time",
  range: {lower: -100000, upper: 100000},
  yLabel: "Energy"};
const energy_plot = createPlot(energy_input);
var ke_line = energy_plot.svg.append("g").attr("id", "kinetic-energy-line");
var pe_line = energy_plot.svg.append("g").attr("id", "potential-energy-line");

// DERIVATIVE OF ENERGY
const derivative_input = {
    divID: "#derivative-graph",
    svgID: "svg-for-derivative-plots",
    domain: {lower: 0, upper: 20},
    xLabel: "Time",
    range: {lower: -10000, upper: 10000},
    yLabel: "Derivative of Energy (dt)"};
const derivative_plot = createPlot(derivative_input);
var kd_line = derivative_plot.svg.append("g").attr("id", "kinetic-derivative-line");
var pd_line = derivative_plot.svg.append("g").attr("id", "potential-derivative-line");

// INTEGRAL OF ENERGY
const integral_input = {
    divID: "#integral-graph",
    svgID: "svg-for-integral-plots",
    domain: {lower: 0, upper: 1},
    xLabel: "p",
    range: {lower: -1000000, upper: 1000000},
    yLabel: "Integral of Energy (dt)"};
const integral_plot = createPlot(integral_input);
var ki_line = integral_plot.svg.append("g").attr("id", "kinetic-integral-line").attr("visibility", "visible");
var pi_line = integral_plot.svg.append("g").attr("id", "potential-integral-line").attr("visibility", "visible");
var kmp_line = integral_plot.svg.append("g").attr("id", "k-minus-p-integral-line").attr("visibility", "hidden");

// points on plot
var ki_point = integral_plot.svg.append("circle")
.attr("id", "kinetic-integral-point").attr("r", 3).attr("fill", "red").attr("visibility", "visible");

var pi_point = integral_plot.svg.append("circle")
.attr("id", "potential-integral-point").attr("r", 3).attr("fill", "green").attr("visibility", "visible");

var kmpi_point = integral_plot.svg.append("circle")
.attr("id", "sum-integral-point").attr("r", 3).attr("fill", "blue").attr("visibility", "hidden");


// updates integral points
function plotIntegralPoints(t, p) {
    // x-axis is control point cy
    ki_point.attr("cx", integral_plot.xScale(p));
    pi_point.attr("cx", integral_plot.xScale(p));
    kmpi_point.attr("cx", integral_plot.xScale(p));

    // y-axis is integral energy
    let ob = evaluateIntegral(p, t);
    console.log(ob);
    ki_point.attr("cy", integral_plot.yScale(ob.k));
    pi_point.attr("cy", integral_plot.yScale(ob.p));
    kmpi_point.attr("cy", integral_plot.yScale(ob.k-ob.p));
}

/////////////////////////////////////////////////
/* EVENT LISTENER FUNCTIONS */
/////////////////////////////////////////////////

// update energy plots
function plotEnergy(data) {

    // kinetic energy
    var input = {
      data: data.k,
      svg: energy_plot.svg,
      line: ke_line,
      xScale: energy_plot.xScale,
      yScale: energy_plot.yScale,
      color: "red"};
  
    // plot the data
    plotData(input);
  
    // potential energy
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

// update derivative plots
function plotDerivative(data) {

    // prepare input
    var input = {
      data: data.kd,
      svg: derivative_plot.svg,
      line: kd_line,
      xScale: derivative_plot.xScale,
      yScale: derivative_plot.yScale,
      color: "red"};
  
    // plot the data
    plotData(input);
  
    // prepare input
    input = {
      data: data.pd,
      svg: derivative_plot.svg,
      line: pd_line,
      xScale: derivative_plot.xScale,
      yScale: derivative_plot.yScale,
      color: "green"};
  
    // plot the data
    plotData(input);
}

const initial_data = energyAndDerivativeData(p);

// initialize energy lines
plotEnergy(initial_data);

// initialize energy lines
plotDerivative(initial_data);

// integral plots initialized only on load
function plotIntegral() {
    // K
    var input = {
        data: integral_data[t2-minT].k,
        svg: integral_plot.svg,
        line: ki_line,
        xScale: integral_plot.xScale,
        yScale: integral_plot.yScale,
        color: "red"};
    plotData(input);

    // P
    var input = {
        data: integral_data[t2-minT].p,
        svg: integral_plot.svg,
        line: pi_line,
        xScale: integral_plot.xScale,
        yScale: integral_plot.yScale,
        color: "green"}
    plotData(input);

    // K-P
    var input = {
        data: integral_data[t2-minT].s,
        svg: integral_plot.svg,
        line: kmp_line,
        xScale: integral_plot.xScale,
        yScale: integral_plot.yScale,
        color: "blue"};
    plotData(input);
}

// initialize integral lines
plotIntegral(t2);

// initialize integral points
plotIntegralPoints(p, t2);

// toggle visibility of lines
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

/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

// update curve when changing p
document.getElementById("p-slider").oninput = function() {
    // get new parameter p
    p = parseInt(document.getElementById("p-slider").value)/100;
    document.getElementById("print-p").innerHTML = p.toFixed(2);

    // generate data
    const data = energyAndDerivativeData(p);

    // update plots
    plotEnergy(data);
    plotDerivative(data);
    plotIntegralPoints(p);
}

// run animation
document.getElementById("p-slider").onchange = function() {
    p = parseInt(document.getElementById("p-slider").value)/100;
    t2 = parseInt(document.getElementById("t2").value);
    endAnimation();
    startAnimation(p);
}

// get input times
document.getElementById("submit").onclick = function() {
    // t1 = parseInt(document.getElementById("t1").value);
    // t2 = parseInt(document.getElementById("t2").value);
    // t3 = parseInt(document.getElementById("t3").value);

    p = parseInt(document.getElementById("p-slider").value)/100;
    t2 = parseInt(document.getElementById("t2").value);
    endAnimation();
    startAnimation(p);
}


// show/hide integral lines on checkmark click
document.getElementById("show-k").onchange = function() {
    hide("show-k", ki_point, ki_line);
}

document.getElementById("show-p").onchange = function() {
    hide("show-p", pi_point, pi_line);
}

document.getElementById("show-kmp").onchange = function() {
    hide("show-kmp", kmpi_point, kmp_line);
}


