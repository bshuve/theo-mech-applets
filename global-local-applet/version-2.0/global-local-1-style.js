/**
 * Global-Local Action Minimization Applet
 * 
 * This applet demonstrates the relationship between global and local action minimization
 * in classical mechanics. It visualizes how varying trajectory points affects the action
 * and compares parameterized vs classical trajectories.
 * 
 * @author Isabel Godoy, Ashley Kim, Michael Mumo, Brian Shuve, 2025
 * @version 2.0
 */

// ============================================================================
// CONFIGURATION AND CONSTANTS
// ============================================================================

/**
 * Physical constants for the simulation
 */
const PHYSICS_CONSTANTS = {
    g: 2,           // Gravitational acceleration (m/s²) - simplified for calculations
    m: 1,           // Particle mass (kg)
    y0: 0,          // Initial y-coordinate
    dt: 0.02        // Time step for animation (s)
};

/**
 * Canvas and SVG dimensions
 */
const DIMENSIONS = {
    CANVAS_WIDTH: 170,
    CANVAS_HEIGHT: 280,
    SVG_WIDTH: 360,
    SVG_HEIGHT: 360
};

/**
 * Animation parameters
 */
const ANIMATION_CONFIG = {
    TRANSITION_TIME: 10,    // D3 transition time (ms)
    FRAME_RATE: 0.1         // Animation frame rate (ms)
};

/**
 * Time points for trajectory calculation (seconds)
 */
const TIME_POINTS = [0, 3, 6, 10, 14, 17, 20];

/**
 * Initial trajectory data
 */
let yList = [0, 51, 84, 100, 84, 51, 0];  // y1 is variable, others are fixed

/**
 * Initialize trajectory data from slider
 */
function initializeTrajectoryData() {
    const slider = document.getElementById("y1-slider");
    if (slider) {
        yList[1] = parseInt(slider.value);
    }
}

/**
 * Slider configuration
 */
const SLIDER_CONFIG = {
    min: 0,
    max: 200,
    initialValue: 0
};


// ============================================================================
// PHYSICS CALCULATIONS
// ============================================================================

/**
 * Calculates the action for a given trajectory using Lagrangian formalism
 * 
 * The action S = ∫[T - V] dt where T is kinetic energy and V is potential energy
 * 
 * @param {number[]} yList - Array of y-coordinates for each time point
 * @returns {number} The calculated action value (J.s)
 */
function calculateAction(yList) {
    const { g, m } = PHYSICS_CONSTANTS;
    let ki = 0; // kinetic energy integral
    let pi = 0; // potential energy integral
    
    for (let i = 1; i < yList.length; i++) {
        // Calculate kinetic energy constant
        const kConst = (yList[i] - yList[i-1] + 0.5 * g * (TIME_POINTS[i] - TIME_POINTS[i-1]) ** 2) / 
                      (TIME_POINTS[i] - TIME_POINTS[i-1]);
        
        ki += (kConst - g * (TIME_POINTS[i] - TIME_POINTS[i-1])) ** 3 - kConst ** 3;
        
        // Calculate potential energy constant
        const pConst = (yList[i] - yList[i-1] + 0.5 * g * (TIME_POINTS[i] - TIME_POINTS[i-1]) ** 2) / 
                       (TIME_POINTS[i] - TIME_POINTS[i-1]);
        
        pi += yList[i-1] * TIME_POINTS[i] + 
              pConst * (TIME_POINTS[i] - TIME_POINTS[i-1]) ** 2 / 2 - 
              g * (TIME_POINTS[i] - TIME_POINTS[i-1]) ** 3 / 6 - 
              yList[i-1] * TIME_POINTS[i-1];
    }
    
    return -m * ki / (6 * g) - m * g * pi;
}

/**
 * Calculates the classical trajectory (global minimum action path)
 * 
 * For a particle under gravity with fixed endpoints, the classical path is:
 * y(t) = 0.5 * g * t * (T - t)
 * 
 * @param {number} t - Time value
 * @param {number} T - Total time (default: 20s)
 * @returns {number} Y-coordinate at time t
 */
function calculateClassicalTrajectory(t, T = 20) {
    const { g } = PHYSICS_CONSTANTS;
    return 0.5 * g * t * (T - t);
}

/**
 * Calculates the parameterized trajectory between two points
 * 
 * This function calculates the trajectory that minimizes action locally
 * between two adjacent points, taking into account gravity.
 * 
 * @param {number} t - Current time
 * @param {number[]} yList - Array of y-coordinates
 * @returns {number} Y-coordinate for parameterized trajectory
 */
function calculateParameterizedTrajectory(t, yList) {
    const { g } = PHYSICS_CONSTANTS;
    
    // Find which time interval we're in
    let i;
    for (let j = 1; j < TIME_POINTS.length; j++) {
        if (t < TIME_POINTS[j]) {
            i = j;
            break;
        } else if (t === TIME_POINTS[j]) {
            return yList[j];
        }
    }
    
    if (t >= TIME_POINTS[TIME_POINTS.length - 1]) {
        return yList[yList.length - 1];
    }
    
    // Calculate position using parameterization
    const dt = TIME_POINTS[i] - TIME_POINTS[i-1];
    const dy = yList[i] - yList[i-1];
    const t_rel = t - TIME_POINTS[i-1];
    
    return yList[i-1] + 
           ((dy + 0.5 * g * dt ** 2) / dt) * t_rel - 
           0.5 * g * t_rel ** 2;
}

/**
 * Generates action data for plotting action vs. control point
 * 
 * @param {number} pointIndex - Index of the control point to vary
 * @returns {Array} Array of {x, y} points for plotting
 */
function generateActionData(pointIndex) {
    const data = [];
    const initialY = yList[pointIndex];
    
    for (let cy = SLIDER_CONFIG.min; cy <= SLIDER_CONFIG.max; cy++) {
        yList[pointIndex] = cy;
        data.push({
            x: cy,
            y: calculateAction(yList)
        });
    }
    
    // Restore original value
    yList[pointIndex] = initialY;
    return data;
}

// ============================================================================
// ANIMATION SYSTEM
// ============================================================================

/**
 * Coordinate transformation functions
 */
function transformXCoord(x) {
    return 20 + x * (DIMENSIONS.CANVAS_WIDTH - 40) / 20;
}

function transformYCoord(y) {
    return DIMENSIONS.CANVAS_HEIGHT - (y + 500) * DIMENSIONS.CANVAS_HEIGHT / 1500;
}

/**
 * Projectile component class for animation
 * 
 * @param {number} width - Component width
 * @param {number} height - Component height
 * @param {string} color - Component color
 * @param {number} x - Initial x position
 * @param {number} y - Initial y position
 * @param {number} type - Component type (1: parameterized, 2: classical)
 */
function component(width, height, color, x, y, type) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.color = color;
    this.x = x;
    this.y = y;

    /**
     * Updates the projectile position based on time and trajectory type
     * 
     * @param {number} t - Current time
     */
    this.newPos = function(t) {
        if (this.type === 1) {
            // Parameterized trajectory
            this.y = calculateParameterizedTrajectory(t, yList);
        } else if (this.type === 2) {
            // Classical trajectory
            this.y = calculateClassicalTrajectory(t);
        }
    };
}

/**
 * Animation controller object
 */
const animArea = {
    parameterized_data: [],
    actual_data: [],
    time: 0,
    interval: null,
    
    /**
     * Starts the animation loop
     */
    start: function() {
        this.time = 0;
        this.parameterized_data = [];
        this.actual_data = [];
        this.interval = setInterval(updateFrame, ANIMATION_CONFIG.FRAME_RATE);
    },
    
    /**
     * Stops the animation loop
     */
    stop: function() {
        this.time = 0;
        this.parameterized_data = [];
        this.actual_data = [];
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
};

/**
 * Creates frames for animation and updates projectile positions
 */
function updateFrame() {
    animArea.time += PHYSICS_CONSTANTS.dt;

    // Update projectile positions
    param1D.newPos(animArea.time);
    actual1D.newPos(animArea.time);
    
    // Collect data for plotting
    animArea.parameterized_data.push({x: animArea.time, y: param1D.y});
    animArea.actual_data.push({x: animArea.time, y: actual1D.y});

    // Update position plot
    plotPosition(animArea.actual_data, animArea.parameterized_data);

    // End animation when t = 20
    if (animArea.time >= TIME_POINTS[TIME_POINTS.length - 1]) {
        endAnimation();
    }
}

/**
 * Starts the animation with initial projectile setup
 */
function startAnimation() {
    const { CANVAS_WIDTH, CANVAS_HEIGHT } = DIMENSIONS;
    const { y0 } = PHYSICS_CONSTANTS;
    
    // Create projectiles
    param1D = new component(10, 10, "orange", CANVAS_WIDTH/3, transformYCoord(y0), 1);
    actual1D = new component(10, 10, "purple", 2 * CANVAS_WIDTH/3, transformYCoord(y0), 2);
    
    // Update action display
    document.getElementById("print-action").innerHTML = Math.floor(calculateAction(yList));
    
    // Start animation
    animArea.start();
}

/**
 * Stops the animation
 */
function endAnimation() {
    animArea.stop();
}

// ============================================================================
// D3 VISUALIZATION AND PLOTTING
// ============================================================================

/**
 * Plot margins and dimensions for D3 visualizations
 */
const margin = { 
    top: 30, 
    right: 30, 
    bottom: 60, 
    left: 80 
};

// Calculate dimensions for larger graphs in new layout
const width = 500 - margin.left - margin.right;  // Larger width for better visibility
const height = 400 - margin.top - margin.bottom; // Larger height for better visibility

/**
 * Plots data on an existing plot using D3
 * 
 * @param {Object} input - Plot data object containing data, SVG, scales, etc.
 */
function plotData(input) {
    const { data, svg, line, xScale, yScale } = input;

  // Update the line
    const u = line.selectAll(".line").data([data], d => xScale(d.x));

  u.enter()
    .append("path")
    .attr("class", "line")
    .merge(u)
    .transition()
        .duration(ANIMATION_CONFIG.TRANSITION_TIME)
    .attr("d", d3.line()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y))
    )
    .attr("fill", "none")
    .attr("stroke-width", 1.5);
}

/**
 * Creates a D3 plot with axes and labels
 * 
 * @param {Object} input - Plot configuration object
 * @returns {Object} Object containing SVG, scales, and plot elements
 */
function createPlot(input) {
    // Check if the target element exists
    const targetElement = document.querySelector(input.divID);
    if (!targetElement) {
        return null;
    }
    
    // Create SVG element
    const svg = d3
    .select(input.divID)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("id", input.divID)
    .attr("class", "plot")
    .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    // Create scales
    const xScale = d3.scaleLinear()
        .domain([input.domain.lower, input.domain.upper])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([input.range.lower, input.range.upper])
        .range([height, 0]);
    
    // Add x-axis
  svg.append("g")
        .attr("transform", `translate(0, ${height})`)
    .attr("class", "myXaxis")
    .call(d3.axisBottom(xScale));

    // Add x-axis label
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width)
    .attr("y", height + margin.top + 20)
    .text(input.xLabel);

    // Add y-axis
  svg.append("g")
        .attr("class", "myYaxis")
    .call(d3.axisLeft(yScale));

    // Add y-axis label
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -margin.top)
        .text(input.yLabel);

    return { svg: svg, xScale: xScale, yScale: yScale };
}

/**
 * Creates and initializes the position plot
 */
function initializePositionPlot() {
const position_input = {
  divID: "#position-graph",
        domain: { lower: 0, upper: TIME_POINTS[TIME_POINTS.length - 1] },
  xLabel: "Time (s)",
        range: { lower: 0, upper: 200 },
        yLabel: "Height (m)"
    };
    
const position_plot = createPlot(position_input);
    
    // Create trajectory lines
    const x_actual_line = position_plot.svg.append("g")
        .attr("id", "x-actual-line")
        .attr("stroke", "black");
    
    const x_parameterized_line = position_plot.svg.append("g")
        .attr("id", "x-parameterized-line")
        .attr("stroke", "blue");
    
    // Create trajectory points
    const colors = ["red", "orange", "green", "blue", "purple"];
    const trajectoryPoints = [];
    
    for (let i = 1; i < yList.length - 1; i++) {
        const point = position_plot.svg.append("circle")
            .attr("id", "fixed-point")
            .attr("r", 3)
            .attr("fill", colors[i - 1])
            .attr("cx", position_plot.xScale(TIME_POINTS[i]))
            .attr("cy", position_plot.yScale(yList[i]));
        
        trajectoryPoints.push(point);
    }
    
    return {
        plot: position_plot,
        actualLine: x_actual_line,
        parameterizedLine: x_parameterized_line,
        points: trajectoryPoints
    };
}

/**
 * Updates the position plot with new trajectory data
 * 
 * @param {Array} actual - Actual trajectory data
 * @param {Array} parameterized - Parameterized trajectory data
 */
function plotPosition(actual, parameterized) {
    // Plot actual trajectory
    plotData({
        data: actual,
        svg: positionPlot.plot.svg,
        line: positionPlot.actualLine,
        xScale: positionPlot.plot.xScale,
        yScale: positionPlot.plot.yScale
    });
    
    // Plot parameterized trajectory
    plotData({
      data: parameterized,
        svg: positionPlot.plot.svg,
        line: positionPlot.parameterizedLine,
        xScale: positionPlot.plot.xScale,
        yScale: positionPlot.plot.yScale
    });
}

/**
 * Creates and initializes the action plot
 */
function initializeActionPlot() {
const integral_input = {
  divID: "#integral-graph",
        domain: { lower: SLIDER_CONFIG.min, upper: SLIDER_CONFIG.max },
  xLabel: "y1 (m)",
        range: { lower: -2500, upper: 10000 },
        yLabel: "Global Action (J.s)"
    };

const integral_plot = createPlot(integral_input);
const colors = ["red", "orange", "green", "blue", "purple"];

    // Create action lines and points
    const lines = [];
    const points = [];
    
    for (let i = 0; i < 5; i++) {
        const line = integral_plot.svg.append("g")
            .attr("id", `action-line-${i + 1}`)
            .attr("stroke", colors[i])
            .attr("visibility", i === 0 ? "visible" : "hidden");
        
        const point = integral_plot.svg.append("circle")
            .attr("id", `action-point-${i + 1}`)
            .attr("r", 3)
            .attr("fill", colors[i])
            .attr("visibility", i === 0 ? "visible" : "hidden");
        
        lines.push(line);
        points.push(point);
    }
    
    return {
        plot: integral_plot,
        lines: lines,
        points: points
    };
}

/**
 * Updates the action plot with new data
 */
function plotIntegral() {
  for (let i = 1; i <= 5; i++) {
        const data = generateActionData(i);
        plotData({
            data: data,
            svg: actionPlot.plot.svg,
            line: actionPlot.lines[i - 1],
            xScale: actionPlot.plot.xScale,
            yScale: actionPlot.plot.yScale
        });
    }
}

/**
 * Updates action plot points with current trajectory values
 */
function plotIntegralPoint() {
  for (let i = 1; i <= 5; i++) {
        if (i < yList.length) {
            actionPlot.points[i - 1].attr("cx", actionPlot.plot.xScale(yList[i]));
            actionPlot.points[i - 1].attr("cy", actionPlot.plot.yScale(calculateAction(yList)));
        }
    }
}

// ============================================================================
// EVENT HANDLERS AND UI CONTROLS
// ============================================================================


/**
 * Updates slider information and trajectory data
 * 
 * @param {number} pointIndex - Index of the trajectory point to update
 */
function updateSliderInfo(pointIndex) {
    const value = parseInt(document.getElementById(`y${pointIndex}-slider`).value);
    yList[pointIndex] = value;
    
    // Update display
    document.getElementById(`print-y${pointIndex}`).innerHTML = value;
    
    // Update trajectory points on position plot
    if (pointIndex < positionPlot.points.length + 1) {
        positionPlot.points[pointIndex - 1].attr("cy", positionPlot.plot.yScale(yList[pointIndex]));
    }
    
    // Restart animation
    endAnimation();
    startAnimation();
}


/**
 * Resets the trajectory to classical path values
 */
function resetToClassicalPath() {
    const classicalValue = 51; // Classical minimum value
    document.getElementById("y1-slider").value = classicalValue;
    updateSliderInfo(1);
    plotIntegral();
    plotIntegralPoint();
}

/**
 * Randomizes the y1 value
 */
function randomizeY1() {
    const randomValue = Math.floor(SLIDER_CONFIG.max * Math.random());
    document.getElementById("y1-slider").value = randomValue;
    updateSliderInfo(1);
    plotIntegral();
    plotIntegralPoint();
}

/**
 * Tutorial system state
 */
let tutorialState = {
    currentStep: 0,
    isActive: false,
    totalSteps: 10,  // Updated to include new interactive steps
    demonstrationTimer: null
};


/**
 * Starts the tutorial system
 */
function startTutorial() {
    tutorialState.isActive = true;
    tutorialState.currentStep = 0;
    
    const overlay = document.getElementById("tutorial-overlay");
    
    overlay.style.display = "block";
    
    showTutorialStep();
}

/**
 * Shows the current tutorial step
 */
function showTutorialStep() {
    const tutorialText = document.getElementById("tutorial-text");
    const stepContent = document.getElementById(`tutorial-step-${tutorialState.currentStep}`);
    
    // Clear any existing demonstration timer
    if (tutorialState.demonstrationTimer) {
        clearTimeout(tutorialState.demonstrationTimer);
        tutorialState.demonstrationTimer = null;
    }
    
    if (stepContent) {
        tutorialText.innerHTML = stepContent.innerHTML;
        
        // Handle interactive demonstration (step 4)
        if (tutorialState.currentStep === 4) {
            startDemonstration();
        }
    }
}

/**
 * Starts the interactive demonstration by changing y1 values
 */
function startDemonstration() {
    const slider = document.getElementById("y1-slider");
    if (!slider) return;
    
    const demoValues = [51, 100, 150, 0, 51]; // Start at classical, go high, higher, low, back to classical
    let demoIndex = 0;
    
    // Change values with delays
    function changeNextValue() {
        if (demoIndex < demoValues.length) {
            const value = demoValues[demoIndex];
            slider.value = value;
            
            // During demonstration, only update what's necessary (not full plot recalculation)
            yList[1] = value;
            document.getElementById("print-y1").innerHTML = value;
            
            // Update trajectory point position
            if (positionPlot && positionPlot.points && positionPlot.points[0]) {
                positionPlot.points[0].attr("cy", positionPlot.plot.yScale(value));
            }
            
            // Update action display and point position (lightweight operations)
            const actionValue = calculateAction(yList);
            document.getElementById("print-action").innerHTML = Math.floor(actionValue);
            
            if (actionPlot && actionPlot.points && actionPlot.points[0]) {
                actionPlot.points[0].attr("cx", actionPlot.plot.xScale(value));
                actionPlot.points[0].attr("cy", actionPlot.plot.yScale(actionValue));
            }
            
            // Restart animation to show new trajectory
    endAnimation();
    startAnimation();
            
            demoIndex++;
            
            if (demoIndex < demoValues.length) {
                tutorialState.demonstrationTimer = setTimeout(changeNextValue, 2000); // 2 second delay between changes
            }
        }
    }
    
    // Start after a brief pause to let user read the instructions
    tutorialState.demonstrationTimer = setTimeout(changeNextValue, 1500);
}

/**
 * Advances to the next tutorial step
 */
function nextTutorialStep() {
    if (tutorialState.currentStep < tutorialState.totalSteps - 1) {
        tutorialState.currentStep++;
        showTutorialStep();
    } else {
        endTutorial();
    }
}

/**
 * Ends the tutorial
 */
function endTutorial() {
    tutorialState.isActive = false;
    
    // Clear demonstration timer
    if (tutorialState.demonstrationTimer) {
        clearTimeout(tutorialState.demonstrationTimer);
        tutorialState.demonstrationTimer = null;
    }
    
    const overlay = document.getElementById("tutorial-overlay");
    
    overlay.style.display = "none";
}

/**
 * Initializes all event listeners
 */
function initializeEventListeners() {
    // Reset button (Classical Path)
    const resetButton = document.getElementById("reset-button");
    if (resetButton) {
        resetButton.onclick = resetToClassicalPath;
    }
    
    // Randomize button
    const randomizeButton = document.getElementById("randomize-button");
    if (randomizeButton) {
        randomizeButton.onclick = randomizeY1;
    }
    
    // Tutorial buttons
    const tutorialBtn = document.getElementById("show-tutorial-btn");
    if (tutorialBtn) {
        tutorialBtn.onclick = startTutorial;
    }
    
    const mainTutorialBtn = document.getElementById("start-tutorial-main");
    if (mainTutorialBtn) {
        mainTutorialBtn.onclick = startTutorial;
    }
    
    // Slider input
    const slider = document.getElementById("y1-slider");
    if (slider) {
        slider.oninput = function() {
  plotIntegral();
  plotIntegralPoint();
  updateSliderInfo(1);
        };
    }
    
    // Tutorial controls
    const tutorialNext = document.getElementById("tutorial-next");
    if (tutorialNext) {
        tutorialNext.onclick = nextTutorialStep;
    }
    
    const tutorialSkip = document.getElementById("tutorial-skip");
    if (tutorialSkip) {
        tutorialSkip.onclick = endTutorial;
    }
}

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

/**
 * Initializes the entire application
 */
function initializeApp() {
    try {
        // Check if D3 is loaded
        if (typeof d3 === 'undefined') {
            console.error("D3.js is not loaded!");
            return;
        }
        
        // Check if required elements exist
        const positionGraph = document.getElementById("position-graph");
        const integralGraph = document.getElementById("integral-graph");
        
        if (!positionGraph || !integralGraph) {
            console.error("Required graph elements not found!");
            return;
        }
        
        // Initialize trajectory data from slider
        initializeTrajectoryData();
        
        // Initialize plots
        window.positionPlot = initializePositionPlot();
        window.actionPlot = initializeActionPlot();
        
        // Initialize event listeners
        initializeEventListeners();
        
        // Defer expensive plot calculations to avoid blocking page load
        setTimeout(() => {
            plotIntegral();
            plotIntegralPoint();
        }, 100);
        
        // Start animation
        startAnimation();
        
    } catch (error) {
        console.error("Error initializing applet:", error);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

