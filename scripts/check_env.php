<?php
// Script de diagnóstico do ambiente A&L Talent
echo "=== PHP ===\n";
echo "Version: " . phpversion() . "\n";
echo "pdo_mysql: " . (extension_loaded('pdo_mysql') ? 'OK' : 'MISSING') . "\n";
echo "mysqli: " . (extension_loaded('mysqli') ? 'OK' : 'MISSING') . "\n";
echo "gd: " . (extension_loaded('gd') ? 'OK' : 'MISSING') . "\n";
echo "mbstring: " . (extension_loaded('mbstring') ? 'OK' : 'MISSING') . "\n";
echo "zip: " . (extension_loaded('zip') ? 'OK' : 'MISSING') . "\n";

echo "\n=== DB CONNECTION ===\n";
try {
    $pdo = new PDO('mysql:host=db;dbname=cats', 'ael_dev', 'ael_dev_2024');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connection: OK\n";
    $r = $pdo->query("SELECT COUNT(*) FROM setting");
    echo "Table 'setting': " . $r->fetchColumn() . " rows\n";
    $r2 = $pdo->query("SELECT COUNT(*) FROM user");
    echo "Table 'user': " . $r2->fetchColumn() . " rows\n";
    $r3 = $pdo->query("SELECT COUNT(*) FROM joborder");
    echo "Table 'joborder': " . $r3->fetchColumn() . " rows\n";
    $r4 = $pdo->query("SELECT COUNT(*) FROM candidate");
    echo "Table 'candidate': " . $r4->fetchColumn() . " rows\n";
    // Check career portal status
    $r5 = $pdo->query("SELECT name, value FROM setting WHERE name IN ('careerPortalEnabled','careerPortalActiveBoard') LIMIT 10");
    echo "\n=== Career Portal Settings ===\n";
    foreach ($r5 as $row) {
        echo $row['name'] . " = " . $row['value'] . "\n";
    }
} catch (Exception $e) {
    echo "Connection FAILED: " . $e->getMessage() . "\n";
}

echo "\n=== UPLOAD DIRS ===\n";
$dirs = ['/var/www/html/upload', '/var/www/html/attachments'];
foreach ($dirs as $d) {
    echo $d . ": " . (is_writable($d) ? 'writable' : 'NOT WRITABLE') . "\n";
}

echo "\n=== ADMIN USER ===\n";
try {
    $stmt = $pdo->query("SELECT user_name, email, access_level FROM user LIMIT 5");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "user=" . $row['user_name'] . " email=" . $row['email'] . " level=" . $row['access_level'] . "\n";
    }
} catch (Exception $e) {
    echo "Query failed: " . $e->getMessage() . "\n";
}
