<?php
include 'conexion_Admi_Recep.php';
header('Content-Type: application/json');

// --- MANEJAR SOLICITUDES POST (Agregar, Editar, Eliminar) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Verificamos que se envíe una acción
    if (!isset($_POST['action'])) {
        echo json_encode(['status' => 'error', 'message' => 'Acción no especificada.']);
        exit;
    }

    $action = $_POST['action'];

    switch ($action) {
        
        // --- AGREGAR UN NUEVO USUARIO ---
        case 'add':
            if (empty($_POST['username']) || empty($_POST['password']) || empty($_POST['nombre_completo']) || empty($_POST['rol'])) {
                echo json_encode(['status' => 'error', 'message' => 'Todos los campos son requeridos.']);
                exit;
            }
            
            $nombre = $_POST['nombre_completo'];
            $username = $_POST['username'];
            $rol = $_POST['rol'];
            // ¡Importante! Siempre hashear las contraseñas
            $password = password_hash($_POST['password'], PASSWORD_DEFAULT); 

            $stmt = $conn->prepare("INSERT INTO usuarios (username, password, nombre_completo, rol) VALUES (?, ?, ?, ?)");
            $stmt->bind_param('ssss', $username, $password, $nombre, $rol);
            $ok = $stmt->execute();
            
            if ($ok) {
                echo json_encode(['status' => 'success']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Error al agregar usuario: ' . $stmt->error]);
            }
            $stmt->close();
            break;

        // --- EDITAR UN USUARIO EXISTENTE ---
        case 'edit':
            if (empty($_POST['id']) || empty($_POST['username']) || empty($_POST['nombre_completo']) || empty($_POST['rol'])) {
                echo json_encode(['status' => 'error', 'message' => 'Faltan datos para editar.']);
                exit;
            }
            
            $id = intval($_POST['id']);
            $nombre = $_POST['nombre_completo'];
            $username = $_POST['username'];
            $rol = $_POST['rol'];
            
            // Verificamos si el usuario quiere cambiar la contraseña
            if (!empty($_POST['password'])) {
                // Si hay contraseña nueva, la hasheamos y la incluimos en la consulta
                $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
                $sql = "UPDATE usuarios SET username = ?, nombre_completo = ?, rol = ?, password = ? WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param('ssssi', $username, $nombre, $rol, $password, $id);
            } else {
                // Si no hay contraseña nueva, la consulta no la toca
                $sql = "UPDATE usuarios SET username = ?, nombre_completo = ?, rol = ? WHERE id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param('sssi', $username, $nombre, $rol, $id);
            }
            
            $ok = $stmt->execute();
            if ($ok) {
                echo json_encode(['status' => 'success']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Error al actualizar usuario: ' . $stmt->error]);
            }
            $stmt->close();
            break;

        // --- ELIMINAR UN USUARIO ---
        case 'delete':
            if (empty($_POST['id'])) {
                echo json_encode(['status' => 'error', 'message' => 'ID de usuario no proporcionado.']);
                exit;
            }
            
            $id = intval($_POST['id']);
            $stmt = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
            $stmt->bind_param('i', $id);
            $ok = $stmt->execute();
            
            if ($ok) {
                echo json_encode(['status' => 'success']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Error al eliminar usuario: ' . $stmt->error]);
            }
            $stmt->close();
            break;

        default:
            echo json_encode(['status' => 'error', 'message' => 'Acción POST no reconocida']);
    }
    
    $conn->close();
    exit;
}


// --- MANEJAR SOLICITUDES GET (Obtener lista, Obtener por ID) ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    if (!isset($_GET['action'])) {
        echo json_encode(['status' => 'error', 'message' => 'Acción no especificada.']);
        exit;
    }

    $action = $_GET['action'];

    switch ($action) {

        // --- OBTENER TODOS LOS USUARIOS ---
        case 'getAll':
            $result = $conn->query("SELECT id, username, nombre_completo, rol FROM usuarios");
            $users = [];
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $users[] = $row;
                }
            }
            // Devolvemos el formato que espera el JS
            echo json_encode(['status' => 'success', 'data' => $users, 'count' => count($users)]);
            break;

        // --- OBTENER UN USUARIO POR SU ID (para editar) ---
        case 'getById':
            if (!isset($_GET['id'])) {
                echo json_encode(['status' => 'error', 'message' => 'ID de usuario no proporcionado']);
                exit;
            }
            
            $id = intval($_GET['id']);
            $stmt = $conn->prepare("SELECT id, username, nombre_completo, rol FROM usuarios WHERE id = ?");
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            
            // Devolvemos solo el objeto del usuario (o un objeto vacío si no se encuentra)
            echo json_encode($user ?: []); 
            $stmt->close();
            break;

        default:
            echo json_encode(['status' => 'error', 'message' => 'Acción GET no reconocida']);
    }

    $conn->close();
    exit;
}
?>