/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 294;
const SVG_WIDTH = 445;
const SVG_HEIGHT = 300;
const dt = 0.005;
const FRAME_RATE = 1;   // ms
const TRANSITION_TIME = 10; // ms
const A = 0.1;
const k = 5;
const m = 5;
const w = Math.sqrt(k/m); // 1
var B = parseFloat(document.getElementById("B-slider").value); // 0
// keep track of number of oscillations
var oscillations = 0;

/////////////////////////////////////////////////
/* CANVAS ANIMATIONS */
/////////////////////////////////////////////////

// wrapper function to start animations
function startAnimation(B) {
    mass = new component(20, 20, "blue", CANVAS_WIDTH/2, CANVAS_HEIGHT/2, B);
    oscillations = 0;
    animArea.start();
}

function runAnimation(B) {
    startAnimation(B);
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

// to create components
function component(width, height, color, x, y, B) {
    this.width = width;
    this.height = height;
    this.color = color;
    this.x = x;
    this.y = y;
    this.B = B * 5;
    this.A = A * 5;
  
    this.update = function(){
        animArea.context.fillStyle = this.color;
        animArea.context.fillRect(this.x, this.y, this.width, this.height);
    }
  
    this.newPos = function(t) {
      this.x = transformXCoord(this.A * Math.cos(w * t) + this.B * Math.sin(2 * w * t));
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
    /* This statement counts oscillations of the spring to decide when to stop the animation. */
    if (Math.round(Math.cos(animArea.time)*200)/200 == 0) {
      oscillations += 0.5;
      console.log(oscillations);
    }
  
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
  
    // end animation when spring has oscillated 5 times
    if (oscillations >= 5) {endAnimation();}
}

// run animation on load
startAnimation(B);
runAnimation(B);


/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

// generate energy data
function energyAndDerivativeData() {
  // create arrays of data for each plot
  var kinetic_energy_data = [];
  var potential_energy_data = [];
  var minus_potential_energy_data = [];
  var kinetic_derivative_data = [];
  var potential_derivative_data = [];
  var n_potential_derivative_data = [];
  var derivative_kinetic_derivative_data = [];
  var t = 0;

  while (t <= 6*Math.PI) {
    //parametrize graphs
    let x = A * Math.cos(w * t) + B * Math.sin(2 * w * t);
    let v = -w * A * Math.sin(w * t) + 2 * B * w * Math.cos(2 * w * t);
    let a = -(w**2) * A * Math.cos(w * t) - (2**2) * B * (w**2) * Math.sin(2 * w * t);
    let KE = 0.5 * m * v ** 2; // kinetic energy T
    let PE = 0.5 * k * x ** 2; // potential energy U
    let nPE = -PE; // negative potential energy -U
    let dKE = m * v; // dT/dv
    let dPE = k * x; // -dU/dy
    let dnPE = -dPE; // dU/dy
    let ddKE = m * a; // d/dt(dT/dv)

    // push all data into arrays
    kinetic_energy_data.push({ "x": v, "y": KE});
    potential_energy_data.push({ "x": x, "y": PE});
    minus_potential_energy_data.push({ "x": x, "y": nPE});
    kinetic_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": dKE });
    potential_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": dPE });
    n_potential_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": dnPE });
    derivative_kinetic_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": ddKE})
    t += dt;
  }
  return {
    k: kinetic_energy_data, np: minus_potential_energy_data, p: potential_energy_data,
    kd: kinetic_derivative_data, pd: potential_derivative_data, npd: n_potential_derivative_data, kdd: derivative_kinetic_derivative_data
  };
}

// set the dimensions and margins of the graph
var margin = { top: 20, right: 20, bottom: 50, left: 50 },
  width = SVG_WIDTH - margin.left - margin.right,
  height = SVG_HEIGHT - margin.top - margin.bottom;

function plotData(input) {
  // update the line
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

/*
function dashplotData(input) {
  // update the line
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
    .attr("stroke-dasharray", 5)
    .attr("stroke-width", 1.5);
}
*/

// initialize the svg element for a graph
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
  var yScale = d3.scaleLinear().domain([input.range.lower, input.range.upper]).range([height, 0]);

  // add y-axis
  svg.append("g")
    .attr("class", "myYaxis")
    .call(d3.axisLeft(yScale));

  // add y-axis label
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 15)
    .attr("x", -margin.top + 15)
    .text(input.yLabel)

  return { svg: svg, xScale: xScale, yScale: yScale };
}

// POTENTIAL ENERGY GRAPH
// this input format will be followed by each plot after this
const potential_energy_input = {
  divID: "#PE-energy-graph", // the id of the <div> element in your HTML file where the plot will go
  svgID: "svg-for-PE-plot", // what you want the svg element to be named (not super important)
  domain: { lower: -0.2, upper: 0.2 }, // domain of the plot
  xLabel: "x Position (m)", // x-axis label
  range: { lower: -0.08, upper: 0.08 }, // range of the plot
  yLabel: "Potential Energy (J)"// y-axis label
};                   

// the svg element is essentially saved as this const variable
const potential_energy_plot = createPlot(potential_energy_input);

// graph each line on the plot
// potential energy U
var pe_line = potential_energy_plot.svg.append("g").attr("id", "potential-energy-line").attr("visibility", "visible");
// negative potential energy -U
var npe_line = potential_energy_plot.svg.append("g").attr("id", "minus-potential-energy-line").attr("visibility", "visible");

// PE DERIVATIVE OF ENERGY
const potential_derivative_input = {
  divID: "#PE-derivative-graph",
  svgID: "svg-for-PE-derivative",
  domain: { lower: 0, upper: 6*Math.PI },
  xLabel: "Time (s)",
  range: { lower: -1, upper: 1 },
  yLabel: "Potential Derivative (∂U/∂x)"
};

const potential_derivative_plot = createPlot(potential_derivative_input);

// dU/dy
var pd_line = potential_derivative_plot.svg.append("g").attr("id", "potential-derivative-line").attr("visibility", "visible");

// nPE DERIVATIVE OF ENERGY
const npotential_derivative_input = {
  divID: "#nPE-derivative-graph",
  svgID: "svg-for-nPE-derivative",
  domain: { lower: 0, upper: 6*Math.PI },
  xLabel: "Time (s)",
  range: { lower: -2.5, upper: 2.5 },
  yLabel: "Potential Derivative (∂U/∂x)"
};

const npotential_derivative_plot = createPlot(npotential_derivative_input);

// -dU/dy
var npd_line = npotential_derivative_plot.svg.append("g").attr("id", "n_potential-derivative-line").attr("visibility", "visible");

// KINETIC ENERGY GRAPH
const kinetic_energy_input = {
  divID: "#KE-energy-graph",
  svgID: "svg-for-KE-plot",
  domain: { lower: -0.35, upper: 0.35 },
  xLabel: "ẋ Velocity (m/s)",
  range: { lower: 0, upper: 0.24 },
  yLabel: "Kinetic Energy (J)"
};

const kinetic_energy_plot = createPlot(kinetic_energy_input);

// kinetic energy T
var ke_line = kinetic_energy_plot.svg.append("g").attr("id", "kinetic-energy-line").attr("visibility", "visible");

// KE DERIVATIVE OF ENERGY
const kinetic_derivative_input = {
  divID: "#KE-derivative-graph",
  svgID: "svg-for-KE-derivative",
  domain: { lower: 0, upper: 6*Math.PI },
  xLabel: "Time (s)",
  range: { lower: -1.6, upper: 1.6 },
  yLabel: "Kinetic Derivative (∂T/∂ẋ)"
};

const kinetic_derivative_plot = createPlot(kinetic_derivative_input);

// dT/dv
var kd_line = kinetic_derivative_plot.svg.append("g").attr("id", "kinetic-derivative-line");

// d/dt KE DERIVATIVE OF ENERGY
const derivative_kinetic_derivative_input = {
  divID: "#dKE-derivative-graph",
  svgID: "svg-for-dKE-derivative",
  domain: { lower: 0, upper: 6*Math.PI },
  xLabel: "Time (s)",
  range: { lower: -2.5, upper: 2.5 },
  yLabel: "d/dt Kinetic Derivative (d/dt(∂T/∂ẋ))"
};

const derivative_kinetic_derivative_plot = createPlot(derivative_kinetic_derivative_input);

// dT/dv
var kdd_line = derivative_kinetic_derivative_plot.svg.append("g").attr("id", "derivative-kinetic-derivative-line");

// update energy plots
function plotEnergy(data) {
  // kinetic energy
  var input = {
    data: data.k,
    svg: kinetic_energy_plot.svg,
    line: ke_line,
    xScale: kinetic_energy_plot.xScale,
    yScale: kinetic_energy_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  // potential energy
  input = {
    data: data.p,
    svg: potential_energy_plot.svg,
    line: pe_line,
    xScale: potential_energy_plot.xScale,
    yScale: potential_energy_plot.yScale,
    color: "green"
  };

  // plot the data
  plotData(input);

  // negative potential energy
  input = {
    data: data.np,
    svg: potential_energy_plot.svg,
    line: npe_line,
    xScale: potential_energy_plot.xScale,
    yScale: potential_energy_plot.yScale,
    color: "grey"
  };

  // plot the data
  plotData(input);

}

// update derivative plots
function plotDerivative(data) {

  // dT/dv
  var input = {
    data: data.kd,
    svg: kinetic_derivative_plot.svg,
    line: kd_line,
    xScale: kinetic_derivative_plot.xScale,
    yScale: kinetic_derivative_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  // derivative kinetic derivative plot (d/dt(dT/dv))
  var input = {
    data: data.kdd,
    svg: derivative_kinetic_derivative_plot.svg,
    line: kdd_line,
    xScale: derivative_kinetic_derivative_plot.xScale,
    yScale: derivative_kinetic_derivative_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  // dU/dy
  var input = {
    data: data.pd,
    svg: potential_derivative_plot.svg,
    line: pd_line,
    xScale: potential_derivative_plot.xScale,
    yScale: potential_derivative_plot.yScale,
    color: "green"
  };

  // plot the data
  plotData(input);

  // -dU/dy
  var input = {
    data: data.npd,
    svg: npotential_derivative_plot.svg,
    line: npd_line,
    xScale: npotential_derivative_plot.xScale,
    yScale: npotential_derivative_plot.yScale,
    color: "gray"
  };

  // plot the data
  plotData(input);
}

// create some initial data when page loads
const initial_data = energyAndDerivativeData();

// initialize energy lines
plotEnergy(initial_data);

// initialize energy lines
plotDerivative(initial_data);


/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

/* This section holds the functions that I call when something happens
on the HTML page (ex. button click, slider change, etc). */

// these booleans store whether answers are being shown
// by default, all answers are hidden
var showAnswer1 = false;
var showAnswer3 = false;

function slider_update() {
  // updates global values for m, a, h
  B = parseFloat(document.getElementById("B-slider").value);
  document.getElementById("print-B").innerHTML = B.toFixed(2);
  if (showAnswer1) { // checks if the answer is being shown before updating it
    document.getElementById("answer1").innerHTML = "<br><br>Force = " + (k * A).toFixed(2) + " N"
      + "<br><br>Yes, this is a conservative force because the displacement force results in the spring having potential/stored energy, which is independent on the path taken.<br>";
  }
  if (showAnswer3) { // checks if the answer is being shown before updating it
    document.getElementById("answer3").style.display = "block";
  }
  const data = energyAndDerivativeData();
  // update plots
  plotEnergy(data);
  plotDerivative(data);
  endAnimation();
  startAnimation(B);
}

// checks if the B slider has been changed
document.getElementById("B-slider").oninput = function () {
  slider_update();
}
document.getElementById("B-slider").onchange = function() {
  runAnimation(B);
}

// shows the answer if the q1 button is clicked
document.getElementById("show-q1").addEventListener("click", function () {
  if (!showAnswer1) {
    showAnswer1 = true;
    document.getElementById("show-q1").innerHTML = "Hide Answers";
    slider_update();
  } else {
    showAnswer1 = false;
    document.getElementById("show-q1").innerHTML = "Show Answers";
    document.getElementById("answer1").innerHTML = "";
  }
});

// shows the proof if the proof button is clicked
document.getElementById("show-more").addEventListener("click", function () {
  if (!showAnswer3) {
    showAnswer3 = true;
    document.getElementById("show-more").innerHTML = "Hide Proof";
    slider_update();
  } else {
    showAnswer3 = false;
    document.getElementById("show-more").innerHTML = "Show Proof";
    document.getElementById("answer3").style.display = "none";
  }
});