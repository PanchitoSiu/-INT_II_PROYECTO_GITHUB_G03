<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperar Contraseña</title>
    <link rel="stylesheet" href="../Estilos/estilo_Admi_Recep.css"> <style>
        /* Pequeño ajuste para centrar el texto extra */
        .login-form p { text-align: center; margin-top: 15px; }
        .login-form a { color: #38BCAE; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <div class="login-wrapper">
        <img src="../Imagenes/sonrie_logo.webp" alt="Logo Sonríe" class="logo">
        <div class="panel-container">
            <div class="login-form">
                <h1>Recuperar Contraseña</h1>
                <p style="color: #666; font-size: 0.9rem; margin-bottom: 20px;">
                    Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu clave.
                </p>

                <form action="../PHP/enviar_correo_reset.php" method="POST">
                    <div class="input-group">
                        <label for="email">Correo Electrónico</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <button type="submit" class="btn">Enviar Enlace</button>
                </form>

                <p><a href="panel_Admi_Recep.php">Volver al Inicio de Sesión</a></p>
            </div>
        </div>
    </div>
</body>
</html>