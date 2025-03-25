/**
 * The CycloidWheel class represents the position of a cycloid wheel.
 * The cycloid wheel is a circle that follows a path.
 * This class holds the current position of the wheel and draws it.
 *
 * The cycloid wheel is defined by:
 * - the center of the circle (centerX, centerY)
 * - the radius of the circle (radius)
 * - the angle of the wheel (theta)
 */
class CycloidWheel {
  constructor(
    p,
    centerX,
    centerY,
    radius,
    theta,
    colours = {
      circle: [0, 0, 200],
      radius: [200, 0, 0],
      centerPoint: [0, 255, 0],
      rimPoint: [255, 100, 250],
    }
  ) {
    this.p = p; // Store the p5 object
    this.centerX = centerX;
    this.centerY = centerY;
    this.radius = radius;
    this.theta = p.radians(theta); // Convert theta to radians using p5 method
    this.colours = colours; // Store the colours
    this.eventTarget = new EventTarget(); // Create an EventTarget instance
  }

  draw() {
    // draw a circle in blue
    this.p.stroke(...this.colours.circle);
    this.p.strokeWeight(2);
    this.p.noFill();
    this.p.ellipse(
      this.centerX,
      this.centerY,
      this.radius * 2,
      this.radius * 2
    );

    // draw a point at the center of the circle
    this.p.fill(...this.colours.centerPoint);
    this.p.ellipse(this.centerX, this.centerY, 5, 5);

    // draw the radius of the circle in red
    this.p.stroke(...this.colours.radius);
    this.p.strokeWeight(2);
    let radiusRimPoint = this.getRadiusRimPoint();
    this.p.line(this.centerX, this.centerY, radiusRimPoint.x, radiusRimPoint.y);

    // draw a point where the radius meets the circle
    this.p.stroke(...this.colours.rimPoint);
    this.p.fill(...this.colours.rimPoint);
    this.p.ellipse(radiusRimPoint.x, radiusRimPoint.y, 5, 5);
  }

  getRadiusRimPoint() {
    return {
      x: this.centerX + this.radius * this.p.cos(this.theta),
      y: this.centerY + this.radius * this.p.sin(this.theta),
    };
  }

  setTheta(theta) {
    this.theta = this.p.radians(theta); // Convert theta to radians using p5 method
    this.emitEvent('changed', { theta: this.theta });
  }

  /**
   * Rotate the wheel by delta_theta degrees. The rotation causes the wheel to move along the cycloid path.
   * In the current implementation we assume the wheel is rolling along the x-axis.
   * @param {Number} delta_theta amount of rotation in degrees
   */
  rotate(delta_theta) {
    this.theta += this.p.radians(delta_theta); // Update theta by delta_theta in radians using p5 method
    this.centerX += this.radius * this.p.radians(delta_theta); // Update centerX based on the rotation
    this.emitEvent('changed', { theta: this.theta, centerX: this.centerX });
  }

  rotateInPlace(delta_theta) {
    this.theta += this.p.radians(delta_theta); // Update theta by delta_theta in radians using p5 method
    this.emitEvent('changed', { theta: this.theta });
  }

  /**
   * Roll the curve along the path by a small distance.
   * The section of the path along which the curve rolls is a straight line. The distance to move is given by the distance parameter. and the direction of the path is given by the direction parameter.
   * 
   * @param {Number} distance Small distance to roll the curve along the path
   * @param {Number} direction The angle of the path from the x-axis in degrees
   */
  rollOnPath(distance, direction) {
    let dx = distance * this.p.cos(this.p.radians(direction));
    let dy = distance * this.p.sin(this.p.radians(direction));
    this.centerX += dx;
    this.centerY += dy;  

    // Since the path distance should be equal to the section of the circle that rolls along the path,
    // we know the angle of the wheel should change by the same amount.
    // so we update the theta by the same amount.
    let circumference = 2 * Math.PI * this.radius;
    let angleRadians = distance/circumference * 2 * Math.PI;
    this.theta += angleRadians;

    this.emitEvent('changed', { centerX: this.centerX, centerY: this.centerY, theta: this.theta });
  }

  emitEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    this.eventTarget.dispatchEvent(event);
  }

  addEventListener(type, listener) {
    this.eventTarget.addEventListener(type, listener);
  }

  removeEventListener(type, listener) {
    this.eventTarget.removeEventListener(type, listener);
  }

  getCenter() {
    return { x: this.centerX, y: this.centerY };
  }
}
