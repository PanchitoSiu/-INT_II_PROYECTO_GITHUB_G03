<?php
include 'conexion_Admi_Recep.php';

// Verificar si los datos fueron enviados
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // Consulta para verificar las credenciales
    $sql = "SELECT * FROM administrador WHERE username = '$username'";
    $result = $conn->query($sql);

    // Verificar si el usuario existe
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();

        // Verificar la contraseña (asegúrate de usar password_hash() en producción)
        if ($password == $row['password']) { // En un entorno real, usa password_verify() aquí
            // Iniciar sesión
            session_start();
            $_SESSION['username'] = $username;
            $_SESSION['role'] = 'administrador'; // Asigna el rol de Administrador
            // Redirigir a la página de gestión del Administrador
            header("Location: ../Interfaz/gestion_Admi_Recep.php"); 
            exit();
        } else {
            echo "Contraseña incorrecta";
        }
    } else {
        // Si no se encontró en la tabla de administradores, busca en la de recepcionistas
        $sql = "SELECT * FROM recepcionistas WHERE username = '$username'";
        $result = $conn->query($sql);

        // Verificar si el usuario existe
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();

            // Verificar la contraseña (asegúrate de usar password_hash() en producción)
            if ($password == $row['password']) { // En un entorno real, usa password_verify() aquí
                // Iniciar sesión
                session_start();
                $_SESSION['username'] = $username;
                $_SESSION['role'] = 'recepcionista'; // Asigna el rol de Recepcionista
                // Redirigir a la página de gestión del Recepcionista
                header("Location: ../Interfaz/gestion_Recepcionista.php"); 
                exit();
            } else {
                echo "Contraseña incorrecta";
            }
        } else {
            echo "Usuario no encontrado";
        }
    }
}

$conn->close();
?>
