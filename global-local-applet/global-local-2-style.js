/**
 * Global-Local Action Minimization Applet - Page 2
 * 
 * This page demonstrates varying y1 while y2-y5 are fixed at random values.
 * 
 * @author Isabel Godoy, Ashley Kim, Brian Shuve, 2023
 */

// ============================================================================
// CONFIGURATION AND CONSTANTS
// ============================================================================

const PHYSICS_CONSTANTS = {
    g: 2,
    m: 1,
    y0: 0,
    dt: 0.02
};

const DIMENSIONS = {
    CANVAS_WIDTH: 170,
    CANVAS_HEIGHT: 280,
    SVG_WIDTH: 360,
    SVG_HEIGHT: 360
};

const ANIMATION_CONFIG = {
    TRANSITION_TIME: 10,
    FRAME_RATE: 0.1
};

const TIME_POINTS = [0, 3, 6, 10, 14, 17, 20];

const SLIDER_CONFIG = {
    min: 0,
    max: 200,
    initialValue: 0
};

// Initialize with random y2-y5 values
let y2, y3, y4, y5;
let yList;
let yAtT1; // Optimal y1 value

function initializeRandomValues() {
    y2 = Math.floor(SLIDER_CONFIG.max * Math.random());
    y3 = Math.floor(SLIDER_CONFIG.max * Math.random());
    y4 = Math.floor(SLIDER_CONFIG.max * Math.random());
    y5 = Math.floor(SLIDER_CONFIG.max * Math.random());
    
    const slider = document.getElementById("y1-slider");
    const y1Value = slider ? parseInt(slider.value) : SLIDER_CONFIG.initialValue;
    
    yList = [0, y1Value, y2, y3, y4, y5, 0];
    
    // Update display
    const y2El = document.getElementById("y2");
    const y3El = document.getElementById("y3");
    const y4El = document.getElementById("y4");
    const y5El = document.getElementById("y5");
    if (y2El) y2El.innerHTML = y2;
    if (y3El) y3El.innerHTML = y3;
    if (y4El) y4El.innerHTML = y4;
    if (y5El) y5El.innerHTML = y5;
    
    // Calculate optimal y1 based on y2
    const { g } = PHYSICS_CONSTANTS;
    yAtT1 = 0 + ((y2 - 0 + 0.5 * g * (6 - 0) ** 2) / (6 - 0)) * (3 - 0) - 0.5 * g * (3 - 0) ** 2;
    
    // Update tutorial answer
    const tutorialYAtT1 = document.getElementById("tutorial-y-at-t1");
    if (tutorialYAtT1) {
        tutorialYAtT1.innerHTML = yAtT1.toFixed(0);
    }
}

// ============================================================================
// PHYSICS CALCULATIONS
// ============================================================================

function calculateAction(yList) {
    const { g, m } = PHYSICS_CONSTANTS;
    let ki = 0;
    let pi = 0;
    
    for (let i = 1; i < yList.length; i++) {
        const kConst = (yList[i] - yList[i-1] + 0.5 * g * (TIME_POINTS[i] - TIME_POINTS[i-1]) ** 2) / 
                      (TIME_POINTS[i] - TIME_POINTS[i-1]);
        ki += (kConst - g * (TIME_POINTS[i] - TIME_POINTS[i-1])) ** 3 - kConst ** 3;
        
        const pConst = (yList[i] - yList[i-1] + 0.5 * g * (TIME_POINTS[i] - TIME_POINTS[i-1]) ** 2) / 
                       (TIME_POINTS[i] - TIME_POINTS[i-1]);
        pi += yList[i-1] * TIME_POINTS[i] + 
              pConst * (TIME_POINTS[i] - TIME_POINTS[i-1]) ** 2 / 2 - 
              g * (TIME_POINTS[i] - TIME_POINTS[i-1]) ** 3 / 6 - 
              yList[i-1] * TIME_POINTS[i-1];
    }
    
    return -m * ki / (6 * g) - m * g * pi;
}

function calculateClassicalTrajectory(t, T = 20) {
    const { g } = PHYSICS_CONSTANTS;
    return 0.5 * g * t * (T - t);
}

function calculateParameterizedTrajectory(t, yList) {
    const { g } = PHYSICS_CONSTANTS;
    
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
    
    return yList[i-1] + 
           ((yList[i] - yList[i-1] + 0.5 * g * (TIME_POINTS[i] - TIME_POINTS[i-1]) ** 2) / 
            (TIME_POINTS[i] - TIME_POINTS[i-1])) * (t - TIME_POINTS[i-1]) - 
           0.5 * g * (t - TIME_POINTS[i-1]) ** 2;
}

function transformYCoord(y) {
    const { CANVAS_HEIGHT } = DIMENSIONS;
    return CANVAS_HEIGHT - (y + 500) * CANVAS_HEIGHT / 1500;
}

// ============================================================================
// ANIMATION
// ============================================================================

function component(width, height, color, x, y, type) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.color = color;
    this.x = x;
    this.y = y;

    this.newPos = function(t) {
        if (this.type === 1) {
            this.y = calculateParameterizedTrajectory(t, yList);
        } else if (this.type === 2) {
            this.y = calculateClassicalTrajectory(t);
        }
    };
}

const animArea = {
    parameterized_data: [],
    actual_data: [],
    time: 0,
    interval: null,
    
    start: function() {
        this.time = 0;
        this.parameterized_data = [];
        this.actual_data = [];
        this.interval = setInterval(updateFrame, ANIMATION_CONFIG.FRAME_RATE);
    },
    
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

let param1D, actual1D;

function updateFrame() {
    animArea.time += PHYSICS_CONSTANTS.dt;

    param1D.newPos(animArea.time);
    actual1D.newPos(animArea.time);
    
    animArea.parameterized_data.push({x: animArea.time, y: param1D.y});
    animArea.actual_data.push({x: animArea.time, y: actual1D.y});

    plotPosition(animArea.actual_data, animArea.parameterized_data);

    if (animArea.time >= TIME_POINTS[TIME_POINTS.length - 1]) {
        endAnimation();
    }
}

function startAnimation() {
    const { CANVAS_WIDTH, CANVAS_HEIGHT } = DIMENSIONS;
    const { y0 } = PHYSICS_CONSTANTS;
    
    param1D = new component(10, 10, "orange", CANVAS_WIDTH/3, transformYCoord(y0), 1);
    actual1D = new component(10, 10, "purple", 2 * CANVAS_WIDTH/3, transformYCoord(y0), 2);
    
    document.getElementById("print-action").innerHTML = Math.floor(calculateAction(yList));
    
    animArea.start();
}

function endAnimation() {
    animArea.stop();
}

// ============================================================================
// D3 VISUALIZATION
// ============================================================================

const margin = { top: 30, right: 30, bottom: 60, left: 80 };
const width = 500 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

function plotData(input) {
    const { data, svg, line, xScale, yScale } = input;

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

function createPlot(input) {
    const targetElement = document.querySelector(input.divID);
    if (!targetElement) {
        return null;
    }
    
    const svg = d3
        .select(input.divID)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("id", input.divID)
        .attr("class", "plot")
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    const xScale = d3.scaleLinear()
        .domain([input.domain.lower, input.domain.upper])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([input.range.lower, input.range.upper])
        .range([height, 0]);
    
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .attr("class", "myXaxis")
        .call(d3.axisBottom(xScale));

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + margin.top + 20)
        .text(input.xLabel);

    svg.append("g")
        .attr("class", "myYaxis")
        .call(d3.axisLeft(yScale));

    svg.append("text")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -margin.top)
        .text(input.yLabel);
    
    return { svg: svg, xScale: xScale, yScale: yScale };
}

let positionPlot, actionPlot;

function initializePositionPlot() {
    const position_input = {
        divID: "#position-graph",
        domain: { lower: 0, upper: TIME_POINTS[TIME_POINTS.length - 1] },
        xLabel: "Time (s)",
        range: { lower: 0, upper: 200 },
        yLabel: "Height (m)"
    };
    
    const plot = createPlot(position_input);
    
    const x_actual_line = plot.svg.append("g")
        .attr("id", "x-actual-line")
        .attr("stroke", "black");
    
    const x_parameterized_line = plot.svg.append("g")
        .attr("id", "x-parameterized-line")
        .attr("stroke", "blue");
    
    const colors = ["red", "orange", "green", "blue", "purple"];
    const trajectoryPoints = [];
    
    for (let i = 1; i < yList.length - 1; i++) {
        const point = plot.svg.append("circle")
            .attr("id", "fixed-point")
            .attr("r", 3)
            .attr("fill", colors[i - 1])
            .attr("cx", plot.xScale(TIME_POINTS[i]))
            .attr("cy", plot.yScale(yList[i]));
        
        trajectoryPoints.push(point);
    }
    
    return {
        plot: plot,
        actualLine: x_actual_line,
        parameterizedLine: x_parameterized_line,
        points: trajectoryPoints
    };
}

function plotPosition(actual, parameterized) {
    if (!positionPlot || !positionPlot.plot) {
        return; // Position plot not initialized yet
    }
    
    plotData({
        data: actual,
        svg: positionPlot.plot.svg,
        line: positionPlot.actualLine,
        xScale: positionPlot.plot.xScale,
        yScale: positionPlot.plot.yScale
    });
    
    plotData({
        data: parameterized,
        svg: positionPlot.plot.svg,
        line: positionPlot.parameterizedLine,
        xScale: positionPlot.plot.xScale,
        yScale: positionPlot.plot.yScale
    });
}

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

    const lines = [];
    const points = [];
    
    for (let i = 0; i < 5; i++) {
        const line = integral_plot.svg.append("g")
            .attr("id", `action-line-${i+1}`)
            .attr("stroke", colors[i])
            .attr("visibility", i === 0 ? "visible" : "hidden");
        
        const point = integral_plot.svg.append("circle")
            .attr("id", `action-point-${i+1}`)
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
    
    yList[pointIndex] = initialY;
    return data;
}

function plotIntegral() {
    if (!actionPlot || !actionPlot.plot) {
        return; // Action plot not initialized yet
    }
    
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

function plotIntegralPoint() {
    if (!actionPlot || !actionPlot.plot) {
        return; // Action plot not initialized yet
    }
    
    for (let i = 1; i <= 5; i++) {
        if (i < yList.length && actionPlot.points[i - 1]) {
            actionPlot.points[i - 1].attr("cx", actionPlot.plot.xScale(yList[i]));
            actionPlot.points[i - 1].attr("cy", actionPlot.plot.yScale(calculateAction(yList)));
        }
    }
}

// ============================================================================
// TUTORIAL SYSTEM
// ============================================================================

let tutorialState = {
    currentStep: 0,
    isActive: false,
    totalSteps: 7
};

function startTutorial() {
    tutorialState.isActive = true;
    tutorialState.currentStep = 0;
    
    const overlay = document.getElementById("tutorial-overlay");
    if (overlay) {
        overlay.style.display = "block";
    }
    
    showTutorialStep();
}

function showTutorialStep() {
    const tutorialText = document.getElementById("tutorial-text");
    const stepContent = document.getElementById(`tutorial-step-${tutorialState.currentStep}`);
    
    if (stepContent && tutorialText) {
        tutorialText.innerHTML = stepContent.innerHTML;
    }
}

function nextTutorialStep() {
    if (tutorialState.currentStep < tutorialState.totalSteps - 1) {
        tutorialState.currentStep++;
        showTutorialStep();
    } else {
        endTutorial();
    }
}

function endTutorial() {
    tutorialState.isActive = false;
    
    const overlay = document.getElementById("tutorial-overlay");
    if (overlay) {
        overlay.style.display = "none";
    }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

function updateSliderInfo(pointIndex) {
    const slider = document.getElementById(`y${pointIndex}-slider`);
    if (!slider) return;
    
    const value = parseInt(slider.value);
    yList[pointIndex] = value;
    
    document.getElementById(`print-y${pointIndex}`).innerHTML = value;
    
    if (positionPlot && pointIndex < positionPlot.points.length + 1 && positionPlot.points[pointIndex - 1]) {
        positionPlot.points[pointIndex - 1].attr("cy", positionPlot.plot.yScale(yList[pointIndex]));
    }
    
    endAnimation();
    startAnimation();
}

function resetToMinimumAction() {
    const slider = document.getElementById("y1-slider");
    if (slider) {
        slider.value = yAtT1;
        updateSliderInfo(1);
    }
    
    setTimeout(() => {
        plotIntegral();
        plotIntegralPoint();
    }, 100);
}

function randomizeY1() {
    window.location.reload();
}

function initializeEventListeners() {
    const resetButton = document.getElementById("reset-button");
    if (resetButton) {
        resetButton.onclick = resetToMinimumAction;
    }
    
    const randomizeButton = document.getElementById("randomize-button");
    if (randomizeButton) {
        randomizeButton.onclick = randomizeY1;
    }
    
    const tutorialBtn = document.getElementById("start-tutorial-main");
    if (tutorialBtn) {
        tutorialBtn.onclick = startTutorial;
    }
    
    const tutorialNext = document.getElementById("tutorial-next");
    if (tutorialNext) {
        tutorialNext.onclick = nextTutorialStep;
    }
    
    const tutorialSkip = document.getElementById("tutorial-skip");
    if (tutorialSkip) {
        tutorialSkip.onclick = endTutorial;
    }
    
    const slider = document.getElementById("y1-slider");
    if (slider) {
        slider.oninput = function() {
            plotIntegral();
            plotIntegralPoint();
            updateSliderInfo(1);
        };
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function initializeApp() {
    try {
        if (typeof d3 === 'undefined') {
            console.error("D3.js is not loaded!");
            return;
        }
        
        const positionGraph = document.getElementById("position-graph");
        const integralGraph = document.getElementById("integral-graph");
        
        if (!positionGraph || !integralGraph) {
            console.error("Required graph elements not found!");
            return;
        }
        
        initializeRandomValues();
        
        positionPlot = initializePositionPlot();
        actionPlot = initializeActionPlot();
        window.positionPlot = positionPlot;
        window.actionPlot = actionPlot;
        
        initializeEventListeners();
        
        // Start animation after plots are ready
        setTimeout(() => {
            plotIntegral();
            plotIntegralPoint();
            // Only start animation after plots are initialized
            if (positionPlot && actionPlot) {
                startAnimation();
            }
        }, 100);
        
    } catch (error) {
        console.error("Error initializing applet:", error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});
