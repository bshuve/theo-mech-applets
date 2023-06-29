/* Parameters */
// t defines how big the tip of a drawn arrow is in comparison to the magnitude
// i.e., t = tip/magnitude
const t = 0.1;

// store the canvas elements in variables
const canvas = document.getElementById('canvas');
const feedback = document.getElementById('feedback');

//store the center coordinates of the canvas
const center_x = canvas.width/2;
const center_y = canvas.height/2;

// set the rendering context to 2D
const ctx = canvas.getContext('2d');
const ctx2 = feedback.getContext('2d');

/* The Vector class */
class Vector {
    constructor(start_x, start_y, x, y, z){
        this.start_x = start_x;
        this.start_y = start_y;
        this.x = x;
        this.y = -1 * y;
        this.z = z;
    }
    
    mag() {
        return Math.sqrt(this.x**2 + this.y**2 + this.z**2);
    }

    getEndX() {
        return this.start_x + this.x;
    }

    getEndY() {
        return this.start_y - this.y;
    }

    cross(v) {
        console.log(this.direction());
        console.log(v.direction());
        var cross = new Vector(this.start_x, this.start_y, 
        Math.round(this.y * v.z - this.z * v.y),
        -1 * Math.round(this.z * v.x - this.x * v.z),
        Math.round(this.x * v.y - this.y * v.x));
        return cross;
    }

    direction() {
        if (this.z == 0) {
            if (this.y == 0) {
                if (this.x == 0) {
                    return "0";
                } else if (this.x > 0) {
                    return "+x";
                } else {
                    return "-x";
                }
            } else if (this.y > 0) {
                return "+y";
            } else {
                return "-y";
            }
        } else if (this.z > 0) {
            return "+z";
        } else {
            return "-z";
        }
    }

    drawVec(color) {
         ctx.strokeStyle = color;
         ctx.fillStyle = color;
        if (this.z == 0) { // if z component is zero, draw arrow as usual
            // store the endpoint coordinates of the arrow
            var end_x = this.getEndX();
            var end_y = this.getEndY();
            // set the length of the arrow tip
            var tipLen = t * this.mag();
            // get the angle between the arrow and the x-axis
            var angle = Math.atan2(this.y, this.x);
            ctx.save();

            // drawing a line for the magnitude of the arrow
            ctx.beginPath();
            ctx.moveTo(this.start_x, this.start_y);
            ctx.lineTo(end_x, end_y);
            ctx.stroke();
            ctx.closePath();

            // path from the head of the arrow to one of the sides of the point
            ctx.beginPath();
            ctx.moveTo(end_x, end_y);
            ctx.lineTo(end_x - tipLen * Math.cos(angle - Math.PI / 7),
                end_y + tipLen * Math.sin(angle - Math.PI / 7));

            // path from the side point of the arrow, to the other side point
            ctx.lineTo(end_x - tipLen * Math.cos(angle + Math.PI / 7),
                end_y + tipLen * Math.sin(angle + Math.PI / 7));

            //path from the side point back to the tip of the arrow, and then
            //again to the opposite side point
            ctx.lineTo(end_x, end_y);
            ctx.lineTo(end_x - tipLen * Math.cos(angle - Math.PI / 7),
                end_y + tipLen * Math.sin(angle - Math.PI / 7));

            //draws the paths created above
            ctx.stroke();
            ctx.fill();
            ctx.restore();
        } else if (this.z > 0) { // draw a circle with a dot inside for +z
            ctx.beginPath();
            ctx.arc(this.start_x, this.start_y, 7, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.arc(this.start_x, this.start_y, 3, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();
        } else { // draw a circle with an x inside for -z
            ctx.beginPath();
            ctx.arc(this.start_x, this.start_y, 7, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.moveTo(this.start_x-7*Math.sqrt(2)/2, this.start_y-7*Math.sqrt(2)/2);
            ctx.lineTo(this.start_x+7*Math.sqrt(2)/2, this.start_y+7*Math.sqrt(2)/2);
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.moveTo(this.start_x+7*Math.sqrt(2)/2, this.start_y-7*Math.sqrt(2)/2);
            ctx.lineTo(this.start_x-7*Math.sqrt(2)/2, this.start_y+7*Math.sqrt(2)/2);
            ctx.stroke();
            ctx.closePath();
        }
    }
}

/* Unit Vectors x,y */
const x_unit_vec = new Vector(40, 80, 50, 0, 0);
x_unit_vec.drawVec('black');

const y_unit_vec = new Vector(40, 80, 0, -50, 0);
y_unit_vec.drawVec('black');

/* Unit Vector z */
const z_unit_vec = new Vector(40, 80, 0, 0, 1);
z_unit_vec.drawVec('black');

/* Labeling Unit Vectors */
ctx.font = "14px Verdana";
ctx.fillStyle = "black";
ctx.fillText("y", 25, 40);
ctx.fillText("x", 80, 95);
ctx.fillText("z", 25, 95);

/* Creating Legend */
ctx.beginPath();
ctx.rect(505, 20, 20, 20);
ctx.fillStyle = "purple";
ctx.fill();
ctx.fillText("First Vector", 530, 35);
ctx.closePath();

ctx.beginPath();
ctx.rect(505, 50, 20, 20);
ctx.fillStyle = "green";
ctx.fill();
ctx.fillText("Second Vector", 530, 65);
ctx.closePath();

/* Creating random r vector*/
// Choose a random direction
var directions = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
var i = Math.floor(Math.random()*directions.length);
var rDir = directions[i];
var r = new Vector(center_x, center_y, 100*rDir[0], 100*rDir[1], rDir[2]);
r.drawVec('purple');

// Update directions so that r and p cannot be the same vector
if (r.z != 0) {
    var i1 = directions.findIndex(x => x[0] === 0 && x[1] === 0 && x[2] === 1);
    directions.splice(i1, 1);
    var i2 = directions.findIndex(x => x[0] === 0 && x[1] === 0 && x[2] === -1);
    directions.splice(i2, 1);
} else {
    directions.splice(i, 1);
}

/* Creating random p vector */
var pDir = directions[Math.floor(Math.random()*directions.length)];
var p = new Vector(center_x, center_y, 100*pDir[0], 100*pDir[1], pDir[2]);
p.drawVec('green');

// Creating title
ctx.beginPath();
ctx.fillStyle = "black";
var rTitle = r.direction();
var pTitle = p.direction();
ctx.fillText(rTitle + " cross " + pTitle, center_x-50, 50);
ctx.closePath();

/* Event Listeners */
// Get the user's input
var guess;
document.getElementById('+x-button').addEventListener('click', function () {
    check("+x");
});
document.getElementById('+y-button').addEventListener('click', function () {
    check("+y");
});
document.getElementById('+z-button').addEventListener('click', function () {
    check("+z");
});
document.getElementById('-x-button').addEventListener('click', function () {
    check("-x");
});
document.getElementById('-y-button').addEventListener('click', function () {
    check("-y");
});
document.getElementById('-z-button').addEventListener('click', function () {
    check("-z");
});
document.getElementById('zero-button').addEventListener('click', function () {
    check("0");
});

// Display whether it's correct or not
ctx2.font = "16px Verdana";
ctx2.fillStyle = "black";
function check(guess) {
    ctx2.clearRect(0, 0, feedback.width, feedback.height);
    var rxp = r.cross(p);
    if (guess == rxp.direction()) {
        ctx2.fillText("Correct! The direction is " + rxp.direction() + ".", feedback.width/6, feedback.height/2);
        rxp.drawVec("orange");
        ctx.beginPath();
        ctx.rect(505, 80, 20, 20);
        ctx.fillStyle = "orange";
        ctx.fill();
        ctx.fillText("Answer Vector", 530, 95);
        ctx.closePath();
    } else {
        ctx2.fillText("Incorrect! Correct answer: " + rxp.direction() + ".", feedback.width/7, feedback.height/2);
    }
}