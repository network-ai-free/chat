const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

const numParticles = 100;
const particles = [];

function randomVelocity() {
  return (Math.random() * 10 - 5);
}

function createParticles() {
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: randomVelocity(),
      vy: randomVelocity()
    });
  }
}

const mouse = { x: null, y: null };

window.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

function updateParticles(dt) {
  for (let p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
  }
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  const baseColor = 'rgba(255, 255, 255, ALPHA)';

  for (let i = 0; i < numParticles; i++) {
    const p1 = particles[i];
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();

    for (let j = i + 1; j < numParticles; j++) {
      const p2 = particles[j];
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 55) {
        const alpha = 1 - (dist / 55);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = baseColor.replace('ALPHA', alpha.toFixed(2));
        ctx.stroke();
      }
    }

    if (mouse.x !== null && mouse.y !== null) {
      const dx = mouse.x - p1.x;
      const dy = mouse.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 52) {
        const alpha = 1 - (dist / 52);
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = baseColor.replace('ALPHA', alpha.toFixed(2));
        ctx.stroke();
      }
    }
  }
}

let lastTime = performance.now();
function animate(time) {
  const dt = (time - lastTime) / 1000;
  lastTime = time;
  updateParticles(dt);
  draw();
  requestAnimationFrame(animate);
}

createParticles();
animate(lastTime);

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});