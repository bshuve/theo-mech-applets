/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////

const CANVAS_WIDTH_1 = 170;
const CANVAS_WIDTH_2 = 380;
const CANVAS_HEIGHT = 280;
const SVG_WIDTH = 270;
const SVG_HEIGHT = 300;
const TRANSITION_TIME = 10; // ms
const dt = 0.01;
const FRAME_RATE = 10; // ms
const x_initial = 20;
const y_initial = 100;
const g = 2;
const p_initial = parseInt(document.getElementById("p-slider").value);
const range_p = parseInt(document.getElementById("p-slider").max);


/////////////////////////////////////////////////
/* CANVAS ANIMATIONS */
/////////////////////////////////////////////////

// wrapper function to start animations
function startAnimation(p) {
    // 1D projectiles
    param1D = new component(10, 10, "orange", 1.*CANVAS_WIDTH_1/3, y_initial, 1, p);
//    actual1D = new component(10, 10, "purple", 0.8*CANVAS_WIDTH_1/3, y_initial, 2, p);
    classmod1D =  new component(10, 10, "aquamarine", 2*CANVAS_WIDTH_1/3, y_initial, 5, p);

    // 2D projectiles
    param2D = new component(3, 3, "orange", x_initial, y_initial, 3, p);
//    actual2D = new component(3, 3, "purple", x_initial, y_initial, 4, p);
    classmod2D = new component(3, 3, "aquamarine", x_initial, y_initial, 6, p);

    animArea.start();
}

// wrapper function to end animations
function endAnimation() {
    animArea.stop();
}

// parameterized coord -> canvas coord
function transformXCoord(x) {
    return x_initial + (x+1) * (CANVAS_WIDTH_2 - 3 * x_initial) / 2;
}

// parameterized coord -> canvas coord
function transformYCoord(y) {
    return CANVAS_HEIGHT - y_initial - y * (CANVAS_HEIGHT/2 - 2 * x_initial) / (2 * range_p/100);
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
        this.context2.fillRect(x_initial, transformYCoord(-0.05), CANVAS_WIDTH_2-40, 3);
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
        if (this.type == 1 || this.type == 2 || this.type == 5) {ctx = animArea.context1;}
        else {ctx = animArea.context2;}
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    this.newPos = function(t) {
        if (type == 1) {
            this.y = transformYCoord((1 + this.p) * (1 - t**2));
        } else if (this.type == 2) {
            // y = v0 t - 0.5 g t**2     v0 = -2t(1+p) at t=-1
            t += 1
            this.y = transformYCoord(2 * (1 ) * t - 0.5 * g * t ** 2);
//	    this.y = transformYCoord(2 * (1 ) * t - 0.5 * g * t ** 2);
        } else if (this.type == 3) {
            this.x = transformXCoord(t);
            this.y = transformYCoord((1 + this.p) * (1 - t**2));
        } else if (this.type == 4) {
            this.x = transformXCoord(t);
//            this.y = transformYCoord(2 * (1 + this.p) * t - 0.5 * g * t ** 2);
	    t += 1
            this.y = transformYCoord(2 * (1) * t - 0.5 * g * t ** 2);
        } else if (this.type == 5) {
            t += 1 
            this.y = transformYCoord(2 * (1 + this.p) * t - 0.5 * g * t ** 2);
	} else if (this.type == 6) {

            this.x = transformXCoord(t);
            t += 1
            this.y = transformYCoord(2 * (1 + this.p ) * t - 0.5 * g * t ** 2);

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
    animArea.context1.fillRect(x_initial, transformYCoord(-0.05), CANVAS_WIDTH_1-40, 3);

    // update projectile positions
    param1D.newPos(animArea.time);
//    actual1D.newPos(animArea.time);
    classmod1D.newPos(animArea.time);
    param2D.newPos(animArea.time)
//    actual2D.newPos(animArea.time);
    classmod2D.newPos(animArea.time);

    // update plots
    param1D.update();
//    actual1D.update();
    classmod1D.update();
    param2D.update();
//    actual2D.update();
    classmod2D.update();

    // add text
    animArea.context1.font = "20px Arial";
    animArea.context1.fillStyle = "black";
    animArea.context1.fillText("Projectile Motion", 10, 30);

    // end animation when t = 1
    if (animArea.time >= 1) {endAnimation();}
}

// run animation on load
startAnimation(p_initial);


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
    let p = parseInt(document.getElementById("p-slider").value)/100;
    document.getElementById("print-p").innerHTML = p.toFixed(2);

}

// run animation
document.getElementById("p-slider").onchange = function() {
    let p = parseInt(document.getElementById("p-slider").value)/100;
    endAnimation();
    startAnimation(p);
}


