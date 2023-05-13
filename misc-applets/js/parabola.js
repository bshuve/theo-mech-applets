/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////

const SVG_HEIGHT = 280;
const SVG_WIDTH = 330;
const x1 = 0;
const y1 = 0;
const x2 = 10;
const y2 = 0;
const g = 9.8;
const m = 0.05;
const dt = 0.005;
const cx_init = 5;
const cy_init = 3;
const max_cy = parseInt(document.getElementById("slide-y-coord").getAttribute("max"));
const cy_range = 6;
const TRANSITION_TIME = 10;   // ms


/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

// generate data
function dynamicData(cx, cy){
    var ke_data = [];
    var pe_data = [];
    var kd_data = [];
    var pd_data = [];
    var integral = 0;

    // second derivatives
    let ddx = 2 * (x1 - cx) + 2 * (x2 - cx);
    let ddy = 2 * (y1 - cy) + 2 * (y2 - cy);

    var t = 0;
    while (t <= 1) {
        // Bezier parameterization
        let y = cy + ((1-t)**2) * (y1-cy) + (t**2) * (y2-cy);
        // let x = cx + ((1-t)**2) * (x1-cx) + (t**2) * (x2-cx);
        
        // first derivatives
        let dx = 2 * (1-t) * (cx - x1) + 2 * t * (x2 - cx);
        let dy = 2 * (1-t) * (cy - y1) + 2 * t * (y2 - cy);

        let KE = 0.5 * m * (dx ** 2 + dy ** 2);
        let PE = -1 * m * g * y;

        let KD = m * (ddx * dx + ddy * dy);
        let PD = -m * g * dy

        integral += (KE + PE) * dt;

        ke_data.push({x: Math.round(t * 1000) / 1000, y: KE});
        pe_data.push({x: Math.round(t * 1000) / 1000, y: PE});
        kd_data.push({x: Math.round(t * 1000) / 1000, y: KD});
        pd_data.push({x: Math.round(t * 1000) / 1000, y: PD});

        t += dt;
    }
    return {k: ke_data, p: pe_data, s: integral, kd: kd_data, pd: pd_data};
}

// generate all integral data
function integralData() {
    var ke_data = [];
    var pe_data = [];
    var s_data = [];
    for (let cy = 0; cy < max_cy+1; cy++) {
        let k_integral = 0;
        let p_integral = 0;
        let s_integral = 0;
        var t = 0;

        let cya = cy_range*cy/max_cy;

        while (t <= 1) {
            // Bezier parameterization
            let y = cya + ((1-t)**2) * (y1-cya) + (t**2) * (y2-cya);
            // let x = cx + ((1-t)**2) * (x1-cx) + (t**2) * (x2-cx);

            let dy = 2 * (1-t) * (cya - y1) + 2 * t * (y2 - cya);
            let dx = 2 * (1-t) * (cx_init - x1) + 2 * t * (x2 - cx_init);

            let KE = 0.5 * m * (dx ** 2 + dy ** 2);
            let PE = -m * g * y
            
            k_integral += KE * dt;
            p_integral += PE * dt;
            s_integral += (KE + PE) * dt;

            t += dt;
        }
        ke_data.push({x: cya, y: k_integral});
        pe_data.push({x: cya, y: p_integral});
        s_data.push({x: cya, y: s_integral});
    }
    return {k: ke_data, p: pe_data, s: s_data};
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
  domain: {lower: 0, upper: 1},
  xLabel: "Time",
  range: {lower: -2, upper: 7},
  yLabel: "Energy"};
const energy_plot = createPlot(energy_input);
var ke_line = energy_plot.svg.append("g").attr("id", "kinetic-energy-line");
var pe_line = energy_plot.svg.append("g").attr("id", "potential-energy-line");

// DERIVATIVE OF ENERGY
const derivative_input = {
    divID: "#derivative-graph",
    svgID: "svg-for-derivative-plots",
    domain: {lower: 0, upper: 1},
    xLabel: "Time",
    range: {lower: -15, upper: 15},
    yLabel: "Derivative of Energy (dt)"};
const derivative_plot = createPlot(derivative_input);
var kd_line = derivative_plot.svg.append("g").attr("id", "kinetic-derivative-line");
var pd_line = derivative_plot.svg.append("g").attr("id", "potential-derivative-line");

// INTEGRAL OF ENERGY
const integral_input = {
    divID: "#integral-graph",
    svgID: "svg-for-integral-plots",
    domain: {lower: 0, upper: cy_range},
    xLabel: "control point y coord",
    range: {lower: -1, upper: 4},
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

// update control point and text
function plotTrajectory(cx, cy, data) {

    // print coords and time
    let dy = 2 * (cy - y1);
    let dx = 2 * (cx - x1);

    let actualY = dy - 0.5 * g;
    let v = Math.sqrt(dx**2 + dy**2);
    let angle = Math.atan(dy/dx);

    // document.getElementById("debug").innerHTML = dy - 0.5 * g;

    // document.getElementById("print-x-coord").innerHTML = cx;
    document.getElementById("print-cy-coord").innerHTML = cy.toFixed(2);
    document.getElementById("print-action").innerHTML = data["s"].toFixed(2);
    document.getElementById("print-velocity").innerHTML = v.toFixed(2);
    document.getElementById("print-angle").innerHTML = (180 * angle / Math.PI).toFixed(1);

    document.getElementById("print-height").innerHTML = (cy + 0.25 * (y1-cy) + 0.25 * (y2-cy)).toFixed(2);

    document.getElementById("print-max-height-classical").innerHTML = ((v * Math.sin(angle)) ** 2 / (2 * g)).toFixed(2);
    document.getElementById("print-x-coord").innerHTML = `${dx}`;
    document.getElementById("print-y-coord").innerHTML = `${actualY.toFixed(2)}`;

    // update curve
    document.getElementById("param").setAttribute("d", `M ${x1} ${y1} Q ${cx*27} ${cy*60} ${x2*27} ${y2}`);
    document.getElementById("classical").setAttribute("d", `M ${x1} ${y1} Q ${cx*27} ${cy*60} ${x2*27} ${actualY*60}`);
    document.getElementById("end-point2").setAttribute("cy", `${actualY*60}`);
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
function plotIntegralPoints(cy) {

  let cya = cy_range*cy/max_cy;

  // x-axis is control point cy
  ki_point.attr("cx", integral_plot.xScale(cya));
  pi_point.attr("cx", integral_plot.xScale(cya));
  si_point.attr("cx", integral_plot.xScale(cya));

  // y-axis is integral energy
  let ki = integral_data["k"][cy].y;
  let pi = integral_data["p"][cy].y;
  let si = integral_data["s"][cy].y;

  ki_point.attr("cy", integral_plot.yScale(ki));
  pi_point.attr("cy", integral_plot.yScale(pi));
  si_point.attr("cy", integral_plot.yScale(si));
}

// initialize everything
const initial_data = dynamicData(cx_init, cy_init);
plotEnergy(initial_data);
plotDerivative(initial_data);
plotTrajectory(cx_init, cy_init, initial_data);
plotIntegral();
plotIntegralPoints(cy_init * max_cy / cy_range);


/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////


// update curve when moving y coord
document.getElementById("slide-y-coord").oninput = function() {
    let cy = parseInt(document.getElementById("slide-y-coord").value);
    let cya = cy_range * cy / max_cy;

    // generate data
    const data = dynamicData(cx_init, cya);

    // update plots
    plotTrajectory(cx_init, cya, data);
    plotEnergy(data);
    plotDerivative(data);
    plotIntegralPoints(cy);
}
