<?php
session_start(); // Inicia la sesión

// --- ¡GUARDIA DE SEGURIDAD! ---
// Asegura que el rol sea 'paciente' y que tengamos un 'user_id'
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'paciente' || !isset($_SESSION['user_id'])) {
    session_destroy();
    header("Location: panel_Admi_Recep.php");
    exit();
}

// Cerrar sesión
if (isset($_GET['logout'])) {
    session_destroy(); 
    header("Location: panel_Admi_Recep.php");
    exit();
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal de Paciente</title>
    <link rel="stylesheet" href="../Estilos/estilo_gestion_Admi_Recep.css">
</head>
<body>

    <div class="gestion-container">

        <div class="menu-options">
            
            <img src="../Imagenes/sonrie_logo.webp" alt="Logo Sonríe" class="logo">
            <h1>Portal de Paciente</h1>
            
            <div class="welcome-message">
                <h4>Bienvenido(a)</h4>
                <p><?php echo htmlspecialchars($_SESSION['username']); ?></p>
            </div>

            <h2>Opciones</h2>
            <div class="button-group">
                <button class="btn" id="btn-mis-citas-pac">Mis Citas Agendadas</button>
                <button class="btn" id="btn-lista-espera-pac">Lista de Espera</button>
                <button class="btn" id="btn-mis-reportes-pac">Visualizar Reportes/Archivos</button>
                
                <button class="btn" id="btn-modificar-perfil-pac" data-id="<?php echo htmlspecialchars($_SESSION['user_id']); ?>">
                    Modificar Datos Personales
                </button>
            </div>
            
            <a href="?logout=true" class="btn logout-btn">Cerrar Sesión</a>
        </div>

        <div class="action-area" id="actionArea">
            <div class="content-box">
                <h3>Portal de Paciente</h3>
                <p>Seleccione una opción del menú para comenzar.</p>
            </div>
        </div>

    </div>

    <script src="../JS/js_comun.js"></script>
    <script src="../JS/js_Paciente.js"></script> 
</body>
</html>