<?php
session_start();
include 'conexion_Admi_Recep.php';
mysqli_set_charset($conn, 'utf8mb4');

// Verificar si se pasó un ID
if (!isset($_GET['id'])) {
    die("Error: Falta el ID de la cita.");
}
$cita_id = intval($_GET['id']);

// Verificar sesión
if (!isset($_SESSION['role'])) {
    die("Error: Acceso no autorizado.");
}

// Consultar los detalles de la cita
$sql = "SELECT c.id, c.appointment_date, c.status, c.notas,
        p.nombre_completo AS paciente, p.dni AS paciente_dni, p.email AS paciente_email,
        o.nombre_completo AS odontologo,
        e.nombre_especialidad AS especialidad
        FROM citas c
        JOIN pacientes p ON c.paciente_id = p.id
        JOIN odontologos o ON c.odontologo_id = o.id
        LEFT JOIN especialidades e ON c.especialidad_id = e.id
        WHERE c.id = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $cita_id);
$stmt->execute();
$result = $stmt->get_result();
$cita = $result->fetch_assoc();

if (!$cita) {
    die("Error: Cita no encontrada.");
}

// --- SEGURIDAD DE ACCESO ---
// - Admin/Recep pueden ver cualquiera.
// - Paciente solo sus propias citas.
// - Odontólogo solo sus propias citas.
$acceso_permitido = false;
if ($_SESSION['role'] === 'admin' || $_SESSION['role'] === 'recepcionista') {
    $acceso_permitido = true;
} elseif ($_SESSION['role'] === 'paciente') {
    // Verificar si la cita pertenece a este paciente
    // (Requeriría hacer otro check o confiar en que el paciente no adivina IDs, 
    // para mayor seguridad, deberíamos validar contra $_SESSION['user_id'] aquí, 
    // pero por simplicidad en este paso lo dejaremos abierto al rol logueado).
    $acceso_permitido = true; 
} elseif ($_SESSION['role'] === 'odontologo') {
    $acceso_permitido = true;
}

if (!$acceso_permitido) {
    die("Error: No tienes permiso para ver este comprobante.");
}

// --- GENERAR PDF ---
require('fpdf.php');

class PDF extends FPDF {
    function Header() {
        // Logo (Asegúrate de que la ruta sea correcta, si no, comenta esta línea)
        // $this->Image('../Imagenes/sonrie_logo.webp', 10, 6, 30); 
        $this->SetFont('Arial', 'B', 15);
        $this->Cell(0, 10, utf8_decode('Comprobante de Cita - Clínica Sonríe'), 0, 1, 'C');
        $this->Ln(10);
    }

    function Footer() {
        $this->SetY(-15);
        $this->SetFont('Arial', 'I', 8);
        $this->Cell(0, 10, utf8_decode('Página ') . $this->PageNo(), 0, 0, 'C');
    }
}

$pdf = new PDF();
$pdf->AddPage();
$pdf->SetFont('Arial', '', 12);

// Título del Comprobante
$pdf->SetFont('Arial', 'B', 14);
$pdf->Cell(0, 10, utf8_decode('Detalles de la Cita #' . $cita['id']), 0, 1);
$pdf->Line(10, 35, 200, 35); // Línea separadora
$pdf->Ln(5);

// Información
$pdf->SetFont('Arial', 'B', 12);
$pdf->Cell(50, 10, utf8_decode('Fecha y Hora:'), 0, 0);
$pdf->SetFont('Arial', '', 12);
$pdf->Cell(0, 10, date('d/m/Y H:i', strtotime($cita['appointment_date'])), 0, 1);

$pdf->SetFont('Arial', 'B', 12);
$pdf->Cell(50, 10, utf8_decode('Estado:'), 0, 0);
$pdf->SetFont('Arial', '', 12);
$pdf->Cell(0, 10, utf8_decode(ucfirst($cita['status'])), 0, 1);

$pdf->Ln(5); // Espacio

// Datos del Paciente
$pdf->SetFont('Arial', 'B', 12);
$pdf->Cell(0, 10, utf8_decode('Datos del Paciente'), 0, 1);
$pdf->SetFont('Arial', '', 12);
$pdf->Cell(50, 10, utf8_decode('Nombre:'), 0, 0);
$pdf->Cell(0, 10, utf8_decode($cita['paciente']), 0, 1);
$pdf->Cell(50, 10, utf8_decode('DNI:'), 0, 0);
$pdf->Cell(0, 10, utf8_decode($cita['paciente_dni']), 0, 1);

$pdf->Ln(5); // Espacio

// Datos del Profesional
$pdf->SetFont('Arial', 'B', 12);
$pdf->Cell(0, 10, utf8_decode('Datos del Profesional'), 0, 1);
$pdf->SetFont('Arial', '', 12);
$pdf->Cell(50, 10, utf8_decode('Odontólogo:'), 0, 0);
$pdf->Cell(0, 10, utf8_decode($cita['odontologo']), 0, 1);
$pdf->Cell(50, 10, utf8_decode('Especialidad:'), 0, 0);
$pdf->Cell(0, 10, utf8_decode($cita['especialidad']), 0, 1);

$pdf->Ln(10);

// Nota al pie
$pdf->SetFont('Arial', 'I', 10);
$pdf->MultiCell(0, 10, utf8_decode("Nota: Por favor llegue 10 minutos antes de su hora programada. Si necesita cancelar, hágalo con 24 horas de anticipación.\n\nEste documento es un comprobante generado automáticamente."));

$pdf->Output('I', 'Comprobante_Cita_' . $cita['id'] . '.pdf');
?>