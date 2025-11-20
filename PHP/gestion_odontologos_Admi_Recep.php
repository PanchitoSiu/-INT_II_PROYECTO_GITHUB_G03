<?php
session_start(); // ¡Importante! Necesitamos la sesión para verificar los permisos
include 'conexion_Admi_Recep.php'; 
header('Content-Type: application/json');
mysqli_set_charset($conn, 'utf8mb4');

// --- MANEJAR SOLICITUDES POST ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    switch ($action) {
        
        // (Esta acción 'add' es solo para el Administrador)
        case 'add':
            if (empty($_POST['numero_id']) || empty($_POST['nombre_completo']) || empty($_POST['username']) || empty($_POST['password']) || empty($_POST['email']) || empty($_POST['telefono']) || empty($_POST['especialidad_id'])) {
                echo json_encode(['status' => 'error', 'message' => 'Faltan campos requeridos.']);
                exit;
            }
            $numero_id = $_POST['numero_id'];
            $nombre = $_POST['nombre_completo'];
            $username = $_POST['username'];
            $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
            $email = $_POST['email'];
            $telefono = $_POST['telefono'];
            $especialidad_id = intval($_POST['especialidad_id']);
            $horario_id = !empty($_POST['horario_id']) ? intval($_POST['horario_id']) : null;

            $stmt = $conn->prepare("INSERT INTO odontologos (numero_id, nombre_completo, username, password, email, telefono, especialidad_id, horario_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param('ssssssii', $numero_id, $nombre, $username, $password, $email, $telefono, $especialidad_id, $horario_id);
            $ok = $stmt->execute();
            echo json_encode(['status' => $ok ? 'success' : 'error', 'message' => $ok ? '' : $stmt->error]);
            $stmt->close();
            break;

        // (Esta acción 'edit' es solo para el Administrador)
        case 'edit':
             if (empty($_POST['id']) || empty($_POST['numero_id']) || empty($_POST['nombre_completo']) || empty($_POST['username']) || empty($_POST['email']) || empty($_POST['telefono']) || empty($_POST['especialidad_id'])) {
                echo json_encode(['status' => 'error', 'message' => 'Faltan campos requeridos.']);
                exit;
            }
            $id = intval($_POST['id']);
            $numero_id = $_POST['numero_id'];
            $nombre = $_POST['nombre_completo'];
            $username = $_POST['username'];
            $email = $_POST['email'];
            $telefono = $_POST['telefono'];
            $especialidad_id = intval($_POST['especialidad_id']);
            $horario_id = !empty($_POST['horario_id']) ? intval($_POST['horario_id']) : null;

            if (!empty($_POST['password'])) {
                $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
                $stmt = $conn->prepare("UPDATE odontologos SET numero_id = ?, nombre_completo = ?, username = ?, password = ?, email = ?, telefono = ?, especialidad_id = ?, horario_id = ? WHERE id = ?");
                $stmt->bind_param('ssssssiii', $numero_id, $nombre, $username, $password, $email, $telefono, $especialidad_id, $horario_id, $id);
            } else {
                $stmt = $conn->prepare("UPDATE odontologos SET numero_id = ?, nombre_completo = ?, username = ?, email = ?, telefono = ?, especialidad_id = ?, horario_id = ? WHERE id = ?");
                $stmt->bind_param('sssssiii', $numero_id, $nombre, $username, $email, $telefono, $especialidad_id, $horario_id, $id);
            }
            $ok = $stmt->execute();
            echo json_encode(['status' => $ok ? 'success' : 'error', 'message' => $ok ? '' : $stmt->error]);
            $stmt->close();
            break;

        // --- ¡ACCIÓN CORREGIDA PARA EL ODONTÓLOGO! ---
        case 'editProfile':
            // El odontólogo solo puede editar su propio perfil
            if (empty($_POST['id']) || empty($_POST['nombre_completo']) || empty($_POST['username']) || empty($_POST['email']) || empty($_POST['telefono'])) {
                echo json_encode(['status' => 'error', 'message' => 'Faltan campos para editar el perfil.']);
                exit;
            }
            
            $id = intval($_POST['id']);
            
            // --- ¡Validación de Seguridad! ---
            if (!isset($_SESSION['user_id']) || $id !== $_SESSION['user_id']) {
                 echo json_encode(['status' => 'error', 'message' => 'Error de permisos. No puede editar un perfil que no es suyo.']);
                 exit;
            }

            $nombre = $_POST['nombre_completo'];
            $username = $_POST['username'];
            $email = $_POST['email'];
            $telefono = $_POST['telefono']; // <-- ¡CAMBIO! Esta columna faltaba

            if (!empty($_POST['password'])) {
                $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
                // --- ¡CAMBIO! Se añadió 'telefono' a la consulta ---
                $stmt = $conn->prepare("UPDATE odontologos SET nombre_completo = ?, username = ?, password = ?, email = ?, telefono = ? WHERE id = ?");
                $stmt->bind_param('sssssi', $nombre, $username, $password, $email, $telefono, $id);
            } else {
                // --- ¡CAMBIO! Se añadió 'telefono' a la consulta ---
                $stmt = $conn->prepare("UPDATE odontologos SET nombre_completo = ?, username = ?, email = ?, telefono = ? WHERE id = ?");
                $stmt->bind_param('ssssi', $nombre, $username, $email, $telefono, $id);
            }
            
            $ok = $stmt->execute();
            
            if ($ok && $username !== $_SESSION['username']) {
                $_SESSION['username'] = $username;
            }
            
            echo json_encode(['status' => $ok ? 'success' : 'error', 'message' => $ok ? '' : $stmt->error]);
            $stmt->close();
            break;

        case 'delete':
            $id = intval($_POST['id']);
            $stmt = $conn->prepare("DELETE FROM odontologos WHERE id = ?");
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
        
        case 'getAll':
            $sql = "SELECT o.id, o.numero_id, o.nombre_completo, o.username, o.email, o.telefono, o.especialidad_id, o.horario_id, e.nombre_especialidad 
                    FROM odontologos o 
                    LEFT JOIN especialidades e ON o.especialidad_id = e.id
                    ORDER BY o.nombre_completo";
            $result = $conn->query($sql);
            $data = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
            echo json_encode(['status' => 'success', 'data' => $data, 'count' => count($data)]);
            break;
            
        // --- ¡FUNCIÓN RESTAURADA! ---
        // Esta es la acción que usa el botón "Modificar Mis Datos"
        case 'getById':
            if (empty($_GET['id'])) {
                echo json_encode(['status' => 'error', 'message' => 'ID no proporcionado.']);
                exit;
            }
            $id = intval($_GET['id']);
            // Se seleccionan todas las columnas que el formulario necesita
            $stmt = $conn->prepare("SELECT id, numero_id, nombre_completo, username, email, telefono, especialidad_id, horario_id FROM odontologos WHERE id = ?");
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $result = $stmt->get_result();
            echo json_encode($result->fetch_assoc() ?: []);
            break;
            
        case 'getOptions': 
            $especialidades = $conn->query("SELECT id, nombre_especialidad FROM especialidades")->fetch_all(MYSQLI_ASSOC);
            $horarios = $conn->query("SELECT id, descripcion FROM horarios")->fetch_all(MYSQLI_ASSOC); // Asumiendo tabla 'horarios'
            echo json_encode(['especialidades' => $especialidades, 'horarios' => $horarios]);
            break;
            
        default:
            echo json_encode(['status' => 'error', 'message' => 'Acción GET no reconocida.']);
    }
    $conn->close();
    exit;
}
?>