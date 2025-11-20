<?php
// Datos de conexión al servidor local de XAMPP
$host = "localhost";      // Servidor (por defecto en XAMPP)
$usuario = "root";        // Usuario por defecto de XAMPP
$contrasena = "";         // Contraseña vacía por defecto
$base_datos = "bsdt_sonrie_odonto"; // Tu base de datos

// Crear conexión
$conn = new mysqli($host, $usuario, $contrasena, $base_datos);

// Verificar conexión
if ($conn->connect_error) {
    die("❌ Error de conexión: " . $conn->connect_error);
} else {
    // Puedes descomentar la línea de abajo si quieres probar visualmente que se conecta:
    // echo "✅ Conexión exitosa a la base de datos $base_datos";
}
?>
