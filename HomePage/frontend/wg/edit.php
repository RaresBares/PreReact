<?php
session_start();
if (!($_SESSION['logged_in'] ?? false)) {
    header('Location: login.php');
    exit;
}

$file = __DIR__ . '/data.yml';
$data = yaml_parse_file($file);
if ($data === false) die('Fehler beim Einlesen von YAML');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach ($data['payments'] as $i => &$p) {
        $p['paid'] = isset($_POST['paid'][$i]);
    }
    file_put_contents($file, yaml_emit($data));
    header('Location: edit.php?success=1');
    exit;
}
?>
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Zahlungsstatus bearbeiten</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body {
      background: #0e0e0e;
      color: #f0f0f0;
      font-family: 'Segoe UI', sans-serif;
      padding: 2rem;
    }
    .card {
      background: #1a1a1a;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 0 20px rgba(0,0,0,0.6);
      max-width: 600px;
      margin: auto;
    }
    h2 {
      color: #4e73df;
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .form-check-label {
      color: #ddd;
    }
    .form-check-input:checked {
      background-color: #1cc88a;
      border-color: #1cc88a;
    }
    .btn-primary {
      background-color: #4e73df;
      border: none;
    }
    .btn-primary:hover {
      background-color: #3b5cc6;
    }
    .btn-secondary {
      background-color: #444;
      border: none;
    }
    .btn-secondary:hover {
      background-color: #666;
    }
    .alert-success {
      background-color: #1cc88a;
      color: #111;
      border: none;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2><i class="bi bi-pencil-square"></i> Zahlungsstatus bearbeiten</h2>

    <?php if (isset($_GET['success'])): ?>
      <div class="alert alert-success">Änderungen gespeichert.</div>
    <?php endif; ?>

    <form method="POST">
      <?php foreach ($data['payments'] as $i => $p): ?>
        <div class="form-check mb-2">
          <input class="form-check-input" type="checkbox" name="paid[<?= $i ?>]" id="p<?= $i ?>" <?= $p['paid'] ? 'checked' : '' ?>>
          <label class="form-check-label" for="p<?= $i ?>">
            <?= htmlspecialchars($p['name']) ?> (CHF <?= number_format($p['amount'], 2) ?>)
          </label>
        </div>
      <?php endforeach; ?>

      <div class="d-flex gap-2 mt-4">
        <button type="submit" class="btn btn-primary w-100">Speichern</button>
        <a href="index.php" class="btn btn-secondary w-100">Zurück</a>
      </div>
    </form>
  </div>
</body>
</html>
