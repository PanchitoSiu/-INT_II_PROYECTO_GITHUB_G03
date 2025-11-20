<?php
session_start(); // ¡Importante! Necesitamos la sesión
include 'conexion_Admi_Recep.php';
mysqli_set_charset($conn, 'utf8mb4');

// 1. OBTENER DATOS DE ENTRADA
$input_data = json_decode(file_get_contents("php://input"), true);

// 2. EXTRAER FILTROS Y EL FORMATO
$startDate = $input_data['startDate'];
$endDate = $input_data['endDate'];
$odontologo_form = $input_data['odontologo']; // Odontólogo seleccionado en el form (si existe)
$especialidad = $input_data['especialidad'];
$format = $input_data['format'];

// 3. CONSTRUIR LA CONSULTA SQL
$sql = "SELECT c.appointment_date, o.nombre_completo AS odontologo, e.nombre_especialidad AS especialidad, 
        p.nombre_completo AS paciente, p.dni, c.notas
        FROM citas c
        JOIN odontologos o ON c.odontologo_id = o.id
        JOIN especialidades e ON o.especialidad_id = e.id
        JOIN pacientes p ON c.paciente_id = p.id
        WHERE 1=1"; // Usamos 1=1 para poder añadir 'AND' fácilmente

// 4. LÓGICA DE FILTROS INTELIGENTE
$types = ""; 
$params = [];

// Filtros de Fecha (para todos)
if (!empty($startDate)) {
    $sql .= " AND c.appointment_date >= ?";
    $types .= "s";
    $params[] = $startDate . " 00:00:00";
}
if (!empty($endDate)) {
    $sql .= " AND c.appointment_date <= ?";
    $types .= "s";
    $params[] = $endDate . " 23:59:59";
}

// --- ¡NUEVA LÓGICA DE ROLES! ---
if (isset($_SESSION['role']) && $_SESSION['role'] === 'odontologo') {
    // Si es ODONTÓLOGO, ignora el formulario y FUERZA su propio ID
    $sql .= " AND c.odontologo_id = ?";
    $types .= "i";
    $params[] = $_SESSION['user_id'];
    
} elseif (isset($_SESSION['role']) && $_SESSION['role'] === 'admin') {
    // Si es ADMIN, usa el filtro del formulario (si se seleccionó uno)
    if (!empty($odontologo_form)) {
        $sql .= " AND c.odontologo_id = ?";
        $types .= "i";
        $params[] = $odontologo_form;
    }
} else {
    // Si es recepcionista o no está logueado, no debe generar reportes
    echo json_encode(['status' => 'error', 'message' => 'Permisos insuficientes.']);
    exit;
}
// --- FIN DE LA LÓGICA DE ROLES ---

// Filtro de Especialidad (para todos)
if (!empty($especialidad)) {
    $sql .= " AND e.id = ?"; // Filtra por ID de especialidad
    $types .= "i";
    $params[] = $especialidad;
}

$stmt = $conn->prepare($sql);

if (!empty($types)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

// 5. OBTENER FILAS DE LA BD
$rows = $result->fetch_all(MYSQLI_ASSOC);

// 6. GENERAR REPORTE (Sin cambios)
if ($format == 'pdf') {
    // ... (Tu lógica de FPDF va aquí) ...
    // Asegúrate de que fpdf.php esté incluido y que uses utf8_decode()
    $fpdf_path = 'fpdf.php'; 
    if (!file_exists($fpdf_path)) {
        http_response_code(500);
        echo "Error: No se encontró el archivo 'fpdf.php'. Verifica la ruta.";
        exit;
    }
    include($fpdf_path); 
    
    $pdf = new FPDF('L', 'mm', 'A4'); 
    $pdf->AddPage();
    $pdf->SetFont('Arial', 'B', 12);
    $pdf->Cell(0, 10, 'Reporte de Citas', 0, 1, 'C');
    $pdf->Ln(5);

    $pdf->SetFont('Arial', 'B', 8);
    $pdf->Cell(40, 7, 'Fecha y Dia', 1);
    $pdf->Cell(50, 7, 'Odontologo', 1);
    $pdf->Cell(40, 7, 'Especialidad', 1);
    $pdf->Cell(50, 7, 'Paciente', 1);
    $pdf->Cell(25, 7, 'DNI', 1);
    $pdf->Cell(70, 7, 'Notas', 1);
    $pdf->Ln();

    $pdf->SetFont('Arial', '', 8);
    if (empty($rows)) {
        $pdf->Cell(275, 10, 'No se encontraron registros con esos filtros.', 1, 1, 'C');
    } else {
        foreach ($rows as $row) {
            $pdf->Cell(40, 7, $row['appointment_date'], 1);
            $pdf->Cell(50, 7, utf8_decode($row['odontologo']), 1); 
            $pdf->Cell(40, 7, utf8_decode($row['especialidad']), 1);
            $pdf->Cell(50, 7, utf8_decode($row['paciente']), 1);
            $pdf->Cell(25, 7, $row['dni'], 1);
            $pdf->Cell(70, 7, utf8_decode($row['notas']), 1);
            $pdf->Ln();
        }
    }
    
    $pdf->Output('D', 'Reporte_Citas.pdf', true);

} else {
    // Generar Excel (CSV)
    header("Content-Type: application/vnd.ms-excel; charset=utf-8");
    header("Content-Disposition: attachment; filename=Reporte_Citas.xls");
    
    echo "Fecha y Dia\tOdontologo\tEspecialidad\tPaciente\tDNI\tNotas\n";
    
    if (empty($rows)) {
        echo "No se encontraron registros con esos filtros.\n";
    } else {
        foreach ($rows as $row) {
            $notas = str_replace(["\r", "\n", "\t"], ' ', $row['notas']);
            echo utf8_decode("{$row['appointment_date']}\t{$row['odontologo']}\t{$row['especialidad']}\t{$row['paciente']}\t{$row['dni']}\t{$notas}\n");
        }
    }
}
exit();
?>