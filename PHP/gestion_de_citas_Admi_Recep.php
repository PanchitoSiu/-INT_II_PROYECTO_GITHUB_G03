<?php
session_start();
include 'conexion_Admi_Recep.php';
mysqli_set_charset($conn, 'utf8mb4');
header('Content-Type: application/json');

// --- MANEJAR SOLICITUDES POST ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if (!isset($_POST['action'])) {
        echo json_encode(['status' => 'error', 'message' => 'Acción POST no reconocida.']);
        exit;
    }
    
    $action = $_POST['action'];

    // --- Lógica de Permisos ---
    // Admin y Recepcionista pueden gestionar citas (CRUD completo)
    $puedeGestionarCita = (isset($_SESSION['role']) && ($_SESSION['role'] === 'admin' || $_SESSION['role'] === 'recepcionista'));
    // Odontólogo tiene permisos específicos (Aceptar, Rechazar, Notas, Archivos)
    $esOdontologo = (isset($_SESSION['role']) && $_SESSION['role'] === 'odontologo');

    switch ($action) {
        
        // (Lógica de Admin/Recepción para AGREGAR)
        case 'add':
            if (!$puedeGestionarCita) {
                echo json_encode(['status' => 'error', 'message' => 'Error de permisos.']);
                exit;
            }
            if (empty($_POST['appointment_date']) || empty($_POST['odontologo_id']) || empty($_POST['paciente_id']) || empty($_POST['especialidad_id'])) {
                echo json_encode(['status' => 'error', 'message' => 'Faltan campos requeridos.']);
                exit;
            }

            // --- HU4: VALIDACIÓN DE CONFLICTO DE HORARIO ---
            $fecha = $_POST['appointment_date'];
            $odonto_id = $_POST['odontologo_id'];

            // Buscamos si ya existe una cita para ese doctor, en esa hora, que NO esté cancelada
            $check_sql = "SELECT id FROM citas WHERE odontologo_id = ? AND appointment_date = ? AND status != 'cancelada'";
            $check_stmt = $conn->prepare($check_sql);
            $check_stmt->bind_param('is', $odonto_id, $fecha);
            $check_stmt->execute();
            $check_stmt->store_result();

            if ($check_stmt->num_rows > 0) {
                echo json_encode(['status' => 'error', 'message' => 'El odontólogo ya tiene una cita programada en ese horario.']);
                $check_stmt->close();
                exit; // Detenemos el proceso
            }
            $check_stmt->close();
            // --- FIN VALIDACIÓN HU4 ---

            $stmt = $conn->prepare("INSERT INTO citas (appointment_date, odontologo_id, paciente_id, especialidad_id, notas, status) VALUES (?, ?, ?, ?, ?, 'pendiente')");
            $notas = $_POST['notas'] ?? '';
            $stmt->bind_param('siiss', $fecha, $odonto_id, $_POST['paciente_id'], $_POST['especialidad_id'], $notas);
            $ok = $stmt->execute();
            echo json_encode(['status' => $ok ? 'success' : 'error', 'message' => $ok ? 'Cita agregada' : $stmt->error]);
            $stmt->close();
            break;

        // (Lógica de Admin/Recepción para EDITAR)
        case 'edit':
            if (!$puedeGestionarCita) {
                echo json_encode(['status' => 'error', 'message' => 'Error de permisos.']);
                exit;
            }
             if (empty($_POST['cita_id']) || empty($_POST['appointment_date']) || empty($_POST['odontologo_id']) || empty($_POST['paciente_id']) || empty($_POST['especialidad_id'])) {
                echo json_encode(['status' => 'error', 'message' => 'Faltan campos requeridos.']);
                exit;
            }

            $cita_id = $_POST['cita_id'];
            $fecha = $_POST['appointment_date'];
            $odonto_id = $_POST['odontologo_id'];

            // --- HU4: VALIDACIÓN DE CONFLICTO DE HORARIO (EDITAR) ---
            // Buscamos conflicto, pero EXCLUYENDO la cita que estamos editando actualmente (id != ?)
            $check_sql = "SELECT id FROM citas WHERE odontologo_id = ? AND appointment_date = ? AND id != ? AND status != 'cancelada'";
            $check_stmt = $conn->prepare($check_sql);
            $check_stmt->bind_param('isi', $odonto_id, $fecha, $cita_id);
            $check_stmt->execute();
            $check_stmt->store_result();

            if ($check_stmt->num_rows > 0) {
                echo json_encode(['status' => 'error', 'message' => 'El odontólogo ya tiene otra cita en ese horario.']);
                $check_stmt->close();
                exit;
            }
            $check_stmt->close();
            // --- FIN VALIDACIÓN HU4 ---

            $stmt = $conn->prepare("UPDATE citas SET appointment_date = ?, odontologo_id = ?, paciente_id = ?, especialidad_id = ?, notas = ? WHERE id = ?");
            $notas = $_POST['notas'] ?? '';
            $stmt->bind_param('siissi', $fecha, $odonto_id, $_POST['paciente_id'], $_POST['especialidad_id'], $notas, $cita_id);
            $ok = $stmt->execute();
            echo json_encode(['status' => $ok ? 'success' : 'error', 'message' => $ok ? 'Cita actualizada' : $stmt->error]);
            $stmt->close();
            break;

        // (Lógica de Admin/Recepción para BORRAR)
        case 'delete':
            if (!$puedeGestionarCita) {
                echo json_encode(['status' => 'error', 'message' => 'Error de permisos.']);
                exit;
            }
            if (empty($_POST['id'])) {
                 echo json_encode(['status' => 'error', 'message' => 'No se proporcionó ID.']);
                exit;
            }
            $stmt = $conn->prepare("DELETE FROM citas WHERE id = ?");
            $stmt->bind_param('i', $_POST['id']);
            $ok = $stmt->execute();
            echo json_encode(['status' => $ok ? 'success' : 'error', 'message' => $ok ? 'Cita eliminada' : $stmt->error]);
            $stmt->close();
            break;

        // (Lógica de Odontólogo y Recep para ACEPTAR Cita)
        case 'aceptarCita':
            if (!$puedeGestionarCita && !$esOdontologo) {
                echo json_encode(['status' => 'error', 'message' => 'Error de permisos o faltan datos.']);
                exit;
            }
            $cita_id = intval($_POST['id']);
            $sql = "UPDATE citas SET status = 'confirmada' WHERE id = ?";
            $params = [$cita_id];
            $types = "i";

            // Si es odontólogo, solo puede aceptar SUS citas
            if ($esOdontologo) {
                $sql .= " AND odontologo_id = ?";
                $types .= "i";
                $params[] = $_SESSION['user_id'];
            }
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$params);
            $ok = $stmt->execute();
            $stmt->close();

            // --- HU5: ENVIAR CORREO AUTOMÁTICO AL PACIENTE ---
            if ($ok) {
                $sql_info = "SELECT p.email, p.nombre_completo AS paciente, o.nombre_completo AS odontologo, c.appointment_date 
                             FROM citas c
                             JOIN pacientes p ON c.paciente_id = p.id
                             JOIN odontologos o ON c.odontologo_id = o.id
                             WHERE c.id = ?";
                $stmt_info = $conn->prepare($sql_info);
                $stmt_info->bind_param('i', $cita_id);
                $stmt_info->execute();
                $res_info = $stmt_info->get_result();

                if ($row = $res_info->fetch_assoc()) {
                    $to = $row['email'];
                    $paciente = $row['paciente'];
                    $doctor = $row['odontologo'];
                    $fecha = date('d/m/Y H:i', strtotime($row['appointment_date']));

                    $asunto = "Cita Confirmada - Clinica Sonrie";
                    $mensaje = "Hola $paciente,\n\n";
                    $mensaje .= "Tu cita ha sido CONFIRMADA exitosamente.\n\n";
                    $mensaje .= "Detalles de la cita:\n";
                    $mensaje .= "- Odontologo: $doctor\n";
                    $mensaje .= "- Fecha y Hora: $fecha\n\n";
                    $mensaje .= "Por favor, llega 10 minutos antes. ¡Te esperamos!";
                    $headers = "From: no-reply@clinicasonrie.com";

                    // Enviamos el correo (el @ suprime errores si el servidor SMTP falla momentáneamente)
                    @mail($to, $asunto, $mensaje, $headers);
                }
                $stmt_info->close();
            }
            // --- FIN HU5 ---
            
            echo json_encode(['status' => $ok ? 'success' : 'error', 'message' => $ok ? 'Cita confirmada' : $conn->error]);
            break;

        // (Lógica de Odontólogo y Recep para RECHAZAR Cita)
        case 'rechazarCita':
            if (!$puedeGestionarCita && !$esOdontologo) {
                echo json_encode(['status' => 'error', 'message' => 'Error de permisos o faltan datos.']);
                exit;
            }
            $cita_id = intval($_POST['id']);
            $sql = "UPDATE citas SET status = 'cancelada' WHERE id = ?";
            $params = [$cita_id];
            $types = "i";

            if ($esOdontologo) {
                $sql .= " AND odontologo_id = ?";
                $types .= "i";
                $params[] = $_SESSION['user_id'];
            }
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$params);
            $ok = $stmt->execute();
            $stmt->close();
            
            echo json_encode(['status' => $ok ? 'success' : 'error', 'message' => $ok ? 'Cita cancelada' : $conn->error]);
            break;

        // (Lógica de Odontólogo para EDITAR NOTA)
        case 'updateNotaCita':
            if (!isset($_POST['cita_id']) || !isset($_POST['notas']) || !$esOdontologo) {
                echo json_encode(['status' => 'error', 'message' => 'Faltan datos o permisos.']);
                exit;
            }
            $cita_id = intval($_POST['cita_id']);
            $notas = $_POST['notas'];
            $odontologo_id = $_SESSION['user_id'];

            $stmt = $conn->prepare("UPDATE citas SET notas = ? WHERE id = ? AND odontologo_id = ?");
            $stmt->bind_param('sii', $notas, $cita_id, $odontologo_id);
            $ok = $stmt->execute();
            $stmt->close();
            
            echo json_encode(['status' => $ok ? 'success' : 'error', 'message' => $ok ? 'Nota actualizada' : $conn->error]);
            break;
            
        // (Lógica de Odontólogo para SUBIR ARCHIVO)
        case 'addArchivoCita':
            if (!isset($_FILES['archivo']) || !isset($_POST['cita_id']) || !$esOdontologo) {
                echo json_encode(['status' => 'error', 'message' => 'Faltan datos o permisos para subir el archivo.']);
                exit;
            }

            $cita_id = intval($_POST['cita_id']);
            $archivo = $_FILES['archivo'];

            if ($archivo['error'] !== UPLOAD_ERR_OK) {
                echo json_encode(['status' => 'error', 'message' => 'Error al subir el archivo.']);
                exit;
            }
            
            $upload_dir = '../uploads/';
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0777, true);
            }
            
            $nombre_original = basename($archivo['name']);
            $extension = pathinfo($nombre_original, PATHINFO_EXTENSION);
            $nombre_servidor = uniqid() . '.' . $extension;
            $ruta_destino = $upload_dir . $nombre_servidor;

            if (move_uploaded_file($archivo['tmp_name'], $ruta_destino)) {
                $ruta_db = '../uploads/'; 
                $stmt = $conn->prepare("INSERT INTO cita_archivos (cita_id, nombre_original, nombre_servidor, ruta_archivo) VALUES (?, ?, ?, ?)");
                $stmt->bind_param('isss', $cita_id, $nombre_original, $nombre_servidor, $ruta_db);
                $ok = $stmt->execute();
                $stmt->close();
                
                echo json_encode(['status' => $ok ? 'success' : 'error', 'message' => $ok ? 'Archivo subido.' : 'Error al guardar en BD.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Error al mover el archivo subido.']);
            }
            break;
            
        default:
            echo json_encode(['status' => 'error', 'message' => 'Acción POST no reconocida.']);
    }
    
    $conn->close();
    exit;
}


// --- MANEJAR SOLICITUDES GET ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    if (!isset($_GET['action'])) {
        $_GET['action'] = 'getAllAdmin';
    }
    
    $action = $_GET['action'];

    $sql_base = "SELECT c.id, DATE_FORMAT(c.appointment_date, '%d/%m/%Y %H:%i') AS appointment_date,
                o.nombre_completo AS odontologo,
                e.nombre_especialidad AS especialidad,
                p.nombre_completo AS paciente,
                p.dni, c.notas, c.status, c.odontologo_id, c.paciente_id, c.especialidad_id
                FROM citas c
                JOIN odontologos o ON c.odontologo_id = o.id
                JOIN pacientes p ON c.paciente_id = p.id
                LEFT JOIN especialidades e ON c.especialidad_id = e.id";

    switch ($action) {

        // Para Admin/Recep
        case 'getAllAdmin':
            $sql = $sql_base . " ORDER BY c.appointment_date DESC";
            $result = $conn->query($sql);
            $citas = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
            echo json_encode(['data' => $citas, 'count' => count($citas)]);
            break;
            
        // Para Odontólogo (Vista "Mis Citas")
        case 'getMisCitas':
            if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'odontologo') {
                echo json_encode(['status' => 'error', 'message' => 'Error de permisos.']);
                exit;
            }
            $odontologo_id = $_SESSION['user_id'];
            
            $sql = $sql_base . " WHERE c.odontologo_id = ? ORDER BY c.appointment_date ASC";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param('i', $odontologo_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $citas = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
            echo json_encode(['status' => 'success', 'data' => $citas, 'count' => count($citas)]);
            $stmt->close();
            break;

        // Para Paciente (Vista "Mis Citas")
        case 'getMisCitasPaciente':
            if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'paciente') {
                echo json_encode(['status' => 'error', 'message' => 'Error de permisos.']);
                exit;
            }
            $paciente_id = $_SESSION['user_id'];
            
            $sql = $sql_base . " WHERE c.paciente_id = ? ORDER BY c.appointment_date ASC";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param('i', $paciente_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $citas = $result ? $result->fetch_all(MYSQLI_ASSOC) : [];
            echo json_encode(['status' => 'success', 'data' => $citas, 'count' => count($citas)]);
            $stmt->close();
            break;

        // Para Odontólogo (Vista "Historial de Paciente > Detalle")
        case 'getHistorialPaciente':
            if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'odontologo' || !isset($_GET['paciente_id'])) {
                echo json_encode(['status' => 'error', 'message' => 'Error de permisos o falta ID de paciente.']);
                exit;
            }
            $odontologo_id = $_SESSION['user_id'];
            $paciente_id = intval($_GET['paciente_id']);
            
            $response = ['paciente' => null, 'historial' => []];

            $stmt_paciente = $conn->prepare("SELECT id, nombre_completo, dni, email, telefono FROM pacientes WHERE id = ?");
            $stmt_paciente->bind_param('i', $paciente_id);
            $stmt_paciente->execute();
            $response['paciente'] = $stmt_paciente->get_result()->fetch_assoc();
            $stmt_paciente->close();

            $sql_historial = "SELECT c.id, DATE_FORMAT(c.appointment_date, '%d/%m/%Y %H:%i') AS fecha,
                                e.nombre_especialidad AS especialidad, c.notas, c.status
                            FROM citas c
                            LEFT JOIN especialidades e ON c.especialidad_id = e.id
                            WHERE c.paciente_id = ? AND c.odontologo_id = ?
                            ORDER BY c.appointment_date DESC";
            
            $stmt_historial = $conn->prepare($sql_historial);
            $stmt_historial->bind_param('ii', $paciente_id, $odontologo_id);
            $stmt_historial->execute();
            $citas = $stmt_historial->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt_historial->close();
            
            // Buscar archivos adjuntos para cada cita
            if (!empty($citas)) {
                $stmt_archivos = $conn->prepare("SELECT id, nombre_original, ruta_archivo, nombre_servidor FROM cita_archivos WHERE cita_id = ?");
                foreach ($citas as $key => $cita) {
                    $stmt_archivos->bind_param('i', $cita['id']);
                    $stmt_archivos->execute();
                    $citas[$key]['archivos'] = $stmt_archivos->get_result()->fetch_all(MYSQLI_ASSOC);
                }
                $stmt_archivos->close();
            }
            $response['historial'] = $citas;
            echo json_encode(['status' => 'success', 'data' => $response]);
            break;
            
        // Para Paciente (Vista "Mis Reportes")
        case 'getMiHistorial':
            if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'paciente') {
                echo json_encode(['status' => 'error', 'message' => 'Error de permisos.']);
                exit;
            }
            $paciente_id = $_SESSION['user_id'];
            
            $response = ['historial' => []];

            $sql_historial = "SELECT c.id, DATE_FORMAT(c.appointment_date, '%d/%m/%Y %H:%i') AS fecha,
                                o.nombre_completo AS odontologo,
                                e.nombre_especialidad AS especialidad, c.notas, c.status
                            FROM citas c
                            JOIN odontologos o ON c.odontologo_id = o.id
                            LEFT JOIN especialidades e ON c.especialidad_id = e.id
                            WHERE c.paciente_id = ?
                            ORDER BY c.appointment_date DESC";
            
            $stmt_historial = $conn->prepare($sql_historial);
            $stmt_historial->bind_param('i', $paciente_id);
            $stmt_historial->execute();
            $citas = $stmt_historial->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt_historial->close();
            
            // Buscar archivos adjuntos
            if (!empty($citas)) {
                $stmt_archivos = $conn->prepare("SELECT id, nombre_original, ruta_archivo, nombre_servidor FROM cita_archivos WHERE cita_id = ?");
                foreach ($citas as $key => $cita) {
                    $stmt_archivos->bind_param('i', $cita['id']);
                    $stmt_archivos->execute();
                    $citas[$key]['archivos'] = $stmt_archivos->get_result()->fetch_all(MYSQLI_ASSOC);
                }
                $stmt_archivos->close();
            }
            
            $response['historial'] = $citas;
            echo json_encode(['status' => 'success', 'data' => $response]);
            break;

        // Para Formulario de Citas (Admin/Recep)
        case 'getById':
            $id = intval($_GET['id']);
            $stmt = $conn->prepare($sql_base . " WHERE c.id = ?");
            $stmt->bind_param('i', $id);
            $stmt->execute();
            echo json_encode($stmt->get_result()->fetch_assoc() ?: []);
            break;
            
        // Para Dropdowns (Admin/Recep)
        case 'getOptions':
            $odontologos = $conn->query("SELECT id, nombre_completo FROM odontologos")->fetch_all(MYSQLI_ASSOC);
            $pacientes = $conn->query("SELECT id, nombre_completo FROM pacientes")->fetch_all(MYSQLI_ASSOC);
            $especialidades = $conn->query("SELECT id, nombre_especialidad FROM especialidades")->fetch_all(MYSQLI_ASSOC);
            echo json_encode([
                'odontologos' => $odontologos,
                'pacientes' => $pacientes,
                'especialidades' => $especialidades
            ]);
            break;
            
        default:
            echo json_encode(['status' => 'error', 'message' => 'Acción GET no reconocida']);
    }

    $conn->close();
    exit;
}
?>