/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////

const HEIGHT = 280;
const WIDTH = 330;
const x1 = 0;
const y1 = 0;
const x2 = 1;
const y2 = 0;
const g = 9.8;
const m = 10;
const dt = 0.005;
const max_t = 1;
const norm = 100;
const p_init = parseInt(document.getElementById("p-slider").value);
const max_p = parseInt(document.getElementById("p-slider").max);
const TRANSITION_TIME = 10;   // ms
const FRAME_RATE = 10;   // ms


/////////////////////////////////////////////////
/* CANVAS ANIMATIONS */
/////////////////////////////////////////////////

// wrapper function to start animations
function startAnimation(p) {
    // projectiles
    param = new component(3, 3, "orange", x1, y1, p/norm, 1);
    actual = new component(3, 3, "purple", x1, y1, p/norm, 2);

    animArea.start();
}

// wrapper function to end animations
function endAnimation() {
    animArea.stop();
}

// parameterized coord -> canvas coord
function transformXCoord(x) {
    return 20 + (WIDTH-40)/(x2-x1) * (x - x1);
}

// parameterized coord -> canvas coord
function transformYCoord(y) {
    // y1 -> HEIGHT - 120
    // max_height -> 20
    let max_height = 7;
    return 20 + (140-HEIGHT)/(max_height-y1) * (y - max_height);
}

// JS object for both canvases
var animArea = {
    panel: document.getElementById("projectile-motion-canvas"),
    start: function(){
        this.panel.width = WIDTH;
        this.panel.height = HEIGHT;
        this.context = this.panel.getContext("2d");

        this.time = 0;   
        this.interval = setInterval(updateFrame, FRAME_RATE);

        // add ground and title
        this.context.fillStyle = "black";
        this.context.font = "20px Arial";
        this.context.fillText("Trajectory", 10, 30);
        this.context.fillRect(transformXCoord(x1), transformYCoord(-0.05), WIDTH-40, 3);
        },
    clear : function() {
        this.context.clearRect(0, 0, this.panel.width, this.panel.height);
        }, 
    stop : function() {
        clearInterval(this.interval); 
        this.time = 0;
    },
}

// to create projectiles
function component(width, height, color, x, y, p, type) {
    this.width = width;
    this.height = height;
    this.color = color;
    this.x = x;
    this.y = y;
    this.p = p;
    this.type = type;

    this.update = function(){
        var ctx = animArea.context;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    this.newPos = function(t) {
        if (this.type == 1) {
            this.x = transformXCoord(t);
            this.y = transformYCoord(this.p * t * (max_t-t));
        } else if (this.type == 2) {
            this.x = transformXCoord(x1 + t);
            this.y = transformYCoord(y1 + max_t * this.p * t - 0.5 * g * t ** 2);
        }
    }
}

// create frames for animation
function updateFrame() {
    // clear frame and move to next
    // animArea.clear();

    // update projectile positions
    param.newPos(animArea.time)
    actual.newPos(animArea.time);

    // update plots
    param.update();
    actual.update();

    animArea.time += dt;

    // end animation when t = 1
    if (animArea.time >= 1) {
        // document.getElementById("debug").innerHTML = `${param.x}, ${param.y}`;
        endAnimation();}
}

// run animation on load
startAnimation(p_init);


/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

// generate data
function dynamicData(pv){
    var ke_data = [];
    var pe_data = [];
    var kd_data = [];
    var pd_data = [];
    var integral = 0;
    const p = pv / norm; 

    // x(t) = t
    // x'(t) = 1
    // y(t) = pt(max_t-t)
    // y'(t) = p(max_t-2t)
    // y''(t) = -2p

    let ddy = -2 * p;  // second derivative

    var t = 0;
    while (t <= max_t) {
        let y = p * t * (max_t - t);
        
        // first derivatives
        let dy = p * (max_t - 2 * t);
        // document.getElementById("debug").innerHTML += ` ${dy.toFixed(2)}`

        let KE = 0.5 * m * (1 + dy ** 2);
        let PE = -1 * m * g * y;

        let KD = m * (ddy * dy);
        let PD = -m * g * dy

        integral += (KE + PE) * dt;

        ke_data.push({x: Math.round(t * 1000) / 1000, y: KE});
        pe_data.push({x: Math.round(t * 1000) / 1000, y: PE});
        kd_data.push({x: Math.round(t * 1000) / 1000, y: KD});
        pd_data.push({x: Math.round(t * 1000) / 1000, y: PD});

        t += dt;
    }
    return {s: integral, k: ke_data, p: pe_data, kd: kd_data, pd: pd_data};
}

// generate all integral data
function integralData() {
    var ke_data = [];
    var pe_data = [];
    var s_data = [];
    for (let pv = 0; pv < max_p + 1; pv++) {
        let k_integral = 0;
        let p_integral = 0;
        let s_integral = 0;
        var t = 0;
        const p = pv/norm;
        while (t <= max_t) {

            let y = p * t * (max_t - t);
            let dy = p * (max_t - 2 * t);

            let KE = 0.5 * m * (1 + dy ** 2);
            let PE = -1 * m * g * y;

            
            k_integral += KE * dt;
            p_integral += PE * dt;
            s_integral += (KE + PE) * dt;

            t += dt;
        }
        ke_data.push({x: p, y: k_integral});
        pe_data.push({x: p, y: p_integral});
        s_data.push({x: p, y: s_integral});
    }
    return {k: ke_data, p: pe_data, s: s_data};
}

// calculate energy maxes for graph limits
function dataMax(pv) {
    const p = pv / norm; 
    let y = p * max_t ** 2 / 4;
    let dy = -p * max_t;   // first derivative
    let ddy = -2 * p;  // second derivative

    let maxKE = 0.5 * m * (1 + dy ** 2);
    let minPE = -1 * m * g * y;
    let maxKD = m * (ddy * dy);
    let minKD = -m * (ddy * dy);
    
    return {emin: minPE, emax: maxKE, dmin: minKD, dmax: maxKD};
}

// CALCULATE ALL DATA ON LOAD
const integral_data = integralData();
const limits = dataMax(max_p);


/////////////////////////////////////////////////
/* MASTER GRAPHING CAPABILITY */
/////////////////////////////////////////////////

// set the dimensions and margins of the graph
var margin = { top: 20, right: 20, bottom: 50, left: 70 },
  width = WIDTH - margin.left - margin.right,
  height = HEIGHT - margin.top - margin.bottom;

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
  domain: {lower: 0, upper: max_t},
  xLabel: "Time",
  range: {lower: limits.emin, upper: limits.emax},
  yLabel: "Energy"};
const energy_plot = createPlot(energy_input);
var ke_line = energy_plot.svg.append("g").attr("id", "kinetic-energy-line");
var pe_line = energy_plot.svg.append("g").attr("id", "potential-energy-line");

// DERIVATIVE OF ENERGY
const derivative_input = {
    divID: "#derivative-graph",
    svgID: "svg-for-derivative-plots",
    domain: {lower: 0, upper: max_t},
    xLabel: "Time",
    range: {lower: limits.dmin, upper: limits.dmax},
    yLabel: "Derivative of Energy (dt)"};
const derivative_plot = createPlot(derivative_input);
var kd_line = derivative_plot.svg.append("g").attr("id", "kinetic-derivative-line");
var pd_line = derivative_plot.svg.append("g").attr("id", "potential-derivative-line");

// INTEGRAL OF ENERGY
const integral_input = {
    divID: "#integral-graph",
    svgID: "svg-for-integral-plots",
    domain: {lower: 0, upper: Math.round(max_p/norm)},
    xLabel: "control point y coord",
    range: {lower: integral_data["p"][max_p].y, upper: integral_data["k"][max_p].y},
    yLabel: "Integral of Energy (dt)"};
const integral_plot = createPlot(integral_input);
var ki_line = integral_plot.svg.append("g").attr("id", "kinetic-integral-line");
var pi_line = integral_plot.svg.append("g").attr("id", "potential-integral-line");
var si_line = integral_plot.svg.append("g").attr("id", "sum-integral-line");

// points on integral plot
var ki_point = integral_plot.svg.append("circle")
.attr("id", "kinetic-integral-point").attr("r", 3).attr("fill", "red");

var pi_point = integral_plot.svg.append("circle")
.attr("id", "potential-integral-point").attr("r", 3).attr("fill", "green");

var si_point = integral_plot.svg.append("circle")
.attr("id", "sum-integral-point").attr("r", 3).attr("fill", "blue");


/////////////////////////////////////////////////
/* EVENT LISTENER FUNCTIONS */
/////////////////////////////////////////////////

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

// updates integral points
function plotIntegralPoints(p) {
  let pv = p/norm;

  // x-axis is control point cy
  ki_point.attr("cx", integral_plot.xScale(pv));
  pi_point.attr("cx", integral_plot.xScale(pv));
  si_point.attr("cx", integral_plot.xScale(pv));

  // y-axis is integral energy
  let ki = integral_data["k"][p].y;
  let pi = integral_data["p"][p].y;
  let si = integral_data["s"][p].y;

  ki_point.attr("cy", integral_plot.yScale(ki));
  pi_point.attr("cy", integral_plot.yScale(pi));
  si_point.attr("cy", integral_plot.yScale(si));
}

// update all graphs
function plotEverything(p) {
    const data = dynamicData(p);
    plotEnergy(data);
    plotDerivative(data);
    plotIntegralPoints(p);
}

// update all text
function printEverything(p) {
    document.getElementById("print-action").innerHTML = (integral_data["s"][p].y).toFixed(4);
    document.getElementById("print-p").innerHTML = (p/norm).toFixed(2);
    document.getElementById("print-vy").innerHTML = (p/norm).toFixed(2);
    document.getElementById("print-theta").innerHTML = (Math.atan(p/norm) * 180 / Math.PI).toFixed(2);
    document.getElementById("print-y").innerHTML = (y1 + max_t * p/norm - 0.5 * g).toFixed(2);
}

printEverything(p_init);
plotEverything(p_init);
plotIntegral();



/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

// update curve when moving y coord
document.getElementById("p-slider").oninput = function() {
    let p = parseInt(document.getElementById("p-slider").value);
    plotEverything(p);
    printEverything(p);
}

// run animation
document.getElementById("p-slider").onchange = function() {
    let p = parseInt(document.getElementById("p-slider").value);
    endAnimation();
    startAnimation(p);
}

// manually submit p
document.getElementById("manual-input-submit").onclick = function() {
    let p = parseInt(document.getElementById("p-input").value);
    document.getElementById("debug").innerHTML = p;
    if (p < 0 || p > 999) {document.getElementById("p-input").value = "[ERROR]"}
    else {
        document.getElementById("p-slider").value = p;
        plotEverything(p);
        printEverything(p);
        endAnimation();
        startAnimation(p);
        document.getElementById("p-input").value = "";
    }
}
