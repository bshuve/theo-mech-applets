let cycloid_moving_sketch = function(p) {
    let cycloidWheel;
    let theta;

    p.setup = function() {
        let canvas = p.createCanvas(200, 200);
        canvas.parent('sketch1-cycloid-moving');
        p.resetWheel();
    };

    p.draw = function() {
        p.background(220);
        
        // calculate additional rotation based on time
        // Convert milliseconds to seconds and then to degrees
        let delta = p.deltaTime / 1000 * 360; 

        // rotate and draw
        cycloidWheel.rotate(delta);
        cycloidWheel.draw();

        // Reset position and rotation if the wheel goes past the canvas
        if (cycloidWheel.centerX > p.width) {
            p.resetWheel();
        }
    };

    p.resetWheel = function() {
        let centerX = 0;
        let centerY = 100;
        let radius = 25;
        theta = 0; // Initial theta in degrees

        cycloidWheel = new CycloidWheel(p, centerX, centerY, radius, theta);
    };
};

new p5(cycloid_moving_sketch);