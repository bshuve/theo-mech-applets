const CANVAS_WIDTH = parseInt(document.getElementById("test").getAttribute("width"));
const CANVAS_HEIGHT = parseInt(document.getElementById("test").getAttribute("height"));
const FRAME_RATE = 1000/60; // 60 FPS
const HORIZONTAL_LEG = 200;
const VERTICAL_LEG = 200;

// Projectile object to track animation state
var projectile1 = {
    t: 0,          // Animation progress (0-1)
    speed: 0.01,    // Animation speed per frame
    startX: 0 + 250,
    startY: CANVAS_HEIGHT - VERTICAL_LEG - 250,
    endX: HORIZONTAL_LEG + 250,
    endY: CANVAS_HEIGHT - 250
};

// Animation controller
var animArea = {
    panel: document.getElementById("test"),
    context: null,
    interval: null,
    
    start: function() {
        this.panel.width = CANVAS_WIDTH;
        this.panel.height = CANVAS_HEIGHT;
        this.context = this.panel.getContext("2d");
        this.interval = setInterval(() => updateFrame(this, projectile1), FRAME_RATE);
    },
    
    stop: function() {
        clearInterval(this.interval);
    }
};

function updateFrame(animArea, projectile) {
    const ctx = animArea.context;
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.font = "15px Arial";
    ctx.fillText(`s=${projectile.t.toFixed(2)}`, 400, 100);
    ctx.beginPath()
    ctx.moveTo(0, CANVAS_WIDTH/2)
    ctx.lineTo(CANVAS_HEIGHT, CANVAS_WIDTH/2)
    ctx.moveTo(CANVAS_HEIGHT/2, 0)
    ctx.lineTo(CANVAS_HEIGHT/2, CANVAS_WIDTH)
    // Draw right triangle
    ctx.moveTo(250, CANVAS_HEIGHT - 250);                   // Starting point (bottom-left)
    ctx.lineTo(250, CANVAS_HEIGHT - VERTICAL_LEG - 250);    // Vertical leg
    ctx.lineTo(HORIZONTAL_LEG + 250, CANVAS_HEIGHT - 250);      // Horizontal leg
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



const CANVAS_WIDTH2 = parseInt(document.getElementById("test2").getAttribute("width"));
const CANVAS_HEIGHT2 = parseInt(document.getElementById("test2").getAttribute("height"));

// Projectile object to track animation state
var projectile2 = {
    t: 10,          // Animation progress (0-1)
    speed: 0.01,    // Animation speed per frame
    startX: 0 + 250,
    startY: CANVAS_HEIGHT2 - VERTICAL_LEG - 250,
    endX: HORIZONTAL_LEG + 250,
    endY: CANVAS_HEIGHT2 - 250
};

// Animation controller
var animArea2 = {
    panel: document.getElementById("test2"),
    context: null,
    interval: null,
    
    start: function() {
        this.panel.width = CANVAS_WIDTH2;
        this.panel.height = CANVAS_HEIGHT2;
        this.context = this.panel.getContext("2d");
        this.interval = setInterval(() => updateFrame2(this, projectile2), FRAME_RATE);
    },
    
    stop: function() {
        clearInterval(this.interval);
    }
};

function updateFrame2(animArea2, projectile) {
    const ctx = animArea2.context;
    
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH2, CANVAS_HEIGHT2);
    
    ctx.beginPath()
    ctx.font = "15px Arial";
    ctx.fillText(`s=${projectile.t.toFixed(2)}`, 400, 100);
    ctx.moveTo(0, CANVAS_WIDTH2/2)
    ctx.lineTo(CANVAS_HEIGHT2, CANVAS_WIDTH2/2)
    ctx.moveTo(CANVAS_HEIGHT2/2, 0)
    ctx.lineTo(CANVAS_HEIGHT2/2, CANVAS_WIDTH2)
    // Draw right triangle
    ctx.moveTo(250, CANVAS_HEIGHT2 - 250);                   // Starting point (bottom-left)
    ctx.lineTo(250, CANVAS_HEIGHT2 - VERTICAL_LEG - 250);    // Vertical leg
    ctx.lineTo(HORIZONTAL_LEG + 250, CANVAS_HEIGHT2 - 250);      // Horizontal leg
    ctx.closePath();                                // Hypotenuse
    ctx.strokeStyle = "#000";
    ctx.stroke();
    
    

    // Update ball position
    if (projectile.t <= 5) {
        projectile.currentX = projectile.startX + (projectile.endX - projectile.startX) * (1-2.71828**-projectile.t);
        projectile.currentY = projectile.startY + (projectile.endY - projectile.startY) * (1-2.71828**-projectile.t);
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