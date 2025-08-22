<?php
session_start();
$auth_base = getenv('AUTH_API') ?: 'http://authentification-backend:8101';
$error_msg = '';
$success_msg = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $username   = trim($_POST['username'] ?? '');
  $email      = strtolower(trim($_POST['email'] ?? ''));
  $first_name = trim($_POST['first_name'] ?? '');
  $last_name  = trim($_POST['last_name'] ?? '');
  $password   = $_POST['password'] ?? '';
  $password2  = $_POST['password2'] ?? '';

  if ($password !== $password2) {
    $error_msg = 'Passwörter stimmen nicht überein.';
  } elseif ($username === '' || $email === '' || $first_name === '' || $last_name === '' || $password === '') {
    $error_msg = 'Bitte alle Felder ausfüllen.';
  } else {
    $payload = json_encode([
      'username'   => $username,
      'email'      => $email,
      'first_name' => $first_name,
      'last_name'  => $last_name,
      'password'   => $password,
    ], JSON_UNESCAPED_SLASHES);

    $ch = curl_init(rtrim($auth_base, '/') . '/register');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http === 200) {
      $data = json_decode($response, true);
      if (isset($data['message']) && $data['message'] === 'registered, verify email') {
        $success_msg = 'Registrierung erfolgreich. Bitte E-Mail prüfen und verifizieren.';
      } elseif (isset($data['message']) && $data['message'] === 'registered') {
        $success_msg = 'Registrierung erfolgreich. E-Mail-Verifizierung ist deaktiviert.';
      } else {
        $success_msg = 'Registrierung erfolgreich.';
      }
    } elseif ($http === 400) {
      $data = json_decode($response, true);
      $detail = is_array($data) && isset($data['detail']) ? (string)$data['detail'] : '';
      if ($detail === 'username or email exists') {
        $error_msg = 'Benutzername oder E-Mail existiert bereits.';
      } else {
        $error_msg = 'Registrierung fehlgeschlagen.';
      }
    } elseif ($http === 0) {
      $error_msg = 'Keine Verbindung zum Auth-Server.';
    } else {
      $error_msg = 'Registrierung fehlgeschlagen.';
    }
  }
}
?>

<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Registrieren – Kundenportal</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    canvas#netCanvas { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0; }
  </style>
</head>
<body class="bg-black text-white overflow-x-hidden">
<?php include './assets/navbar.html'; ?>

  <canvas id="netCanvas"></canvas>

  <main class="relative z-10 flex items-center justify-center min-h-screen px-4">
    <form method="post" class="bg-white/5 border border-white/10 p-8 rounded-2xl w-full max-w-lg shadow-lg backdrop-blur-md">
      <h1 class="text-3xl font-bold text-center mb-6">Konto erstellen</h1>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="block">
          <span class="text-sm text-gray-300">Benutzername</span>
          <input type="text" name="username" required class="w-full mt-1 p-3 rounded bg-black/30 text-white border border-white/10" />
        </label>
        <label class="block">
          <span class="text-sm text-gray-300">E-Mail</span>
          <input type="email" name="email" required class="w-full mt-1 p-3 rounded bg-black/30 text-white border border-white/10" />
        </label>
        <label class="block">
          <span class="text-sm text-gray-300">Vorname</span>
          <input type="text" name="first_name" required class="w-full mt-1 p-3 rounded bg-black/30 text-white border border-white/10" />
        </label>
        <label class="block">
          <span class="text-sm text-gray-300">Nachname</span>
          <input type="text" name="last_name" required class="w-full mt-1 p-3 rounded bg-black/30 text-white border border-white/10" />
        </label>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <label class="block">
          <span class="text-sm text-gray-300">Passwort</span>
          <input type="password" name="password" required class="w-full mt-1 p-3 rounded bg-black/30 text-white border border-white/10" />
        </label>
        <label class="block">
          <span class="text-sm text-gray-300">Passwort wiederholen</span>
          <input type="password" name="password2" required class="w-full mt-1 p-3 rounded bg-black/30 text-white border border-white/10" />
        </label>
      </div>

      <button type="submit" class="mt-6 w-full bg-white/10 hover:bg-white/20 transition-colors p-3 rounded font-semibold">Registrieren</button>

      <?php if (!empty($error_msg)): ?>
        <p class="mt-6 text-red-500 text-sm text-center"><?php echo htmlspecialchars($error_msg, ENT_QUOTES, 'UTF-8'); ?></p>
      <?php endif; ?>
      <?php if (!empty($success_msg)): ?>
        <p class="mt-6 text-green-400 text-sm text-center"><?php echo htmlspecialchars($success_msg, ENT_QUOTES, 'UTF-8'); ?></p>
        <p class="mt-2 text-center text-sm"><a href="login.php" class="underline text-gray-300">Zum Login</a></p>
      <?php endif; ?>

      <div class="text-sm text-center mt-4 space-y-2">
        <a href="login.php" class="text-gray-400 hover:underline">Bereits ein Konto? Einloggen</a><br>
        <a href="forgot.php" class="text-gray-400 hover:underline">Passwort vergessen?</a>
      </div>
    </form>
  </main>

  <script>
    const canvas = document.getElementById('netCanvas'), ctx = canvas.getContext('2d');
    let w, h, points = [];
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      points = [];
      for (let i = 0; i < 100; i++) {
        points.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4 });
      }
    }
    window.addEventListener('resize', resize); resize();
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < points.length; i++) {
        let p = points[i];
        p.x += p.vx; p.y += p.vy;
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
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
  </script>
</body>
</html>
