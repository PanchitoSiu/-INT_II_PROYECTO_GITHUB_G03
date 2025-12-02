// ===================================
// ====== JS PARA ADMIN Y RECEPCIÓN ======
// (Depende de js_comun.js para utilidades)
// ===================================

document.addEventListener("DOMContentLoaded", () => {
  
  // --- Almacenamiento en caché ---
  let allCitasData = []; 
  let allWaitingListData = [];
  let allAdminsData = []; 
  let allRecepcionistasData = []; 
  let allOdontologosData = [];
  let allPacientesData = [];
  
  const actionArea = document.querySelector("#actionArea");

  // ===================================
  // ====== NAVEGACIÓN PRINCIPAL ======
  // ===================================

  const btnManageAppointments = document.querySelector("#manageAppointments");
  if(btnManageAppointments) btnManageAppointments.addEventListener("click", renderAppointmentsView);
  
  const btnWaitingList = document.querySelector("#waitingList");
  if(btnWaitingList) btnWaitingList.addEventListener("click", renderWaitingListView); 
  
  const btnGenerateReports = document.querySelector("#generateReports");
  if(btnGenerateReports) btnGenerateReports.addEventListener("click", renderReportsView);
  
  const btnManageUsers = document.querySelector("#manageUsers");
  if(btnManageUsers) btnManageUsers.addEventListener("click", renderUsersSubMenuView);

  const btnManagePatients = document.querySelector("#managePatients");
  if(btnManagePatients) btnManagePatients.addEventListener("click", renderPacientesView);

  // --- HU12: BOTÓN SERVICIOS Y HORARIOS ---
  const btnManageServices = document.querySelector("#manageServices");
  if(btnManageServices) btnManageServices.addEventListener("click", renderServicesView);


  // ===================================
  // ====== HU12: SERVICIOS Y HORARIOS ======
  // ===================================

  function renderServicesView() {
    actionArea.innerHTML = `
      <div style="display: flex; gap: 20px; flex-wrap: wrap; width: 100%;">
        
        <div class="citas-container" style="flex: 1; min-width: 300px;">
            <div class="citas-header"><h2>Especialidades</h2></div>
            <div class="table-container" style="max-height: 300px; overflow-y: auto;">
                <table id="table-specialties">
                    <thead><tr><th>Nombre</th><th>Acción</th></tr></thead>
                    <tbody><tr><td colspan="2" style="text-align:center">Cargando...</td></tr></tbody>
                </table>
            </div>
            <form id="formSpecialty" style="margin-top: 15px; display: flex; gap: 10px;">
                <input type="text" name="nombre" placeholder="Nueva Especialidad" required style="padding: 8px; flex: 1; border:1px solid #ccc; border-radius:5px;">
                <button type="submit" class="btn btn-add-new" style="padding: 8px 15px;">+</button>
            </form>
        </div>

        <div class="citas-container" style="flex: 1; min-width: 300px;">
            <div class="citas-header"><h2>Horarios Maestros</h2></div>
            <div class="table-container" style="max-height: 300px; overflow-y: auto;">
                <table id="table-schedules">
                    <thead><tr><th>Turno</th><th>Hora</th><th>Desc.</th><th>Acción</th></tr></thead>
                    <tbody><tr><td colspan="4" style="text-align:center">Cargando...</td></tr></tbody>
                </table>
            </div>
            <form id="formSchedule" style="margin-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <select name="turno" required style="padding: 8px; border:1px solid #ccc; border-radius:5px;">
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noche">Noche</option>
                </select>
                <input type="time" name="hora" required style="padding: 8px; border:1px solid #ccc; border-radius:5px;">
                <input type="text" name="descripcion" placeholder="Ej: 8am - 1pm" required style="padding: 8px; grid-column: span 2; border:1px solid #ccc; border-radius:5px;">
                <button type="submit" class="btn btn-add-new" style="padding: 8px; grid-column: span 2;">Agregar Horario</button>
            </form>
        </div>

      </div>
    `;

    loadServicesAndSchedules();

    // Listener Agregar Especialidad
    document.querySelector("#formSpecialty").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        fd.append('action', 'addSpecialty');
        await sendServiceRequest(fd);
        e.target.reset();
    });

    // Listener Agregar Horario
    document.querySelector("#formSchedule").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        fd.append('action', 'addSchedule');
        await sendServiceRequest(fd);
        e.target.reset();
    });
  }

  async function loadServicesAndSchedules() {
    try {
        // Asegúrate de haber creado el archivo 'gestion_servicios_horarios.php' en la carpeta PHP
        const res = await fetch("../PHP/gestion_servicios_horarios.php?action=getAll").then(r => r.json());
        
        // Render Especialidades
        const tbodyEsp = document.querySelector("#table-specialties tbody");
        if(res.especialidades.length === 0) {
             tbodyEsp.innerHTML = '<tr><td colspan="2" style="text-align:center">No hay especialidades.</td></tr>';
        } else {
            tbodyEsp.innerHTML = res.especialidades.map(s => `
                <tr>
                    <td>${escapeHTML(s.nombre_especialidad)}</td>
                    <td style="text-align:center">
                        <button class="btn-delete" onclick="deleteService('deleteSpecialty', ${s.id})" title="Eliminar">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }

        // Render Horarios
        const tbodySch = document.querySelector("#table-schedules tbody");
        if(res.horarios.length === 0) {
             tbodySch.innerHTML = '<tr><td colspan="4" style="text-align:center">No hay horarios.</td></tr>';
        } else {
            tbodySch.innerHTML = res.horarios.map(h => `
                <tr>
                    <td>${escapeHTML(h.turno)}</td>
                    <td>${escapeHTML(h.hora)}</td>
                    <td>${escapeHTML(h.descripcion || '')}</td>
                    <td style="text-align:center">
                        <button class="btn-delete" onclick="deleteService('deleteSchedule', ${h.id})" title="Eliminar">🗑️</button>
                    </td>
                </tr>
            `).join('');
        }

    } catch(e) { console.error(e); }
  }

  async function sendServiceRequest(formData) {
      try {
          const res = await fetch("../PHP/gestion_servicios_horarios.php", { method: 'POST', body: formData }).then(r => r.json());
          if(res.status === 'success') {
              loadServicesAndSchedules();
          } else {
              alert(res.message || "Error al procesar la solicitud.");
          }
      } catch(e) { alert("Error de conexión."); }
  }

  // Función global para borrar desde el onclick del HTML
  window.deleteService = async function(action, id) {
      if(!confirm("¿Estás seguro de eliminar este registro?")) return;
      const fd = new FormData();
      fd.append('action', action);
      fd.append('id', id);
      await sendServiceRequest(fd);
  };


  // ===================================
  // ====== SECCIÓN DE REPORTES ======
  // ===================================

  function renderReportsView() {
    actionArea.innerHTML = `
      <div class="content-box report-container">
        <h3>Generar Reportes</h3>
        <form id="reportForm">
          <div class="report-filters-grid">
            <label for="startDate">Fecha de inicio</label>
            <input type="date" name="startDate" id="startDate">
            <label for="endDate">Fecha de fin</label>
            <input type="date" name="endDate" id="endDate">
            <label for="odontologo">Odontólogo</label>
            <select name="odontologo" id="odontologo">
              <option value="">Todos los Odontólogos</option>
            </select>
            <label for="especialidad">Especialidad</label>
            <select name="especialidad" id="especialidad">
              <option value="">Todas las Especialidades</option>
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
      const odontologoSelect = document.querySelector("#odontologo");
      const especialidadSelect = document.querySelector("#especialidad");
  
      if(odontologoSelect && opts.odontologos) {
        opts.odontologos.forEach(odontologo => {
          const option = document.createElement('option');
          option.value = odontologo.id;
          option.textContent = odontologo.nombre_completo;
          odontologoSelect.appendChild(option);
        });
      }
  
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
      const dateStr = getFormattedDate(); 
      if (format === 'excel') {
        link.download = `reporte_citas_excel_${dateStr}.xls`; 
      } else {
        link.download = `reporte_citas_pdf_${dateStr}.pdf`;
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

  
  // ===================================
  // ====== VISTA: GESTIONAR CITAS ======
  // ===================================
  
  function renderAppointmentsView() {
    actionArea.innerHTML = `
      <div class="citas-container">
        <div class="citas-header">
          <h2>Historial de Citas <span class="badge" id="citas-badge">0</span></h2>
          <div class="search-bar">
            <label for="search-citas">Buscador</label>
            <input type="text" id="search-citas" placeholder="Nombre...">
          </div>
        </div>

        <div style="margin-bottom: 15px; text-align: right;">
            <button class="btn" id="btn-send-reminders" style="background-color: #f0ad4e; border:none; padding: 8px 15px; font-size: 0.9rem;">
                🔔 Enviar Recordatorios (24h)
            </button>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha y Día</th>
                <th>Personal Sanitario</th>
                <th>Especialidad</th>
                <th>Paciente</th>
                <th>DNI</th>
                <th>Estado</th>
                <th>Opciones</th>
              </tr>
            </thead>
            <tbody id="citas-table-body">
              <tr><td colspan="7" style="text-align:center;">Cargando citas...</td></tr>
            </tbody>
          </table>
        </div>
        <div class="citas-footer">
          <button class="btn btn-add-new" id="add-new-cita">Agregar nueva Cita</button>
          <span class="pagination-info">Paginación 1 de 1</span>
        </div>
      </div>
    `;

    document.querySelector("#add-new-cita").addEventListener("click", () => openCitaForm());
    document.querySelector("#search-citas").addEventListener("input", handleSearchCitas);
    
    // Listener para el botón de recordatorios
    document.querySelector("#btn-send-reminders").addEventListener("click", async () => {
        if(!confirm("¿Desea buscar citas para mañana y enviar recordatorios por correo a los pacientes?")) return;
        
        const btn = document.querySelector("#btn-send-reminders");
        btn.disabled = true;
        btn.textContent = "Enviando...";
        
        try {
            const res = await fetch("../PHP/enviar_recordatorios.php").then(r => r.json());
            alert(res.message);
        } catch (e) {
            console.error(e);
            alert("Error al ejecutar el proceso de recordatorios.");
        } finally {
            btn.disabled = false;
            btn.textContent = "🔔 Enviar Recordatorios (24h)";
        }
    });

    document.querySelector("#citas-table-body").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const id = btn.dataset.id;
      
      if (btn.classList.contains("btn-edit")) {
        openCitaForm(id);
      } else if (btn.classList.contains("btn-delete")) {
        confirmDelete(id);
      } else if (btn.classList.contains("btn-accept")) {
          handleCitaAction(id, 'aceptarCita'); 
      } else if (btn.classList.contains("btn-reject")) {
          handleCitaAction(id, 'rechazarCita');
      } else if (btn.classList.contains("btn-checkin")) { 
          // HU7: CHECK-IN
          if(confirm("¿El paciente ha llegado a la clínica?")) {
              handleCitaAction(id, 'registrarLlegada');
          }
      } else if (btn.classList.contains("btn-print")) {
          window.open(`../PHP/generar_comprobante.php?id=${id}`, '_blank');
      }
    });
    loadAppointments();
  }
  
  function handleSearchCitas(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const filteredData = searchTerm === ''
      ? allCitasData
      : allCitasData.filter(cita => 
          cita.paciente.toLowerCase().includes(searchTerm) 
        );
    renderCitasTable(filteredData);
  }

  function loadAppointments() {
    const tbody = document.querySelector("#citas-table-body");
    const badge = document.querySelector("#citas-badge");
    if (!tbody || !badge) return;
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Cargando citas...</td></tr>`;
    badge.textContent = "0";

    fetch("../PHP/gestion_de_citas_Admi_Recep.php?action=getAllAdmin") 
      .then(r => r.json())
      .then(({ data, count }) => {
        allCitasData = data || []; 
        allCitasData.sort((a, b) => 
          parseCustomDate(a.appointment_date).localeCompare(parseCustomDate(b.appointment_date))
        );
        renderCitasTable(allCitasData);
        if (badge) badge.textContent = count || 0;
      })
      .catch((e) => {
        console.error("Error al cargar citas:", e);
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Error al cargar las citas.</td></tr>`;
      });
  }

  function renderCitasTable(citas) {
    const tbody = document.querySelector("#citas-table-body");
    if (!tbody) return; 

    if (citas.length === 0) {
      const searchTerm = document.querySelector("#search-citas") ? document.querySelector("#search-citas").value : "";
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">${searchTerm ? 'No se encontraron citas.' : 'No hay citas registradas.'}</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    citas.forEach(cita => {
      const tr = document.createElement("tr");
      const statusClass = escapeHTML(cita.status);
      
      // --- BOTONES CON EMOJIS ---
      let botonesHTML = `
        <button class="btn-edit" data-id="${cita.id}" title="Editar">⚙️</button>
        <button class="btn-delete" data-id="${cita.id}" title="Eliminar">🗑️</button>
        <button class="btn-print" data-id="${cita.id}" title="Imprimir Comprobante">🖨️</button>
      `;
      
      if (cita.status === 'pendiente') {
          botonesHTML = `
            <button class="btn-accept" data-id="${cita.id}" title="Confirmar">✅</button>
            <button class="btn-reject" data-id="${cita.id}" title="Rechazar">❌</button>
          ` + botonesHTML;
      } else if (cita.status === 'confirmada') {
          // HU7: Check-in
          botonesHTML = `
            <button class="btn-checkin" data-id="${cita.id}" title="Registrar Llegada del Paciente">🙋‍♂️</button>
          ` + botonesHTML;
      }
      
      tr.innerHTML = `
        <td>${escapeHTML(cita.appointment_date)}</td>
        <td>${escapeHTML(cita.odontologo)}</td>
        <td>${escapeHTML(cita.especialidad)}</td>
        <td>${escapeHTML(cita.paciente)}</td>
        <td>${escapeHTML(cita.dni)}</td>
        <td><span class="status-badge ${statusClass}">${escapeHTML(cita.status)}</span></td>
        <td class="opciones-buttons" style="display:flex; gap:5px;">${botonesHTML}</td>`;
      tbody.appendChild(tr);
    });
  }
  
  async function handleCitaAction(id, action) {
      const fd = new FormData();
      fd.append('action', action);
      fd.append('id', id);

      try {
        const res = await fetch("../PHP/gestion_de_citas_Admi_Recep.php", { method: 'POST', body: fd }).then(r => r.json());
        if (res.status === 'success') {
          loadAppointments(); 
        } else {
          alert(res.message || 'Ocurrió un error.');
        }
      } catch (e) {
        alert("Error al procesar la solicitud.");
      }
  }
  
  async function openCitaForm(citaId = null, preselectedPacienteId = null, waitingListId = null) {
    try {
      const opts = await fetch("../PHP/gestion_de_citas_Admi_Recep.php?action=getOptions").then(r => r.json());
      const odOpts = (opts.odontologos || []).map(o => `<option value="${o.id}">${escapeHTML(o.nombre_completo)}</option>`).join("");
      const paOpts = (opts.pacientes || []).map(p => `<option value="${p.id}">${escapeHTML(p.nombre_completo)}</option>`).join("");
      const esOpts = (opts.especialidades || []).map(e => `<option value="${e.id}">${escapeHTML(e.nombre_especialidad)}</option>`).join("");
  
      let cita = null;
      if (citaId) {
        cita = await fetch(`../PHP/gestion_de_citas_Admi_Recep.php?action=getById&id=${citaId}`).then(r => r.json());
      }
  
      const html = `
        <div id="overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999;">
          <div style="background:#fff;border-radius:10px;padding:20px;max-width:820px;width:95%;">
            <h3 style="margin-top:0;">${citaId ? 'Editar Cita' : 'Agregar Nueva Cita'}</h3>
            <form id="formCita" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:center;">
              <label>Fecha y Hora</label>
              <input type="datetime-local" name="appointment_date" required
                     value="${cita ? toLocalInputValue(cita.appointment_date) : ''}"/>
              <label>Odontólogo</label>
              <select name="odontologo_id" required>
                <option value="">Seleccionar Odontólogo</option>${odOpts}
              </select>
              <label>Paciente</label>
              <select name="paciente_id" required>
                <option value="">Seleccionar Paciente</option>${paOpts}
              </select>
              <label>Especialidad</label>
              <select name="especialidad_id" required>
                <option value="">Seleccionar Especialidad</option>${esOpts}
              </select>
              <label>Notas</label>
              <textarea name="notas" rows="2">${cita ? escapeHTML(cita.notas ?? '') : ''}</textarea>
              <div style="grid-column:1/-1;display:flex;gap:10px;margin-top:6px;">
                <button type="submit" class="btn">${citaId ? 'Actualizar Cita' : 'Agregar Cita'}</button>
                <button type="button" class="btn" style="background:#999" id="btnCancel">Cancelar</button>
              </div>
            </form>
          </div>
        </div>`;
      actionArea.insertAdjacentHTML('beforeend', html);
  
      const form = document.querySelector("#formCita");
      if (cita) {
        form.elements['odontologo_id'].value = cita.odontologo_id;
        form.elements['paciente_id'].value = cita.paciente_id;
        form.elements['especialidad_id'].value = cita.especialidad_id;
      } else if (preselectedPacienteId) {
        form.elements['paciente_id'].value = preselectedPacienteId;
      }
  
      document.querySelector("#btnCancel").addEventListener("click", closeOverlay);
      document.querySelector("#formCita").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        fd.append('action', citaId ? 'edit' : 'add');
        if (citaId) fd.append('cita_id', citaId);
  
        const res = await fetch("../PHP/gestion_de_citas_Admi_Recep.php", { method: 'POST', body: fd }).then(r => r.json());
        
        if (res.status === 'success') {
          closeOverlay();
          if (waitingListId) {
            await removeWaitingListEntry(waitingListId); 
            renderAppointmentsView();
          } else {
            renderAppointmentsView();
          }
        } else {
          alert('Ocurrió un error al guardar.');
        }
      });
    } catch(e) {
      console.error("Error al abrir formulario de cita:", e);
    }
  }
  
  function confirmDelete(id) {
    const html = `
      <div id="overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999;">
        <div style="background:#fff;border-radius:10px;padding:20px;max-width:520px;width:92%;">
          <h3 style="margin-top:0;">¿Estás seguro que quieres borrar esta cita?</h3>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
            <button id="btnYes" class="btn" style="background:#D9534F;">Sí, borrar</button>
            <button id="btnNo"  class="btn" style="background:#999;">Cancelar</button>
          </div>
        </div>
      </div>`;
    actionArea.insertAdjacentHTML('beforeend', html);

    document.querySelector("#btnNo").addEventListener("click", closeOverlay);
    document.querySelector("#btnYes").addEventListener("click", async () => {
      const fd = new FormData();
      fd.append('action','delete');
      fd.append('id', id);
      const res = await fetch("../PHP/gestion_de_citas_Admi_Recep.php", { method:'POST', body: fd }).then(r=>r.json());
      closeOverlay();
      if (res.status === 'success') renderAppointmentsView();
      else alert('No se pudo eliminar.');
    });
  }


  // ===================================
  // ====== SECCIÓN LISTA DE ESPERA ======
  // ===================================
  
  function renderWaitingListView() {
    actionArea.innerHTML = `
      <div class="citas-container">
        <div class="citas-header">
          <h3>Lista de Espera <span class="badge" id="waiting-list-badge">0</span></h3>
          <div class="search-bar">
            <label for="search-waiting-list">Buscar</label>
            <input type="text" id="search-waiting-list" placeholder="Buscar por nombre...">
          </div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Fecha de Ingreso</th>
                <th>Notas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="lista-espera-body">
              <tr><td colspan="4" style="text-align:center;">Cargando lista de espera...</td></tr>
            </tbody>
          </table>
        </div>
        <div class="citas-footer">
          <button class="btn btn-add-new" id="add-to-waiting-list">Agregar a Lista de Espera</button>
        </div>
      </div>
    `;

    document.querySelector("#add-to-waiting-list").addEventListener("click", () => openAddToWaitingListForm());
    document.querySelector("#search-waiting-list").addEventListener("input", handleWaitingListSearch);
    
    document.querySelector("#lista-espera-body").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const waitingListId = btn.dataset.id;
      const pacienteId = btn.dataset.pacienteId;

      if (btn.classList.contains("btn-assign")) {
        openCitaForm(null, pacienteId, waitingListId); 
      } else if (btn.classList.contains("btn-remove")) {
        confirmRemovePatient(waitingListId);
      }
    });

    loadWaitingList();
  }

  function handleWaitingListSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const filteredData = searchTerm === ''
      ? allWaitingListData
      : allWaitingListData.filter(item => 
          item.paciente.toLowerCase().includes(searchTerm)
        );
    renderWaitingListTable(filteredData);
  }

  function loadWaitingList() {
    const tbody = document.querySelector("#lista-espera-body");
    const badge = document.querySelector("#waiting-list-badge");
    if (!tbody || !badge) return;
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Cargando lista de espera...</td></tr>`;

    fetch("../PHP/gestion_lista_espera_Admi_Recep.php?action=getWaitingList")
      .then(r => r.json())
      .then(({ data }) => { 
        allWaitingListData = data || []; 
        allWaitingListData.sort((a, b) => 
          parseCustomDate(a.fecha_ingreso).localeCompare(parseCustomDate(b.fecha_ingreso))
        );
        renderWaitingListTable(allWaitingListData);
        if (badge) badge.textContent = allWaitingListData.length;
      })
      .catch((e) => {
        console.error("Error al cargar lista de espera:", e);
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">Error al cargar la lista de espera.</td></tr>`;
      });
  }

  function renderWaitingListTable(data) {
    const tbody = document.querySelector("#lista-espera-body");
    if (!tbody) return;

    if (data.length === 0) {
      const searchTerm = document.querySelector("#search-waiting-list") ? document.querySelector("#search-waiting-list").value : "";
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">${searchTerm ? 'No se encontraron pacientes.' : 'No hay pacientes en espera.'}</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    data.forEach(patient => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHTML(patient.paciente)}</td>
        <td>${escapeHTML(patient.fecha_ingreso)}</td>
        <td>${escapeHTML(patient.notas)}</td>
        <td class="opciones-buttons">
          <button class="btn-assign" data-id="${patient.id}" data-paciente-id="${patient.paciente_id}">Asignar Cita</button>
          <button class="btn-remove" data-id="${patient.id}">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
  
  async function openAddToWaitingListForm() {
    try {
      const html = `
        <div id="overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999;">
          <div style="background:#fff;border-radius:10px;padding:20px;max-width:820px;width:95%;">
            <h3 style="margin-top:0;">Agregar a la Lista de Espera</h3>
            <form id="formAddToWaitingList">
              <label for="paciente_id">Paciente</label>
              <select name="paciente_id" required>
                <option value="">Seleccionar Paciente</option>
              </select>
              <label for="notas">Notas</label>
              <textarea name="notas" rows="2"></textarea>
              <div style="display:flex;gap:10px;margin-top:6px;">
                <button type="submit" class="btn">Agregar a Lista</button>
                <button type="button" class="btn" style="background:#999" id="btnCancel">Cancelar</button>
              </div>
            </form>
          </div>
        </div>`;
      actionArea.insertAdjacentHTML('beforeend', html);
      
      loadPatientsForWaitingList(); 
      
      document.querySelector("#btnCancel").addEventListener("click", closeOverlay);
      document.querySelector("#formAddToWaitingList").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        fd.append('action', 'addToWaitingList');
        const res = await fetch("../PHP/gestion_lista_espera_Admi_Recep.php", { method: 'POST', body: fd }).then(r => r.json());
        if (res.status === 'success') {
          closeOverlay();
          renderWaitingListView();
        } else {
          alert('Ocurrió un error al agregar.');
        }
      });
    } catch(e) {
      console.error("Error al abrir formulario de lista de espera:", e);
    }
  }
  
  async function loadPatientsForWaitingList() {
    try {
      const opts = await fetch("../PHP/gestion_de_citas_Admi_Recep.php?action=getOptions")
        .then(r => r.json())
        .then(opts => opts.pacientes);
      const pacienteSelect = document.querySelector("select[name='paciente_id']");
      if (!pacienteSelect) return;
      pacienteSelect.innerHTML = '<option value="">Seleccionar Paciente</option>';
      opts.forEach(paciente => {
        const option = document.createElement('option');
        option.value = paciente.id;
        option.textContent = escapeHTML(paciente.nombre_completo); 
        pacienteSelect.appendChild(option);
      });
    } catch(e) {
      console.error("Error cargando pacientes para lista de espera:", e);
    }
  }
  
  function confirmRemovePatient(id) {
    const html = `
      <div id="overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999;">
        <div style="background:#fff;border-radius:10px;padding:20px;max-width:520px;width:92%;">
          <h3 style="margin-top:0;">¿Eliminar paciente de la lista de espera?</h3>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
            <button id="btnYes" class="btn" style="background:#D9534F;">Sí, eliminar</button>
            <button id="btnNo"  class="btn" style="background:#999;">Cancelar</button>
          </div>
        </div>
      </div>`;
    actionArea.insertAdjacentHTML('beforeend', html);
    
    document.querySelector("#btnNo").addEventListener("click", closeOverlay);
    document.querySelector("#btnYes").addEventListener("click", async () => {
      await removeWaitingListEntry(id);
      closeOverlay();
      renderWaitingListView();
    });
  }
  
  async function removeWaitingListEntry(id) {
    const fd = new FormData();
    fd.append('action', 'removeFromWaitingList');
    fd.append('id', id);
    try {
      await fetch("../PHP/gestion_lista_espera_Admi_Recep.php", { method: 'POST', body: fd }).then(r => r.json());
    } catch (e) {
      console.error("Error al eliminar de la lista de espera:", e);
    }
  }


  // ========================================================
  // ====== SECCIÓN GESTIONAR USUARIOS (SUB-MENÚ) ======
  // ========================================================

  function renderUsersSubMenuView() {
    actionArea.innerHTML = `
      <div class="user-menu-container">
        <button class="user-role-button" id="btn-manage-admins">
          <img src="../Imagenes/icono_de_administradores.png" alt="Administradores">
          <span>Administradores</span>
        </button>
        <button class="user-role-button" id="btn-manage-odontologos">
          <img src="../Imagenes/icono_de_odontologo.png" alt="Odontólogos">
          <span>Odontólogos</span>
        </button>
        <button class="user-role-button" id="btn-manage-receptionists">
          <img src="../Imagenes/icono_de_recepcionista.png" alt="Recepcionistas">
          <span>Recepcionistas</span>
        </button>
        <button class="user-role-button" id="btn-manage-patients">
          <img src="../Imagenes/icono_de_cliente.png" alt="Pacientes">
          <span>Pacientes</span>
        </button>
      </div>
    `;

    document.querySelector("#btn-manage-admins").addEventListener("click", renderAdminsView);
    document.querySelector("#btn-manage-receptionists").addEventListener("click", renderRecepcionistasView);
    document.querySelector("#btn-manage-odontologos").addEventListener("click", renderOdontologosView);
    document.querySelector("#btn-manage-patients").addEventListener("click", renderPacientesView);
  }

  // ========================================================
  // ====== GESTIÓN DE ADMINS (Tabla Admin) ======
  // ========================================================
  
  function renderAdminsView() {
    actionArea.innerHTML = `
      <div class="citas-container">
        <div class="citas-header">
          <h2>Gestionar Administradores <span class="badge" id="admin-badge">0</span></h2>
          <div class="search-bar">
            <label for="search-admins">Buscador</label>
            <input type="text" id="search-admins" placeholder="Nombre, usuario, email...">
          </div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Usuario (Username)</th>
                <th>Nombre Completo</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Opciones</th>
              </tr>
            </thead>
            <tbody id="admin-table-body">
              <tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>
            </tbody>
          </table>
        </div>
        <div class="citas-footer">
          <button class="btn btn-back" id="btn-back-to-usermenu">← Volver al Menú</button>
          <button class="btn btn-add-new" id="add-new-admin">Agregar Administrador</button>
        </div>
      </div>
    `;

    document.querySelector("#btn-back-to-usermenu").addEventListener("click", renderUsersSubMenuView);
    document.querySelector("#add-new-admin").addEventListener("click", () => openAdminForm());
    document.querySelector("#search-admins").addEventListener("input", handleSearchAdmins);
    document.querySelector("#admin-table-body").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.classList.contains("btn-edit")) {
        openAdminForm(id);
      } else if (btn.classList.contains("btn-delete")) {
        confirmDeleteAdmin(id);
      }
    });
    loadAdmins();
  }

  function loadAdmins() {
    const tbody = document.querySelector("#admin-table-body");
    const badge = document.querySelector("#admin-badge");
    if (!tbody || !badge) return;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>`;
    badge.textContent = "0";

    fetch("../PHP/gestion_admin_Admi_Recep.php?action=getAll")
      .then(r => r.json())
      .then(({ data, count }) => {
        allAdminsData = data || [];
        badge.textContent = count || 0;
        renderAdminsTable(allAdminsData);
      })
      .catch(e => {
        console.error("Error al cargar admins:", e);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Error al cargar.</td></tr>`;
      });
  }

  function renderAdminsTable(data) {
    const tbody = document.querySelector("#admin-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay administradores.</td></tr>`;
      return;
    }
    data.forEach(user => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHTML(user.username)}</td>
        <td>${escapeHTML(user.nombre_completo)}</td>
        <td>${escapeHTML(user.email)}</td>
        <td>${escapeHTML(user.telefono || '-')}</td>
        <td>Administrador</td>
        <td class="opciones-buttons">
          <button class="btn-edit" data-id="${user.id}">Editar</button>
          <button class="btn-delete" data-id="${user.id}">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  function handleSearchAdmins(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const filteredData = searchTerm === ''
      ? allAdminsData
      : allAdminsData.filter(user => 
          user.username.toLowerCase().includes(searchTerm) ||
          user.nombre_completo.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          (user.telefono && user.telefono.toLowerCase().includes(searchTerm))
        );
    renderAdminsTable(filteredData);
  }
  
  async function openAdminForm(id = null) {
    let item = null;
    if (id) {
      item = await fetch(`../PHP/gestion_admin_Admi_Recep.php?action=getById&id=${id}`).then(r => r.json());
    }

    const html = `
      <div id="overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999;">
        <div style="background:#fff;border-radius:10px;padding:20px;max-width:500px;width:95%;">
          <h3 style="margin-top:0;">${id ? 'Editar' : 'Agregar'} Administrador</h3>
          <form id="formAdmin" style="display:grid;grid-template-columns:1fr;gap:14px;">
            <label>Nombre Completo</label>
            <input type="text" name="nombre_completo" required value="${item ? escapeHTML(item.nombre_completo) : ''}"/>
            <label>Username</label>
            <input type="text" name="username" required value="${item ? escapeHTML(item.username) : ''}"/>
            <label>Email</label>
            <input type="email" name="email" required value="${item ? escapeHTML(item.email) : ''}"/>
            <label>Teléfono</label>
            <input type="text" name="telefono" required value="${item ? escapeHTML(item.telefono) : ''}"/>
            <label>Contraseña</label>
            <input type="password" name="password" placeholder="${id ? 'Dejar en blanco para no cambiar' : 'Requerida'}" ${id ? '' : 'required'} />
            <div style="display:flex;gap:10px;margin-top:6px;">
              <button type="submit" class="btn">${id ? 'Actualizar' : 'Agregar'}</button>
              <button type="button" class="btn" style="background:#999" id="btnCancel">Cancelar</button>
            </div>
          </form>
        </div>
      </div>`;
    actionArea.insertAdjacentHTML('beforeend', html);
    
    document.querySelector("#btnCancel").addEventListener("click", closeOverlay);
    document.querySelector("#formAdmin").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      fd.append('action', id ? 'edit' : 'add');
      if (id) fd.append('id', id);
      const res = await fetch("../PHP/gestion_admin_Admi_Recep.php", { method: 'POST', body: fd }).then(r => r.json());
      if (res.status === 'success') {
        closeOverlay();
        renderAdminsView();
      } else {
        alert(res.message || 'Ocurrió un error.');
      }
    });
  }

  function confirmDeleteAdmin(id) {
    const html = `
      <div id="overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999;">
        <div style="background:#fff;border-radius:10px;padding:20px;max-width:520px;width:92%;">
          <h3 style="margin-top:0;">¿Eliminar este administrador?</h3>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
            <button id="btnYes" class="btn" style="background:#D9534F;">Sí, eliminar</button>
            <button id="btnNo"  class="btn" style="background:#999;">Cancelar</button>
          </div>
        </div>
      </div>`;
    actionArea.insertAdjacentHTML('beforeend', html);

    document.querySelector("#btnNo").addEventListener("click", closeOverlay);
    document.querySelector("#btnYes").addEventListener("click", async () => {
      const fd = new FormData();
      fd.append('action','delete');
      fd.append('id', id);
      const res = await fetch("../PHP/gestion_admin_Admi_Recep.php", { method:'POST', body: fd }).then(r=>r.json());
      closeOverlay();
      if (res.status === 'success') {
        renderAdminsView();
      } else {
        alert(res.message || 'No se pudo eliminar.');
      }
    });
  }
  
  // ========================================================
  // ====== GESTIÓN DE RECEPCIONISTAS (Tabla Recepcionistas) ======
  // ========================================================
  
  function renderRecepcionistasView() {
    actionArea.innerHTML = `
      <div class="citas-container">
        <div class="citas-header">
          <h2>Gestionar Recepcionistas <span class="badge" id="recep-badge">0</span></h2>
          <div class="search-bar">
            <label for="search-recep">Buscador</label>
            <input type="text" id="search-recep" placeholder="Nombre, usuario, email...">
          </div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Opciones</th>
              </tr>
            </thead>
            <tbody id="recep-table-body">
              <tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>
            </tbody>
          </table>
        </div>
        <div class="citas-footer">
          <button class="btn btn-back" id="btn-back-to-usermenu">← Volver al Menú</button>
          <button class="btn btn-add-new" id="add-new-recep">Agregar Recepcionista</button>
        </div>
      </div>
    `;

    document.querySelector("#btn-back-to-usermenu").addEventListener("click", renderUsersSubMenuView);
    document.querySelector("#add-new-recep").addEventListener("click", () => openRecepcionistaForm());
    document.querySelector("#search-recep").addEventListener("input", handleSearchRecepcionistas);
    document.querySelector("#recep-table-body").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.classList.contains("btn-edit")) {
        openRecepcionistaForm(id);
      } else if (btn.classList.contains("btn-delete")) {
        confirmDeleteRecepcionista(id);
      }
    });
    loadRecepcionistas();
  }
  
  function loadRecepcionistas() {
    const tbody = document.querySelector("#recep-table-body");
    const badge = document.querySelector("#recep-badge");
    if (!tbody || !badge) return;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>`;
    badge.textContent = "0";

    fetch("../PHP/gestion_recepcionistas_Admi_Recep.php?action=getAll")
      .then(r => r.json())
      .then(({ data, count }) => {
        allRecepcionistasData = data || [];
        badge.textContent = count || 0;
        renderRecepcionistasTable(allRecepcionistasData);
      })
      .catch(e => {
        console.error("Error al cargar recepcionistas:", e);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Error al cargar.</td></tr>`;
      });
  }
  
  function renderRecepcionistasTable(data) {
    const tbody = document.querySelector("#recep-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No hay recepcionistas.</td></tr>`;
      return;
    }
    data.forEach(user => {
      const tr = document.createElement("tr");
      // Depende de js_comun.js
      tr.innerHTML = `
        <td>${escapeHTML(user.nombre_completo)}</td>
        <td>${escapeHTML(user.username)}</td>
        <td>${escapeHTML(user.email)}</td>
        <td>${escapeHTML(user.telefono)}</td>
        <td>${escapeHTML(user.rol)}</td>
        <td class="opciones-buttons">
          <button class="btn-edit" data-id="${user.id}">Editar</button>
          <button class="btn-delete" data-id="${user.id}">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  function handleSearchRecepcionistas(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const filteredData = searchTerm === ''
      ? allRecepcionistasData
      : allRecepcionistasData.filter(user => 
          user.username.toLowerCase().includes(searchTerm) ||
          user.nombre_completo.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.telefono.toLowerCase().includes(searchTerm)
        );
    renderRecepcionistasTable(filteredData);
  }
  
  async function openRecepcionistaForm(id = null) {
    let item = null;
    if (id) {
      item = await fetch(`../PHP/gestion_recepcionistas_Admi_Recep.php?action=getById&id=${id}`).then(r => r.json());
    }

    const html = `
      <div id="overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999;">
        <div style="background:#fff;border-radius:10px;padding:20px;max-width:500px;width:95%;">
          <h3 style="margin-top:0;">${id ? 'Editar' : 'Agregar'} Recepcionista</h3>
          <form id="formRecep" style="display:grid;grid-template-columns:1fr;gap:14px;">
            <label>Nombre Completo</label>
            <input type="text" name="nombre_completo" required value="${item ? escapeHTML(item.nombre_completo) : ''}"/>
            <label>Username</label>
            <input type="text" name="username" required value="${item ? escapeHTML(item.username) : ''}"/>
            <label>Email</label>
            <input type="email" name="email" required value="${item ? escapeHTML(item.email) : ''}"/>
            <label>Teléfono</label>
            <input type="text" name="telefono" required value="${item ? escapeHTML(item.telefono) : ''}"/>
            <label>Contraseña</label>
            <input type="password" name="password" placeholder="${id ? 'Dejar en blanco para no cambiar' : 'Requerida'}" ${id ? '' : 'required'} />
            <div style="display:flex;gap:10px;margin-top:6px;">
              <button type="submit" class="btn">${id ? 'Actualizar' : 'Agregar'}</button>
              <button type="button" class="btn" style="background:#999" id="btnCancel">Cancelar</button>
            </div>
          </form>
        </div>
      </div>`;
    actionArea.insertAdjacentHTML('beforeend', html);

    document.querySelector("#btnCancel").addEventListener("click", closeOverlay);
    document.querySelector("#formRecep").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      fd.append('action', id ? 'edit' : 'add');
      if (id) fd.append('id', id);
      const res = await fetch("../PHP/gestion_recepcionistas_Admi_Recep.php", { method: 'POST', body: fd }).then(r => r.json());
      if (res.status === 'success') {
        closeOverlay();
        renderRecepcionistasView();
      } else {
        alert(res.message || 'Ocurrió un error.');
      }
    });
  }

  function confirmDeleteRecepcionista(id) {
    const html = `
      <div id="overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999;">
        <div style="background:#fff;border-radius:10px;padding:20px;max-width:520px;width:92%;">
          <h3 style="margin-top:0;">¿Eliminar este recepcionista?</h3>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
            <button id="btnYes" class="btn" style="background:#D9534F;">Sí, eliminar</button>
            <button id="btnNo"  class="btn" style="background:#999;">Cancelar</button>
          </div>
        </div>
      </div>`;
    actionArea.insertAdjacentHTML('beforeend', html);

    document.querySelector("#btnNo").addEventListener("click", closeOverlay);
    document.querySelector("#btnYes").addEventListener("click", async () => {
      const fd = new FormData();
      fd.append('action','delete');
      fd.append('id', id);
      const res = await fetch("../PHP/gestion_recepcionistas_Admi_Recep.php", { method:'POST', body: fd }).then(r=>r.json());
      closeOverlay();
      if (res.status === 'success') {
        renderRecepcionistasView();
      } else {
        alert(res.message || 'No se pudo eliminar.');
      }
    });
  }

  // ===================================
  // ====== GESTIÓN DE ODONTÓLOGOS ======
  // ===================================

  function renderOdontologosView() {
    actionArea.innerHTML = `
      <div class="citas-container">
        <div class="citas-header">
          <h2>Gestionar Odontólogos <span class="badge" id="odontologo-badge">0</span></h2>
          <div class="search-bar">
            <label for="search-odontologos">Buscador</label>
            <input type="text" id="search-odontologos" placeholder="Nombre, email, DNI...">
          </div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nro. ID</th>
                <th>Nombre Completo</th>
                <th>Especialidad</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Opciones</th>
              </tr>
            </thead>
            <tbody id="odontologo-table-body">
              <tr><td colspan="7" style="text-align:center;">Cargando...</td></tr>
            </tbody>
          </table>
        </div>
        <div class="citas-footer">
          <button class="btn btn-back" id="btn-back-to-usermenu">← Volver al Menú</button>
          <button class="btn btn-add-new" id="add-new-odontologo">Agregar Odontólogo</button>
        </div>
      </div>
    `;

    document.querySelector("#btn-back-to-usermenu").addEventListener("click", renderUsersSubMenuView);
    document.querySelector("#add-new-odontologo").addEventListener("click", () => openOdontologoForm());
    document.querySelector("#search-odontologos").addEventListener("input", handleSearchOdontologos);
    
    document.querySelector("#odontologo-table-body").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.classList.contains("btn-edit")) {
        openOdontologoForm(id);
      } else if (btn.classList.contains("btn-delete")) {
        confirmDeleteOdontologo(id);
      }
    });

    loadOdontologos();
  }

  function loadOdontologos() {
    const tbody = document.querySelector("#odontologo-table-body");
    const badge = document.querySelector("#odontologo-badge");
    if (!tbody || !badge) return;
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Cargando...</td></tr>`;
    badge.textContent = "0";

    fetch("../PHP/gestion_odontologos_Admi_Recep.php?action=getAll")
      .then(r => r.json())
      .then(({ data, count }) => {
        allOdontologosData = data || [];
        badge.textContent = count || 0;
        renderOdontologosTable(allOdontologosData);
      })
      .catch((e) => {
        console.error("Error al cargar odontólogos:", e);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Error al cargar.</td></tr>`;
      });
  }

  function handleSearchOdontologos(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const filteredData = searchTerm === ''
      ? allOdontologosData
      : allOdontologosData.filter(o => 
          o.nombre_completo.toLowerCase().includes(searchTerm) ||
          o.username.toLowerCase().includes(searchTerm) ||
          o.email.toLowerCase().includes(searchTerm) ||
          o.numero_id.toLowerCase().includes(searchTerm) ||
          (o.telefono && o.telefono.toLowerCase().includes(searchTerm))
        );
    renderOdontologosTable(filteredData);
  }

  function renderOdontologosTable(data) {
    const tbody = document.querySelector("#odontologo-table-body");
    if (!tbody) return;
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">No se encontraron odontólogos.</td></tr>`;
      return;
    }
    tbody.innerHTML = "";
    data.forEach(o => {
      const tr = document.createElement("tr");
      // Depende de js_comun.js
      tr.innerHTML = `
        <td>${escapeHTML(o.numero_id)}</td>
        <td>${escapeHTML(o.nombre_completo)}</td>
        <td>${escapeHTML(o.nombre_especialidad)}</td>
        <td>${escapeHTML(o.username)}</td>
        <td>${escapeHTML(o.email)}</td>
        <td>${escapeHTML(o.telefono || '-')}</td>
        <td class="opciones-buttons">
          <button class="btn-edit" data-id="${o.id}">Editar</button>
          <button class="btn-delete" data-id="${o.id}">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  async function openOdontologoForm(id = null) {
    let item = null;
    let opts = {};
    try {
      if (id) {
        item = await fetch(`../PHP/gestion_odontologos_Admi_Recep.php?action=getById&id=${id}`).then(r => r.json());
      }
      opts = await fetch(`../PHP/gestion_odontologos_Admi_Recep.php?action=getOptions`).then(r => r.json());
    } catch(e) {
      alert("Error al cargar datos para el formulario.");
      return;
    }
    
    const esOpts = (opts.especialidades || []).map(e => `<option value="${e.id}" ${item && item.especialidad_id == e.id ? 'selected' : ''}>${escapeHTML(e.nombre_especialidad)}</option>`).join("");
    const hoOpts = (opts.horarios || []).map(h => `<option value="${h.id}" ${item && item.horario_id == h.id ? 'selected' : ''}>${escapeHTML(h.descripcion || h.id)}</option>`).join("");

    const html = `
      <div id="overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999;">
        <div style="background:#fff;border-radius:10px;padding:20px;max-width:800px;width:95%;">
          <h3 style="margin-top:0;">${id ? 'Editar' : 'Agregar'} Odontólogo</h3>
          <form id="formOdontologo" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <label>Nro. ID</label>
            <input type="text" name="numero_id" required value="${item ? escapeHTML(item.numero_id) : ''}"/>
            <label>Nombre Completo</label>
            <input type="text" name="nombre_completo" required value="${item ? escapeHTML(item.nombre_completo) : ''}"/>
            <label>Username</label>
            <input type="text" name="username" required value="${item ? escapeHTML(item.username) : ''}"/>
            <label>Email</label>
            <input type="email" name="email" required value="${item ? escapeHTML(item.email) : ''}"/>
            <label>Teléfono</label>
            <input type="text" name="telefono" required value="${item ? escapeHTML(item.telefono) : ''}"/>
            <label>Especialidad</label>
            <select name="especialidad_id" required>
              <option value="">Seleccionar...</option>${esOpts}
            </select>
            <label>Horario</label>
            <select name="horario_id">
              <option value="">Seleccionar...</option>${hoOpts}
            </select>
            <label>Contraseña</label>
            <input type="password" name="password" placeholder="${id ? 'Dejar en blanco para no cambiar' : 'Requerida'}" ${id ? '' : 'required'} />
            
            <div style="grid-column:1/-1;display:flex;gap:10px;margin-top:6px;">
              <button type="submit" class="btn">${id ? 'Actualizar' : 'Agregar'}</button>
              <button type="button" class="btn" style="background:#999" id="btnCancel">Cancelar</button>
            </div>
          </form>
        </div>
      </div>`;
    actionArea.insertAdjacentHTML('beforeend', html);

    document.querySelector("#btnCancel").addEventListener("click", closeOverlay);
    document.querySelector("#formOdontologo").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      fd.append('action', id ? 'edit' : 'add');
      if (id) fd.append('id', id);
      const res = await fetch("../PHP/gestion_odontologos_Admi_Recep.php", { method: 'POST', body: fd }).then(r => r.json());
      if (res.status === 'success') {
        closeOverlay();
        renderOdontologosView();
      } else {
        alert(res.message || 'Ocurrió un error.');
      }
    });
  }

  function confirmDeleteOdontologo(id) {
    const html = `
      <div id="overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999;">
        <div style="background:#fff;border-radius:10px;padding:20px;max-width:520px;width:92%;">
          <h3 style="margin-top:0;">¿Eliminar este odontólogo?</h3>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
            <button id="btnYes" class="btn" style="background:#D9534F;">Sí, eliminar</button>
            <button id="btnNo"  class="btn" style="background:#999;">Cancelar</button>
          </div>
        </div>
      </div>`;
    actionArea.insertAdjacentHTML('beforeend', html);

    document.querySelector("#btnNo").addEventListener("click", closeOverlay);
    document.querySelector("#btnYes").addEventListener("click", async () => {
      const fd = new FormData();
      fd.append('action','delete');
      fd.append('id', id);
      const res = await fetch("../PHP/gestion_odontologos_Admi_Recep.php", { method:'POST', body: fd }).then(r=>r.json());
      closeOverlay();
      if (res.status === 'success') {
        renderOdontologosView();
      } else {
        alert(res.message || 'No se pudo eliminar.');
      }
    });
  }

  // ===================================
  // ====== GESTIÓN DE PACIENTES ======
  // ===================================

  function renderPacientesView() {
    actionArea.innerHTML = `
      <div class="citas-container">
        <div class="citas-header">
          <h2>Gestionar Pacientes <span class="badge" id="paciente-badge">0</span></h2>
          <div class="search-bar">
            <label for="search-pacientes">Buscador</label>
            <input type="text" id="search-pacientes" placeholder="Nombre, email, DNI...">
          </div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>DNI</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Opciones</th>
              </tr>
            </thead>
            <tbody id="paciente-table-body">
              <tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>
            </tbody>
          </table>
        </div>
        <div class="citas-footer">
          ${document.querySelector("#manageUsers") ? '<button class="btn btn-back" id="btn-back-to-usermenu">← Volver al Menú</button>' : ''}
          <button class="btn btn-add-new" id="add-new-paciente">Agregar Paciente</button>
        </div>
      </div>
    `;

    const btnBack = document.querySelector("#btn-back-to-usermenu");
    if (btnBack) {
      btnBack.addEventListener("click", renderUsersSubMenuView);
    }
    
    document.querySelector("#add-new-paciente").addEventListener("click", () => openPacienteForm());
    document.querySelector("#search-pacientes").addEventListener("input", handleSearchPacientes);
    
    document.querySelector("#paciente-table-body").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.classList.contains("btn-edit")) {
        openPacienteForm(id);
      } else if (btn.classList.contains("btn-delete")) {
        confirmDeletePaciente(id);
      }
    });

    loadPacientes();
  }

  function loadPacientes() {
    const tbody = document.querySelector("#paciente-table-body");
    const badge = document.querySelector("#paciente-badge");
    if (!tbody || !badge) return;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>`;
    badge.textContent = "0";

    fetch("../PHP/gestion_pacientes_Admi_Recep.php?action=getAll")
      .then(r => r.json())
      .then(({ data, count }) => {
        allPacientesData = data || [];
        badge.textContent = count || 0;
        renderPacientesTable(allPacientesData);
      })
      .catch((e) => {
        console.error("Error al cargar pacientes:", e);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Error al cargar.</td></tr>`;
      });
  }

  function handleSearchPacientes(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    const filteredData = searchTerm === ''
      ? allPacientesData
      : allPacientesData.filter(p => 
          p.nombre_completo.toLowerCase().includes(searchTerm) ||
          p.username.toLowerCase().includes(searchTerm) ||
          p.email.toLowerCase().includes(searchTerm) ||
          p.dni.toLowerCase().includes(searchTerm)
        );
    renderPacientesTable(filteredData);
  }

  function renderPacientesTable(data) {
    const tbody = document.querySelector("#paciente-table-body");
    if (!tbody) return;
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No se encontraron pacientes.</td></tr>`;
      return;
    }
    tbody.innerHTML = "";
    data.forEach(p => {
      const tr = document.createElement("tr");
      // Depende de js_comun.js
      tr.innerHTML = `
        <td>${escapeHTML(p.nombre_completo)}</td>
        <td>${escapeHTML(p.dni)}</td>
        <td>${escapeHTML(p.username)}</td>
        <td>${escapeHTML(p.email)}</td>
        <td>${escapeHTML(p.telefono)}</td>
        <td class="opciones-buttons">
          <button class="btn-edit" data-id="${p.id}">Editar</button>
          <button class="btn-delete" data-id="${p.id}">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  async function openPacienteForm(id = null) {
    let item = null;
    if (id) {
      try {
        item = await fetch(`../PHP/gestion_pacientes_Admi_Recep.php?action=getById&id=${id}`).then(r => r.json());
      } catch(e) {
        alert("Error al cargar datos del paciente.");
        return;
      }
    }

    // Depende de js_comun.js
    const html = `
      <div id="overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999;">
        <div style="background:#fff;border-radius:10px;padding:20px;max-width:800px;width:95%;">
          <h3 style="margin-top:0;">${id ? 'Editar' : 'Agregar'} Paciente</h3>
          <form id="formPaciente" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <label>Nombre Completo</label>
            <input type="text" name="nombre_completo" required value="${item ? escapeHTML(item.nombre_completo) : ''}"/>
            <label>DNI</label>
            <input type="text" name="dni" required value="${item ? escapeHTML(item.dni) : ''}"/>
            <label>Username</label>
            <input type="text" name="username" required value="${item ? escapeHTML(item.username) : ''}"/>
            <label>Email</label>
            <input type="email" name="email" required value="${item ? escapeHTML(item.email) : ''}"/>
            <label>Teléfono</label>
            <input type="text" name="telefono" required value="${item ? escapeHTML(item.telefono) : ''}"/>
            <label>Contraseña</label>
            <input type="password" name="password" placeholder="${id ? 'Dejar en blanco para no cambiar' : 'Requerida'}" ${id ? '' : 'required'} />
            
            <div style="grid-column:1/-1;display:flex;gap:10px;margin-top:6px;">
              <button type="submit" class="btn">${id ? 'Actualizar' : 'Agregar'}</button>
              <button type="button" class="btn" style="background:#999" id="btnCancel">Cancelar</button>
            </div>
          </form>
        </div>
      </div>`;
    actionArea.insertAdjacentHTML('beforeend', html);

    document.querySelector("#btnCancel").addEventListener("click", closeOverlay);
    document.querySelector("#formPaciente").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      fd.append('action', id ? 'edit' : 'add');
      if (id) fd.append('id', id);
      const res = await fetch("../PHP/gestion_pacientes_Admi_Recep.php", { method: 'POST', body: fd }).then(r => r.json());
      if (res.status === 'success') {
        closeOverlay();
        renderPacientesView();
      } else {
        alert(res.message || 'Ocurrió un error.');
      }
    });
  }

  function confirmDeletePaciente(id) {
    const html = `
      <div id="overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:9999;">
        <div style="background:#fff;border-radius:10px;padding:20px;max-width:520px;width:92%;">
          <h3 style="margin-top:0;">¿Eliminar este paciente?</h3>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
            <button id="btnYes" class="btn" style="background:#D9534F;">Sí, eliminar</button>
            <button id="btnNo"  class="btn" style="background:#999;">Cancelar</button>
          </div>
        </div>
      </div>`;
    actionArea.insertAdjacentHTML('beforeend', html);

    document.querySelector("#btnNo").addEventListener("click", closeOverlay);
    document.querySelector("#btnYes").addEventListener("click", async () => {
      const fd = new FormData();
      fd.append('action','delete');
      fd.append('id', id);
      const res = await fetch("../PHP/gestion_pacientes_Admi_Recep.php", { method:'POST', body: fd }).then(r=>r.json());
      closeOverlay();
      if (res.status === 'success') {
        renderPacientesView();
      } else {
        alert(res.message || 'No se pudo eliminar.');
      }
    });
  }
  
});