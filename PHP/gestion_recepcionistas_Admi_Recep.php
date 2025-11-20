<?php
include 'conexion_Admi_Recep.php';
header('Content-Type: application/json');
mysqli_set_charset($conn, 'utf8mb4');

// --- MANEJAR SOLICITUDES POST ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    switch ($action) {
        case 'add':
            if (empty($_POST['username']) || empty($_POST['password']) || empty($_POST['nombre_completo']) || empty($_POST['email']) || empty($_POST['telefono'])) {
                echo json_encode(['status' => 'error', 'message' => 'Todos los campos son requeridos.']);
                exit;
            }
            $username = $_POST['username'];
            $password = password_hash($_POST['password'], PASSWORD_DEFAULT); // <-- ¡VERSIÓN SEGURA!
            $nombre = $_POST['nombre_completo'];
            $email = $_POST['email'];
            $telefono = $_POST['telefono'];
            $rol = 'recepcionista'; 

            $stmt = $conn->prepare("INSERT INTO recepcionistas (nombre_completo, username, password, email, telefono, rol, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, NOW())");
            $stmt->bind_param('ssssss', $nombre, $username, $password, $email, $telefono, $rol);
            $ok = $stmt->execute();
            echo json_encode(['status' => $ok ? 'success' : 'error', 'message' => $ok ? '' : $stmt->error]);
            $stmt->close();
            break;

        case 'edit':
            if (empty($_POST['id']) || empty($_POST['username']) || empty($_POST['nombre_completo']) || empty($_POST['email']) || empty($_POST['telefono'])) {
                echo json_encode(['status' => 'error', 'message' => 'Faltan campos para editar.']);
                exit;
            }
            $id = intval($_POST['id']);
            $username = $_POST['username'];
            $nombre = $_POST['nombre_completo'];
            $email = $_POST['email'];
            $telefono = $_POST['telefono'];

            if (!empty($_POST['password'])) {
                $password = password_hash($_POST['password'], PASSWORD_DEFAULT); // <-- ¡VERSIÓN SEGURA!
                $stmt = $conn->prepare("UPDATE recepcionistas SET nombre_completo = ?, username = ?, password = ?, email = ?, telefono = ? WHERE id = ?");
                $stmt->bind_param('sssssi', $nombre, $username, $password, $email, $telefono, $id);
            } else {
                $stmt = $conn->prepare("UPDATE recepcionistas SET nombre_completo = ?, username = ?, email = ?, telefono = ? WHERE id = ?");
                $stmt->bind_param('ssssi', $nombre, $username, $email, $telefono, $id);
            }
            $ok = $stmt->execute();
            echo json_encode(['status' => $ok ? 'success' : 'error', 'message' => $ok ? '' : $stmt->error]);
            $stmt->close();
            break;

        case 'delete':
            // ... (código de borrar sin cambios) ...
            $id = intval($_POST['id']);
            $stmt = $conn->prepare("DELETE FROM recepcionistas WHERE id = ?");
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
    // ... (Tu código GET está bien, no necesita cambios) ...
    $action = $_GET['action'] ?? '';
    switch ($action) {
        case 'getAll':
            $result = $conn->query("SELECT id, nombre_completo, username, email, telefono, rol FROM recepcionistas");
            $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
            echo json_encode(['status' => 'success', 'data' => $data, 'count' => count($data)]);
            break;
        case 'getById':
            $id = intval($_GET['id']);
            $stmt = $conn->prepare("SELECT id, nombre_completo, username, email, telefono, rol FROM recepcionistas WHERE id = ?");
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $result = $stmt->get_result();
            echo json_encode($result->fetch_assoc() ?: []);
            break;
        default:
            echo json_encode(['status' => 'error', 'message' => 'Acción GET no reconocida.']);
    }
    $conn->close();
    exit;
}
?>