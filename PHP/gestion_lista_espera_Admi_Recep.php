<?php
session_start(); // Necesitamos la sesión
include 'conexion_Admi_Recep.php';
mysqli_set_charset($conn, 'utf8mb4');
header('Content-Type: application/json');

/* ---------- POST: AGREGAR / ELIMINAR DE LA LISTA DE ESPERA ---------- */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if (!isset($_POST['action'])) {
        echo json_encode(['status' => 'error', 'message' => 'Acción POST no reconocida.']);
        exit;
    }
    $action = $_POST['action'];

    switch ($action) {
        
        // (Acción del Admin)
        case 'addToWaitingList':
            $paciente_id = intval($_POST['paciente_id']);
            $notas = $_POST['notas'] ?? '';

            $stmt = $conn->prepare("INSERT INTO lista_espera (paciente_id, fecha_ingreso, notas) VALUES (?, NOW(), ?)");
            $stmt->bind_param('is', $paciente_id, $notas);
            $ok = $stmt->execute();
            $stmt->close();

            echo json_encode(['status' => $ok ? 'success' : 'error']);
            break;

        // (Acción de Admin y Odontólogo)
        case 'removeFromWaitingList':
            $id = intval($_POST['id']);
            $stmt = $conn->prepare("DELETE FROM lista_espera WHERE id = ?");
            $stmt->bind_param('i', $id);
            $ok = $stmt->execute();
            $stmt->close();

            echo json_encode(['status' => $ok ? 'success' : 'error']);
            break;
            
        // (Acción del Paciente)
        case 'addMeToWaitingList':
            if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'paciente') {
                 echo json_encode(['status' => 'error', 'message' => 'Error de permisos.']);
                 exit;
            }
            $paciente_id = $_SESSION['user_id'];
            $notas = $_POST['notas'] ?? '';
            
            $check_stmt = $conn->prepare("SELECT id FROM lista_espera WHERE paciente_id = ?");
            $check_stmt->bind_param('i', $paciente_id);
            $check_stmt->execute();
            $check_result = $check_stmt->get_result();
            
            if ($check_result->num_rows > 0) {
                 echo json_encode(['status' => 'error', 'message' => 'Ya te encuentras en la lista de espera.']);
                 exit;
            }
            $check_stmt->close();
            
            $stmt = $conn->prepare("INSERT INTO lista_espera (paciente_id, fecha_ingreso, notas) VALUES (?, NOW(), ?)");
            $stmt->bind_param('is', $paciente_id, $notas);
            $ok = $stmt->execute();
            $stmt->close();

            echo json_encode(['status' => $ok ? 'success' : 'error', 'message' => $ok ? '' : $conn->error]);
            break;

        default:
            echo json_encode(['status' => 'error', 'message' => 'Acción POST no reconocida.']);
    }

    $conn->close();
    exit;
}

/* ---------- GET: OBTENER LA LISTA DE ESPERA ---------- */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    
    if (!isset($_GET['action'])) {
        echo json_encode(['status' => 'error', 'message' => 'Acción GET no reconocida.']);
        exit;
    }
    $action = $_GET['action'];

    switch ($action) {
    
        // (Acción del Admin)
        case 'getWaitingList':
            $sql = "SELECT lista_espera.id, lista_espera.paciente_id, lista_espera.fecha_ingreso, pacientes.nombre_completo AS paciente, lista_espera.notas
                    FROM lista_espera
                    JOIN pacientes ON lista_espera.paciente_id = pacientes.id
                    ORDER BY lista_espera.fecha_ingreso ASC";
            $result = $conn->query($sql);
            $waitingList = [];
            if ($result && $result->num_rows > 0) {
                while ($r = $result->fetch_assoc()) {
                    $waitingList[] = [
                        'id'            => (int)$r['id'],
                        'paciente_id'   => (int)$r['paciente_id'],
                        'fecha_ingreso' => date('d/m/Y H:i', strtotime($r['fecha_ingreso'])),
                        'paciente'      => $r['paciente'],
                        'notas'         => $r['notas']
                    ];
                }
            }
            echo json_encode(['data' => $waitingList]);
            break;
            
        // (Acción del Paciente)
        case 'getMiEstadoEspera':
            if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'paciente') {
                echo json_encode(['status' => 'error', 'message' => 'Error de permisos.']);
                exit;
            }
            $paciente_id = $_SESSION['user_id'];
            
            $stmt = $conn->prepare("SELECT id, DATE_FORMAT(fecha_ingreso, '%d/%m/%Y') AS fecha_ingreso, notas FROM lista_espera WHERE paciente_id = ?");
            $stmt->bind_param('i', $paciente_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $data = $result->fetch_assoc();
            
            echo json_encode(['status' => 'success', 'data' => $data]);
            $stmt->close();
            break;

        default:
            echo json_encode(['status' => 'error', 'message' => 'Acción GET no reconocida']);
    }
    
    $conn->close();
    exit;
}
?>