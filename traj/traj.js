// Parameters
const CANVAS_WIDTH_1 = 170; // width of 1D parameterized paths animation canvas
const CANVAS_WIDTH_2 = 380; // width of 2D parameterized paths animation canvas - bigger because here there is an x component
const CANVAS_HEIGHT = 280;  // height of both 1D and 2D parameterized animations
const SVG_WIDTH = 360;
const SVG_HEIGHT = 360;
const TRANSITION_TIME = 10;
const FRAME_RATE = 10;
const dt = 0.005;   // time intervals for calculating position
const h_i = 1;  // initial height of body
const g = 9.8;  // gravitiational constant
const m = 1;    // mass of body
const end_time = Math.sqrt(2*h_i/g);    // this I don't fully understand yet
const x_initial = 20;   // starting x position of parameterized body
const y_initial = 100;  // starting y position of parameterized body
const p_intial = parseInt(document.getElementById("p-slider").value);   // initial value of p from slider (0)
const range_pmin = parseInt(document.getElementById("p-slider").min);   // minimum value on slider (-100)
const range_pmax = parseInt(document.getElementById("p-slider").max);   // maximum value on slider (100)


/**
 * Creates objects of parameterized paths and calls functions to draw their animations
 * @param {number} p 
 */
function startAnimation(p) {
    param1D = new component(10, 10, "orange", 2.*CANVAS_WIDTH_1/3, y_initial, 1, p);    // 1 is the parameterized 1D path
    actual1D = new component(10, 10, "purple", 1*CANVAS_WIDTH_1/3, y_initial, 2, p);    // 2 is the classical 1D path

    param2D = new component(3, 3, "orange", x_initial, y_initial, 3, p);    // 3 is the parameterized 2D path
    actual2D = new component(3, 3, "purple", x_initial, y_initial, 4, p);   // 4 is the classical 2D path

    AnimArea.start();
}


function endAnimation() {
    AnimArea.stop();
}



/**
 * Finds x coordinate to draw on
 * @param {number} x - parametrized x coordinate
 * @returns canvas x coordinate to draw on
 */
function transformXCoord(x) {
    return (x_initial + 168) + (CANVAS_WIDTH_2 * (x)) / 1.2;
}

/**
 * Finds y coordinate to draw on
 * @param {number} x - parametrized y coordinate
 * @returns canvas y coordinate to draw on
 */
function transformYCoord(y) {
    return CANVAS_HEIGHT - y_initial - y * (CANVAS_HEIGHT/2 - 2 * x_initial) / (2 * range_p/100);
}

// AnimArea is the animation space that has functions to draw, erase and stop drawing
class AnimArea {
    constructor(){
        // uses ids to grab the 2 canvases from html
        this.panel1 = document.getElementById("projectile-motion-canvas-1");
        this.panel2 = document.getElementById("projectile-motion-canvas-2");
    }
    // starts drawing of parameterized paths
    start() {
        this.panel1.width = CANVAS_WIDTH_1;
        this.panel1.height = CANVAS_HEIGHT;
        this.context1 = this.panel1.getContext("2d");

        this.panel2.width = CANVAS_WIDTH_2;
        this.panel2.height = CANVAS_HEIGHT;
        this.context2 = this.panel2.getContext("2d");

        this.time = -end_time;

        this.interval = setInterval(updateFrame, FRAME_RATE);   // calls update fram at FRAME_RATE to draw new positions of body

        this.context1.font = "18px Verdana";
        this.context1.fillStyle = "black";
        this.context1.fillText("Projectile Motion", 10, 30);
        this.context1.fillRect(x_initial, transformYCoord(-0.05), CANVAS_WIDTH_1-40, 3);

        this.context2.font = "18px Verdana";
        this.context2.fillStyle = "black";
        this.context2.fillText("Height vs Time", 10, 30);
        this.context2.fillRect(x_initial, transformYCoord(-0.05), CANVAS_WIDTH_2-40,3)
    }
    // erases all of the 1D parameterized canvas and draws back the x axis and label
    clear() {
        this.context1.clearRect(0, 0, this.panel1.width, this.panel1.height);
        this.context1.font = "18px Verdana";
        this.context1.fillStyle = "black";
        this.context1.fillText("Projectile Motion", 10, 30);
        this.context1.fillRect(x_initial, transformYCoord(-0.05), CANVAS_WIDTH_1-40, 3);
    }
    
    stop() {
        this.time = -end_time;
        clearInterval(this.interval);
    }
}

// class Component model a points on the parameterized paths
class Component {
    constructor(width, height, color, x, y, type, p) {
        this.width = width;
        this.height = height;
        this.color = color;
        this.x = x;
        this.y = y;
        this.type = type;
        this.p = p;
    }

    update() {
        var ctx;
        if (this.type == 1 || this.type == 2 ) {ctx = AnimArea.context1;}
        else {ctx = AnimArea.context2;}
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    newPos(t) {
        if (type == 1) {
            this.y = transformYCoord((1 + this.p) * (h_i - (1/2) * g * t ** 2));
        } else if (this.type == 2) {
            t += end_time
            this.y = transformYCoord(Math.sqrt(2*g*h_i) * (h_i + this.p) * t - (1/2) * g * t ** 2); // Math.sqrt(2*g*ho) is the factor to make ho and vo equal for classical and alternate path
        } else if (this.type == 3) {
            this.x = transformXCoord(t);
            this.y = transformYCoord((1 + this.p) * (h_i - (1/2) * g * t ** 2));
	    } else if (this.type == 4) {
            this.x = transformXCoord(t);
            t += end_time
            this.y = transformYCoord(Math.sqrt(2*g*h_i) * (h_i + this.p ) * t - (1/2) * g * t ** 2);
        }
    }
}

// create frames for animation
function updateFrame() {
    // clear first frame and updates time
    AnimArea.clear();
    AnimArea.time += dt;

    param1D.newPos(AnimArea.time);
    actual1D.newPos(AnimArea.time);
    param2D.newPos(AnimArea.time);
    actual2D.newPos(AnimArea.time);

    param1D.update();
    actual1D.update();
    param2D.update();
    actual2D.update();

    if (AnimArea.time >= end_time) {endAnimation();}
}

startAnimation(p_intial);
