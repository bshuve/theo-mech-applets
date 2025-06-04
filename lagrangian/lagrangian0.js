const originalPanel1 = document.getElementById("test");
const CANVAS_WIDTH = parseInt(originalPanel1.getAttribute("width"));
const CANVAS_HEIGHT = parseInt(originalPanel1.getAttribute("height"));

const hiPPICanvas1 = createHiPPICanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
originalPanel1.replaceWith(hiPPICanvas1);
hiPPICanvas1.id = "test";

const FRAME_RATE = 1000 / 60; // 60 FPS
const HORIZONTAL_LEG = 200;
const VERTICAL_LEG = 200;

// Projectile object to track animation state
var projectile1 = {
    t: 0,          // Animation progress (0-1)
    speed: 0.01,    // Animation speed per frame
    startX: 0 + 200,
    startY: CANVAS_HEIGHT - VERTICAL_LEG - 200,
    endX: HORIZONTAL_LEG + 200,
    endY: CANVAS_HEIGHT - 200
};

// Animation controller
var animArea = {
    panel: hiPPICanvas1,
    context: null,
    interval: null,

    start: function () {
        this.context = this.panel.getContext("2d");
        this.interval = setInterval(() => updateFrame(this, projectile1), FRAME_RATE);
    },

    stop: function () {
        clearInterval(this.interval);
    }
};

function updateFrame(animArea, projectile) {
    const ctx = animArea.context;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.font = "15px Arial";
    ctx.fillText(`t = ${projectile.t.toFixed(2)}`, 325, 75);
    ctx.beginPath()
    ctx.moveTo(0, CANVAS_WIDTH / 2)
    ctx.lineTo(CANVAS_HEIGHT, CANVAS_WIDTH / 2)
    ctx.moveTo(CANVAS_HEIGHT / 2, 0)
    ctx.lineTo(CANVAS_HEIGHT / 2, CANVAS_WIDTH)
    // Draw right triangle
    ctx.moveTo(200, CANVAS_HEIGHT - 200);                   // Starting point (bottom-left)
    ctx.lineTo(200, CANVAS_HEIGHT - VERTICAL_LEG - 200);    // Vertical leg
    ctx.lineTo(HORIZONTAL_LEG + 200, CANVAS_HEIGHT - 200);      // Horizontal leg
    ctx.closePath();                                // Hypotenuse
    ctx.strokeStyle = "#000";
    ctx.stroke();



    // Update ball position
    if (projectile.t <= 1) {
        projectile.currentX = projectile.startX + (projectile.endX - projectile.startX) * projectile.t;
        projectile.currentY = projectile.startY + (projectile.endY - projectile.startY) * projectile.t;
        projectile.t += projectile.speed;
    } else {
        projectile.t = 0; // Reset animation
    }

    // Draw ball
    ctx.beginPath();
    ctx.arc(projectile.currentX, projectile.currentY, 10, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
}

// Start animation
animArea.start();


const originalPanel2 = document.getElementById("test2");
const CANVAS_WIDTH2 = parseInt(originalPanel2.getAttribute("width"));
const CANVAS_HEIGHT2 = parseInt(originalPanel2.getAttribute("height"));

const hiPPICanvas2 = createHiPPICanvas(CANVAS_WIDTH2, CANVAS_HEIGHT2);
originalPanel2.replaceWith(hiPPICanvas2);

hiPPICanvas2.id = "test";

// Projectile object to track animation state
var projectile2 = {
    t: 10,          // Animation progress (0-1)
    speed: 0.01,    // Animation speed per frame
    startX: 0 + 200,
    startY: CANVAS_HEIGHT2 - VERTICAL_LEG - 200,
    endX: HORIZONTAL_LEG + 200,
    endY: CANVAS_HEIGHT2 - 200
};

// Animation controller
var animArea2 = {
    panel: hiPPICanvas2,
    context: null,
    interval: null,

    start: function () {
        this.context = this.panel.getContext("2d");
        this.interval = setInterval(() => updateFrame2(this, projectile2), FRAME_RATE);
    },

    stop: function () {
        clearInterval(this.interval);
    }
};

function updateFrame2(animArea2, projectile) {
    const ctx = animArea2.context;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH2, CANVAS_HEIGHT2);

    ctx.beginPath()
    ctx.font = "15px Arial";
    ctx.fillText(`s = ${projectile.t.toFixed(2)}`, 325, 75);
    ctx.moveTo(0, CANVAS_WIDTH2 / 2)
    ctx.lineTo(CANVAS_HEIGHT2, CANVAS_WIDTH2 / 2)
    ctx.moveTo(CANVAS_HEIGHT2 / 2, 0)
    ctx.lineTo(CANVAS_HEIGHT2 / 2, CANVAS_WIDTH2)
    // Draw right triangle
    ctx.moveTo(200, CANVAS_HEIGHT2 - 200);                   // Starting point (bottom-left)
    ctx.lineTo(200, CANVAS_HEIGHT2 - VERTICAL_LEG - 200);    // Vertical leg
    ctx.lineTo(HORIZONTAL_LEG + 200, CANVAS_HEIGHT2 - 200);      // Horizontal leg
    ctx.closePath();                                // Hypotenuse
    ctx.strokeStyle = "#000";
    ctx.stroke();



    // Update ball position
    if (projectile.t <= 5) {
        projectile.currentX = projectile.startX + (projectile.endX - projectile.startX) * (1 - 2.71828 ** -projectile.t);
        projectile.currentY = projectile.startY + (projectile.endY - projectile.startY) * (1 - 2.71828 ** -projectile.t);
        projectile.t += projectile.speed;
    } else {
        projectile.t = 0; // Reset animation
    }

    // Draw ball
    ctx.beginPath();
    ctx.arc(projectile.currentX, projectile.currentY, 10, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
}

// Start animation
animArea2.start();


var showAnswer0 = false;
document.getElementById("show-q0").addEventListener("click", function () {
    if (!showAnswer0) {
        showAnswer0 = true;
        document.getElementById("show-q0").innerHTML = "Hide Answer";
        document.getElementById("answer0").style.display = "block";

    } else {
        showAnswer0 = false;
        document.getElementById("show-q0").innerHTML = "Show Answer";
        document.getElementById("answer0").style.display = "none";
    }
});



//https://stackoverflow.com/questions/15661339/how-do-i-fix-blurry-text-in-my-html5-canvas
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
