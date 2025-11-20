<?php
// Clases/ClinicaServices.php

class ClinicaServices {

    // --- HU01: Registro de Pacientes ---
    // Valida que los datos cumplan con los requisitos mínimos
    public function validarDatosPaciente($nombre, $email, $dni) {
        if (empty($nombre) || empty($dni)) {
            return false; // Fallo: Datos vacíos
        }
        // Valida formato de email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false; // Fallo: Email inválido
        }
        // Valida que el DNI sea numérico y tenga longitud correcta (ej. 8 dígitos)
        if (!is_numeric($dni) || strlen($dni) < 8) {
            return false; // Fallo: DNI inválido
        }
        return true; // Éxito
    }

    // --- HU02: Autenticación ---
    // Simula la verificación de contraseña segura
    public function verificarLogin($passwordIngresada, $hashGuardado) {
        return password_verify($passwordIngresada, $hashGuardado);
    }

    // --- HU04: Conflicto de Horarios (Citas) ---
    // Recibe una fecha nueva y una lista de fechas ya ocupadas
    public function detectarConflicto($fechaNueva, $listaCitasExistentes) {
        foreach ($listaCitasExistentes as $cita) {
            // Si la fecha y hora coinciden exactamente
            if ($cita == $fechaNueva) {
                return true; // ¡Hay conflicto!
            }
        }
        return false; // No hay conflicto, está libre
    }

    // --- HU05: Estados de Cita ---
    // Valida las transiciones de estado permitidas
    public function cambiarEstadoCita($estadoActual, $accion) {
        if ($estadoActual === 'pendiente') {
            if ($accion === 'aceptar') return 'confirmada';
            if ($accion === 'rechazar') return 'cancelada';
        }
        // Si ya está confirmada o cancelada, no debería cambiar fácilmente
        return $estadoActual; 
    }

    // --- HU06: Lista de Espera ---
    // Calcula prioridad basada en días de espera
    public function calcularPrioridadEspera($fechaIngreso) {
        $fecha = new DateTime($fechaIngreso);
        $hoy = new DateTime();
        $dias = $hoy->diff($fecha)->days;

        if ($dias >= 7) {
            return 'ALTA'; // Más de una semana esperando
        }
        return 'NORMAL';
    }
}
?>