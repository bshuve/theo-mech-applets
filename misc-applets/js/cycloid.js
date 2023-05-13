/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////
const x1 = 0
const y1 = 0
const x2 = 250
const y2 = 160
const g = 9.81
const m = 1
const dt = 0.01;
const cx_init = parseInt(document.getElementById("control-point").getAttribute("cx"));
const cy_init = parseInt(document.getElementById("control-point").getAttribute("cy"));
const TRANSITION_TIME = 10 // ms


/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

// calculate integral (actual time) for a given control point
function timeIntegral(cx, cy) {
    var integral = 0
    var t = dt
    while (t <= 1) {
        // Bezier parameterization
        let y = cy + ((1-t)**2) * (y1-cy) + (t**2) * (y2-cy);
        // let x = cx + ((1-t)**2) * (x1-cx) + (t**2) * (x2-cx);

        let dy = 2 * (1-t) * (cy - y1) + 2 * t * (y2 - cy);
        let dx = 2 * (1-t) * (cx - x1) + 2 * t * (x2 - cx);

        integral += Math.sqrt(((dx)**2 + (dy)**2) / y) * dt;

        t += dt;
    }

    integral = integral/Math.sqrt(2*g);
    return integral
}

// generate energy data
function integralData() {
    var all_data = [];
    for (let cx = 0; cx < 301; cx++) {
        row_data = []
        for (let cy = 0; cy < 301; cy++) {
            row_data.push({x: cy, y: timeIntegral(cx, cy)});
        }
        all_data.push(row_data)
    }
    return all_data;
}

// CALCULATE ALL DATA FOR ENERGY PLOT ON LOAD
const all_integral_data = integralData();


/////////////////////////////////////////////////
/* FUNCTIONS AND VARIABLES FOR INTEGRAL PLOTS */
/////////////////////////////////////////////////

// set the dimensions and margins of the graph
var margin = {top: 20, right: 20, bottom: 50, left: 60},
    width = 400 - margin.left - margin.right,
    height = 320 - margin.top - margin.bottom;

// append the svg object to the body of the page
var integral_svg = d3.select("#integral-graphs")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("id", "svg-for-integral-plots")
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

// line on plot
var time_line = integral_svg.append("g").attr("id", "time-line");
// var mi_line = integral_svg.append("g").attr("id", "min-integral-line");

// point on plot
var time_point = integral_svg.append("circle")
.attr("id", "kinetic-integral-point")
.attr("r", 3).attr("fill", "red");

// initialize an x-axis
var xi = d3.scaleLinear().domain([0, 300]).range([0,width]);
integral_svg.append("g")
  .attr("transform", "translate(0," + height + ")")
  .attr("class","myXaxis")
  .call(d3.axisBottom(xi));

// add x-axis label
integral_svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin.top + 20)
    .text("control point y coord");

// initialize a y axis
var yi = d3.scaleLinear().range([height, 0]);
var yAxis = d3.axisLeft().scale(yi);
integral_svg.append("g")
  .attr("class","myYaxis")

// add y-axis label
integral_svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left+20)
    .attr("x", -margin.top)
    .text("time (s)")

// updates integral lines
function plotIntegralLines(cx) {

    // update the Y axis
    yi.domain([0, d3.max(all_integral_data[cx], d => d.y)+2 ]);
    integral_svg.selectAll(".myYaxis")
        .transition()
        .duration(TRANSITION_TIME)
        .call(yAxis);

    // Update the line
    var u = time_line.selectAll(".line")
    .data([all_integral_data[cx]], d => xi(d.x));

    u.enter()
    .append("path")
    .attr("class","line")
    .merge(u)
    .transition()
    .duration(TRANSITION_TIME)
    .attr("d", d3.line()
    .x(d => xi(d.x))
    .y(d => yi(d.y)))
    .attr("fill", "none")
    .attr("stroke", "blue")
    .attr("stroke-width", 1.5);
}

// updates integral points
function plotIntegralPoints(cx, cy) {

    // x-axis is control point cy
    time_point.attr("cx", xi(cy));

    // y-axis is integral energy
    let t = all_integral_data[cx][cy].y;
    time_point.attr("cy", yi(t));
}


/////////////////////////////////////////////////
/* EVENT LISTENER FUNCTIONS */
/////////////////////////////////////////////////

// update control point and text
function updatePoint(cx, cy) {
    // update curve
    document.getElementById("curve").setAttribute("d", `M 0 0 Q ${cx} ${cy} 250 160`);

    // update lines to control point
    document.getElementById("start-to-control").setAttribute("d", `M 0 0 L ${cx} ${cy}`);
    document.getElementById("end-to-control").setAttribute("d", `M 250 160 L ${cx} ${cy}`);

    // update coordinates of control point
    document.getElementById("control-point").setAttribute("cx", cx);
    document.getElementById("control-point").setAttribute("cy", cy);

    // print coords and time
    document.getElementById("print-x-coord").innerHTML = cx;
    document.getElementById("print-y-coord").innerHTML = cy;
    document.getElementById("print-time").innerHTML = timeIntegral(cx, cy).toFixed(2);
}

// initialize control point and text
updatePoint(cx_init, cy_init);

// update integral plots (when cx changes)
function updateIntegralLines(cx) {
    plotIntegralLines(cx);
}

// initialize integral lines
updateIntegralLines(cx_init);

// initialize integral points
plotIntegralPoints(cx_init, cy_init);


/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

// update curve when moving y coord
document.getElementById("slide-y-coord").oninput = function() {
    // get new control point coordinates - STRINGS
    let cx = parseInt(document.getElementById("slide-x-coord").value);
    let cy = parseInt(document.getElementById("slide-y-coord").value);


    updatePoint(cx, cy);
    plotIntegralPoints(cx, cy);
}

// update curve when moving x coord
document.getElementById("slide-x-coord").oninput = function() {
    // get new control point coordinates - STRINGS
    let cx = parseInt(document.getElementById("slide-x-coord").value);
    let cy = parseInt(document.getElementById("slide-y-coord").value);

    updatePoint(cx, cy);
    updateIntegralLines(cx);
    plotIntegralPoints(cx, cy);
}

// show cycloid
document.getElementById("show-cycloid").onclick = function() {
    let cycloid_on = document.getElementById("show-cycloid").value
    if (cycloid_on == "hide") {
        document.getElementById("cycloid").setAttribute("d", "M 0 0 C 57 214 440 214 500 0");
        document.getElementById("show-cycloid").value = "show"
    } else {
        document.getElementById("cycloid").setAttribute("d", "");
        document.getElementById("show-cycloid").value = "hide"
    }
}
