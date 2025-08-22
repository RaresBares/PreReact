<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(0);

$file = __DIR__ . '/data.yml';
$data = yaml_parse_file($file);
if ($data === false) {
    http_response_code(500);
    echo json_encode(['status'=>'error','error'=>'YAML parse error beim Einlesen']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];
if (empty($body['action'])) {
    http_response_code(400);
    echo json_encode(['status'=>'error','error'=>'Invalid request, keine Action']);
    exit;
}

switch ($body['action']) {
    case 'add_item':
        $item = trim($body['item'] ?? '');
        if ($item === '') {
            http_response_code(400);
            echo json_encode(['status'=>'error','error'=>'Leeres Item']);
            exit;
        }
        $data['shopping'][] = $item;
        $response = ['status'=>'success','index'=>count($data['shopping'])-1];
        break;

    case 'delete_item':
        $idx = (int)($body['index'] ?? -1);
        if ($idx<0 || !isset($data['shopping'][$idx])) {
            http_response_code(400);
            echo json_encode(['status'=>'error','error'=>'Ungültiger Index']);
            exit;
        }
        array_splice($data['shopping'], $idx, 1);
        $response = ['status'=>'success'];
        break;

    case 'add_transaction':
        $date = trim($body['date'] ?? '');
        $type = trim($body['type'] ?? '');
        $amount = (float)($body['amount'] ?? 0);
        $receipts = $body['receipts'] ?? [];

        if (!in_array($type, ['in', 'out'], true)) {
            http_response_code(400);
            echo json_encode(['status'=>'error','error'=>'Ungültiger Typ']);
            exit;
        }
        if ($amount <= 0) {
            http_response_code(400);
            echo json_encode(['status'=>'error','error'=>'Betrag muss > 0 sein']);
            exit;
        }
        if ($date === '') {
            $date = date('Y-m-d');
        }

        $entry = [
            'date' => $date,
            'type' => $type,
            'amount' => $amount,
            'receipts' => ($type === 'out') ? (array)$receipts : [],
        ];

        $data['history'][] = $entry;
        $response = ['status' => 'success', 'index' => count($data['history']) - 1];
        break;

    default:
        http_response_code(400);
        echo json_encode(['status'=>'error','error'=>'Unknown action']);
        exit;
}

// YAML schreiben
$yaml = yaml_emit($data);
if ($yaml === false) {
    http_response_code(500);
    echo json_encode(['status'=>'error','error'=>'Fehler beim Serialisieren von YAML']);
    exit;
}

$result = @file_put_contents($file, $yaml, LOCK_EX);
if ($result === false) {
    $err = error_get_last();
    http_response_code(500);
    echo json_encode([
        'status'=>'error',
        'error'=>"File write error: " . ($err['message'] ?? 'unbekannt'),
        'path'=>$file,
        'writable'=> is_writable($file) ? 'ja' : 'nein'
    ]);
    exit;
}

echo json_encode($response);
