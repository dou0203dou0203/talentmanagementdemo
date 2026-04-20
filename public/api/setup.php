<?php
/**
 * ブラウザからpdfplumberをインストールするためのセットアップスクリプト
 * ※ 実行後はセキュリティのため必ず削除してください
 */

header('Content-Type: text/plain; charset=utf-8');

echo "=== Python Setup ===\n\n";

$pythonPaths = [];
for ($i = 12; $i >= 8; $i--) {
    $pythonPaths[] = "python3.$i";
    $pythonPaths[] = "/usr/bin/python3.$i";
    $pythonPaths[] = "/usr/local/bin/python3.$i";
}
$pythonPaths[] = 'python3';
$pythonPaths[] = '/usr/bin/python3';

$python = '';

foreach ($pythonPaths as $p) {
    // try to get version output
    $ver = shell_exec("$p --version 2>&1");
    // Only accept if version starts with Python 3.8+ 
    if ($ver && preg_match('/Python 3\.([8-9]|1[0-9])/', $ver)) {
        $python = $p;
        break;
    }
}

// Fallback to whatever we can find if none found
if (!$python) {
    foreach ($pythonPaths as $p) {
        if (shell_exec("$p --version 2>&1")) {
            $python = $p;
            break;
        }
    }
}


if (!$python) {
    echo "Error: Python3 が見つかりません\n";
    exit;
}

echo "Found Python: $python\n";
echo "Version: " . shell_exec("$python --version 2>&1") . "\n";

echo "\n=== Installing pdfplumber ===\n";
$output = shell_exec("$python -m pip install --user pdfplumber 2>&1");
echo $output;

echo "\n=== Verifying Installation ===\n";
$verify = shell_exec("$python -c \"import pdfplumber; print('pdfplumber OK:', pdfplumber.__version__)\" 2>&1");
echo $verify;

echo "\n=== Setting Permissions ===\n";
$chmodPy = shell_exec("chmod 755 parse_payroll.py 2>&1");
$chmodPhp = shell_exec("chmod 755 parse_payroll.php 2>&1");
echo "Permissions updated.\n";

echo "\nSetup Complete!\n";
