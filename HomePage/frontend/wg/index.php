<?php
ini_set('display_errors', 0);
error_reporting(0);

$data = yaml_parse_file(__DIR__ . '/data.yml');
if ($data === false) {
    die('Fehler beim Einlesen der YAML.');
}

$payments = $data['payments'] ?? [];
$shopping = $data['shopping'] ?? [];
$history = $data['history'] ?? [];

$balance = 0;
foreach ($history as $h) {
    $balance += ($h['type'] === 'in') ? $h['amount'] : -$h['amount'];
}

?>
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HWC 33 – PennerWG</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" rel="stylesheet">
  <style>
    :root {
      --bg: #121212;
      --card-bg: #1e1e1e;
      --text: #e0e0e0;
      --primary: #4e73df;
      --success: #1cc88a;
      --danger:  #e74a3b;
    }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Segoe UI', sans-serif;
    }
    .card-section {
      background: var(--card-bg);
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 .5rem 1rem rgba(0,0,0,.5);
    }
    .person-entry {
      border-radius: .75rem;
      margin-bottom: .75rem;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: transform .3s, box-shadow .3s;
    }
    .person-entry.paid { background: linear-gradient(to left, var(--success), #a8e6cf); }
    .person-entry.unpaid { background: linear-gradient(to left, var(--danger), #f8cdc7); }
    .person-entry:hover {
      transform: translateY(-4px);
      box-shadow: 0 .75rem 1.25rem rgba(0,0,0,.7);
    }
    .person-entry strong {
      color: #111 !important;
    }
    .shopping-input .form-control {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      background: #2e2e2e;
      border: 1px solid #444;
      color: var(--text);
    }
    .shopping-input .btn {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      background: var(--primary);
      border: none;
    }
    .shopping-item {
      background: #2e2e2e;
      border: 1px solid #444;
      border-radius: .5rem;
      margin-bottom: .5rem;
      padding: .75rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: transform .3s, background .3s;
      color: var(--text);
    }
    .shopping-item:hover {
      transform: translateX(4px);
      background: #3a3a3a;
    }
	.person {
  position: relative;
  padding: 0 0.2rem;
  color: var(--text);
}
.person.removed {
  color: var(--danger);
  text-decoration: line-through;
  text-decoration-thickness: 3px; /* oder z. B. 'from-font', 'auto', '0.15em' */
}



    .btn-trash {
      background: transparent;
      border: none;
      color: var(--danger);
      font-size: 1.2rem;
      transition: color .2s;
    }
    .btn-trash:hover { color: #ff6b6b; }
    .stats-item {
      background: #2a2a2a;
      border-radius: .5rem;
      padding: 1rem;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .stats-item.centered { align-items: center; }
    .stats-item h5 {
      color: var(--primary);
      margin-bottom: .5rem;
      text-transform: uppercase;
      letter-spacing: .05em;
    }
    .stats-item .balance {
      color: var(--text);
      font-size: 2rem;
      font-weight: bold;
      margin: 0;
      text-align: center;
      width: 100%;
    }
    .stats-item .bank-details,
    .stats-item .twint {
      color: var(--text);
      margin: .5rem 0 0 0;
      line-height: 1.4;
    }
    .copy-wrapper {
      display: inline-flex;
      align-items: center;
      gap: .25rem;
      cursor: pointer;
      color: var(--text);
    }
    .copy-wrapper i {
      font-size: 1rem;
      color: var(--text);
    }
    .copy-wrapper:hover i { color: var(--primary); }

    .history-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }
    .history-table th, .history-table td {
      padding: 0.75rem 1rem;
      text-align: left;
    }
    .history-table th {
      background: var(--primary);
      color: #fff;
      text-transform: uppercase;
      font-size: 0.85rem;
      letter-spacing: 0.05em;
    }
    .history-table td {
      background: #2e2e2e;
      color: var(--text);
      border-bottom: 1px solid #444;
    }
	
	.history-table th,
.history-table td {
  padding: 0.75rem 1rem;
  text-align: center; /* ← vorher: left */
}
    .history-table td.income {
      color: var(--success);
      font-weight: bold;
    }
    .history-table td.expense {
      color: var(--danger);
      font-weight: bold;
    }
    .history-table td.balance-cell {
      font-weight: bold;
      text-align: center;
    }
    .receipts a {
      font-size: 1.3rem;
      text-decoration: none;
      margin-right: 0.3rem;
    }
  </style>
</head>
<body class="p-3">
  <div class="container">

    <div class="card-section">
      <h2 class="text-center mb-4" style="color: var(--primary)">
        <i class="bi bi-wallet2"></i> payment overview
      </h2>
      <?php foreach ($payments as $p): ?>
        <div class="person-entry <?= $p['paid'] ? 'paid' : 'unpaid' ?>">
          <div><strong><?= htmlspecialchars($p['name'], ENT_QUOTES) ?></strong></div>
          <div>CHF <?= number_format($p['amount'], 2) ?></div>
        </div>
      <?php endforeach; ?>
    </div>

    <div class="card-section">
      <h2 class="text-center mb-3" style="color: var(--primary)">
        <i class="bi bi-cart-check"></i> shopping list
      </h2>
      <div class="input-group mb-3 shopping-input">
        <input type="text" id="itemInput" class="form-control" placeholder="new element...">
        <button class="btn btn-primary" id="addBtn"><i class="bi bi-plus-lg"></i></button>
      </div>
      <ul id="shoppingList" class="list-group">
        <?php foreach ($shopping as $idx => $item): ?>
          <li class="list-group-item shopping-item" data-idx="<?= $idx ?>">
            <span><?= htmlspecialchars($item, ENT_QUOTES) ?></span>
            <button class="btn-trash" onclick="deleteItem(<?= $idx ?>)"><i class="bi bi-trash-fill"></i></button>
          </li>
        <?php endforeach; ?>
      </ul>
    </div>

    <div class="card-section">
      <h2 class="text-center mb-4" style="color: var(--primary)">
        <i class="bi bi-piggy-bank"></i> current stats
      </h2>
      <div class="row g-3">
        <div class="col-md-6">
          <div class="stats-item centered">
            <h5>current balance</h5>
            <p class="balance">CHF <?= number_format($balance, 2) ?></p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="stats-item">
            <h5>bank details</h5>
            <p class="bank-details">
              Account holder:<br>
              <strong>Rares Sahleanu</strong><br><br>
              IBAN:<br>
              <span class="copy-wrapper" data-copy="CH30 0070 0114 9006 2340 1" title="Kopieren">
                <code>CH30 0070 0114 9006 2340 1</code> <i class="bi bi-clipboard"></i>
              </span><br><br>
              BIC/SWIFT:<br>
              <span class="copy-wrapper" data-copy="ZKBKCHZZ80A" title="Kopieren">
                <code>ZKBKCHZZ80A</code> <i class="bi bi-clipboard"></i>
              </span><br><br>
              Bank:<br>
              Zürcher Kantonalbank
            </p>
            <div class="twint">
              <i class="bi bi-phone"></i>
              pay via TWINT:
              <span class="copy-wrapper" data-copy="+41763616185" title="Kopieren">
                +41 76 361 61 85 <i class="bi bi-clipboard"></i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card-section">
      <h2 class="text-center mb-4" style="color: var(--primary)">
        <i class="bi bi-clock-history"></i> transaction history
      </h2>
      <div class="table-responsive">
        <table class="history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Receipts</th>
              <th>Balance after</th>
            </tr>
          </thead>
          <tbody>
            <?php
              $running = 0;
              foreach ($history as $h):
                $running += ($h['type'] === 'in') ? $h['amount'] : -$h['amount'];
            ?>
              <tr>
                <td><?= htmlspecialchars($h['date'], ENT_QUOTES) ?></td>
                <td class="<?= $h['type'] === 'in' ? 'income' : 'expense' ?>">
                  <?= $h['type'] === 'in' ? '+' : '−' ?> CHF <?= number_format($h['amount'], 2) ?>
                </td>
                <td class="receipts">
                  <?php if ($h['type'] === 'out'): ?>
                    <?php foreach ($h['receipts'] ?? [] as $r): ?>
						<a href="receipts/<?= htmlspecialchars($r, ENT_QUOTES) ?>" target="_blank">📄</a>
					<?php endforeach; ?>

                  <?php else: ?>–<?php endif; ?>
                </td>
                <td class="balance-cell">CHF <?= number_format($running, 2) ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
<div class="card-section text-center">
  <h2 class="mb-3" style="color: var(--primary)">
    <i class="bi bi-diagram-3"></i> cleaning order – reverse alphabetical
  </h2>

  <div class="d-flex flex-wrap justify-content-center gap-2 chain" style="font-size: 1.1rem; font-weight: bold;">
    <span class="person">Rares</span> &rarr;
    <span class="person">Pia</span> &rarr;
    <span class="person removed">Nicolas</span> &rarr;
    <span class="person">Mengze</span> &rarr;
    <span class="person removed">Magdalena</span> &rarr;
    <span class="person">Fred</span> &rarr;
    <span class="person">Felix</span> &rarr;
    <span class="person removed">Duru</span> &rarr;
    <span class="person removed">Ding</span> &rarr;
    <span class="person">Alan</span>
  </div>

 <p class="mt-4 text-center text-secondary">
 Flatmates who are not home or are exempt from tasks for other reasons are crossed out.
</p>

</div>


  <script>
    document.querySelectorAll('.copy-wrapper').forEach(el => {
      el.addEventListener('click', () => {
        const text = el.getAttribute('data-copy');
        navigator.clipboard.writeText(text).then(() => {
          el.querySelector('i').classList.add('text-success');
          setTimeout(() => el.querySelector('i').classList.remove('text-success'), 1000);
        });
      });
    });

    const input = document.getElementById('itemInput');
    document.getElementById('addBtn').addEventListener('click', addItem);
    input.addEventListener('keypress', e => { if (e.key === 'Enter') addItem(); });

    async function addItem() {
      const value = input.value.trim();
      if (!value) return;
      try {
        const res = await fetch('save.php', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ action:'add_item', item:value })
        });
        const json = await res.json();
        if (json.status !== 'success') throw new Error(json.error || 'Unknown error');
        const ul = document.getElementById('shoppingList');
        const li = document.createElement('li');
        li.className = 'list-group-item shopping-item';
        li.dataset.idx = json.index;
        li.innerHTML = `<span>${value}</span><button class="btn-trash" onclick="deleteItem(${json.index})"><i class="bi bi-trash-fill"></i></button>`;
        ul.appendChild(li);
        input.value = '';
      } catch (e) {
        alert('Fehler: ' + e.message);
      }
    }

    async function deleteItem(idx) {
      try {
        const res = await fetch('save.php', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ action:'delete_item', index:idx })
        });
        const json = await res.json();
        if (json.status !== 'success') throw new Error(json.error || 'Unknown error');
        document.querySelector(`li[data-idx="${idx}"]`).remove();
        setTimeout(() => location.reload(), 200);
      } catch (e) {
        alert('Fehler: ' + e.message);
      }
    }
  </script>
</body>
</html>
