/* JavaScript is a pretty easy to learn language.
Some common mistakes I ran into:
    - Don't forget semicolons and brackets!
    - Sometimes HTML sliders will give you strings instead of numbers,
    so you might have to use the parseInt() function to convert a
    slider's value into an integer
    - Use console.log() to print things to the console for debugging.
    I use Google Chrome on a Mac and can view lots of important things
    like the console and errors in the inspector (command + option + i). You should
    always leave the inspector open so you can see what errors are happening
    - Almost always declare variables with "var" (if the variable can change) or
    "const" (if the value will stay constant). Don't use "let" unless you actually
    know what it means */

/* SVG (scalable graphics vector) and CANVAS are types of HTML elements used for drawing.
SVGs images are sharp no matter how zoomed in you are,
but they cannot handle as much data as a canvas.
A canvas draws pixel by pixel and is suited to handle lots of image data.
Here I use SVGs for graphing smooth curves (with the help of the library d3)
and canvases for creating animations of physical systems.
You can also look at the HTML file to see where the canvases are. */


/////////////////////////////////////////////////
/* Parameters */
/////////////////////////////////////////////////


/* Keep your code organized! "Magic Numbers" are numbers in your code
that would not make sense to someone who is not familiar with your code. 
Keep parameters like sizes of HTML elements, initial positions, 
etc in this section */

const CANVAS_WIDTH_1 = 170;
const CANVAS_WIDTH_2 = 380;
const CANVAS_HEIGHT = 280;
const TRANSITION_TIME = 10; // ms
const m = 1;
const dt = 0.005;
const FRAME_RATE = 10; // ms
const x_initial = 20;
const y_initial = 100;
const h_i = 1; // height_i when t=0
const g = 9.8;
const end_time = Math.sqrt(2*h_i/g);
const p_initial = parseInt(document.getElementById("p-slider").value);
const range_p = parseInt(document.getElementById("p-slider").max);


/////////////////////////////////////////////////
/* CANVAS ANIMATIONS */
/////////////////////////////////////////////////


/* This section deals with all of the things that make the animations run
Back in the day, I used this website: https://www.w3schools.com/graphics/game_intro.asp
to learn how to animate a Canvas. Feel free to take a look */

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

    // 1D projectiles

    /* Note that we declare a different x-position for the two vertical animations
       so that they happen side-by-side
    */

    param1D = new component(10, 10, "orange", 2.*CANVAS_WIDTH_1/3, y_initial, 1, p);
    actual1D = new component(10, 10, "purple", 1.*CANVAS_WIDTH_1/3, y_initial, 1, 0);

    // 2D projectiles
    param2D = new component(3, 3, "orange", x_initial, y_initial, 2, p);
    actual2D = new component(3, 3, "purple", x_initial, y_initial, 2, 0);

    animArea.start();
}

// wrapper function to end animations
function endAnimation() {
    animArea.stop();
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
    return (x_initial + 168) + (CANVAS_WIDTH_2 * (x)) / 1.2;
}

// parameterized coord -> canvas coord
function transformYCoord(y) {
    return CANVAS_HEIGHT - y_initial - y * (CANVAS_HEIGHT/2 - 2 * x_initial) / (2 * range_p/100);
}

/* This is the bulk of the information for the canvases. The animArea variable
is an Object in JavaScript (similar to a hashmap or a dictionary in Python).
We can define variables and functions inside it */

var animArea = {
    panel1: document.getElementById("projectile-motion-canvas-1"),
    panel2: document.getElementById("projectile-motion-canvas-2"),
    start: function(){
        this.panel1.width = CANVAS_WIDTH_1;
        this.panel1.height = CANVAS_HEIGHT;
        this.context1 = this.panel1.getContext("2d");

        /* This "context" thing is just what you use to actually
        render the 2D image drawing on the canvas
        Follow the code and it should not be a problem! */

        this.panel2.width = CANVAS_WIDTH_2;
        this.panel2.height = CANVAS_HEIGHT;
        this.context2 = this.panel2.getContext("2d");

        /* In this example, time is parameterized from -sqrt(2*h_i/g)
        to sqrt(2*h_i/g), so we will set the initial time to -sqrt(2*h_i/g) */
        this.time = -end_time;


        /* The built-in setInterval() function takes in a function f (updateFrame)
        and a number n (FRAME_RATE) and runs f every n milliseconds. This is how we
        actually simulate the "animation". updateFrame updates the position of everything
        on the canvas a little and then redraws everything. */

        this.interval = setInterval(updateFrame, FRAME_RATE);

	// add text and ground to panel 1
        this.context1.font = "18px Verdana";
        this.context1.fillStyle = "black";
        this.context1.fillText("Projectile Motion", 10, 30);
        this.context1.fillStyle = "black";
        this.context1.fillRect(x_initial, transformYCoord(-0.05), CANVAS_WIDTH_1-40, 3);

        // add text and ground to panel 2
        this.context2.font = "18px Verdana";
        this.context2.fillText("Height vs Time", 10, 30);
        this.context2.fillStyle = "black";
        this.context2.fillRect(x_initial, transformYCoord(-0.05), CANVAS_WIDTH_2-40, 3);
        },
    clear : function() {

        /* clearRect(x,y,width,height) is essentially the erase function for a canvas.
        It erases everything in the box from x to x+width and y to y+height (remember
        that the +y direction is down!) */

	// We clear context1 but not context2 because we actually want to keep the earlier
	// parts of the curve in the 2D case

        this.context1.clearRect(0, 0, this.panel1.width, this.panel1.height);
        }, 
    stop : function() {
        this.time = -end_time;

	/* The built-in clearInterval() function basically terminates the setInterva() function */

        clearInterval(this.interval); 
    },
}

/* This component thing is similar to defining a class in Python or Java.
We use it to create the objects that will move in our animation */

function component(width, height, color, x, y, type, p) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.color = color;
    this.x = x;
    this.y = y;
    this.p = p;

    /* This is the function that draws the projectiles using
    the built-in fillRect() function. Notice how we set the context
    to specify which canvas to draw on */

    this.update = function(){
        var ctx;
        if (this.type == 1 ) {ctx = animArea.context1;}
        else {ctx = animArea.context2;}
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    /* This is the function that updates the projectile positions.
    Notice how we use the transform() functions from above in order to
    plot things correctly on the canvas. The "type" is 1 for the 1D
    animation and 2 for the 2D animation. */

    this.newPos = function(t) {
        if (type == 1) {
            this.y = transformYCoord((1 + this.p) * (h_i - (1/2)*g*t**2));
        } else if (this.type == 2) {
            this.x = transformXCoord(t);
            this.y = transformYCoord((1 + this.p) * (h_i - (1/2)*g*t**2));
	}

    }
}

/* This updateFrame function is very important. It updates the position
of everything on the canvas a little and then redraws everything */

function updateFrame() {
    // clear frame and move to next
    // Note that the clear() function only erases the 1D panel

    animArea.clear();
    animArea.time += dt;

    // re-draw the text and ground on the left panel (1D)
    animArea.context1.fillStyle = "black";
    animArea.context1.fillRect(x_initial, transformYCoord(-0.05), CANVAS_WIDTH_1-40, 3);
    animArea.context1.font = "18px Verdana";
    animArea.context1.fillStyle = "black";
    animArea.context1.fillText("Projectile Motion", 10, 30);

    // update projectile positions (internally)
    param1D.newPos(animArea.time);
    actual1D.newPos(animArea.time);
    param2D.newPos(animArea.time)
    actual2D.newPos(animArea.time);

    // draw projectiles  with updated positions on the canvas

    param1D.update();
    actual1D.update();
    param2D.update();
    actual2D.update();

    // end animation when t = end_time
    if (animArea.time >= end_time) {endAnimation();}
}

// run animation on load
startAnimation(p_initial);



/////////////////////////////////////////////////
/* EVENT LISTENERS */
/////////////////////////////////////////////////

/* This section holds the functions that I call when something happens
on the HTML page (ex. button click, slider change, etc). For example, when the slider
is moved, I want to update the parameter p, change the print- entry that HTML uses to print 
the current value of p, stop the old animation and restart with the new value of p */

document.getElementById("p-slider").oninput = function() {
    // get new parameter p
    let p = parseInt(document.getElementById("p-slider").value)/100;
    document.getElementById("print-p").innerHTML = p.toFixed(2);
    endAnimation();
    startAnimation(p);

}

document.addEventListener("DOMContentLoaded", function() {
    // Add event listeners for each solution button
    document.getElementById("solution-button-1").addEventListener("click", function() {
        toggleSolution("solution-container-1", this, "Show Solution for Question 1", "Hide Solution for Question 1");
    });

    document.getElementById("solution-button-2").addEventListener("click", function() {
        toggleSolution("solution-container-2", this, "Show Solution for Question 2", "Hide Solution for Question 2");
    });

    document.getElementById("solution-button-3").addEventListener("click", function() {
        toggleSolution("solution-container-3", this, "Show Solution for Question 3", "Hide Solution for Question 3");
    });

    // Function to toggle solution visibility
    function toggleSolution(containerId, button, showText, hideText) {
        const solutionContainer = document.getElementById(containerId);
        if (solutionContainer.style.display === "none") {
            solutionContainer.style.display = "block";
            button.innerHTML = hideText;  // Change button text
        } else {
            solutionContainer.style.display = "none";
            button.innerHTML = showText;  // Change button text
        }
    }
});



