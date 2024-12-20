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
    // dark -> light
    this.colors = ["#032401", "#074C02", "#0B7B03", "#15F706"];
    this.color = this.colors[Math.floor(Math.random() * this.colors.length)]
    this.reset();
  }

  draw(context) {
    // context.fillRect(this.x, this.y, 10, 10);
    context.beginPath();
    context.moveTo(this.history[0].x, this.history[0].y);
    for (let i = 0; i < this.history.length; i++) {
      context.lineTo(this.history[i].x, this.history[i].y);
    }
    context.strokeStyle = this.color;
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
  constructor(canvas) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.particles = [];
    this.numberOfParticles = 1000;
    this.cellSize = 20; // make smaller to make flow more smooth.
    this.rows;
    this.cols;
    this.flowField = [];
    this.curve = 2; // increase this to make field spiral on itself.
    this.zoom = .1;
    this.debug = false;
    this.init();

    window.addEventListener('keydown', e => {
      if (e.key === 'd') this.debug = !this.debug;
    });

    window.addEventListener('resize', e => {
      this.resize(e.target.innerWidth, e.target.innerHeight);
    });    
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.init();
  }

  init() {
    // create flow field
    this.rows = Math.floor(this.height / this.cellSize);
    this.cols = Math.floor(this.width / this.cellSize);
    this.flowField = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        // Sin and Cosine spiral pattern.
        let angle = ((Math.cos(x * this.zoom) + Math.sin(y * this.zoom)) * 1) * this.curve;
        this.flowField.push(angle);
      }
    }

    // create particles
    this.particles = [];
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new Particle(this));
    }
  }

  render(context) {
    if (this.debug) this.drawGrid(context);
    this.particles.forEach(particle => {
      particle.draw(context);
      particle.update();
    })
  }

  drawGrid(context) {
    context.save()
    context.lineWidth = .3;
    for (let c = 0; c < this.cols; c++) {
      context.beginPath();
      context.moveTo(this.cellSize * c, 0);
      context.lineTo(this.cellSize * c, this.height);
      context.stroke();
    }
    for (let r = 0; r < this.rows; r++) {
      context.beginPath();
      context.moveTo(0, this.cellSize * r);
      context.lineTo(this.width, this.cellSize * r);
      context.stroke();
    }
    context.restore();
  }
}

const effect = new Effect(canvas);
effect.render(ctx);

function animate() {
  // clear old paint so new shapes don't streak.
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.height);

  effect.render(ctx);
  requestAnimationFrame(animate);
}
animate();