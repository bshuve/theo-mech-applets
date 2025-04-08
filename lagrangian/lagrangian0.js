const CANVAS_WIDTH1 = parseInt(document.getElementById("ball-launch-1").getAttribute("width"));
const CANVAS_HEIGHT1 = parseInt(document.getElementById("ball-launch-1").getAttribute("height"));

const CANVAS_WIDTH2 = parseInt(document.getElementById("ball-launch-2").getAttribute("width"));
const CANVAS_HEIGHT2 = parseInt(document.getElementById("ball-launch-2").getAttribute("height"));

var h = 50;
var h2 = 2500; // h squared for w initial value
var a = -2;
var m = 10;
const x_initial = 20;
const FRAME_RATE = 1; // ms
const dt = 0.005;
const end_time = 11;

// Define separate projectile variables for each canvas
var projectile1, projectile2;

// Transformation functions for Canvas 1
function transformXCoord1(x) {
  return (CANVAS_WIDTH1 * x) + 20;
}

function transformYCoord1(y) {
    return CANVAS_HEIGHT1 - (y * (CANVAS_HEIGHT1 / 100));
}

// Transformation functions for Canvas 2 (w = y²)
function transformXCoord2(x) {
    return (CANVAS_WIDTH2 * x) + 20;
}

function transformYCoord2(w) {
  return CANVAS_HEIGHT2 - (w * (CANVAS_HEIGHT2 / 10000));

}

function startAnimation1() {
    projectile1 = new component(animArea1, 3, 3, "purple", x_initial, h, m, a, false);
    animArea1.start();
}

function startAnimation2() {
    projectile2 = new component(animArea2, 3, 3, "purple", x_initial, h2, m, a, true);
    animArea2.start();
}

// Modified component constructor to accept animArea and isWCoordinate flag
function component(animArea, width, height, color, x, y, m, a, isWCoordinate) {
    this.animArea = animArea;
    this.width = width;
    this.height = height;
    this.color = color;
    this.x = x;
    this.y = y;
    this.m = m;
    this.a = a;
    this.isWCoordinate = isWCoordinate;

    this.update = function () {
        var ctx = this.animArea.context;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    this.newPos = function (t) {
        const yPosition = h + 0.5 * a * (t * 5) ** 2;

        if (this.isWCoordinate) {
            const wPosition = yPosition ** 2;
            this.x = transformXCoord2(t);
            this.y = transformYCoord2(wPosition);
        } else {
            this.x = transformXCoord1(t);
            this.y = transformYCoord1(yPosition);
        }
    }
}

// Animation objects for each canvas
var animArea1 = {
    panel: document.getElementById("ball-launch-1"),
    start: function () {
        this.panel.width = CANVAS_WIDTH1;
        this.panel.height = CANVAS_HEIGHT1;
        this.context = this.panel.getContext("2d");
        this.time = 0;
        this.interval = setInterval(() => updateFrame(this, projectile1), FRAME_RATE);
        ctx = this.context; 

        ctx.font = "18px Verdana";
    ctx.fillStyle = "black";
    ctx.fillText("Projectile Motion (y)", 200, 30);
    ctx.fillStyle = "gray";
    ctx.fillRect(0, transformYCoord1(h), 25, 3);
    ctx.fillRect(0, transformYCoord1(h), 25, 300);
    // Markers for y and w
    ctx.font = "12px Arial";
    for (let y = 10; y <= 90; y += 10) {
        const canvasY = transformYCoord1(y);
        ctx.fillStyle = "red";
        ctx.fillRect(0, canvasY, 20, 1);
        ctx.fillText(`y=${y}`, 5, canvasY - 5);
        ctx.fillStyle = "green";
        const w = y ** 2;
        ctx.fillRect(CANVAS_WIDTH1 - 20, canvasY, 20, 1);
        ctx.fillText(`w=${w}`, CANVAS_WIDTH1 - 45, canvasY - 5);
    }
    },
    stop: function () {
        clearInterval(this.interval);
    }
};

var animArea2 = {
    panel: document.getElementById("ball-launch-2"),
    start: function () {
        this.panel.width = CANVAS_WIDTH2;
        this.panel.height = CANVAS_HEIGHT2;
        this.context = this.panel.getContext("2d");
        this.time = 0;
        this.interval = setInterval(() => updateFrame(this, projectile2), FRAME_RATE);
        ctx = this.context; 
        ctx.font = "18px Verdana";
    ctx.fillStyle = "black";
    ctx.fillText("Projectile Motion (w)", 200, 30);
    ctx.fillStyle = "gray";
    ctx.fillRect(0, transformYCoord2(h2), 25, 3);
    ctx.fillRect(0, transformYCoord2(h2), 25, 300);

    // Markers for w and corresponding y
    ctx.font = "12px Arial";
    for (let w = 1000; w <= 10000; w += 1000) {
        const canvasY = transformYCoord2(w);
        ctx.fillStyle = "green";
        ctx.fillRect(0, canvasY, 20, 1);
        ctx.fillText(`w=${w}`, 5, canvasY - 5);
        ctx.fillStyle = "red";
        const yVal = Math.sqrt(w).toFixed(1);
        ctx.fillRect(CANVAS_WIDTH2 - 20, canvasY, 20, 1);
        ctx.fillText(`y=${yVal}`, CANVAS_WIDTH2 - 45, canvasY - 5);
    }
    },
    stop: function () {
        clearInterval(this.interval);
    }
};





function updateFrame(animArea, projectile) {
    animArea.time += dt;
    projectile.newPos(animArea.time);
    
    
    projectile.update();
    if (animArea.time >= end_time) animArea.stop();
}

// Start both animations
startAnimation1();
startAnimation2();


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
