<?php
// No iniciamos session_start() aquí porque los archivos principales ya lo hacen.

function registrarAuditoria($conn, $accion, $detalles) {
    // Obtener datos del usuario actual (si existe sesión)
    $usuario = $_SESSION['username'] ?? 'Desconocido';
    $rol = $_SESSION['role'] ?? 'Sistema';
    
    // Obtener IP del cliente
    $ip = $_SERVER['REMOTE_ADDR'];

    // Preparar la consulta
    $stmt = $conn->prepare("INSERT INTO auditoria (usuario, rol, accion, detalles, ip) VALUES (?, ?, ?, ?, ?)");
    
    if ($stmt) {
        $stmt->bind_param("sssss", $usuario, $rol, $accion, $detalles, $ip);
        $stmt->execute();
        $stmt->close();
    }
}
?>