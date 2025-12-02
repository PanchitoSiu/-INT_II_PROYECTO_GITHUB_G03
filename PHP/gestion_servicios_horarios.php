<?php
session_start();
include 'conexion_Admi_Recep.php';
mysqli_set_charset($conn, 'utf8mb4');
header('Content-Type: application/json');

// Solo Admin puede tocar esto
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Acceso denegado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    switch ($action) {
        // --- ESPECIALIDADES ---
        case 'addSpecialty':
            $nombre = $_POST['nombre'];
            if(empty($nombre)) { echo json_encode(['status'=>'error', 'message'=>'Nombre vacío']); exit; }
            
            $stmt = $conn->prepare("INSERT INTO especialidades (nombre_especialidad) VALUES (?)");
            $stmt->bind_param('s', $nombre);
            if($stmt->execute()) {
                echo json_encode(['status' => 'success']);
            } else {
                echo json_encode(['status' => 'error', 'message' => $stmt->error]);
            }
            break;

        case 'deleteSpecialty':
            $id = $_POST['id'];
            // Validamos si se está usando
            $check = $conn->query("SELECT id FROM odontologos WHERE especialidad_id = $id");
            if ($check->num_rows > 0) {
                echo json_encode(['status' => 'error', 'message' => 'No se puede borrar: Hay odontólogos con esta especialidad.']);
            } else {
                $conn->query("DELETE FROM especialidades WHERE id = $id");
                echo json_encode(['status' => 'success']);
            }
            break;

        // --- HORARIOS ---
        case 'addSchedule':
            $turno = $_POST['turno'];
            $hora = $_POST['hora'];
            $desc = $_POST['descripcion'];
            
            $stmt = $conn->prepare("INSERT INTO horarios (turno, hora, descripcion) VALUES (?, ?, ?)");
            $stmt->bind_param('sss', $turno, $hora, $desc);
            if($stmt->execute()) {
                echo json_encode(['status' => 'success']);
            } else {
                echo json_encode(['status' => 'error', 'message' => $stmt->error]);
            }
            break;

        case 'deleteSchedule':
            $id = $_POST['id'];
            $check = $conn->query("SELECT id FROM odontologos WHERE horario_id = $id");
            if ($check->num_rows > 0) {
                echo json_encode(['status' => 'error', 'message' => 'No se puede borrar: Hay odontólogos usando este horario.']);
            } else {
                $conn->query("DELETE FROM horarios WHERE id = $id");
                echo json_encode(['status' => 'success']);
            }
            break;
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    if ($action == 'getAll') {
        $especialidades = $conn->query("SELECT * FROM especialidades")->fetch_all(MYSQLI_ASSOC);
        $horarios = $conn->query("SELECT * FROM horarios ORDER BY turno, hora")->fetch_all(MYSQLI_ASSOC);
        
        echo json_encode([
            'especialidades' => $especialidades,
            'horarios' => $horarios
        ]);
    }
    exit;
}
?>