<?php
include '../PHP/conexion_Admi_Recep.php';

$token = $_GET['token'] ?? '';
$token_valido = false;

if ($token) {
    $tablas = ['administrador', 'recepcionistas', 'odontologos', 'pacientes'];
    $fecha_actual = date("Y-m-d H:i:s");

    foreach ($tablas as $tabla) {
        $stmt = $conn->prepare("SELECT id FROM $tabla WHERE reset_token = ? AND token_expiry > ?");
        $stmt->bind_param('ss', $token, $fecha_actual);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res->num_rows > 0) {
            $token_valido = true;
            break;
        }
    }
}

if (!$token_valido) {
    die("<h2 style='text-align:center; margin-top:50px; font-family:sans-serif;'>Enlace inválido o expirado. <br><a href='recuperar_cuenta.php'>Solicitar uno nuevo</a></h2>");
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva Contraseña</title>
    <link rel="stylesheet" href="../Estilos/estilo_Admi_Recep.css">
</head>
<body>
    <div class="login-wrapper">
        <img src="../Imagenes/sonrie_logo.webp" alt="Logo Sonríe" class="logo">
        <div class="panel-container">
            <div class="login-form">
                <h1>Nueva Contraseña</h1>
                <form action="../PHP/guardar_nuevo_pass.php" method="POST">
                    <input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">
                    
                    <div class="input-group">
                        <label for="password">Nueva Contraseña</label>
                        <input type="password" id="password" name="password" required minlength="4">
                    </div>
                    <div class="input-group">
                        <label for="confirm_password">Confirmar Contraseña</label>
                        <input type="password" id="confirm_password" name="confirm_password" required minlength="4">
                    </div>
                    
                    <button type="submit" class="btn">Guardar Cambios</button>
                </form>
            </div>
        </div>
    </div>
</body>
</html>