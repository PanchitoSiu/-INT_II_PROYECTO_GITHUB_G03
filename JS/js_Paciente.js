// ===================================
// ====== JS PARA PACIENTE ======
// (Depende de js_comun.js)
// ===================================

document.addEventListener("DOMContentLoaded", () => {
    
    const actionArea = document.querySelector("#actionArea");
    let allMisCitasData = []; // Caché para "Mis Citas"

    // ===================================
    // ====== NAVEGACIÓN PACIENTE ======
    // ===================================
    
    const btnMisCitas = document.querySelector("#btn-mis-citas-pac");
    if (btnMisCitas) {
      btnMisCitas.addEventListener("click", renderMisCitasPacienteView); 
    }
  
    const btnListaEspera = document.querySelector("#btn-lista-espera-pac");
    if (btnListaEspera) {
      btnListaEspera.addEventListener("click", renderMiListaEsperaView);
    }
  
    const btnModificarPerfil = document.querySelector("#btn-modificar-perfil-pac");
    if (btnModificarPerfil) {
      btnModificarPerfil.addEventListener("click", (e) => {
        const pacienteId = e.currentTarget.dataset.id;
        if (pacienteId) {
          openPacienteProfileForm(pacienteId); 
        } else {
          alert("Error: No se pudo encontrar el ID de usuario.");
        }
      });
    }
    
    const btnMisReportes = document.querySelector("#btn-mis-reportes-pac");
    if (btnMisReportes) {
      btnMisReportes.addEventListener("click", renderMisReportesPacienteView);
    }

    // ========================================
    // ====== VISTA "MIS CITAS" (PACIENTE) ======
    // ========================================

    function renderMisCitasPacienteView() {
      actionArea.innerHTML = `
        <div class="citas-container">
          <div class="citas-header">
            <h2>Mis Citas Agendadas <span class="badge" id="miscitas-badge">0</span></h2>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha y Día</th>
                  <th>Odontólogo</th>
                  <th>Especialidad</th>
                  <th>Notas</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody id="miscitas-table-body">
                <tr><td colspan="5" style="text-align:center;">Cargando mis citas...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
      loadMisCitasPaciente();
    }

    function loadMisCitasPaciente() {
      const tbody = document.querySelector("#miscitas-table-body");
      const badge = document.querySelector("#miscitas-badge");
      if (!tbody || !badge) return;
      
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>`;
      badge.textContent = "0";

      fetch("../PHP/gestion_de_citas_Admi_Recep.php?action=getMisCitasPaciente")
        .then(r => r.json())
        .then(({ data, count }) => {
          allMisCitasData = data || []; 
          badge.textContent = count || 0;
          renderMisCitasPacienteTable(allMisCitasData);
        })
        .catch(e => {
          console.error("Error al cargar mis citas:", e);
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Error al cargar las citas.</td></tr>`;
        });
    }
    
    function renderMisCitasPacienteTable(citas) {
      const tbody = document.querySelector("#miscitas-table-body");
      if (!tbody) return;

      if (citas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No tiene citas programadas.</td></tr>`;
        return;
      }
      
      tbody.innerHTML = "";
      citas.forEach(cita => {
        const tr = document.createElement("tr");
        const statusClass = escapeHTML(cita.status); // Depende de js_comun.js
        
        tr.innerHTML = `
          <td>${escapeHTML(cita.appointment_date)}</td>
          <td>${escapeHTML(cita.odontologo)}</td>
          <td>${escapeHTML(cita.especialidad)}</td>
          <td>${escapeHTML(cita.notas || '-')}</td>
          <td><span class="status-badge ${statusClass}">${escapeHTML(cita.status)}</span></td>
        `;
        tbody.appendChild(tr);
      });
    }
    
    // ========================================
    // ====== VISTA "LISTA DE ESPERA" (PACIENTE) ======
    // ========================================
    
    function renderMiListaEsperaView() {
      actionArea.innerHTML = `
        <div class="content-box report-container">
          <h3>Mi Estado en Lista de Espera</h3>
          <div id="lista-espera-status" style="text-align:center; margin-bottom: 20px;">
            <p>Consultando estado...</p>
          </div>
          <form id="formAddMeToWaitingList" style="text-align:center;">
            <label for="notas_espera">Notas (Opcional: Razón de la cita, preferencia de horario, etc.)</label>
            <textarea name="notas" id="notas_espera" rows="3" style="width:100%; font-family: Arial; font-size: 1rem; padding: 8px; margin-top: 10px;"></textarea>
            <button type="submit" class="btn btn-add-new" style="margin-top:15px;">Agregarme a la Lista de Espera</button>
          </form>
        </div>
      `;
      
      loadMiEstadoEspera();
      
      document.querySelector("#formAddMeToWaitingList").addEventListener("submit", async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          fd.append('action', 'addMeToWaitingList');
          
          try {
            const res = await fetch("../PHP/gestion_lista_espera_Admi_Recep.php", { method: 'POST', body: fd }).then(r => r.json());
            if (res.status === 'success') {
                alert("¡Te has agregado a la lista de espera con éxito!");
                loadMiEstadoEspera(); // Recarga el estado
            } else {
                alert(res.message || 'Ocurrió un error.');
            }
          } catch (err) {
            alert("Error de conexión al agregar a la lista.");
          }
      });
    }
    
    async function loadMiEstadoEspera() {
        const statusDiv = document.querySelector("#lista-espera-status");
        if (!statusDiv) return;
        
        try {
            const res = await fetch("../PHP/gestion_lista_espera_Admi_Recep.php?action=getMiEstadoEspera").then(r => r.json());
            if (res.status === 'success' && res.data) {
                // Si el paciente ESTÁ en la lista
                statusDiv.innerHTML = `
                    <p style="font-weight: bold; font-size: 1.1rem; color: #38BCAE;">Actualmente SÍ estás en la lista de espera.</p>
                    <p>Fecha de ingreso: ${escapeHTML(res.data.fecha_ingreso)}</p>
                    <p>Notas: ${escapeHTML(res.data.notas || '(sin notas)')}</p>
                `;
                // Ocultamos el formulario de agregar si ya está
                document.querySelector("#formAddMeToWaitingList").style.display = 'none';
                
            } else if (res.status === 'success') {
                // Si NO está en la lista
                statusDiv.innerHTML = `
                    <p style="font-weight: bold; font-size: 1.1rem; color: #D9534F;">Actualmente NO estás en la lista de espera.</p>
                    <p>Si no encuentras una cita disponible, puedes agregarte a la lista y te contactaremos.</p>
                `;
                document.querySelector("#formAddMeToWaitingList").style.display = 'block';
            } else {
                statusDiv.innerHTML = `<p style="color: #D9534F;">${res.message || 'Error al consultar estado.'}</p>`;
            }
        } catch(e) {
            statusDiv.innerHTML = `<p style="color: #D9534F;">Error de conexión al consultar estado.</p>`;
        }
    }
    
    // ========================================
    // ====== VISTA "MIS REPORTES" (PACIENTE) ======
    // ========================================

    function renderMisReportesPacienteView() {
        actionArea.innerHTML = `
        <div class="citas-container historial-container">
          <div class="citas-header">
            <h2>Mis Reportes y Archivos</h2>
          </div>
          <div id="historial-lista-paciente">
            <div class="content-box"><p>Cargando historial...</p></div>
          </div>
        </div>
      `;
      loadMisReportesPaciente();
    }
    
    async function loadMisReportesPaciente() {
        const listDiv = document.querySelector("#historial-lista-paciente");
        if (!listDiv) return;
        
        try {
            const res = await fetch(`../PHP/gestion_de_citas_Admi_Recep.php?action=getMiHistorial`);
            const { status, data } = await res.json();

            if (status !== 'success' || !data.historial) {
                throw new Error(data.message || "No se pudo cargar el historial.");
            }
        
            const { historial } = data; // Solo necesitamos el historial de citas

            let historialHtml = '';
            if (historial.length === 0) {
                historialHtml = '<div class="cita-item"><p>No tienes citas pasadas con diagnósticos o archivos.</p></div>';
            } else {
                historialHtml = historial.map(cita => {
                    let archivosHtml = '<ul class="lista-archivos-cita">';
                    if (cita.archivos && cita.archivos.length > 0) {
                        cita.archivos.forEach(file => {
                            const filePath = `${file.ruta_archivo}${file.nombre_servidor}`;
                            archivosHtml += `
                                <li>
                                    <a href="${filePath}" target="_blank">${escapeHTML(file.nombre_original)}</a>
                                </li>`;
                        });
                    } else {
                        archivosHtml += '<li>No hay archivos adjuntos.</li>';
                    }
                    archivosHtml += '</ul>';

                    return `
                    <div class="cita-item">
                        <div class="cita-item-header">
                        <strong>Fecha:</strong> ${escapeHTML(cita.fecha)} | 
                        <strong>Odontólogo:</strong> ${escapeHTML(cita.odontologo)} | 
                        <strong>Especialidad:</strong> ${escapeHTML(cita.especialidad)}
                        </div>
                        <div class="cita-item-body">
                        <strong>Diagnóstico/Notas del Doctor:</strong>
                        <p>${escapeHTML(cita.notas || '(Sin notas)')}</p>
                        
                        <strong>Archivos Adjuntos (Radiografías, etc.):</strong>
                        ${archivosHtml}
                        </div>
                    </div>
                    `;
                }).join('');
            }
            listDiv.innerHTML = historialHtml;
            
        } catch (e) {
            console.error("Error al cargar historial:", e);
            listDiv.innerHTML = `<div class="content-box"><p>Error al cargar el historial.</p></div>`;
        }
    }


    // ========================================
    // ====== FUNCIONES PERFIL PACIENTE ======
    // ========================================

    async function openPacienteProfileForm(id) {
        let item = null;
        try {
          item = await fetch(`../PHP/gestion_pacientes_Admi_Recep.php?action=getById&id=${id}`).then(r => r.json());
          if (!item || !item.id) {
            throw new Error("No se pudieron cargar los datos del perfil.");
          }
        } catch(e) {
          alert(e.message || "Error al cargar datos para el formulario.");
          return;
        }
    
        // Usa js_comun.js
        const html = `
          <div id="overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999;">
            <div style="background:#fff;border-radius:10px;padding:20px;max-width:800px;width:95%;">
              <h3 style="margin-top:0;">Modificar Mis Datos Personales</h3>
              <form id="formPacienteProfile" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                <label>Nombre Completo</label>
                <input type="text" name="nombre_completo" required value="${escapeHTML(item.nombre_completo)}"/>
                <label>DNI</label>
                <input type="text" name="dni" required value="${escapeHTML(item.dni)}"/>
                <label>Username</label>
                <input type="text" name="username" required value="${escapeHTML(item.username)}"/>
                <label>Email</label>
                <input type="email" name="email" required value="${escapeHTML(item.email)}"/>
                <label>Teléfono</label>
                <input type="text" name="telefono" required value="${escapeHTML(item.telefono)}"/>
                <label>Contraseña</label>
                <input type="password" name="password" placeholder="Dejar en blanco para no cambiar" />
                
                <div style="grid-column:1/-1;display:flex;gap:10px;margin-top:6px;">
                    <button type="submit" class="btn">Actualizar Perfil</button>
                    <button type="button" class="btn" style="background:#999" id="btnCancel">Cancelar</button>
                </div>
                </form>
            </div>
            </div>`;
        actionArea.insertAdjacentHTML('beforeend', html);
    
        // Usa js_comun.js
        document.querySelector("#btnCancel").addEventListener("click", closeOverlay);
        document.querySelector("#formPacienteProfile").addEventListener("submit", async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
          fd.append('action', 'editProfile'); // Llama a la nueva acción 'editProfile'
            fd.append('id', id);
        
            const res = await fetch("../PHP/gestion_pacientes_Admi_Recep.php", { method: 'POST', body: fd }).then(r => r.json());
        
            if (res.status === 'success') {
            closeOverlay();
            alert("¡Perfil actualizado con éxito!");
            window.location.reload(); // Recarga para actualizar el nombre de bienvenida
            } else {
            alert(res.message || 'Ocurrió un error al actualizar el perfil.');
            }
        });
        }
});