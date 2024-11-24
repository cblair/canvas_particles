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
    this.speedModifier = Math.floor(Math.random() * 2 + 1);
    this.maxLength = Math.floor(Math.random() * 60 + 20);
    this.angle = 0;
    this.newAngle = 0;
    this.angleCorrector = Math.random() * .5 + .01;
    // dark -> light
    this.colors = ["#032401", "#074C02", "#0B7B03", "#15F706"];
    this.color = this.colors[Math.floor(Math.random() * this.colors.length)]
    this.x = Math.floor(Math.random() * this.effect.width);
    this.y = Math.floor(Math.random() * this.effect.height);
    this.history = [{x: this.x, y: this.y}];
    this.timer = this.maxLength * 2;
  }

  draw() {
    // context.fillRect(this.x, this.y, 10, 10);
    this.effect.context.beginPath();
    this.effect.context.moveTo(this.history[0].x, this.history[0].y);
    for (let i = 0; i < this.history.length; i++) {
      this.effect.context.lineTo(this.history[i].x, this.history[i].y);
    }
    this.effect.context.strokeStyle = this.color;
    this.effect.context.stroke();
  }

  update() {
    this.timer--;
    if (this.timer >= 1) {
      let x = Math.floor(this.x / this.effect.cellSize);
      let y = Math.floor(this.y / this.effect.cellSize);
      let index = y * this.effect.cols + x;

      if (this.effect.flowField[index]){
        this.newAngle = this.effect.flowField[index].colorAngle; // radians 
        if (this.angle > this.newAngle) {
          this.angle -= this.angleCorrector;
        } else if (this.angle < this.newAngle) {
          this.angle += this.angleCorrector;
        } else {
          this.angle = this.newAngle;
        }
      }
      
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
    // Only start the redrawing process if particle is within the letters.
    let attempts = 0;
    let resetSuccess = false;
    while (attempts < 10 && !resetSuccess) {
      attempts++;
      let testIndex = Math.floor(Math.random() * this.effect.flowField.length);
      // IF alpha is set, then it's within the letters.
      if (this.effect.flowField[testIndex].alpha > 0) {
        this.x = this.effect.flowField[testIndex].x;
        this.y = this.effect.flowField[testIndex].y;
        this.history = [{x: this.x, y: this.y}];
        this.timer = this.maxLength * 2;
        resetSuccess = true;
      }
    }
    if (!resetSuccess) {
      this.x = Math.random() * this.effect.width;
      this.y = Math.random() * this.effect.height;
      this.history = [{x: this.x, y: this.y}];
        this.timer = this.maxLength * 2;
    }

    // Instead of above: Draw particles everywhere
    // this.x = Math.floor(Math.random() * this.effect.width);
    // this.y = Math.floor(Math.random() * this.effect.height);
    // this.history = [{x: this.x, y: this.y}];
    // this.timer = this.maxLength * 2;
  }
}

class Effect {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.context = ctx;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.particles = [];
    this.numberOfParticles = 4000;
    this.cellSize = 1; // make smaller to make flow more smooth.
    this.rows;
    this.cols;
    this.flowField = [];

    // this.curve = 2; // increase this to make field spiral on itself.
    // this.zoom = .1;
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

  drawText() {
    this.context.font = '500px Impact';
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    
    
    // Color - determines the direction of the flow movement.
    
    // Static color makes static lines across the text.
    //this.context.fillStyle = 'green';
    
    // Gradients
    const gradient1 = this.context.createLinearGradient(0, 0, this.width, this.height);
    gradient1.addColorStop(.2, 'rgb(255,255,255)');
    gradient1.addColorStop(.4, 'rgb(255,255,0)');
    gradient1.addColorStop(.6, 'rgb(0,255,255)');
    gradient1.addColorStop(.8, 'rgb(0,0,255)');
    
    const gradient2 = this.context.createLinearGradient(0, 0, this.width, this.height);
    gradient2.addColorStop(.2, 'rgb(255,255,0)');
    gradient2.addColorStop(.4, 'rgb(200,5,50)');
    gradient2.addColorStop(.6, 'rgb(150,255,255)');
    gradient2.addColorStop(.8, 'rgb(255,255,150)');

    const gradient3 = this.context.createRadialGradient(this.width * .5, this.height * .5, 10, this.width * .5, this.height * .5, this.width);
    gradient3.addColorStop(.2, 'rgb(0,0,255)');
    gradient3.addColorStop(.4, 'rgb(200,255,0)');
    gradient3.addColorStop(.6, 'rgb(0,0,255)');
    gradient3.addColorStop(.8, 'rgb(0,0,0)');

    this.context.fillStyle = gradient2;


    this.context.fillText(
      'FS', 
      // 'JS', 
      this.width * .5, 
      this.height * .5,
      // max width of text
      this.width * .8
    );

  }

  init() {
    // create flow field
    this.rows = Math.floor(this.height / this.cellSize);
    this.cols = Math.floor(this.width / this.cellSize);
    this.flowField = [];

    // draw text
    this.drawText();

    // scan pixel data
    // An array of int, elements are groups of 4, each group is a pixel.
    // The 4 in the group are int values of:
    // * red
    // * green
    // * blue
    // * alpha
    const pixels = this.context.getImageData(0, 0, this.width, this.height).data;
    console.log({pixels})
    for (let y = 0; y < this.height; y += this.cellSize) {
      for (let x = 0; x < this.width; x += this.cellSize) {
        const index = (y * this.width + x) * 4;
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const alpha = pixels[index + 3];
        const grayscale = (red + green + blue) / 3; // gray is equal parts of all; get a grey that's close to the average of all 3.
        // console.log({index, red, green, blue})
        // Take our grey, and convert to radians for an equivalent angle.
        // gray = 0 - 255
        // radians = 0 - 6.28
        // Take the ratio of grey, and make into a ratio of radians.
        const colorAngle = ((grayscale / 255) * 6.28).toFixed(2);
        // console.log({alpha})
        this.flowField.push({
          x,
          y,
          alpha,
          colorAngle,
        });
      }
    }
    console.log({ff: this.flowField})

    // Spirals - just here for comparison.
    // for (let y = 0; y < this.rows; y++) {
    //   for (let x = 0; x < this.cols; x++) {
    //     // Sin and Cosine spiral pattern.
    //     let angle = ((Math.cos(x * this.zoom) + Math.sin(y * this.zoom)) * 1) * this.curve;
    //     this.flowField.push(angle);
    //   }
    // }

    // create particles
    this.particles = [];
    for (let i = 0; i < this.numberOfParticles; i++) {
      this.particles.push(new Particle(this));
    }
    // Force particles to reset and attempt to start within letters. Gives a good surge effect at first.
    this.particles.forEach(particle => particle.reset());
  }

  render() {
    if (this.debug) {
      this.drawGrid(this.context);
      this.drawText();
    }
    this.particles.forEach(particle => {
      particle.draw(this.context);
      particle.update();
    })
  }

  drawGrid() {
    this.context.save()
    this.context.lineWidth = .3;
    for (let c = 0; c < this.cols; c++) {
      this.context.beginPath();
      this.context.moveTo(this.cellSize * c, 0);
      this.context.lineTo(this.cellSize * c, this.height);
      this.context.stroke();
    }
    for (let r = 0; r < this.rows; r++) {
      this.context.beginPath();
      this.context.moveTo(0, this.cellSize * r);
      this.context.lineTo(this.width, this.cellSize * r);
      this.context.stroke();
    }
    this.context.restore();
  }
}

const effect = new Effect(canvas, ctx);
effect.render();

function animate() {
  // clear old paint so new shapes don't streak.
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.height);

  effect.render();
  requestAnimationFrame(animate);
}
animate();