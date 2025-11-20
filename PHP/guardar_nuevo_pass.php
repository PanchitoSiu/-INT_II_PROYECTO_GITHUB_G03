<?php
include 'conexion_Admi_Recep.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['token'];
    $password = $_POST['password'];
    $confirm = $_POST['confirm_password'];

    if ($password !== $confirm) {
        echo "<script>alert('Las contraseñas no coinciden.'); window.history.back();</script>";
        exit;
    }

    // Encriptar la nueva contraseña
    $new_hash = password_hash($password, PASSWORD_DEFAULT);
    $fecha_actual = date("Y-m-d H:i:s");
    $tablas = ['administrador', 'recepcionistas', 'odontologos', 'pacientes'];
    $actualizado = false;

    foreach ($tablas as $tabla) {
        // Verificar token válido de nuevo
        $stmt = $conn->prepare("SELECT id FROM $tabla WHERE reset_token = ? AND token_expiry > ?");
        $stmt->bind_param('ss', $token, $fecha_actual);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            // Actualizar contraseña y BORRAR el token (un solo uso)
            $update = $conn->prepare("UPDATE $tabla SET password = ?, reset_token = NULL, token_expiry = NULL WHERE reset_token = ?");
            $update->bind_param('ss', $new_hash, $token);
            $update->execute();
            $actualizado = true;
            break;
        }
    }

    if ($actualizado) {
        echo "<script>alert('¡Contraseña actualizada con éxito!'); window.location='../Interfaz/panel_Admi_Recep.php';</script>";
    } else {
        echo "<script>alert('Error: El enlace ha expirado o ya fue usado.'); window.location='../Interfaz/panel_Admi_Recep.php';</script>";
    }
}
?>