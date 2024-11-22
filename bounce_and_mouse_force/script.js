const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Move to Element if you want to customize any of these per particle.
// ctx.strokeStyle = "white";
// ctx.lineWidth = 5;


class Particle {
  constructor(effect) {
    this.effect = effect;
    this.radius = Math.floor(Math.random() * 10 + 1); // using floor here to set as integer, works for this animation and ints help performance.
    this.setNewPosition();
    this.vx = Math.random() * 1 - .5; // velocity x
    this.vy = Math.random() * 1 - .5; // velocity y
    // Used for increasing velocity for animations like mouse movement.
    this.pushX = 0;
    this.pushY = 0;
    this.friction = .70;
    // this.friction = .95;
  }

  setNewPosition() {
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
    // Handling mouse press events.
    if (this.effect.mouse.pressed) {
      const dx = this.x - this.effect.mouse.x;
      const dy = this.y - this.effect.mouse.y;
      const distance = Math.hypot(dx, dy);
      const force = this.effect.mouse.radius / distance;
      if (distance < this.effect.mouse.radius) {
        const angle = Math.atan2(dy, dx);
        this.pushX += Math.cos(angle) * force;
        this.pushY += Math.sin(angle) * force;
      }
    }
    // What actually cause the movement, but also the push away from mouse.
    this.x += (this.pushX *= this.friction) + this.vx;
    this.y += (this.pushY *= this.friction) + this.vy;
    
    // Edges bounce.
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx *= -1;
    } else if (this.x > this.effect.width - this.radius) {
      this.x = this.effect.width - this.radius;
      this.vx *= -1;
    }
    if (this.y < this.radius) {
      this.y = this.radius;
      this.vy *= -1;
    } else if (this.y > this.effect.height - this.radius) {
      this.y = this.effect.height - this.radius;
      this.vy *= -1;
    }

    // Old canvas edge bouncing.
    // // x
    // this.x += this.vx;
    // if (
    //   // bounce off the right of the canvas.
    //   this.x > this.effect.width - this.radius || 
    //   // bounce off the left of the canvas.
    //   this.x < this.radius
    // ) {
    //   this.vx *= -1;
    // }

    // // y
    // this.y += this.vy;
    // if (
    //   // bounce off the right of the canvas.
    //   this.y > this.effect.height - this.radius || 
    //   // bounce off the left of the canvas.
    //   this.y < this.radius
    // ) {
    //   this.vy *= -1;
    // }
  }
}

class Effect {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.setStyles();
    this.width = canvas.width;
    this.height = canvas.height;
    this.particles = [];
    this.numberOfParticles = 200;
    this.createParticles();
    this.mouse = {
      x: 0,
      y: 0,
      pressed: false,
      radius: 150,
    };

    // Canvas resizing.
    window.addEventListener('resize', e => {
      this.resize(e.target.window.innerWidth, e.target.window.innerHeight);
    });

    // Mouse reactions.
    window.addEventListener('mousemove', e => {
      if (this.mouse.pressed) {
        this.mouse.x = e.x;
        this.mouse.y = e.y;
      }
    });
    window.addEventListener('mousedown', e => this.mouse.pressed = true);
    window.addEventListener('mouseup', e => this.mouse.pressed = false);
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
          this.ctx.save(); // anything global styles we do meant only for this line will undone with restore().
          const opacity = 1 - (distance / maxDistance); // helps us transition lines instead of hard appear/disappear.
          this.ctx.globalAlpha = opacity;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[a].x, this.particles[a].y);
          this.ctx.lineTo(this.particles[b].x, this.particles[b].y);
          this.ctx.stroke();
          this.ctx.restore();
        }
      }
    }
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;

    this.setStyles();

    // Do this so particles outside the new canvas size aren't lost.
    this.particles.forEach(particle => particle.setNewPosition());
  }

  setStyles() {
    // Gradient colors from top right to bottom left.
    const gradient = this.ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    //                   (offset, color)
    gradient.addColorStop(0, "white");
    gradient.addColorStop(.5, "#16FF06");
    gradient.addColorStop(1, "#043301");
    this.ctx.fillStyle = gradient;
    // Set line colors.
    ctx.strokeStyle = "white";
  }
}

const effect = new Effect(canvas, ctx);
console.log(effect)

function animate() {
  // New paints will leave streaks, this clears the old paint.
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  effect.handleParticles(ctx);
  // Request further animations. It does this at the internal frame rate (60 / sec).
  requestAnimationFrame(animate);
}
animate();