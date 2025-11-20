// ===================================
// ====== JS PARA ODONTÓLOGO ======
// (Depende de js_comun.js)
// ===================================

document.addEventListener("DOMContentLoaded", () => {
    
    const actionArea = document.querySelector("#actionArea");
    let allMisPacientesData = []; // Caché para la lista de pacientes
    let allCitasData = []; // Caché para la vista de "Mis Citas"

    // ===================================
    // ====== NAVEGACIÓN ODONTÓLOGO ======
    // ===================================
    
    const btnMisCitas = document.querySelector("#btn-mis-citas");
    if (btnMisCitas) {
      btnMisCitas.addEventListener("click", renderMisCitasView); 
    }
  
    const btnHistorialPacientes = document.querySelector("#btn-historial-pacientes");
    if (btnHistorialPacientes) {
      btnHistorialPacientes.addEventListener("click", renderHistorialPacientesView);
    }
  
    const btnModificarPerfil = document.querySelector("#btn-modificar-perfil");
    if (btnModificarPerfil) {
      btnModificarPerfil.addEventListener("click", (e) => {
        const odontologoId = e.currentTarget.dataset.id;
        if (odontologoId) {
          openOdontologoProfileForm(odontologoId); 
        } else {
          alert("Error: No se pudo encontrar el ID de usuario.");
        }
      });
    }
    
    const btnMisReportes = document.querySelector("#btn-mis-reportes");
    if (btnMisReportes) {
      btnMisReportes.addEventListener("click", renderMisReportesView);
    }

    // ========================================
    // ====== VISTA "MIS REPORTES" =======
    // ========================================

    function renderMisReportesView() {
      actionArea.innerHTML = `
        <div class="content-box report-container">
          <h3>Mis Reportes</h3>
          <p style="text-align:center; margin-top:-10px; margin-bottom:20px;">Genere reportes de sus citas por rango de fecha o especialidad.</p>
          <form id="reportForm">
            <div class="report-filters-grid">
              <label for="startDate">Fecha de inicio</label>
              <input type="date" name="startDate" id="startDate">
              <label for="endDate">Fecha de fin</label>
              <input type="date" name="endDate" id="endDate">
              <input type="hidden" name="odontologo" value="">
              <label for="especialidad">Especialidad</label>
              <select name="especialidad" id="especialidad">
                <option value="">Todas mis Especialidades</option>
              </select>
            </div>
            <div class="report-actions">
              <button type="button" class="btn" id="generatePDF">
                <img src="../Imagenes/icono_de_pdf.png" alt="PDF" style="width: 30px; vertical-align: middle;"> Generar PDF
              </button>
              <button type="button" class="btn" id="generateExcel">
                <img src="../Imagenes/icono_de_excel.png" alt="Excel" style="width: 30px; vertical-align: middle;"> Generar Excel
              </button>
            </div>
          </form>
        </div>
      `;

      loadReportOptions(); 
  
      document.querySelector("#generatePDF").addEventListener("click", () => {
        const formData = new FormData(document.querySelector("#reportForm"));
        formData.append('format', 'pdf');
        generateReport(formData); 
      });
    
      document.querySelector("#generateExcel").addEventListener("click", () => {
        const formData = new FormData(document.querySelector("#reportForm"));
        formData.append('format', 'excel');
        generateReport(formData); 
      });
    }

    async function loadReportOptions() {
      try {
        const opts = await fetch("../PHP/gestion_de_citas_Admi_Recep.php?action=getOptions").then(r => r.json());
        const especialidadSelect = document.querySelector("#especialidad");
    
        if(especialidadSelect && opts.especialidades) {
          opts.especialidades.forEach(especialidad => {
            const option = document.createElement('option');
            option.value = especialidad.id;
            option.textContent = especialidad.nombre_especialidad;
            especialidadSelect.appendChild(option);
          });
        }
      } catch(e) {
        console.error("Error cargando opciones de reporte:", e);
      }
    }

    function generateReport(formData) {
      const startDate = formData.get("startDate");
      const endDate = formData.get("endDate");
      const odontologo = formData.get("odontologo"); 
      const especialidad = formData.get("especialidad");
      const format = formData.get("format");

      fetch("../PHP/generar_reporte.php", {
        method: "POST",
        body: JSON.stringify({ startDate, endDate, odontologo, especialidad, format }),
        headers: { "Content-Type": "application/json" }
      })
      .then(response => {
          if (!response.ok) throw new Error('Error en la respuesta del servidor');
          return response.blob();
      })
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const dateStr = getFormattedDate(); // Depende de js_comun.js
        if (format === 'excel') {
          link.download = `mis_reportes_citas_${dateStr}.xls`; 
        } else {
          link.download = `mis_reportes_citas_${dateStr}.pdf`;
        }
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(error => {
        console.error("Error al generar el reporte:", error);
        alert("Error al generar el reporte. Revise la consola.");
      });
    }

    // ========================================
    // ====== VISTA "MIS CITAS" =======
    // ========================================

    function renderMisCitasView() {
      actionArea.innerHTML = `
        <div class="citas-container">
          <div class="citas-header">
            <h2>Mis Citas Agendadas <span class="badge" id="miscitas-badge">0</span></h2>
            <div class="search-bar">
              <label for="search-miscitas">Buscador</label>
              <input type="text" id="search-miscitas" placeholder="Nombre paciente, DNI...">
            </div>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha y Día</th>
                  <th>Paciente</th>
                  <th>DNI</th>
                  <th>Notas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="miscitas-table-body">
                <tr><td colspan="6" style="text-align:center;">Cargando mis citas...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
      
      document.querySelector("#search-miscitas").addEventListener("input", handleSearchMisCitas);
      
      // --- AQUÍ ESTÁ EL PRIMER CAMBIO ---
      document.querySelector("#miscitas-table-body").addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        
        const id = btn.dataset.id;
        if (btn.classList.contains("btn-accept")) {
          btn.textContent = "Procesando..."; // Feedback visual
          handleCitaAction(id, 'aceptarCita', btn); // Pasamos el botón 'btn'
        } else if (btn.classList.contains("btn-reject")) {
          btn.textContent = "Procesando...";
          handleCitaAction(id, 'rechazarCita', btn); // Pasamos el botón 'btn'
        }
      });

      loadMisCitas();
    }

    function loadMisCitas() {
      const tbody = document.querySelector("#miscitas-table-body");
      const badge = document.querySelector("#miscitas-badge");
      if (!tbody || !badge) return;
      
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>`;
      badge.textContent = "0";

      fetch("../PHP/gestion_de_citas_Admi_Recep.php?action=getMisCitas")
        .then(r => r.json())
        .then(({ data, count }) => {
          allCitasData = data || []; 
          badge.textContent = count || 0;
          renderMisCitasTable(allCitasData);
        })
        .catch(e => {
          console.error("Error al cargar mis citas:", e);
          tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Error al cargar las citas.</td></tr>`;
        });
    }
    
    function renderMisCitasTable(citas) {
      const tbody = document.querySelector("#miscitas-table-body");
      if (!tbody) return;

      if (citas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No tiene citas programadas.</td></tr>`;
        return;
      }
      
      tbody.innerHTML = "";
      citas.forEach(cita => {
        const tr = document.createElement("tr");
        const statusClass = escapeHTML(cita.status); // Depende de js_comun.js
        
        let botonesHTML = '';
        if (cita.status === 'pendiente') {
            botonesHTML = `
              <button class="btn-accept" data-id="${cita.id}">Aceptar</button>
              <button class="btn-reject" data-id="${cita.id}">Rechazar</button>
            `;
        } else {
            botonesHTML = '---';
        }

        tr.innerHTML = `
          <td>${escapeHTML(cita.appointment_date)}</td>
          <td>${escapeHTML(cita.paciente)}</td>
          <td>${escapeHTML(cita.dni)}</td>
          <td>${escapeHTML(cita.notas || '-')}</td>
          <td><span class="status-badge ${statusClass}">${escapeHTML(cita.status)}</span></td>
          <td class="opciones-buttons">${botonesHTML}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    function handleSearchMisCitas(e) {
      const searchTerm = e.target.value.toLowerCase().trim();
      const filteredData = searchTerm === ''
        ? allCitasData
        : allCitasData.filter(cita => 
            cita.paciente.toLowerCase().includes(searchTerm) ||
            cita.dni.toLowerCase().includes(searchTerm)
          );
      renderMisCitasTable(filteredData);
    }

    // --- AQUÍ ESTÁ EL SEGUNDO CAMBIO ---
    async function handleCitaAction(id, action, btnElement) {
      const fd = new FormData();
      fd.append('action', action);
      fd.append('id', id);

      // Deshabilitamos el botón para evitar doble clic
      if(btnElement) btnElement.disabled = true;

      try {
        const res = await fetch("../PHP/gestion_de_citas_Admi_Recep.php", { method: 'POST', body: fd }).then(r => r.json());
        
        if (res.status === 'success') {
          // Actualización inmediata del DOM (sin recargar)
          if (btnElement) {
             const row = btnElement.closest('tr'); 
             const statusCell = row.querySelector('span.status-badge'); 
             const actionsCell = row.querySelector('.opciones-buttons'); 

             if (action === 'aceptarCita') {
                 statusCell.className = 'status-badge confirmada';
                 statusCell.textContent = 'Confirmada';
             } else {
                 statusCell.className = 'status-badge cancelada';
                 statusCell.textContent = 'Cancelada';
             }
             // Quitamos los botones
             actionsCell.innerHTML = '---';
          }
        } else {
          alert(res.message || 'Ocurrió un error.');
          // Si falló, restauramos el botón
          if(btnElement) {
              btnElement.disabled = false;
              btnElement.textContent = (action === 'aceptarCita') ? "Aceptar" : "Rechazar";
          }
        }
      } catch (e) {
        alert("Error al procesar la solicitud.");
        if(btnElement) btnElement.disabled = false;
      }
    }


    // ========================================
    // ====== VISTA "HISTORIAL DE PACIENTES" =======
    // ========================================

    function renderHistorialPacientesView() {
      actionArea.innerHTML = `
        <div class="citas-container">
          <div class="citas-header">
            <h2>Mis Pacientes Atendidos <span class="badge" id="pacientes-badge">0</span></h2>
            <div class="search-bar">
              <label for="search-pacientes">Buscador</label>
              <input type="text" id="search-pacientes" placeholder="Nombre paciente, DNI...">
            </div>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre Paciente</th>
                  <th>DNI</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="pacientes-table-body">
                <tr><td colspan="5" style="text-align:center;">Cargando pacientes...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
      
      document.querySelector("#search-pacientes").addEventListener("input", handleSearchHistorialPacientes);
      document.querySelector("#pacientes-table-body").addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        
        if (btn.classList.contains("btn-view-history")) {
          const pacienteId = btn.dataset.id;
          loadClinicalHistory(pacienteId); 
        }
      });

      loadHistorialPacientes();
    }

    function loadHistorialPacientes() {
      const tbody = document.querySelector("#pacientes-table-body");
      const badge = document.querySelector("#pacientes-badge");
      if (!tbody || !badge) return;
      
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>`;
      badge.textContent = "0";

      fetch("../PHP/gestion_pacientes_Admi_Recep.php?action=getMisPacientes")
        .then(r => r.json())
        .then(({ data, count }) => {
          allMisPacientesData = data || []; 
          badge.textContent = count || 0;
          renderHistorialPacientesTable(allMisPacientesData);
        })
        .catch(e => {
          console.error("Error al cargar mis pacientes:", e);
          tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Error al cargar los pacientes.</td></tr>`;
        });
    }
    
    function renderHistorialPacientesTable(pacientes) {
      const tbody = document.querySelector("#pacientes-table-body");
      if (!tbody) return;

      if (pacientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No ha atendido a ningún paciente aún.</td></tr>`;
        return;
      }
      
      tbody.innerHTML = "";
      pacientes.forEach(paciente => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHTML(paciente.nombre_completo)}</td>
          <td>${escapeHTML(paciente.dni)}</td>
          <td>${escapeHTML(paciente.email)}</td>
          <td>${escapeHTML(paciente.telefono)}</td>
          <td class="opciones-buttons">
            <button class="btn-edit btn-view-history" data-id="${paciente.id}">Ver Historial</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    function handleSearchHistorialPacientes(e) {
      const searchTerm = e.target.value.toLowerCase().trim();
      const filteredData = searchTerm === ''
        ? allMisPacientesData
        : allMisPacientesData.filter(paciente => 
            paciente.nombre_completo.toLowerCase().includes(searchTerm) ||
            paciente.dni.toLowerCase().includes(searchTerm)
          );
      renderHistorialPacientesTable(filteredData);
    }

    async function loadClinicalHistory(pacienteId) {
      actionArea.innerHTML = `<div class="content-box"><p>Cargando historial del paciente...</p></div>`;

      try {
        const res = await fetch(`../PHP/gestion_de_citas_Admi_Recep.php?action=getHistorialPaciente&paciente_id=${pacienteId}`);
        const { status, data } = await res.json();

        if (status !== 'success' || !data.paciente) {
          throw new Error(data.message || "No se pudo cargar el historial.");
        }
        
        const { paciente, historial } = data;

        let historialHtml = '';
        if (historial.length === 0) {
          historialHtml = '<div class="cita-item"><p>Este paciente no tiene citas registradas con usted.</p></div>';
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
                  <strong>Especialidad:</strong> ${escapeHTML(cita.especialidad)} | 
                  <strong>Estado:</strong> <span class="status-badge ${escapeHTML(cita.status)}">${escapeHTML(cita.status)}</span>
                </div>
                <div class="cita-item-body">
                  <strong>Notas/Diagnóstico:</strong>
                  <p>${escapeHTML(cita.notas || '(Sin notas)')}</p>
                  
                  <strong>Archivos Adjuntos:</strong>
                  ${archivosHtml}
                </div>
                <div class="cita-item-actions">
                  <button class="btn-edit btn-edit-detalles-cita" data-id="${cita.id}">Ver / Editar Detalles</button>
                </div>
              </div>
            `;
          }).join('');
        }

        actionArea.innerHTML = `
          <div class="citas-container historial-container">
            <div class="citas-header">
              <h2>Historial Clínico</h2>
              <button class="btn btn-back" id="btn-back-to-patient-list">← Volver a Pacientes</button>
            </div>
            
            <div class="paciente-detalle-card">
              <h3>${escapeHTML(paciente.nombre_completo)}</h3>
              <p><strong>DNI:</strong> ${escapeHTML(paciente.dni)}</p>
              <p><strong>Email:</strong> ${escapeHTML(paciente.email)}</p>
              <p><strong>Teléfono:</strong> ${escapeHTML(paciente.telefono)}</p>
            </div>
            
            <div class="historial-lista">
              ${historialHtml}
            </div>
          </div>
        `;
        
        document.querySelector("#btn-back-to-patient-list").addEventListener("click", renderHistorialPacientesView);
        
        document.querySelectorAll(".btn-edit-detalles-cita").forEach(btn => {
          btn.addEventListener("click", (e) => {
            const citaId = e.currentTarget.dataset.id;
            const cita = historial.find(c => c.id == citaId);
            openCitaDetalleModal(cita, pacienteId);
          });
        });
        
      } catch (e) {
        console.error("Error al cargar historial:", e);
        actionArea.innerHTML = `<div class="content-box"><p>Error al cargar el historial.</p></div>`;
      }
    }

    function openCitaDetalleModal(cita, pacienteId) {
      const html = `
        <div id="overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999;">
          <div style="background:#fff;border-radius:10px;padding:20px;max-width:700px;width:95%;">
            <h3 style="margin-top:0;">Detalles de la Cita (${escapeHTML(cita.fecha)})</h3>
            
            <form id="formNotaCita">
              <label for="notas">Notas Clínicas / Diagnóstico</label>
              <textarea name="notas" id="notas" rows="6" style="width:100%; font-family: Arial; font-size: 1rem; padding: 8px;">${escapeHTML(cita.notas || '')}</textarea>
              <button type="submit" class="btn" style="margin-top:10px;">Guardar Nota</button>
            </form>

            <hr style="margin: 20px 0;">

            <form id="formSubirArchivo">
              <label for="archivo">Subir Nuevo Archivo (Radiografía, PDF, etc.)</label>
              <input type="file" name="archivo" id="archivo" required>
              <button type="submit" class="btn" style="margin-top:10px; background-color: #5cb85c;">Subir Archivo</button>
            </form>
            
            <button type="button" class="btn" style="background:#6c757d; margin-top:20px;" id="btnCancel">Cerrar</button>
          </div>
        </div>`;
      actionArea.insertAdjacentHTML('beforeend', html);

      document.querySelector("#btnCancel").addEventListener("click", closeOverlay);
      
      document.querySelector("#formNotaCita").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        fd.append('action', 'updateNotaCita');
        fd.append('cita_id', cita.id);

        const res = await fetch("../PHP/gestion_de_citas_Admi_Recep.php", { method: 'POST', body: fd }).then(r => r.json());
        if (res.status === 'success') {
          alert("Nota guardada");
          closeOverlay(); 
          loadClinicalHistory(pacienteId); 
        } else {
          alert(res.message || 'Error al guardar la nota.');
        }
      });
      
      document.querySelector("#formSubirArchivo").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fileInput = e.target.querySelector('input[type="file"]');
        if (!fileInput.files || fileInput.files.length === 0) {
          alert("Por favor, seleccione un archivo para subir.");
          return;
        }

        const fd = new FormData(e.target);
        fd.append('action', 'addArchivoCita');
        fd.append('cita_id', cita.id);

        const res = await fetch("../PHP/gestion_de_citas_Admi_Recep.php", { method: 'POST', body: fd }).then(r => r.json());
        if (res.status === 'success') {
          alert("Archivo subido con éxito");
          closeOverlay(); 
          loadClinicalHistory(pacienteId); 
        } else {
          alert(res.message || 'Error al subir el archivo.');
        }
      });
    }

    // ========================================
    // ====== FUNCIONES PERFIL ODONTÓLOGO ======
    // ========================================

    async function openOdontologoProfileForm(id) {
        let item = null;
        try {
          item = await fetch(`../PHP/gestion_odontologos_Admi_Recep.php?action=getById&id=${id}`).then(r => r.json());
          if (!item || !item.id) {
            throw new Error("No se pudieron cargar los datos del perfil.");
          }
        } catch(e) {
          alert(e.message || "Error al cargar datos para el formulario.");
          return;
        }
    
        const html = `
          <div id="overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999;">
            <div style="background:#fff;border-radius:10px;padding:20px;max-width:800px;width:95%;">
              <h3 style="margin-top:0;">Modificar Mis Datos Personales</h3>
              <form id="formOdontologoProfile" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                <label>Nombre Completo</label>
                <input type="text" name="nombre_completo" required value="${escapeHTML(item.nombre_completo)}"/>
                <label>Username</label>
                <input type="text" name="username" required value="${escapeHTML(item.username)}"/>
                <label>Email</label>
                <input type="email" name="email" required value="${escapeHTML(item.email)}"/>
                <label>Teléfono</label>
                <input type="text" name="telefono" required value="${escapeHTML(item.telefono)}"/>
                <label>Nro. ID</label>
                <input type="text" value="${escapeHTML(item.numero_id)}" disabled />
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
    
        document.querySelector("#btnCancel").addEventListener("click", closeOverlay);
        document.querySelector("#formOdontologoProfile").addEventListener("submit", async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          fd.append('action', 'editProfile');
          fd.append('id', id);
          
          const res = await fetch("../PHP/gestion_odontologos_Admi_Recep.php", { method: 'POST', body: fd }).then(r => r.json());
          
          if (res.status === 'success') {
            closeOverlay();
            alert("¡Perfil actualizado con éxito!");
            window.location.reload(); 
          } else {
            alert(res.message || 'Ocurrió un error al actualizar el perfil.');
          }
        });
      }
});