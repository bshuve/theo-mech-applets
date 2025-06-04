const CANVAS_WIDTH_1 = 170; // Why do we decide to do 170
const CANVAS_WIDTH_2 = 380;
const CANVAS_HEIGHT = 280;
const FRAME_RATE = 10; //ms
const SVG_WIDTH = 360;
const SVG_HEIGHT = 360;
const dt = 0.005;
const h_i = 1;
const g = 9.8;
const m = 1;
const end_time = Math.sqrt(2*h_i/g); // how do we decided end time
const x_initial = 20;
const y_initial = 100;
const p_intial = parseInt(document.getElementById("p-slider").value);
const range_pmin = parseInt(document.getElementById("p-slider").min);
const range_pmax = parseInt(document.getElementById("p-slider").max);

function startAnimation(p) {

    // what do each of these represent?
    param1D = new component(10, 10, "orange", 2.*CANVAS_WIDTH_1/3, y_initial, 1, p);
    actual1D = new component(10, 10, "purple", 1*CANVAS_WIDTH_1/3, y_initial, 1, 0);

    param2D = new component(3, 3, "orange", x_initial, y_initial, 2, p);
    actual2D = new component(3, 3, "purple", x_initial, y_initial, 2, 0);

    animArea.start();
}

function endAnimation() {
    animArea.stop();
}

// where do we get this equation from?
function transformYCoord(y) {
    return CANVAS_HEIGHT - y_initial - y * (CANVAS_HEIGHT/2 - 2 * x_initial) / (2 * range_pmax/100);
}

// where does 168 come from?
function transformXCoord(x) {
    return (x_initial + 168) + (CANVAS_WIDTH_2 * (x))   / 1.2;
}


// what is context? 
var animArea = {
    panel1: document.getElementById("projectile-motion-canvas-1"),
    panel2: document.getElementById("projectile-motion-canvas-2"),
    start: function() {
        this.panel1.width = CANVAS_WIDTH_1;
        this.panel1.height = CANVAS_HEIGHT;
        this.context1 = this.panel1.getContext("2d");

        this.panel2.width = CANVAS_WIDTH_2;
        this.panel2.height = CANVAS_HEIGHT;
        this.context2 = this.panel2.getContext("2d");

        this.time = -end_time;

        this.interval = setInterval(updateFrame, FRAME_RATE);

        this.context1.font = "18px Verdana";
        this.context1.fillStyle = "black";
        this.context1.fillText("Projectile Motion", 10, 30);
        this.context1.fillRect(x_initial, transformYCoord(-0.05), CANVAS_WIDTH_1-40, 3);

        this.context2.font = "18px Verdana";
        this.context2.fillStyle = "black";
        this.context2.fillText("Height vs Time", 10, 30);
        this.context2.fillRect(x_initial, transformYCoord(-0.05), CANVAS_WIDTH_2-40,3)
        },
    clear: function() {
        this.context1.clearRect(0, 0, this.panel1.width, this.panel1.height);
        },
    stop: function() {
        this.time = -end_time;
        clearInterval(this.interval);
        },   
}

function component(width, height, color, x, y, type, p) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.color = color;
    this.x = x;
    this.y = y;
    this.p = p;


    this.update = function() {
        var ctx;
        if (this.type == 1) {ctx = animArea.context1;}
        else {ctx = animArea.context2;}
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }

    this.newPos = function(t) {
        if (type == 1) {
            this.y = transformYCoord((1 + this.p) * (h_i - (1/2)*g*t**2));
        } else if (this.type == 2) {
            this.x = transformXCoord(t);
            this.y = transformYCoord((1 + this.p) * (h_i - (1/2)*g*t**2));
        }     
    }
}

function updateFrame() {

    // only clears the first frame (Projectile Motion)
    animArea.clear();
    animArea.time += dt;

    animArea.context1.font = "18px Verdana";
    animArea.context1.fillStyle = "black";
    animArea.context1.fillText("Projectile Motion", 10, 30);
    animArea.context1.fillRect(x_initial, transformYCoord(-0.05), CANVAS_WIDTH_1-40, 3);

    param1D.newPos(animArea.time);
    actual1D.newPos(animArea.time);
    param2D.newPos(animArea.time);
    actual2D.newPos(animArea.time);

    param1D.update();
    actual1D.update();
    param2D.update();
    actual2D.update();

    if (animArea.time >= end_time) {endAnimation();}
}

startAnimation(p_intial);

// dimensions and margins of svg graph
var margin = {top: 20, right: 20, bottom: 50, left: 60},
    width = SVG_WIDTH - margin.left - margin.right,
    height = SVG_HEIGHT - margin.top - margin.bottom;

// updates line of the graph
function plotData(input) {
    // update line
    var u = input.line.selectAll(".line").data([input.data], d => input.xScale(d.x));

    u.enter()
        .append("path")
        .attr("class", "line")
        .merge(u)
        .transition()
        .duration(FRAME_RATE)
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
    var svg = d3
        .select(input.divID)
        .append("svg")
        .attr("width", SVG_WIDTH)
        .attr("height", SVG_HEIGHT)
        .attr("id", input.divID)
        .attr("class", "plot")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // initialize an x-axis and y-axis scaling function    
    var xScale = d3.scaleLinear().domain([input.domain.lower, input.domain.upper]).range([0, width]);
    var yScale = d3.scaleLinear().domain([input.range.lower, input.range.upper]).range([height, 0]);

    // add x-axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "myXaxis")
        .call(d3.axisBottom(xScale));

    // add x-axis label
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width/2)
        .attr("y", height + margin.top + 20)
        .text(input.xLabel)    

    // add y-axis
    svg.append("g")
        .attr("class", "myYaxis")
        .call(d3.axisLeft(yScale));

    // add y-axis label
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -margin.top)
        .text(input.yLabel)

    
    return {svg: svg, xScale: xScale, yScale: yScale}
}

// how do we come up with formulae for integralke or integralpe
function integralData() {
    var action_data = [];
    for (let p = range_pmin; p <= range_pmax + 1; p++) {
        let pv = p / 100;
        let integral_KE = (1/6 * m * g**2 * (1 + pv)**2) * ((end_time)**3 - (-end_time)**3);
        let integral_PE = m * g * (1 + pv) * (h_i * (end_time - (-end_time)) - 1/6 * g * (end_time**3 - (-end_time)**3));
        action_data.push({"x": pv, "y": integral_KE - integral_PE});
    }
    return {action_data: action_data};
}

const integral_data = integralData();

const integral_input = {
    divID: "#integral-graph",
    svgID: "svg-for-integral-plots",
    domain: {lower: -1, upper: 1},
    xLabel: "p",
    range: {lower: -10, upper: 10},
    yLabel: "Action"};


const integral_plot = createPlot(integral_input)
var action_line = integral_plot.svg.append("g").attr("id", "action-line").attr("visibility", "visible");
var action_point = integral_plot.svg.append("circle").attr("id", "action-point").attr("r", 3).attr("fill", "orange").attr("visibility", "visible");

function plotIntegral() {
    var input = {
        data: integral_data.action_data,
        svg: integral_plot.svg,
        line: action_line,
        xScale: integral_plot.xScale,
        yScale: integral_plot.yScale,
        color: "orange"};
    plotData(input);
}

function plotIntegralPoints(p) {
    // x-axis is control point cy
    action_point.attr("cx", integral_plot.xScale(p));

    // y-axis is integral energy which we can access from our precomputed data
    p = Math.round(p * 100);
    let action = integral_data["action_data"][p - range_pmin].y;

    // set the circle's y-coord as the data y value
    action_point.attr("cy", integral_plot.yScale(action));
}

// draw initial graphs

plotIntegral();
plotIntegralPoints(p_intial);


document.getElementById("p-slider").oninput = function() {
    let p = parseInt(document.getElementById("p-slider").value)/100;
    document.getElementById("print-p").innerHTML = p.toFixed(2);
    endAnimation();
    startAnimation(p);
    plotIntegralPoints(p);
}
