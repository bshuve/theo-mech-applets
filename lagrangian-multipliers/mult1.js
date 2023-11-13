/* Parameters */
const SVG_WIDTH = 445;
const SVG_HEIGHT = 300;
const TRANSITION_TIME = 10; // ms
const dt = 0.002;
const dtheta = 0.001;
const end_time = 20;
const end_theta = Math.PI;
const m = 1;
const R = 1;
const g = 9.8;
var theta_i = parseFloat(document.getElementById("theta-slider").value); // 0.011

/////////////////////////////////////////////////
/* FUNCTIONS TO GENERATE PLOTTING DATA */
/////////////////////////////////////////////////

// generate energy data
function energyAndDerivativeData() {
  // create arrays of data for each plot
  var lambda_data_theta = [];
  var newtonian_data_theta = [];
  var lambda_data_time = [];
  var newtonian_data_time = [];
  var t = 0;
  var theta = theta_i;
  var w = dtheta/dt;

  while (theta <= end_theta) {
    //parametrize graphs
    // let Ei = m * g * R * Math.cos(theta_i) // initial energy for system
    // let Ef = 1/2 * m * (v)**2 + m * g * R * Math.cos(theta); // final energy for system
    let v = Math.sqrt(2 * g * R * (Math.cos(theta_i) - Math.cos(theta))); // found using Ei = Ef
    w = v / R; // by definition v = R * omega = R(w)
    let newtonianFn = -m * (v)** 2 / R + m * g * Math.cos(theta);
    let lagrangianFn = -m * R * (w)** 2 + m * g * Math.cos(theta)

     // push all data into arrays
    // only graph values in (+) force (used -0.1 to get line to touch y=0)
    if (newtonianFn >= -0.1) { // since newtonianFn = lagrangianFn, can just test this condition
      lambda_data_theta.push({ "x": Math.round(theta * 10000) / 10000, "y": lagrangianFn });
      newtonian_data_theta.push({ "x": Math.round(theta * 10000) / 10000, "y": newtonianFn });
    }

    theta += dtheta;
  }

  // reinitialize theta to theta_i + dtheta so that w doesn't and dtheta_forTimeLoop don't stay at 0
  theta = theta_i + dtheta;
  while (t <= end_time) {
    w = Math.sqrt(2 * g * (Math.cos(theta_i) - Math.cos(theta)) / R); // reinitialize w to new w

    let dtheta_forTimeLoop = w*dt;

    // v = R * w
    let newtonianFn = -m * R * (w)** 2 + m * g * Math.cos(theta);
    let lagrangianFn = -m * R * (w)** 2 + m * g * Math.cos(theta);
    
    // push all data into arrays
    // only graph values in (+) force (used -0.1 to get line to touch y=0)
    if (newtonianFn >= -0.1) { // since newtonianFn = lagrangianFn can just test this condition
      lambda_data_time.push({ "x": Math.round(t * 10000) / 10000, "y": lagrangianFn });
      newtonian_data_time.push({ "x": Math.round(t * 10000) / 10000, "y": newtonianFn });
    } else {
      break // leave while loop so the other parts of the graph after force goes negative do not graph
    }

    theta += dtheta_forTimeLoop;
    t += dt;
  }


  return {
    l: lambda_data_theta, n: newtonian_data_theta,
    lt: lambda_data_time, nt: newtonian_data_time
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
    .attr("x", -margin.top)
    .text(input.yLabel)

  return { svg: svg, xScale: xScale, yScale: yScale };
}

// Newtonian Fn vs. Theta
// this input format will be followed by each plot after this
const newtonian_theta_input = {
  divID: "#newtonian-theta-graph", // the id of the <div> element in your HTML file where the plot will go
  svgID: "svg-for-newtoniantheta-plot", // what you want the svg element to be named (not super important)
  domain: { lower: 0, upper: 1 }, // domain of the plot
  xLabel: "Theta (radians)", // x-axis label
  range: { lower: 0, upper: 10 }, // range of the plot
  yLabel: "Normal Force (N)"// y-axis label
};

// the svg element is essentially saved as this const variable
const newtonian_theta_plot = createPlot(newtonian_theta_input);

// graph each line on the plot
// Fn using Newtonian calculation vs. theta line
var ntheta_line = newtonian_theta_plot.svg.append("g").attr("id", "newtonian-theta-line").attr("visibility", "visible");

// Lagrangian Fn vs. Theta
const lambda_theta_input = {
  divID: "#lambda-theta-graph",
  svgID: "svg-for-lambdatheta-plot",
  domain: { lower: 0, upper: 1 },
  xLabel: "Theta (radians)",
  range: { lower: 0, upper: 10 },
  yLabel: "Normal Force (N)"
};

const lambda_theta_plot = createPlot(lambda_theta_input);

// Fn using Lagrangian calculation vs. theta line
var ltheta_line = lambda_theta_plot.svg.append("g").attr("id", "lambda-theta-line").attr("visibility", "visible");

// Newtonian Fn vs. Time
// this input format will be followed by each plot after this
const newtonian_time_input = {
    divID: "#newtonian-time-graph", // the id of the <div> element in your HTML file where the plot will go
    svgID: "svg-for-newtoniantime-plot", // what you want the svg element to be named (not super important)
    domain: { lower: 0, upper: 2.5 }, // domain of the plot
    xLabel: "Time (s)", // x-axis label
    range: { lower: 0, upper: 10 }, // range of the plot
    yLabel: "Normal Force (N)"// y-axis label
  };
  
  // the svg element is essentially saved as this const variable
  const newtonian_time_plot = createPlot(newtonian_time_input);
  
  // graph each line on the plot
  // Fn using Newtonian calculation vs. theta line
  var ntime_line = newtonian_time_plot.svg.append("g").attr("id", "newtonian-time-line").attr("visibility", "visible");

// Lagrangian Fn vs. Time
const lambda_time_input = {
    divID: "#lambda-time-graph",
    svgID: "svg-for-lambdatime-plot",
    domain: { lower: 0, upper: 2.5 },
    xLabel: "Time (s)",
    range: { lower: 0, upper: 10 },
    yLabel: "Normal Force (N)"
  };
  
  const lambda_time_plot = createPlot(lambda_time_input);
  
  // Fn using Lagrangian calculation vs. theta line
  var ltime_line = lambda_time_plot.svg.append("g").attr("id", "lambda-time-line").attr("visibility", "visible");
  
// update energy plots
function plotEnergy(data) {
  // newtonian theta
  var input = {
    data: data.n,
    svg: newtonian_theta_plot.svg,
    line: ntheta_line,
    xScale: newtonian_theta_plot.xScale,
    yScale: newtonian_theta_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  // lagrangian theta
  input = {
    data: data.l,
    svg: lambda_theta_plot.svg,
    line: ltheta_line,
    xScale: lambda_theta_plot.xScale,
    yScale: lambda_theta_plot.yScale,
    color: "green"
  };

  // plot the data
  plotData(input);

  // newtonian time
  var input = {
    data: data.nt,
    svg: newtonian_time_plot.svg,
    line: ntime_line,
    xScale: newtonian_time_plot.xScale,
    yScale: newtonian_time_plot.yScale,
    color: "red"
  };

  // plot the data
  plotData(input);

  // lagrangian time
  input = {
    data: data.lt,
    svg: lambda_time_plot.svg,
    line: ltime_line,
    xScale: lambda_time_plot.xScale,
    yScale: lambda_time_plot.yScale,
    color: "green"
  };

  // plot the data
  plotData(input);
}

// create some initial data when page loads
const initial_data = energyAndDerivativeData();

// initialize energy lines
plotEnergy(initial_data);


function slider_update() {
  // updates global values for theta_i
  theta_i = parseFloat(document.getElementById("theta-slider").value);
  document.getElementById("print-theta").innerHTML = theta_i.toFixed(3);
  const data = energyAndDerivativeData();
  // update plot
  plotEnergy(data);
}

// checks if any sliders have been changed
document.getElementById("theta-slider").oninput = function () {
  slider_update();
}