const CANVAS_WIDTH_1 = 170; // Why do we decide to do 170
const CANVAS_WIDTH_2 = 380;
const CANVAS_HEIGHT = 280;
const FRAME_RATE = 10; //ms
const dt = 0.005;
const h_i = 1;
const g = 9.8;
const end_time = Math.sqrt(2*h_i/g);
const x_initial = 20;
const y_initial = 100;
const p_intial = parseInt(document.getElementById("p-slider").value);
const range_p = parseInt(document.getElementById("p-slider").max);


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
    return CANVAS_HEIGHT - y_initial - y * (CANVAS_HEIGHT/2 - 2 * x_initial) / (2 * range_p/100);
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


document.getElementById("p-slider").oninput = function() {
    let p = parseInt(document.getElementById("p-slider").value)/100;
    document.getElementById("print-p").innerHTML = p.toFixed(2);
    endAnimation();
    startAnimation(p);
}
