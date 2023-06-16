/* Parameters */
// t defines how big the tip of a drawn arrow is in comparison to the magnitude
// i.e., t = tip/magnitude
const t = 0.1;

// store the canvas elements in variables
const canvas = document.getElementById('canvas');
const feedback = document.getElementById('feedback');

// set the rendering context to 2D
const ctx = canvas.getContext('2d');
const ctx2 = feedback.getContext('2d');

/* The Vector class */
class Vector {
    constructor(start_x, start_y, x, y){
        this.start_x = start_x;
        this.start_y = start_y;
        this.x = x;
        this.y = y;
    }
    
    mag() {
        return Math.sqrt(this.x**2 + this.y**2);
    }

    crossDir(v) {
        var z = Math.round(this.x * (v.y*(-1)) - this.y*(-1) * v.x);
        if (z == 0) {
            return "0";
        } else if (z < 0) {
            return "-z";
        } else {
            return "+z";
        }
    }

    getEndX() {
        return this.start_x + this.x;
    }

    getEndY() {
        return this.start_y + this.y;
    }

    drawVec(color) {
        // store the endpoint coordinates of the arrow
        var end_x = this.getEndX();
        var end_y = this.getEndY();
        // set the length of the arrow tip
        var tipLen = t*this.mag();
        // get the angle between the arrow and the x-axis
        var angle = Math.atan2(this.y, this.x);

        ctx.save();
        ctx.strokeStyle = color;

        // drawing a line for the magnitude of the arrow
        ctx.beginPath();
        ctx.moveTo(this.start_x, this.start_y);
        ctx.lineTo(end_x, end_y);
        ctx.stroke();
        ctx.closePath();

        // path from the head of the arrow to one of the sides of the point
        ctx.beginPath();
        ctx.moveTo(end_x, end_y);
        ctx.lineTo(end_x-tipLen*Math.cos(angle-Math.PI/7),
                   end_y-tipLen*Math.sin(angle-Math.PI/7));
    
        // path from the side point of the arrow, to the other side point
        ctx.lineTo(end_x-tipLen*Math.cos(angle+Math.PI/7),
                   end_y-tipLen*Math.sin(angle+Math.PI/7));
    
        //path from the side point back to the tip of the arrow, and then
        //again to the opposite side point
        ctx.lineTo(end_x, end_y);
        ctx.lineTo(end_x-tipLen*Math.cos(angle-Math.PI/7),
                   end_y-tipLen*Math.sin(angle-Math.PI/7));
    
        //draws the paths created above
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
    }
}

/* Unit Vectors x,y */
const x_unit_vec = new Vector(40, 80, 50, 0);
x_unit_vec.drawVec('black');

const y_unit_vec = new Vector(40, 80, 0, -50);
y_unit_vec.drawVec('black');

/* Unit Vector z */
ctx.beginPath();
ctx.arc(40, 80, 7, 0, 2*Math.PI);
ctx.stroke()
ctx.closePath();
ctx.beginPath();
ctx.arc(40, 80, 3, 0, 2*Math.PI);
ctx.fill();
ctx.closePath();

/* Labeling Unit Vectors */
ctx.font = "14px Verdana";
ctx.fillStyle = "black";
ctx.fillText("y", 25, 40);
ctx.fillText("x", 80, 95);
ctx.fillText("z", 25, 95);

/* Creating Legend */
ctx.beginPath();
ctx.rect(540, 20, 20, 20);
ctx.fillStyle = "purple";
ctx.fill();
ctx.fillText("r Vector", 565, 35);
ctx.closePath();

ctx.beginPath();
ctx.rect(540, 50, 20, 20);
ctx.fillStyle = "green";
ctx.fill();
ctx.fillText("p Vector", 565, 65);
ctx.closePath();

/* Creating random r vector*/
// Choose a random angle
/* angles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI,
            5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4];
            */
angles = [0, Math.PI/6, Math.PI/4, Math.PI/3, Math.PI/2, 3*Math.PI/4, 5*Math.PI/6, Math.PI,
        7*Math.PI/6, 5*Math.PI/4, 4*Math.PI/3, 3*Math.PI/2, 7*Math.PI/4, 11*Math.PI/6];
var randAngle = angles[Math.floor(Math.random()*angles.length)];
var r = new Vector(canvas.width/2, canvas.height/2, 100*Math.cos(randAngle), 100*Math.sin(randAngle));
r.drawVec('purple');

/* Creating random p vector */
// Choose a random angle
randAngle = angles[Math.floor(Math.random()*angles.length)];
var p = new Vector(r.getEndX(), r.getEndY(), 100*Math.cos(randAngle), 100*Math.sin(randAngle));
p.drawVec('green');

/* Event Listeners */
// Get the user's input
var guess;
document.getElementById('into-button').addEventListener('click', function () {
    check("-z");
    });
document.getElementById('out-button').addEventListener('click', function () {
    check("+z");
    });
 document.getElementById('zero-button').addEventListener('click', function () {
    check("0");
    });

// Display whether it's correct or not
ctx2.font = "16px Verdana";
ctx2.fillStyle = "black";
function check(guess) {
    ctx2.clearRect(0, 0, feedback.width, feedback.height);
    if (guess == r.crossDir(p)) {
        ctx2.fillText("Correct! The direction is " + r.crossDir(p) + ".", feedback.width/6, feedback.height/2);
    } else {
        ctx2.fillText("Incorrect! Correct answer: " + r.crossDir(p) + ".", feedback.width/7, feedback.height/2);
    }
}