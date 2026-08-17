<?php
try {
    $pdo = new PDO('mysql:host=db;dbname=cats', 'ael_dev', 'ael_dev_2024');
    echo "DB OK\n";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables: " . count($tables) . "\n";
    foreach ($tables as $t) {
        echo "  - $t\n";
    }
} catch(Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
