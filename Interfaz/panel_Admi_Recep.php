<?php
session_start();

// --- LÓGICA DE MENSAJES (Login y Recuperación) ---
$msg_text = "";
$msg_type = ""; // 'error' o 'success'

// 1. Errores de Login
if (isset($_GET['error'])) {
    if ($_GET['error'] == 'invalido') {
        $msg_text = "Usuario o contraseña incorrecta.";
        $msg_type = "error";
    } elseif ($_GET['error'] == 'vacío') {
        $msg_text = "Por favor, complete todos los campos.";
        $msg_type = "error";
    } elseif ($_GET['error'] == 'user_not_found') {
        $msg_text = "No encontramos una cuenta con ese correo.";
        $msg_type = "error";
    } elseif ($_GET['error'] == 'mail_failed') {
        $msg_text = "Error al enviar el correo. Intente más tarde.";
        $msg_type = "error";
    }
}

// 2. Mensajes de Éxito (Recuperación)
if (isset($_GET['status'])) {
    if ($_GET['status'] == 'sent') {
        $msg_text = "¡Enlace enviado! Revisa tu correo.";
        $msg_type = "success"; // Tipo 'success' para color verde
    } elseif ($_GET['status'] == 'password_updated') {
        $msg_text = "Contraseña actualizada correctamente. Inicia sesión.";
        $msg_type = "success";
    }
}
// --- FIN DE LÓGICA ---

if (isset($_SESSION['username']) && isset($_SESSION['role'])) {
    // (Tu lógica de redirección de roles va aquí igual que antes...)
    if ($_SESSION['role'] == 'admin') { header("Location: gestion_Admi_Recep.php"); exit(); }
    elseif ($_SESSION['role'] == 'recepcionista') { header("Location: gestion_Recepcionista.php"); exit(); }
    elseif ($_SESSION['role'] == 'odontologo') { header("Location: gestion_Odontologo.php"); exit(); }
    elseif ($_SESSION['role'] == 'paciente') { header("Location: gestion_Paciente.php"); exit(); }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración</title>
    <link rel="stylesheet" href="../Estilos/estilo_Admi_Recep.css">
</head>
<body>

    <div class="login-wrapper">
        <img src="../Imagenes/sonrie_logo.webp" alt="Logo Sonríe" class="logo">

        <div class="panel-container">
            <div class="login-form">
                <h1>Panel de Administración</h1>
                <h2>Iniciar Sesión</h2>
                
                <?php if (!empty($msg_text)): ?>
                    <div class="<?php echo ($msg_type == 'success') ? 'success-message' : 'error-message'; ?>">
                        <?php echo $msg_text; ?>
                    </div>
                <?php endif; ?>
                <form action="../PHP/procesar_login.php" method="POST" id="loginForm">
                    <div class="input-group">
                        <label for="username">Usuario</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div class="input-group">
                        <label for="password">Contraseña</label>
                        <input type="password" id="password" name="password" required>
                    </div>

                    <div style="text-align: right; margin-bottom: 15px;">
                        <a href="recuperar_cuenta.php" style="color: #38BCAE; font-size: 0.9rem; text-decoration: none;">¿Olvidaste tu contraseña?</a>
                    </div>

                    <button type="submit" class="btn">Ingresar</button>
                </form>
            </div>
        </div>
    </div>
</body>
</html>