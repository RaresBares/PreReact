<?php
session_start();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($_POST['password'] === 'raresbares') {
        $_SESSION['logged_in'] = true;
        header('Location: edit.php');
        exit;
    } else {
        $error = "Falsches Passwort.";
    }
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Login</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">
  <style>
    body {
      background-color: #0e0e0e;
      color: #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-family: 'Segoe UI', sans-serif;
    }
    .login-box {
      background: #1a1a1a;
      border-radius: 1rem;
      padding: 2.5rem;
      box-shadow: 0 0 30px rgba(0,0,0,0.6);
      width: 100%;
      max-width: 400px;
    }
    .form-control {
      background-color: #2c2c2c;
      border: 1px solid #444;
      color: #fff;
    }
    .form-control:focus {
      background-color: #2c2c2c;
      color: #fff;
      border-color: #4e73df;
      box-shadow: 0 0 0 0.2rem rgba(78, 115, 223, 0.25);
    }
    .form-label {
      color: #ccc;
    }
    .btn-primary {
      background-color: #4e73df;
      border: none;
    }
    .btn-primary:hover {
      background-color: #3b5cc6;
    }
    h2 {
      color: #4e73df;
    }
    .alert-danger {
      background-color: #e74a3b;
      border: none;
      color: #fff;
    }
  </style>
</head>
<body>
  <div class="login-box">
    <h2 class="mb-4 text-center"><i class="bi bi-shield-lock"></i> Login</h2>
    <?php if (!empty($error)): ?>
      <div class="alert alert-danger"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    <form method="POST">
      <div class="mb-3">
        <label for="password" class="form-label">Passwort</label>
        <input type="password" class="form-control" id="password" name="password" required autofocus>
      </div>
      <button type="submit" class="btn btn-primary w-100">Einloggen</button>
    </form>
  </div>
</body>
</html>
