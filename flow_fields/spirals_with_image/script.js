const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = 700; // window.innerWidth;
canvas.height = 900; // window.innerHeight;

// global settings
ctx.lineWidth = 10;
// ctx.strokeStyle = 'magenta';
// canvas shadows
ctx.shadowOffsetX = 2;
ctx.shadowOffsetY = 2;
ctx.shadowColor = 'black';

// gradients
// const gradient1 = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
// gradient1.addColorStop('0.2', 'yellow');
// gradient1.addColorStop('0.5', 'green');
// gradient1.addColorStop('0.8', 'black');
// ctx.strokeStyle = gradient1;
// const gradient2 = ctx.createRadialGradient(canvas.width * .5, canvas.height * .5, 70, canvas.width * .5, canvas.height *.5, 400);
// gradient2.addColorStop('0.2', 'green');
// gradient2.addColorStop('0.5', 'red');
// gradient2.addColorStop('0.8', 'blue');
// ctx.strokeStyle = gradient2;

// canvas pattern
const patternImage = document.getElementById('patternImage');
const pattern1 = ctx.createPattern(patternImage, 'no-repeat');
ctx.strokeStyle = pattern1;

// ctx.strokeStyle = "white";

class Line {
  constructor (canvas) {
    this.canvas = canvas;
    this.reset();
    this.lineWidth = Math.floor(Math.random() * 25 + 1);
    this.hue = Math.floor(Math.random() * 360);
    this.maxLength = Math.floor(Math.random() * 150 + 10);
    this.speedX = Math.random() * 5 - 2.5;
    this.speedY = 6;
    this.lifeSpan = this.maxLength * 2;
    this.breakPoint = this.lifeSpan * .85;
    this.angle = 0;
    this.va = Math.random() * .5 - .25;
    this.curve = .1;
    this.vc = Math.random() * .4 - .2;
  }

  draw (context) {
    // context.strokeStyle = `hsl(${this.hue}, 100%, 50%)`;
    context.lineWidth = this.lineWidth;
    context.beginPath();
    context.moveTo(this.history[0].x, this.history[0].y);
    for (let i = 0; i < this.history.length; i++) {
      context.lineTo(this.history[i].x, this.history[i].y);
    }
    context.stroke();
  }

  update() {
    this.timer++;
    this.angle += this.va;
    this.curve += this.vc;
    if (this.timer < this.lifeSpan) {
      if (this.timer > this.breakPoint) {
        this.va *= -1.12;
      }
      // Add one segment to our line.
      this.x += Math.sin(this.angle) * this.curve;
      this.y += Math.cos(this.angle) * this.curve;
      this.history.push({x: this.x, y: this.y});
      // Delete the first segment if too many.
      if (this.history.length > this.maxLength) {
        this.history.shift();
      }
    } else if (this.history.length <= 1) {
      this.reset();
    } else {
      // remove segment one by one when timer has expired.
      this.history.shift();
    }
  }

  reset() {
    this.x = Math.random() * this.canvas.width;
    this.y = Math.random() * this.canvas.height;
    this.history = [{x: this.x, y: this.y}];
    this.timer = 0;
    this.angle = 0;
    this.curve = 0;
    this.va = Math.random() * .5 - .25;
  }
}

const linesArray = [];
const numberOfLines = 100;
for (let i = 0; i < numberOfLines; i++) {
  linesArray.push(new Line(canvas));
}

function animate() {
  // clears entire 
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw lines
  linesArray.forEach(line => {
    line.draw(ctx)
    line.update();
  });
  
  requestAnimationFrame(animate);
}
animate();