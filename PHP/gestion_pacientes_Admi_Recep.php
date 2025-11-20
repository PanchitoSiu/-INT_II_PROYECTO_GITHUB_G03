<?php
session_start(); // Necesitamos la sesión
include 'conexion_Admi_Recep.php';
header('Content-Type: application/json');
mysqli_set_charset($conn, 'utf8mb4');

// --- MANEJAR SOLICITUDES POST ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    switch ($action) {
        
        // (Acción del Admin)
        case 'add':
            if (empty($_POST['username']) || empty($_POST['password']) || empty($_POST['nombre_completo']) || empty($_POST['dni']) || empty($_POST['email']) || empty($_POST['telefono'])) {
                echo json_encode(['status' => 'error', 'message' => 'Todos los campos son requeridos.']);
                exit;
            }
            $username = $_POST['username'];
            $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
            $nombre = $_POST['nombre_completo'];
            $dni = $_POST['dni'];
            $email = $_POST['email'];
            $telefono = $_POST['telefono'];

            $stmt = $conn->prepare("INSERT INTO pacientes (username, password, nombre_completo, dni, email, telefono) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param('ssssss', $username, $password, $nombre, $dni, $email, $telefono);
            $ok = $stmt->execute();
            echo json_encode(['status' => $ok ? 'success' : 'error', 'message' => $ok ? '' : $stmt->error]);
            $stmt->close();
            break;

        // (Acción del Admin)
        case 'edit':
            if (empty($_POST['id']) || empty($_POST['username']) || empty($_POST['nombre_completo']) || empty($_POST['dni']) || empty($_POST['email']) || empty($_POST['telefono'])) {
                echo json_encode(['status' => 'error', 'message' => 'Todos los campos son requeridos.']);
                exit;
            }
            $id = intval($_POST['id']);
            $username = $_POST['username'];
            $nombre = $_POST['nombre_completo'];
            $dni = $_POST['dni'];
            $email = $_POST['email'];
            $telefono = $_POST['telefono'];

            if (!empty($_POST['password'])) {
                $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
                $stmt = $conn->prepare("UPDATE pacientes SET username = ?, password = ?, nombre_completo = ?, dni = ?, email = ?, telefono = ? WHERE id = ?");
                $stmt->bind_param('ssssssi', $username, $password, $nombre, $dni, $email, $telefono, $id);
            } else {
                $stmt = $conn->prepare("UPDATE pacientes SET username = ?, nombre_completo = ?, dni = ?, email = ?, telefono = ? WHERE id = ?");
                $stmt->bind_param('sssssi', $username, $nombre, $dni, $email, $telefono, $id);
            }
            $ok = $stmt->execute();
            echo json_encode(['status' => $ok ? 'success' : 'error', 'message' => $ok ? '' : $stmt->error]);
            $stmt->close();
            break;

        // (Acción del Paciente)
        case 'editProfile':
            if (empty($_POST['id']) || empty($_POST['username']) || empty($_POST['nombre_completo']) || empty($_POST['dni']) || empty($_POST['email']) || empty($_POST['telefono'])) {
                echo json_encode(['status' => 'error', 'message' => 'Todos los campos son requeridos.']);
                exit;
            }
            $id = intval($_POST['id']);

            if (!isset($_SESSION['user_id']) || $id !== $_SESSION['user_id'] || $_SESSION['role'] !== 'paciente') {
                 echo json_encode(['status' => 'error', 'message' => 'Error de permisos.']);
                 exit;
            }

            $username = $_POST['username'];
            $nombre = $_POST['nombre_completo'];
            $dni = $_POST['dni'];
            $email = $_POST['email'];
            $telefono = $_POST['telefono'];

            if (!empty($_POST['password'])) {
                $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
                $stmt = $conn->prepare("UPDATE pacientes SET username = ?, password = ?, nombre_completo = ?, dni = ?, email = ?, telefono = ? WHERE id = ?");
                $stmt->bind_param('ssssssi', $username, $password, $nombre, $dni, $email, $telefono, $id);
            } else {
                $stmt = $conn->prepare("UPDATE pacientes SET username = ?, nombre_completo = ?, dni = ?, email = ?, telefono = ? WHERE id = ?");
                $stmt->bind_param('sssssi', $username, $nombre, $dni, $email, $telefono, $id);
            }
            $ok = $stmt->execute();
            
            if ($ok && $username !== $_SESSION['username']) {
                $_SESSION['username'] = $username;
            }
            
            echo json_encode(['status' => $ok ? 'success' : 'error', 'message' => $ok ? '' : $stmt->error]);
            $stmt->close();
            break;

        // (Acción del Admin)
        case 'delete':
            $id = intval($_POST['id']);
            $stmt = $conn->prepare("DELETE FROM pacientes WHERE id = ?");
            $stmt->bind_param('i', $id);
            $ok = $stmt->execute();
            echo json_encode(['status' => $ok ? 'success' : 'error', 'message' => $ok ? '' : $stmt->error]);
            $stmt->close();
            break;
            
        default:
            echo json_encode(['status' => 'error', 'message' => 'Acción POST no reconocida.']);
    }
    $conn->close();
    exit;
}

// --- MANEJAR SOLICITUDES GET ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        
        // (Para Admin)
        case 'getAll':
            $result = $conn->query("SELECT id, username, nombre_completo, dni, email, telefono FROM pacientes ORDER BY nombre_completo");
            $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
            echo json_encode(['status' => 'success', 'data' => $data, 'count' => count($data)]);
            break;
            
        // (Para Admin y Paciente)
        case 'getById':
            $id = intval($_GET['id']);
            // (Se podría añadir seguridad de sesión aquí, pero 'getById' es usado por Admin y Paciente)
            $stmt = $conn->prepare("SELECT id, username, nombre_completo, dni, email, telefono FROM pacientes WHERE id = ?");
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $result = $stmt->get_result();
            echo json_encode($result->fetch_assoc() ?: []);
            break;
            
        // (Para Odontólogo)
        case 'getMisPacientes':
            if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'odontologo') {
                echo json_encode(['status' => 'error', 'message' => 'Error de permisos.']);
                exit;
            }
            $odontologo_id = $_SESSION['user_id'];
            
            $sql = "SELECT DISTINCT 
                        p.id, p.nombre_completo, p.dni, p.email, p.telefono 
                    FROM pacientes p
                    JOIN citas c ON p.id = c.paciente_id
                    WHERE c.odontologo_id = ?
                    ORDER BY p.nombre_completo";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param('i', $odontologo_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
            
            echo json_encode(['status' => 'success', 'data' => $data, 'count' => count($data)]);
            $stmt->close();
            break;
            
        default:
            echo json_encode(['status' => 'error', 'message' => 'Acción GET no reconocida.']);
    }
    $conn->close();
    exit;
}
?>