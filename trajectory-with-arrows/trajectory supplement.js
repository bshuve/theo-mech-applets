/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const hiPPICanvas = createHiPPICanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
const originalPanel = document.getElementById("projectile-motion-canvas");
originalPanel.replaceWith(hiPPICanvas);
hiPPICanvas.id = ("projectile-motion-canvas");
const TRANSITION_TIME = 10; // ms
const m = 1; //kg
const dt = 0.0025;
const FRAME_RATE = 0.01; // ms
const x_initial = 20;
const y_initial = 100;
const h_i = 1; // height_i when t=0
const g = 9.8;
/* In this example, time is parameterized from -sqrt(2*h_i/g)
to sqrt(2*h_i/g), so we will set the initial time to -sqrt(2*h_i/g) */
const start_time = -Math.sqrt(2 * h_i / g);
const end_time = Math.sqrt(2 * h_i / g);
const p_initial = parseInt(document.getElementById("p-slider").value);
const range_p = parseInt(document.getElementById("p-slider").max);

/////////////////////////////////////////////////
/* CANVAS ANIMATIONS */
/////////////////////////////////////////////////

/* This is the function we call to start an animation (in this case,
when the slider is moved on the HTML page). We want to create new projectiles
that follow a path with the given p value and then start the animation */

function startAnimation(p) {

    // Create component used to animate trajectory

    /* the 6th argument is an integer indicating the 'type' of plot. It is 1 for the
       1D animation and 2 for the 2D animation

       the 'param' animations include the effects of p whereas the 'actual' animations
       show the physical trajectory when p = 0
    */
    param2D = new component(3, 3, "#FE6100", 2, p);
    animArea.start();
    param2D.generateTrajectory();
    for (t = start_time; t <= end_time; t += (end_time - start_time) / 10) {
        param2D.drawArrow(t);
    }
    param2D.writeValues();

}


/* Canvases plot pixel by pixel on an x-y grid where the origin is
the upper left corner. To make things more convenient for us, we will
create transformation functions to allow us to work in a more normal
convenient coordinate systems (maybe have the origin in the center of
the canvas for example. These functions should take in coordinates in your
coordinate system and transform them into the Canvas coordinate system
Remember that the canvas x coordinate increases from left to right (which is normal),
but the y coordinates increase from top to bottom (which is the opposite
of cartesian coordinates) */

function transformXCoord(x) {
    return (x_initial + 275) + (CANVAS_WIDTH * (x)) / 1.1;
}

// parameterized coord -> canvas coord
function transformYCoord(y) {
    return CANVAS_HEIGHT - y_initial - y * (CANVAS_HEIGHT / 1.5 - 2 * x_initial) / (2 * range_p / 100);
}

/* This is the bulk of the information for the canvases. The animArea variable
is an Object in JavaScript (similar to a hashmap or a dictionary in Python).
We can define variables and functions inside it */

var animArea = {

    panel2: hiPPICanvas,
    start: function () {
        /* This "context" thing is just what you use to actually
        render the 2D image drawing on the canvas
        Follow the code and it should not be a problem! */
        this.context = this.panel2.getContext("2d");
        this.context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        this.time = start_time;
        // add text and ground to panel
        this.context.font = "18px Verdana";
        this.context.fillText("Height vs Time", 10, 30);
        this.context.fillStyle = "black";
        this.context.fillRect(x_initial, transformYCoord(-0.05), CANVAS_WIDTH - 40, 3);
    },
}

/* This component thing is similar to defining a class in Python or Java.
We use it to create the objects that will move in our animation */

function component(width, height, color, type, p) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.color = color;
    this.p = p;
    let rectangles = [];
    //This creates the trajectory for the path and then draws it. 
    //It stores all the retangles on the path in an array and then draws each of the rectangles.
    this.generateTrajectory = function () {
        rectangles = [];
        for (let t2 = start_time; t2 <= end_time; t2 += dt) {
            rectangles.push({
                x: transformXCoord(t2),
                y: transformYCoord((h_i - (1 / 2) * g * t2 ** 2) + p * (h_i * Math.cos(Math.PI / 2 * t2 / start_time))),
                width: this.width,
                height: this.height,
                color: this.color
            });
        }
        const drawRectangle = (x, y, width, height, color) => {
            ctx = animArea.context
            ctx.fillStyle = color;
            ctx.fillRect(x, y, width, height);
        }
        for (let rectangle of rectangles) {
            drawRectangle(rectangle.x, rectangle.y, rectangle.width, rectangle.height, rectangle.color);
        }
    }
    //This draws the arrow on the path for a given t.
    this.drawArrow = function (t) {
        arrowX = transformXCoord(t);
        arrowY = transformYCoord((h_i - (1 / 2) * g * t ** 2) + p * (h_i * Math.cos(Math.PI / 2 * t / start_time)));
        tempAccel = calculateAccel(this.p, t) * 2.5;
        tempForceMass = -9.8 * 2.5;
        canvas_arrow(animArea.context, arrowX, arrowY, arrowX, arrowY - tempAccel);
        canvas_arrow2(animArea.context, arrowX, arrowY, arrowX, arrowY - tempForceMass);
        animArea.context.fillStyle = "black";
    }
    //This writes the values 
    this.writeValues = function() {
        animArea.context.font = "18px Verdana";
        animArea.context.fillText("F/m: -9.8 m/s^2", 10, 350);
        animArea.context.fillText("Acceleration at peak:" + calculateAccel(this.p, 0).toFixed(4) + " m/s^2" , 10, 390);
        animArea.context.fillText("Action:" + computeAction(this.p).toFixed(4) + " J.s", 350, 350);
    }
}

//calculates acceleration for a given p and time. 
function calculateAccel(p, t) {
    return -g - p * ((Math.PI / 2 * 1 / start_time) ** 2) * Math.cos(Math.PI / 2 * t / start_time);
}

// run animation on load
startAnimation(p_initial);


//https://stackoverflow.com/questions/808826/drawing-an-arrow-using-html-canvas
//this draws an arrow on the canvas from one point to another point. This is for accel arrow.
function canvas_arrow(context, fromx, fromy, tox, toy) {
    var headlen = 10; // length of head in pixels
    var dx = tox - fromx;
    var dy = toy - fromy;
    var angle = Math.atan2(dy, dx);
    context.beginPath();
    context.strokeStyle = "#D81B60";
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    context.stroke();
}
//same as above but in blue. This is for F/m arrow.
function canvas_arrow2(context, fromx, fromy, tox, toy) {
    var headlen = 10; // length of head in pixels
    var dx = tox - fromx;
    var dy = toy - fromy;
    var angle = Math.atan2(dy, dx);
    context.beginPath();
    context.strokeStyle = "#1E88E5";
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    context.stroke();
}


//https://stackoverflow.com/questions/15661339/how-do-i-fix-blurry-text-in-my-html5-canvas
//this fixes blurry text on canvas. 
function createHiPPICanvas(width, height) {
    const ratio = window.devicePixelRatio;
    const canvas = document.createElement("canvas");
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.getContext("2d").scale(ratio, ratio);
    return canvas;
}

/////////////////////////////////////////////////
/* ACTION CALCULATION */
/////////////////////////////////////////////////

// Function to compute the Lagrangian at a given time t and parameter p
function Lagrangian(t, p) {
    // Calculate height h(t)
    const h = h_i - 0.5 * g * t * t + p * h_i * Math.cos((Math.PI / 2) * (t / start_time));
    
    // Calculate velocity dh/dt
    const v = -g * t - (p * h_i * Math.PI / (2 * start_time)) * Math.sin((Math.PI / 2) * (t / start_time));
    
    // Kinetic energy T = (1/2)mv^2
    const T = 0.5 * m * v * v;
    
    // Potential energy U = mgh
    const U = m * g * h;
    
    // Lagrangian L = T - U
    return T - U;
}

// Function to compute the action S for a given p using numerical integration
function computeAction(p) {
    const numIntervals = 10000;  // Number of intervals for numerical integration
    const deltaT = (end_time - start_time) / numIntervals;
    let S = 0;
    
    // First value of Lagrangian
    let L_prev = Lagrangian(start_time, p);
    
    for (let i = 1; i <= numIntervals; i++) {
        const t_current = start_time + i * deltaT;
        const L_current = Lagrangian(t_current, p);
        
        // Trapezoidal rule integration
        S += (L_prev + L_current) * deltaT / 2;
        L_prev = L_current;
    }
    
    return S;
}

/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

/* This section holds the functions that I call when something happens
on the HTML page (ex. button click, slider change, etc). For example, when the slider
is moved, I want to update the parameter p, change the print- entry that HTML uses to print 
the current value of p, stop the old animation and restart with the new value of p */

document.getElementById("p-slider").oninput = function () {
    // get new parameter p
    let p = parseInt(document.getElementById("p-slider").value) / 100;
    document.getElementById("print-p").innerHTML = p.toFixed(2);
    startAnimation(p);

}

var showAnswer1 = false;
document.getElementById("show-q1").addEventListener("click", function () {
    if (!showAnswer1) {
        showAnswer1 = true;
        document.getElementById("show-q1").innerHTML = "Hide Answer";
        document.getElementById("answer1").style.display = "block";
    } else {
        showAnswer1 = false;
        document.getElementById("show-q1").innerHTML = "Show Answer";
        document.getElementById("answer1").style.display = "none";
    }
});

var showAnswer2 = false;
document.getElementById("show-q2").addEventListener("click", function () {
    if (!showAnswer2) {
        showAnswer2 = true;
        document.getElementById("show-q2").innerHTML = "Hide Answer";
        document.getElementById("answer2").style.display = "block";
    } else {
        showAnswer2 = false;
        document.getElementById("show-q2").innerHTML = "Show Answer";
        document.getElementById("answer2").style.display = "none";
    }
});