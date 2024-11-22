const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Move to Element if you want to customize any of these per particle.
// ctx.strokeStyle = "white";
// ctx.lineWidth = 5;

// Gradient colors from top right to bottom left.
const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
//                   (offset, color)
gradient.addColorStop(0, "white");
gradient.addColorStop(.5, "magenta");
gradient.addColorStop(1, "blue");
ctx.fillStyle = gradient;

// Set line colors.
ctx.strokeStyle = "white";

class Particle {
  constructor(effect) {
    this.effect = effect;
    this.radius = Math.random() * 5 + 5;
    this.x = 
      // Don't go past the left.
      this.radius + Math.random() *
      // Don't go past the right. 
      (this.effect.width - this.radius * 2);
    this.y = 
      // Don't go past the top.
      this.radius + Math.random() *
      // Don't go past the bottom. 
      (this.effect.height - this.radius * 2);
    this.vx = Math.random() * 1 - .5; // velocity x
    this.vy = Math.random() * 1 - .5; // velocity x
  }

  draw(context) {
    // context.fillStyle = "hsl(120, 100%, 50%)";
    // context.fillStyle = `hsl(${this.x * .5}, 100%, 50%)`;

    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2); // make a circle
    context.fill(); // render
    // context.stroke(); // just disabled because can be performance intensive.
  }

  update() {
    // x
    this.x += this.vx;
    if (
      // bounce off the right of the canvas.
      this.x > this.effect.width - this.radius || 
      // bounce off the left of the canvas.
      this.x < this.radius
    ) {
      this.vx *= -1;
    }

    // y
    this.y += this.vy;
    if (
      // bounce off the right of the canvas.
      this.y > this.effect.height - this.radius || 
      // bounce off the left of the canvas.
      this.y < this.radius
    ) {
      this.vy *= -1;
    }
  }
}

class Effect {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.particles = [];
    this.numberOfParticles = 200;
    this.createParticles();
  }

  createParticles() {
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new Particle(this));
    }
  }

  handleParticles(context) {
    this.connectParticles(context);
    this.particles.forEach(particle => {
      particle.draw(context);
      particle.update();
    });
  }

  connectParticles(context) {
    const maxDistance = 100;
    for (let a = 0; a < this.particles.length; a++) {
      for (let b = a; b < this.particles.length; b++) {
        const dx = this.particles[a].x - this.particles[b].x;
        const dy = this.particles[a].y - this.particles[b].y;
        const distance = Math.hypot(dx, dy); // Calculate the hypotenuse from Pythangreon's Theroem.
        if (distance < maxDistance) {
          // Draw line between the two particles.
          context.save(); // anything global styles we do meant only for this line will undone with restore().
          const opacity = 1 - (distance / maxDistance); // helps us transition lines instead of hard appear/disappear.
          context.globalAlpha = opacity;
          context.beginPath();
          context.moveTo(this.particles[a].x, this.particles[a].y);
          context.lineTo(this.particles[b].x, this.particles[b].y);
          context.stroke();
          context.restore();
        }
      }
    }
  }
}

const effect = new Effect(canvas);
console.log(effect)

function animate() {
  // New paints will leave streaks, this clears the old paint.
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  effect.handleParticles(ctx);
  // Request further animations. It does this at the internal frame rate (60 / sec).
  requestAnimationFrame(animate);
}
animate();