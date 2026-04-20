<?php
/**
 * 給与PDF解析APIエンドポイント
 * PHPがPDFファイルを受け取り、Pythonのpdfplumberで解析してJSONを返す
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// プリフライトリクエスト対応
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'POSTリクエストのみ受け付けます'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'PDFファイルを送信してください'], JSON_UNESCAPED_UNICODE);
    exit;
}

$uploadedFile = $_FILES['file']['tmp_name'];
$mimeType = mime_content_type($uploadedFile);

if ($mimeType !== 'application/pdf') {
    http_response_code(400);
    echo json_encode(['error' => 'PDFファイルのみ受け付けます'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Pythonスクリプトのパス（このPHPファイルと同じディレクトリ）
$scriptDir = __DIR__;
$pythonScript = $scriptDir . '/parse_payroll.py';

if (!file_exists($pythonScript)) {
    http_response_code(500);
    echo json_encode(['error' => 'Pythonスクリプトが見つかりません'], JSON_UNESCAPED_UNICODE);
    exit;
}

// 一時ファイルにコピー（pdfplumberが直接読めるように拡張子を付ける）
$tmpFile = tempnam(sys_get_temp_dir(), 'payroll_') . '.pdf';
copy($uploadedFile, $tmpFile);

// Pythonを実行
// XServerではpython3.xのパスが異なる場合があるので複数試す
$pythonPaths = ['python3', '/usr/bin/python3', '/usr/local/bin/python3', 'python'];
$output = '';
$exitCode = 1;

foreach ($pythonPaths as $python) {
    $cmd = escapeshellcmd($python) . ' ' . escapeshellarg($pythonScript) . ' ' . escapeshellarg($tmpFile) . ' 2>&1';
    $output = shell_exec($cmd);
    
    if ($output !== null) {
        // JSONとして解析できるか確認
        $decoded = json_decode($output, true);
        if ($decoded !== null && isset($decoded['pages'])) {
            $exitCode = 0;
            break;
        }
    }
}

// 一時ファイル削除
@unlink($tmpFile);

if ($exitCode !== 0 || $output === null) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Python実行に失敗しました',
        'detail' => $output ?: 'No output',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 成功 → PythonのJSON出力をそのまま返す
echo $output;
