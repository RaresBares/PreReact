<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Prereact – Intelligente Lösungen</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  canvas#netCanvas {
    position: fixed;
    top: 0; left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 0;
  }
</style>
</head>
<body class="bg-black text-white overflow-x-hidden">

<?php include $_SERVER['DOCUMENT_ROOT']. '/dev/storemate/navbar_storemate.html'; ?>

<canvas id="netCanvas"></canvas>

<script>
  // Netzwerk-Hintergrund animation script
  const canvas = document.getElementById('netCanvas'),
        ctx = canvas.getContext('2d');
  let w, h, points = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    points = [];
    for (let i = 0; i < 100; i++) {
      points.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
      });
    }
  }
  window.addEventListener('resize', resize);
  resize();

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < points.length; i++) {
      let p = points[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#aaa';
      ctx.fill();
      for (let j = i + 1; j < points.length; j++) {
        let q = points[j], dx = p.x - q.x, dy = p.y - q.y;
        let dist = Math.hypot(dx, dy);
        if (dist < 100) {
          ctx.strokeStyle = `rgba(255,255,255,${1 - dist / 100})`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
</script>

</body>
</html>
