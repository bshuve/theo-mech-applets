class CycloidOnCycloid extends CycloidWheel {
  constructor(
    p,
    parentCycloid,
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
    super(p, centerX, centerY, radius, theta, colours);
    this.parentCycloid = parentCycloid;
    this.path = [];
    this.previousOuterRimPoint = this.parentCycloid.getRadiusRimPoint();
  }

  drawCycloid() {
    let currentOuterRimPoint = this.parentCycloid.getRadiusRimPoint();

    let newCenter = {
      x:
        currentOuterRimPoint.x -
        this.radius * this.p.cos(this.parentCycloid.theta),
      y:
        currentOuterRimPoint.y -
        this.radius * this.p.sin(this.parentCycloid.theta),
    };

    let oldCenter = this.getCenter();

    let distance = this.p.dist(
      newCenter.x,
      newCenter.y,
      oldCenter.x,
      oldCenter.y
    );

    let angleInDegrees = this.p.degrees(
      this.p.atan2(
        currentOuterRimPoint.y - this.previousOuterRimPoint.y,
        currentOuterRimPoint.x - this.previousOuterRimPoint.x
      )
    );

    this.rollOnPath(distance, angleInDegrees);

    this.previousOuterRimPoint = currentOuterRimPoint;

    this.draw();

    let innerRimPoint = this.getRadiusRimPoint();

    this.path.push(innerRimPoint);

    this.p.stroke(0, 200, 100);
    this.p.strokeWeight(3);
    this.p.noFill();
    this.p.beginShape();
    this.path.forEach((point) => {
      this.p.vertex(point.x, point.y);
    });
    this.p.endShape();
  }

  resetPath() {
    this.path = [];
  }

  static createInnerWheel(p, outerCycloidWheel, innerCycloidRadius) {
    let outerRimPoint = outerCycloidWheel.getRadiusRimPoint();

    let center = {
      x: outerRimPoint.x - innerCycloidRadius * p.cos(outerCycloidWheel.theta),
      y: outerRimPoint.y - innerCycloidRadius * p.sin(outerCycloidWheel.theta),
    };

    let innerCycloidWheel = new CycloidOnCycloid(
      p,
      outerCycloidWheel,
      center.x,
      center.y,
      innerCycloidRadius,
      0
    );
    innerCycloidWheel.resetPath();
    return innerCycloidWheel;
  }
}

function cycloid_circle_sketch(
  canvas_div = "sketch0-cycloid-on-circle",
  innerRadiusRatio = 0.05,
  innerRadiusIncrement = 0.0,
  numRotations = 10,
  outerRotationSpeed = 360
) {
  return function (p) {
    let outerCycloidWheel;
    let outerCycloidCenter = {
      x: 200,
      y: 100,
    };
    let outerCycloidRadius = 50;
    let innerCycloidRadius = 20;
    let innerCycloidWheel;
    let innerCycloidRadiusRatio = innerRadiusRatio;
    let innerCycloidRadiusIncrement = innerRadiusIncrement;

    p.setup = function () {
      let canvas = p.createCanvas(600, 500);
      canvas.parent(canvas_div);

      outerCycloidCenter = {
        x: p.width / 2,
        y: p.height / 2,
      };

      outerCycloidRadius = p.min(p.width, p.height) / 2 - 10;

      innerCycloidRadius = outerCycloidRadius * innerCycloidRadiusRatio;

      p.resetOuterWheel();
      p.resetInnerWheel();
    };

    p.draw = function () {
      p.background(220);

      let outerDeltaTheta = (outerRotationSpeed * p.deltaTime) / 10000;
      outerCycloidWheel.rotateInPlace(outerDeltaTheta);

      outerCycloidWheel.draw();

      innerCycloidWheel.drawCycloid();

      if (p.degrees(outerCycloidWheel.theta) >= 360 * numRotations) {
        innerCycloidRadiusRatio += innerCycloidRadiusIncrement;
        innerCycloidRadius = outerCycloidRadius * innerCycloidRadiusRatio;

        p.resetOuterWheel();
        p.resetInnerWheel();
      }

      p.fill(0);
      p.noStroke();
      p.textSize(12);
      p.textAlign(p.RIGHT, p.BOTTOM);
      p.text(
        `Inner Radius Ratio: ${innerCycloidRadiusRatio.toFixed(2)}`,
        p.width - 10,
        p.height - 10
      );
      p.text(
        `Rotation: ${p.floor(p.degrees(outerCycloidWheel.theta) / 360)}`,
        p.width - 10,
        p.height - 30
      );
    };

    p.resetOuterWheel = function () {
      theta = 0;
      outerCycloidWheel = new CycloidWheel(
        p,
        outerCycloidCenter.x,
        outerCycloidCenter.y,
        outerCycloidRadius,
        theta
      );
    };

    p.resetInnerWheel = function () {
      innerCycloidWheel = CycloidOnCycloid.createInnerWheel(
        p,
        outerCycloidWheel,
        innerCycloidRadius
      );
    };
  };
}

new p5(cycloid_circle_sketch());
