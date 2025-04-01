let cycloid_only_sketch = function(p) {
    let cycloidWheel;

    p.setup = function() {
        let canvas = p.createCanvas(200, 200);
        canvas.parent('sketch0-cycloid-only');

        let centerX = 100;
        let centerY = 100;
        let radius = 50;
        let theta = 0; // Initial theta in degrees

        cycloidWheel = new CycloidWheel(p, centerX, centerY, radius, theta);
    };

    p.draw = function() {
        p.background(220);
        let theta = (p.millis() / 5000) * 360 % 360; // Animate theta from 0 to 360 every 5 seconds
        cycloidWheel.setTheta(theta);
        cycloidWheel.draw(p);
    };
};

new p5(cycloid_only_sketch);