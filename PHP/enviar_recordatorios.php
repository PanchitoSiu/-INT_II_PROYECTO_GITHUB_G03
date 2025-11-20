<?php
// Este script puede ser llamado por AJAX (botón) o por Cron Job
session_start();
include 'conexion_Admi_Recep.php';
mysqli_set_charset($conn, 'utf8mb4');

// Configuración: Enviar recordatorio para citas en las próximas 24 horas
// Buscamos citas confirmadas, futuras, dentro de 1 dia, y que no tengan recordatorio enviado
$sql = "SELECT c.id, c.appointment_date, 
        p.nombre_completo AS paciente, p.email, 
        o.nombre_completo AS odontologo
        FROM citas c
        JOIN pacientes p ON c.paciente_id = p.id
        JOIN odontologos o ON c.odontologo_id = o.id
        WHERE c.status = 'confirmada' 
        AND c.recordatorio_enviado = 0
        AND c.appointment_date > NOW()
        AND c.appointment_date <= DATE_ADD(NOW(), INTERVAL 1 DAY)";

$result = $conn->query($sql);
$count = 0;

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $to = $row['email'];
        $paciente = $row['paciente'];
        $doctor = $row['odontologo'];
        $fecha = date('d/m/Y H:i', strtotime($row['appointment_date']));

        $asunto = "Recordatorio de Cita - Clinica Sonrie";
        $mensaje = "Hola $paciente,\n\n";
        $mensaje .= "Te recordamos que tienes una cita programada para mañana.\n\n";
        $mensaje .= "Detalles:\n";
        $mensaje .= "- Odontologo: $doctor\n";
        $mensaje .= "- Fecha y Hora: $fecha\n\n";
        $mensaje .= "Por favor, recuerda llegar puntual. Si no puedes asistir, contactanos para reagendar.";
        $headers = "From: no-reply@clinicasonrie.com";

        // Intentar enviar correo
        if (mail($to, $asunto, $mensaje, $headers)) {
            // Si se envió, marcamos la cita como "recordatorio enviado"
            $update = $conn->prepare("UPDATE citas SET recordatorio_enviado = 1 WHERE id = ?");
            $update->bind_param('i', $row['id']);
            $update->execute();
            $count++;
        }
    }
}

// Respuesta JSON para el botón manual
header('Content-Type: application/json');
echo json_encode([
    'status' => 'success', 
    'message' => "Proceso finalizado. Se enviaron $count recordatorios."
]);

$conn->close();
?>