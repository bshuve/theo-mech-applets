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

//store angles 
const angles = [0, Math.PI/6, Math.PI/4, Math.PI/3, Math.PI/2, 3*Math.PI/4, 5*Math.PI/6, Math.PI,
    7*Math.PI/6, 5*Math.PI/4, 4*Math.PI/3, 3*Math.PI/2, 7*Math.PI/4, 11*Math.PI/6];

//init r and p
let r, p;

/* The Vector class */
class Vector {
    constructor(start_x, start_y, x, y, z){
        this.start_x = start_x;
        this.start_y = start_y;
        this.x = x;
        // on a canvas, y increases downwards, so transform y to match our coordinate system
        this.y = -1 * y;
        this.z = z;
    }
    
    // returns magnitude of a vector
    mag() {
        return Math.sqrt(this.x**2 + this.y**2 + this.z**2);
    }

    // scales a vector by 1/2
    scale() {
        this.x = this.x/2;
        this.y = this.y/2;
    }

    // returns the x coordinate of a vector's endpoint
    getEndX() {
        return this.start_x + this.x;
    }

    // returns the y coordinate of a vector's endpoint
    getEndY() {
        return this.start_y - this.y;
    }

    // returns the cross product vector of two vectors
    cross(v) { 
        var product = [Math.round(this.y * v.z - this.z * v.y),
            -1 * Math.round(this.z * v.x - this.x * v.z),
            Math.round(this.x * v.y - this.y * v.x)];
        var height;
        if (product[1] < 0) {
            height = feedback.height/1.15; // +y
        } else if (product[1] > 0) {
            height = feedback.height/2.3; // -y
        } else {
            height = feedback.height*0.6;
        }
        var cross = new Vector(feedback.width/2, height, product[0], product[1], product[2]);
        return cross;
    }

    // returns the direction of a vector, simply as +/- x, y, z, or 0
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

    // draws a vector
    drawVec(color, context) {
        context.strokeStyle = color;
        context.fillStyle = color;
       if (this.z == 0) { // if z component is zero, draw arrow as usual
           // store the endpoint coordinates of the arrow
           var end_x = this.getEndX();
           var end_y = this.getEndY();
           // set the length of the arrow tip
           var tipLen = t * this.mag();
           // get the angle between the arrow and the x-axis
           var angle = Math.atan2(this.y, this.x);
           context.save();

           // drawing a line for the magnitude of the arrow
           context.beginPath();
           context.moveTo(this.start_x, this.start_y);
           context.lineTo(end_x, end_y);
           context.stroke();
           context.closePath();

           // path from the head of the arrow to one of the sides of the point
           context.beginPath();
           context.moveTo(end_x, end_y);
           context.lineTo(end_x - tipLen * Math.cos(angle - Math.PI / 7),
               end_y + tipLen * Math.sin(angle - Math.PI / 7));

           // path from the side point of the arrow, to the other side point
           context.lineTo(end_x - tipLen * Math.cos(angle + Math.PI / 7),
               end_y + tipLen * Math.sin(angle + Math.PI / 7));

           //path from the side point back to the tip of the arrow, and then
           //again to the opposite side point
           context.lineTo(end_x, end_y);
           context.lineTo(end_x - tipLen * Math.cos(angle - Math.PI / 7),
               end_y + tipLen * Math.sin(angle - Math.PI / 7));

           //draws the paths created above
           context.stroke();
           context.fill();
           context.restore();
       } else if (this.z > 0) { // draw a circle with a dot inside for +z
            context.beginPath();
            context.arc(this.start_x, this.start_y, 7, 0, 2 * Math.PI);
            context.stroke();
            context.closePath();
            context.beginPath();
            context.arc(this.start_x, this.start_y, 3, 0, 2 * Math.PI);
            context.fill();
            context.closePath();
        } else { // draw a circle with an x inside for -z
            context.beginPath();
            context.arc(this.start_x, this.start_y, 7, 0, 2 * Math.PI);
            context.stroke();
            context.closePath();
            context.beginPath();
            context.moveTo(this.start_x-7*Math.sqrt(2)/2, this.start_y-7*Math.sqrt(2)/2);
            context.lineTo(this.start_x+7*Math.sqrt(2)/2, this.start_y+7*Math.sqrt(2)/2);
            context.stroke();
            context.closePath();
            context.beginPath();
            context.moveTo(this.start_x+7*Math.sqrt(2)/2, this.start_y-7*Math.sqrt(2)/2);
            context.lineTo(this.start_x-7*Math.sqrt(2)/2, this.start_y+7*Math.sqrt(2)/2);
            context.stroke();
            context.closePath();
       }
   }
}

//refresh vectors
function regenerateVectors(){
    // unit vectors 
    const x_unit_vec = new Vector(40, 80, 50, 0, 0);
    const y_unit_vec = new Vector(40, 80, 0, -50, 0);
    const z_unit_vec = new Vector(40, 80, 0, 0, 1);
    // Clear canvases
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx2.clearRect(0, 0, feedback.width, feedback.height);

    /* Unit Vectors */
    x_unit_vec.drawVec('black', ctx);
    y_unit_vec.drawVec('black', ctx);
    z_unit_vec.drawVec('black', ctx);

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

    let randAngle = angles[Math.floor(Math.random()*angles.length)];
     r = new Vector(center_x, center_y, 100*Math.cos(randAngle), 100*Math.sin(randAngle), 0);
    r.drawVec('purple', ctx);

    /* Creating random p vector */
    // Choose a random angle
    randAngle = angles[Math.floor(Math.random()*angles.length)];
     p = new Vector(r.getEndX(), r.getEndY(), 100*Math.cos(randAngle), 100*Math.sin(randAngle), 0);
    p.drawVec('green', ctx);
}
//initalize
regenerateVectors();

/* Event Listeners */
// Get the user's input
document.getElementById('into-button').addEventListener('click', function () {
    check("-z");
    });
document.getElementById('out-button').addEventListener('click', function () {
    check("+z");
    });
 document.getElementById('zero-button').addEventListener('click', function () {
    check("0");
    });
document.getElementById('reload-button').addEventListener('click', regenerateVectors);

// Display whether it's correct or not
var guess;
ctx2.font = "16px Verdana";
ctx2.fillStyle = "black";
function check(guess) {
    ctx2.clearRect(0, 0, feedback.width, feedback.height);
    // take the cross of r and p
    var rxp = r.cross(p);
    if (guess == rxp.direction()) {
        ctx2.fillText("Correct! The direction is " + rxp.direction() + ".", feedback.width/6, feedback.height/3);
        rxp.scale();
        rxp.drawVec("orange", ctx2);
    } else {
        ctx2.fillText("Incorrect! Try again :)", feedback.width/4.5, feedback.height/2);
    }
    ctx2.fillStyle = "black";
}