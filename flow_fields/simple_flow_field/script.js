const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// canvas settings
ctx.fillStyle = 'white';
ctx.strokeStyle = 'white';
ctx.lineWidth = 1;
// ctx.lineCap = 'round';

class Particle {
  constructor(effect) {
    this.effect = effect;
    this.speedX;
    this.speedY;
    this.speedModifier = Math.floor(Math.random() * 5 + 1);
    this.maxLength = Math.floor(Math.random() * 200 + 10);
    this.angle = 0;
    this.reset();
  }

  draw(context) {
    // context.fillRect(this.x, this.y, 10, 10);
    context.beginPath();
    context.moveTo(this.history[0].x, this.history[0].y);
    for (let i = 0; i < this.history.length; i++) {
      context.lineTo(this.history[i].x, this.history[i].y);
    }
    context.stroke();
  }

  update() {
    this.timer--;
    if (this.timer >= 1) {
      let x = Math.floor(this.x / this.effect.cellSize);
      let y = Math.floor(this.y / this.effect.cellSize);
      let index = y * this.effect.cols + x;
      this.angle = this.effect.flowField[index]; // radians
      
      // this.x += this.speedX + Math.random() * 15 - 7.5;
      // this.y += this.speedY + Math.random() * 15 - 7.5;
      this.speedX = Math.cos(this.angle);
      this.speedY = Math.sin(this.angle);
      this.x += this.speedX * this.speedModifier;
      this.y += this.speedY * this.speedModifier;
      
      this.history.push({x: this.x, y: this.y});
      if (this.history.length > this.maxLength) {
        this.history.shift();
      }
    } else if (this.history.length > 1) {
      this.history.shift();
    } else {
      this.reset();
    }
  }

  reset() {
    this.x = Math.floor(Math.random() * this.effect.width);
    this.y = Math.floor(Math.random() * this.effect.height);
    this.history = [{x: this.x, y: this.y}];
    this.timer = this.maxLength * 2;
  }
}

class Effect {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.particles = [];
    this.numberOfParticles = 2000;
    this.cellSize = 5; // make smaller to make flow more smooth.
    this.rows;
    this.cols;
    this.flowField = [];
    this.curve = 8; // increase this to make field spiral on itself.
    this.zoom = .02;
    this.init();
  }

  init() {
    // create flow field
    this.rows = Math.floor(this.height / this.cellSize);
    this.cols = Math.floor(this.width / this.cellSize);
    this.flowField = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        let angle = ((Math.cos(x * this.zoom) + Math.sin(y * this.zoom)) * 1) * this.curve;
        this.flowField.push(angle);
      }
      
    }

    // create particles
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new Particle(this));
    }
  }

  render(context) {
    this.particles.forEach(particle => {
      particle.draw(context);
      particle.update();
    })
  }
}

const effect = new Effect(canvas.width, canvas.height);
effect.render(ctx);

function animate() {
  // clear old paint so new shapes don't streak.
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.height);

  effect.render(ctx);
  requestAnimationFrame(animate);
}
animate();