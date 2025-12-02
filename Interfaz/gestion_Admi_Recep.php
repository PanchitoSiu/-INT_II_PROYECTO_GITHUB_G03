<?php
session_start(); // Inicia la sesión

// --- GUARDIA DE SEGURIDAD ---
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
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
    <title>Gestión de Administración</title>
    <link rel="stylesheet" href="../Estilos/estilo_gestion_Admi_Recep.css?v=<?php echo time(); ?>">
</head>
<body>

    <div class="gestion-container">

        <div class="menu-options">
            <img src="../Imagenes/sonrie_logo.webp" alt="Logo Sonríe" class="logo">
            <h1>Gestión de Administración</h1>
            
            <div class="welcome-message">
                <h4>Bienvenido, Admin</h4>
                <p><?php echo htmlspecialchars($_SESSION['username']); ?></p>
            </div>

            <h2>Opciones</h2>
            <div class="button-group">
                <button class="btn" id="manageAppointments">Gestionar Citas</button>
                <button class="btn" id="waitingList">Lista de Espera</button>
                <button class="btn" id="generateReports">Generar Reportes</button>
                <button class="btn" id="manageUsers">Gestionar Usuarios</button>
                
                <button class="btn" id="manageServices" style="background-color: #17a2b8;">Servicios y Horarios</button>
                </div>
            
            <a href="?logout=true" class="btn logout-btn">Cerrar Sesión</a>
        </div>

        <div class="action-area" id="actionArea">
            <div class="content-box">
                <h3>Bienvenido al Panel de Control</h3>
                <p>Seleccione una opción del menú para comenzar.</p>
            </div>
        </div>

    </div>

    <script src="../JS/js_comun.js?v=<?php echo time(); ?>"></script>
    <script src="../JS/js_Admi_Recep.js?v=<?php echo time(); ?>"></script>

</body>
</html>