let cycloid_path_sketch = function(p) {
    let cycloidWheel;
    let theta;
    let path = [];

    p.setup = function() {
        let canvas = p.createCanvas(400, 200);
        canvas.parent('sketch2-cycloid-path');
        p.resetWheel();
    };

    p.draw = function() {
        p.background(220);
        
        // calculate additional rotation based on time
        // Convert milliseconds to seconds and then to degrees
        let delta = p.deltaTime / 1000 * 360; 

        // rotate and draw
        cycloidWheel.rotate(delta);
        // get the cycloid rim point and add it to the path
        path.push(cycloidWheel.getRadiusRimPoint());

        // draw the path
        // magenta colour
        p.stroke(255, 0, 255);
        p.strokeWeight(2);
        p.noFill();
        p.beginShape();
        for (let i = 0; i < path.length; i++) {
            p.vertex(path[i].x, path[i].y);
        }
        p.endShape();

        cycloidWheel.draw();

        // Reset position and rotation if the wheel goes past the canvas
        if (cycloidWheel.centerX > p.width) {
            p.resetWheel();
        }
    };

    p.resetWheel = function() {
        let centerX = 0;
        let centerY = 100;
        let radius = 20;
        theta = 0; // Initial theta in degrees

        cycloidWheel = new CycloidWheel(p, centerX, centerY, radius, theta);

        path = [];
    };
};

new p5(cycloid_path_sketch);