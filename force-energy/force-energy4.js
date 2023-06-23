/* Parameters */
const CANVAS_WIDTH = 380;
const CANVAS_HEIGHT = 280;
const SVG_WIDTH = 445;
const SVG_HEIGHT = 300;
const TRANSITION_TIME = 10; // ms
const dt = 0.001;
const end_time = 4;
const FRAME_RATE = 1; // ms
const x_initial = 20;
const y_initial = 100;
const m = 1;
const g = 2;
const p_initial = parseInt(document.getElementById("p-slider").value);
var p = parseInt(document.getElementById("p-slider").value); // 0.0
const range_p = parseInt(document.getElementById("p-slider").max);

/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

// generate energy data
function energyAndDerivativeData() {
  // create arrays of data for each plot
  var kinetic_energy_l_data = [];
  var kinetic_energy_r_data = [];
  var potential_energy_l_data = [];
  var potential_energy_r_data = [];
  var minus_potential_energy_l_data = [];
  var minus_potential_energy_r_data = [];
  var kinetic_derivative_data = [];
  var potential_derivative_data = [];
  var n_potential_derivative_data = [];
  var derivative_kinetic_derivative_data = [];
  var t = 0.01;

  while (t <= end_time) {
    //parametrize graphs
    let y = 1-t**4;
    let v = -p*t**(p-1);
    let a = -p*(p-1)*t**(p-2);
    let KEl = (1/2 * m * (-(4)*t**((4)-1))**2); // kinetic energy T left
    let KEr = (1/2 * m * (-(-0.40200451)*t**((-0.40200451)-1))**2); // kinetic energy T right 
                                                                  // p = −0.40200451 to mimic left side of graph going from v= 0 to v=-256
    let PEl = m * g * y; // potential energy U
    let nPEl = -PEl; // negative potential energy -U
    let dKE = m * v; // dT/dv
    let dPE = m * g; // dU/dy
    let dnPE = -dPE; // -dU/dy
    let ddKE = m * a;

    // push all data into arrays
    kinetic_energy_l_data.push({ "x": -(4)*t**((4)-1), "y": KEl/1000 });
    kinetic_energy_r_data.push({ "x": -(-0.40200451)*t**((-0.40200451)-1), "y": KEr/1000 });
    potential_energy_l_data.push({ "x": y, "y": PEl });
    minus_potential_energy_l_data.push({ "x": y, "y": nPEl });
    kinetic_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": dKE });
    potential_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": dPE });
    n_potential_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": dnPE });
    derivative_kinetic_derivative_data.push({ "x": Math.round(t * 10000) / 10000, "y": ddKE });

    t += dt;
  }

  var ti = -0.01;
  while (ti >= -end_time) {
    //parametrize graphs
    let y = 1-ti**(5);
    let PEr = m * g * y; // potential energy U
    let nPEr = -PEr;
    if (y <= 260) {
      // push all data into arrays
      potential_energy_r_data.push({ "x": y, "y": PEr });
      minus_potential_energy_r_data.push({ "x": y, "y": nPEr });

    }
    ti -= dt;
  }

  // note that this iterates for all values of h for each dt

  return {
    kl: kinetic_energy_l_data, kr: kinetic_energy_r_data, npl: minus_potential_energy_l_data, npr: minus_potential_energy_r_data,
    pl: potential_energy_l_data, pr: potential_energy_r_data, kd: kinetic_derivative_data, pd: potential_derivative_data, npd: n_potential_derivative_data,
    kdd: derivative_kinetic_derivative_data
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
    .attr("y", -margin.left + 20)
    .attr("x", -margin.top + 15)
    .text(input.yLabel)

  return { svg: svg, xScale: xScale, yScale: yScale };
}

// POTENTIAL ENERGY GRAPH
// this input format will be followed by each plot after this
const potential_energy_input = {
  divID: "#PE-energy-graph", // the id of the <div> element in your HTML file where the plot will go
  svgID: "svg-for-PE-plot", // what you want the svg element to be named (not super important)
  domain: { lower: -300, upper: 300 }, // domain of the plot
  xLabel: "y Position (m)", // x-axis label
  range: { lower: -500, upper: 500 }, // range of the plot
  yLabel: "Potential Energy (J)"// y-axis label
};

// the svg element is essentially saved as this const variable
const potential_energy_plot = createPlot(potential_energy_input);

// graph each line on the plot
// potential energy U
var pe_l_line = potential_energy_plot.svg.append("g").attr("id", "potential-energy-l-line").attr("visibility", "visible");
// negative potential energy -U
var npe_l_line = potential_energy_plot.svg.append("g").attr("id", "minus-potential-energy-l-line").attr("visibility", "visible");

var pe_r_line = potential_energy_plot.svg.append("g").attr("id", "potential-energy-r-line").attr("visibility", "visible");
var npe_r_line = potential_energy_plot.svg.append("g").attr("id", "minus-potential-energy-r-line").attr("visibility", "visible");

// PE DERIVATIVE OF ENERGY
const potential_derivative_input = {
  divID: "#PE-derivative-graph",
  svgID: "svg-for-PE-derivative",
  domain: { lower: 0, upper: 4 },
  xLabel: "Time (s)",
  range: { lower: -4, upper: 4 },
  yLabel: "Potential Derivative (∂U/∂y)"
};

const potential_derivative_plot = createPlot(potential_derivative_input);

// -dU/dy
var npd_line = potential_derivative_plot.svg.append("g").attr("id", "n_potential-derivative-line").attr("visibility", "visible");
// dU/dy
var pd_line = potential_derivative_plot.svg.append("g").attr("id", "potential-derivative-line").attr("visibility", "visible");

// nPE DERIVATIVE OF ENERGY
const npotential_derivative_input = {
  divID: "#nPE-derivative-graph",
  svgID: "svg-for-nPE-derivative",
  domain: { lower: 0, upper: 4 },
  xLabel: "Time (s)",
  range: { lower: -4, upper: 4 },
  yLabel: "Potential Derivative (∂U/∂x)"
};

const npotential_derivative_plot = createPlot(npotential_derivative_input);

// -dU/dy
var npd_line = npotential_derivative_plot.svg.append("g").attr("id", "n_potential-derivative-line").attr("visibility", "visible");

// KINETIC ENERGY GRAPH
const kinetic_energy_input = {
  divID: "#KE-energy-graph",
  svgID: "svg-for-KE-plot",
  domain: { lower: -300, upper: 300},
  xLabel: "ẏ Velocity (m/s)",
  range: { lower: 0, upper: 35 },
  yLabel: "Kinetic Energy (kJ)"
};

const kinetic_energy_plot = createPlot(kinetic_energy_input);


// kinetic energy T
var ke_l_line = kinetic_energy_plot.svg.append("g").attr("id", "kinetic-energy-l-line").attr("visibility", "visible");
var ke_r_line = kinetic_energy_plot.svg.append("g").attr("id", "kinetic-energy-r-line").attr("visibility", "visible");

// KE DERIVATIVE OF ENERGY
const kinetic_derivative_input = {
  divID: "#KE-derivative-graph",
  svgID: "svg-for-KE-derivative",
  domain: { lower: 0, upper: 4 },
  xLabel: "Time (s)",
  range: { lower: -10, upper: 10 },
  yLabel: "Kinetic Derivative (∂T/∂ẏ)"
};

const kinetic_derivative_plot = createPlot(kinetic_derivative_input);

// dT/dv
var kd_line = kinetic_derivative_plot.svg.append("g").attr("id", "kinetic-derivative-line");

// d/dt KE DERIVATIVE OF ENERGY
const derivative_kinetic_derivative_input = {
  divID: "#dKE-derivative-graph",
  svgID: "svg-for-dKE-derivative",
  domain: { lower: 0, upper: 4 },
  xLabel: "Time (s)",
  range: { lower: -4, upper: 4 },
  yLabel: "d/dt Kinetic Derivative (d/dt(∂T/∂ẋ))"
};

const derivative_kinetic_derivative_plot = createPlot(derivative_kinetic_derivative_input);

// dT/dv
var kdd_line = derivative_kinetic_derivative_plot.svg.append("g").attr("id", "derivative-kinetic-derivative-line");

// update energy plots
function plotEnergy(data) {
  // kinetic energy
  var input = {
    data: data.kl,
    svg: kinetic_energy_plot.svg,
    line: ke_l_line,
    xScale: kinetic_energy_plot.xScale,
    yScale: kinetic_energy_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  var input = {
    data: data.kr,
    svg: kinetic_energy_plot.svg,
    line: ke_r_line,
    xScale: kinetic_energy_plot.xScale,
    yScale: kinetic_energy_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  // potential energy
  input = {
    data: data.pl,
    svg: potential_energy_plot.svg,
    line: pe_l_line,
    xScale: potential_energy_plot.xScale,
    yScale: potential_energy_plot.yScale,
    color: "green"
  };

  // plot the data
  plotData(input);

  // potential energy
  input = {
    data: data.pr,
    svg: potential_energy_plot.svg,
    line: pe_r_line,
    xScale: potential_energy_plot.xScale,
    yScale: potential_energy_plot.yScale,
    color: "green"
  };

  // plot the data
  plotData(input);

  // negative potential energy
  input = {
    data: data.npl,
    svg: potential_energy_plot.svg,
    line: npe_l_line,
    xScale: potential_energy_plot.xScale,
    yScale: potential_energy_plot.yScale,
    color: "grey"
  };

  // plot the data
  plotData(input);

  input = {
    data: data.npr,
    svg: potential_energy_plot.svg,
    line: npe_r_line,
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

  // d/dt(dT/dv)
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
var showAnswer2 = false;
var showAnswer3 = false;

function slider_update() {
  // updates global value for p
  p = parseFloat(document.getElementById("p-slider").value);
  document.getElementById("print-p").innerHTML = p.toFixed(1);
  if (showAnswer1) { // checks if the answer is being shown before updating it
    document.getElementById("answer1").innerHTML = "<br><br>Force = " + (-m * g).toFixed(2) + " N"
      + "<br><br>Yes, this is a conservative force because the work done is independent of the path taken and only depends on the initial and final position.<br>";
  }
  if (showAnswer2) { // checks if the answer is being shown before updating it
    document.getElementById("answer2").style.display = "block";
  }
  if (showAnswer3) { // checks if the answer is being shown before updating it
    document.getElementById("answer3").style.display = "block";
  }
  const data = energyAndDerivativeData();
  // update plots
  plotEnergy(data);
  plotDerivative(data);
}

// checks if any sliders have been changed
document.getElementById("p-slider").oninput = function () {
  slider_update();
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

// shows the answer if the q2 button is clicked
document.getElementById("show-q2").addEventListener("click", function () {
  if (!showAnswer2) {
    showAnswer2 = true;
    document.getElementById("show-q2").innerHTML = "Hide Answer";
    slider_update();
  } else {
    showAnswer2 = false;
    document.getElementById("show-q2").innerHTML = "Show Answer";
    document.getElementById("answer2").style.display = "none";
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