<?php
session_start();
include 'conexion_Admi_Recep.php';
include 'funciones_auditoria.php'; // <--- ¡NUEVO!

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

if (empty($username) || empty($password)) {
    header('Location: ../Interfaz/panel_Admi_Recep.php?error=vacío');
    exit;
}

function verificarUsuario($conn, $tabla, $username, $password, $role_name) {
    $sql = "SELECT id, password FROM $tabla WHERE username = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $row = $result->fetch_assoc();
        $hash_guardado = $row['password'];

        if (password_verify($password, $hash_guardado)) {
            $_SESSION['username'] = $username;
            $_SESSION['role'] = $role_name; 
            $_SESSION['user_id'] = $row['id']; 
            
            // --- ¡HU14: REGISTRAR AUDITORÍA! ---
            registrarAuditoria($conn, 'LOGIN', "Usuario '$username' ($role_name) inició sesión exitosamente.");
            // -----------------------------------

            return true;
        }
    }
    $stmt->close();
    return false;
}

if (verificarUsuario($conn, 'administrador', $username, $password, 'admin')) {
    header('Location: ../Interfaz/gestion_Admi_Recep.php');
    exit;
}
if (verificarUsuario($conn, 'recepcionistas', $username, $password, 'recepcionista')) {
    header('Location: ../Interfaz/gestion_Recepcionista.php');
    exit;
}
if (verificarUsuario($conn, 'odontologos', $username, $password, 'odontologo')) {
    header('Location: ../Interfaz/gestion_Odontologo.php');
    exit;
}
if (verificarUsuario($conn, 'pacientes', $username, $password, 'paciente')) {
    header('Location: ../Interfaz/gestion_Paciente.php');
    exit;
}

$conn->close();
header('Location: ../Interfaz/panel_Admi_Recep.php?error=invalido');
exit;
?>