<?php
// tests/ClinicaTest.php

use PHPUnit\Framework\TestCase;

// Importamos nuestra clase de lógica
require_once __DIR__ . '/../Clases/ClinicaServices.php';

class ClinicaTest extends TestCase {
    
    private $servicio;

    protected function setUp(): void {
        $this->servicio = new ClinicaServices();
    }

    // --- PRUEBA HU01: Registro ---
    public function testValidacionPacienteCorrecta() {
        $resultado = $this->servicio->validarDatosPaciente("Juan Perez", "juan@gmail.com", "12345678");
        $this->assertTrue($resultado, "Debería aceptar datos correctos");
    }

    public function testValidacionPacienteEmailIncorrecto() {
        $resultado = $this->servicio->validarDatosPaciente("Juan Perez", "juan-sin-arroba", "12345678");
        $this->assertFalse($resultado, "Debería rechazar emails sin @");
    }

    // --- PRUEBA HU02: Autenticación ---
    public function testLoginPasswordCorrecta() {
        // Simulamos un hash real de la BD (del string '1234')
        $hashReal = password_hash('1234', PASSWORD_DEFAULT);
        
        $esValido = $this->servicio->verificarLogin('1234', $hashReal);
        $this->assertTrue($esValido, "La contraseña '1234' debería coincidir con su hash");
    }

    public function testLoginPasswordIncorrecta() {
        $hashReal = password_hash('1234', PASSWORD_DEFAULT);
        
        $esValido = $this->servicio->verificarLogin('abcd', $hashReal);
        $this->assertFalse($esValido, "Una contraseña incorrecta no debe pasar");
    }

    // --- PRUEBA HU04: Conflicto de Horarios ---
    public function testDetectarCitaDuplicada() {
        $horarioOcupado = ['2025-10-05 08:00', '2025-10-05 09:00'];
        $intentoCita = '2025-10-05 09:00'; // Esta hora ya está ocupada

        $hayConflicto = $this->servicio->detectarConflicto($intentoCita, $horarioOcupado);
        $this->assertTrue($hayConflicto, "Debería detectar que las 09:00 ya está ocupado");
    }

    public function testPermitirHorarioLibre() {
        $horarioOcupado = ['2025-10-05 08:00', '2025-10-05 09:00'];
        $intentoCita = '2025-10-05 15:00'; // Esta hora está libre

        $hayConflicto = $this->servicio->detectarConflicto($intentoCita, $horarioOcupado);
        $this->assertFalse($hayConflicto, "Debería permitir agendar a las 15:00");
    }

    // --- PRUEBA HU05: Estados de Cita ---
    public function testAceptarCitaPendiente() {
        $nuevoEstado = $this->servicio->cambiarEstadoCita('pendiente', 'aceptar');
        $this->assertEquals('confirmada', $nuevoEstado);
    }

    // --- PRUEBA HU06: Lista de Espera ---
    public function testPrioridadAltaPorTiempo() {
        // Simulamos una fecha de hace 10 días
        $fechaAntigua = date('Y-m-d', strtotime('-10 days'));
        
        $prioridad = $this->servicio->calcularPrioridadEspera($fechaAntigua);
        $this->assertEquals('ALTA', $prioridad, "Pacientes con >7 días deben ser prioridad ALTA");
    }
}
?>