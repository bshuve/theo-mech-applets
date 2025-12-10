/**
 * Global-Local Action Minimization Applet - Page 4
 * 
 * This page allows full control over all y1-y5 points with checkboxes to show/hide action plots.
 * 
 * @author Isabel Godoy, Ashley Kim, Michael Mumo, Brian Shuve, 2025
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
    max: 200
};

// Global classical path values
const CLASSICAL_VALUES = [0, 51, 84, 100, 84, 51, 0];

let yList;

function initializeRandomValues() {
    const max_y = SLIDER_CONFIG.max;
    const y1 = Math.floor(max_y * Math.random());
    const y2 = Math.floor(max_y * Math.random());
    const y3 = Math.floor(max_y * Math.random());
    const y4 = Math.floor(max_y * Math.random());
    const y5 = Math.floor(max_y * Math.random());
    
    yList = [0, y1, y2, y3, y4, y5, 0];
    
    // Update sliders and displays
    for (let i = 1; i <= 5; i++) {
        const slider = document.getElementById(`y${i}-slider`);
        const display = document.getElementById(`print-y${i}`);
        if (slider) {
            slider.value = yList[i];
        }
        if (display) {
            display.innerHTML = yList[i];
        }
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
        }
    };
}

const animArea = {
    parameterized_data: [],
    time: 0,
    interval: null,
    
    start: function() {
        this.time = 0;
        this.parameterized_data = [];
        this.interval = setInterval(updateFrame, ANIMATION_CONFIG.FRAME_RATE);
    },
    
    stop: function() {
        this.time = 0;
        this.parameterized_data = [];
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
};

let param1D;

function updateFrame() {
    animArea.time += PHYSICS_CONSTANTS.dt;

    param1D.newPos(animArea.time);
    
    animArea.parameterized_data.push({x: animArea.time, y: param1D.y});

    if (positionPlot && positionPlot.plot) {
        plotPosition(animArea.parameterized_data);
    }

    if (animArea.time >= TIME_POINTS[TIME_POINTS.length - 1]) {
        endAnimation();
    }
}

function startAnimation() {
    const { CANVAS_WIDTH, CANVAS_HEIGHT } = DIMENSIONS;
    const { y0 } = PHYSICS_CONSTANTS;
    
    param1D = new component(10, 10, "orange", CANVAS_WIDTH/3, transformYCoord(y0), 1);
    
    const actionDisplay = document.getElementById("print-action");
    if (actionDisplay) {
        actionDisplay.innerHTML = Math.floor(calculateAction(yList));
    }
    
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
    
    // Only parameterized line for page 4
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
        parameterizedLine: x_parameterized_line,
        points: trajectoryPoints
    };
}

function plotPosition(parameterized) {
    if (!positionPlot || !positionPlot.plot) {
        return;
    }
    
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
        xLabel: "y coord (m)",
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
        return;
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
        return;
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
    
    const display = document.getElementById(`print-y${pointIndex}`);
    if (display) {
        display.innerHTML = value;
    }
    
    if (positionPlot && pointIndex < positionPlot.points.length + 1 && positionPlot.points[pointIndex - 1]) {
        positionPlot.points[pointIndex - 1].attr("cy", positionPlot.plot.yScale(yList[pointIndex]));
    }
    
    endAnimation();
    startAnimation();
}

function setGlobalClassicalPath() {
    for (let i = 1; i <= 5; i++) {
        const slider = document.getElementById(`y${i}-slider`);
        if (slider) {
            slider.value = CLASSICAL_VALUES[i];
            updateSliderInfo(i);
        }
    }
    
    setTimeout(() => {
        plotIntegral();
        plotIntegralPoint();
    }, 100);
}

function randomizeAll() {
    initializeRandomValues();
    
    // Update plots
    for (let i = 1; i <= 5; i++) {
        if (positionPlot && positionPlot.points[i - 1]) {
            positionPlot.points[i - 1].attr("cy", positionPlot.plot.yScale(yList[i]));
        }
    }
    
    setTimeout(() => {
        plotIntegral();
        plotIntegralPoint();
        endAnimation();
        startAnimation();
    }, 100);
}

function toggleActionPlot(index) {
    const checkbox = document.getElementById(`show-action-${index}`);
    if (!checkbox || !actionPlot) return;
    
    const isVisible = checkbox.value === "on";
    const newVisibility = isVisible ? "hidden" : "visible";
    const newValue = isVisible ? "off" : "on";
    
    checkbox.value = newValue;
    actionPlot.lines[index - 1].attr("visibility", newVisibility);
    actionPlot.points[index - 1].attr("visibility", newVisibility);
}

function initializeEventListeners() {
    const resetButton = document.getElementById("reset-button");
    if (resetButton) {
        resetButton.onclick = setGlobalClassicalPath;
    }
    
    const randomizeButton = document.getElementById("randomize-button");
    if (randomizeButton) {
        randomizeButton.onclick = randomizeAll;
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
    
    // Set up sliders
    for (let i = 1; i <= 5; i++) {
        const slider = document.getElementById(`y${i}-slider`);
        if (slider) {
            slider.oninput = function() {
                plotIntegral();
                plotIntegralPoint();
                updateSliderInfo(i);
            };
        }
    }
    
    // Set up checkboxes
    for (let i = 1; i <= 5; i++) {
        const checkbox = document.getElementById(`show-action-${i}`);
        if (checkbox) {
            checkbox.onchange = function() {
                toggleActionPlot(i);
            };
        }
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
        
        setTimeout(() => {
            plotIntegral();
            plotIntegralPoint();
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

