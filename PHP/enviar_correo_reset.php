<?php
session_start();
include 'conexion_Admi_Recep.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    
    $token = bin2hex(random_bytes(50));
    $expiry = date("Y-m-d H:i:s", strtotime('+1 hour'));

    $tablas = ['administrador', 'recepcionistas', 'odontologos', 'pacientes'];
    $encontrado = false;

    foreach ($tablas as $tabla) {
        $stmt = $conn->prepare("SELECT id FROM $tabla WHERE email = ?");
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $res = $stmt->get_result();

        if ($res->num_rows > 0) {
            $stmt_update = $conn->prepare("UPDATE $tabla SET reset_token = ?, token_expiry = ? WHERE email = ?");
            $stmt_update->bind_param('sss', $token, $expiry, $email);
            $stmt_update->execute();
            $encontrado = true;
            break; 
        }
    }

    if ($encontrado) {
        // Cambia esto por tu ruta real si es diferente
        $link = "http://localhost/ProyectoFinal_FranciscoCastaneda/Interfaz/restablecer_password.php?token=" . $token;
        
        $asunto = "Restablecer Contrasena - Clinica Sonrie";
        $mensaje = "Hola,\n\nHaz clic aqui para restablecer tu clave:\n" . $link;
        $headers = "From: panchoalmacenamiento05@gmail.com";

        if (mail($email, $asunto, $mensaje, $headers)) {
            // --- CAMBIO: Redirige con mensaje de ÉXITO ---
            header("Location: ../Interfaz/panel_Admi_Recep.php?status=sent");
        } else {
            // --- CAMBIO: Redirige con mensaje de ERROR DE ENVÍO ---
            header("Location: ../Interfaz/panel_Admi_Recep.php?error=mail_failed");
        }

    } else {
        // --- CAMBIO: Redirige con mensaje de USUARIO NO ENCONTRADO ---
        header("Location: ../Interfaz/panel_Admi_Recep.php?error=user_not_found");
    }
    $conn->close();
    exit();
}
?>

