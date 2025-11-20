// ===================================
// ====== ARCHIVO COMÚN DE UTILIDADES ======
// ===================================

/**
 * Cierra cualquier modal/overlay abierto.
 */
function closeOverlay() {
  const ov = document.querySelector("#overlay");
  if (ov) ov.remove();
}

/**
 * Escapa caracteres HTML para prevenir ataques XSS.
 */
function escapeHTML(str='') {
  if (typeof str !== 'string') str = String(str);
  return str.replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[s]));
}

/**
 * Convierte un string de fecha (ISO o dd/mm/yyyy) a un formato para <input type="datetime-local">.
 */
function toLocalInputValue(displayDate) {
  if (!displayDate) return '';
  // Formato 'YYYY-MM-DD HH:MM:SS' o 'YYYY-MM-DDTHH:MM'
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(displayDate)) {
      return displayDate.slice(0, 16).replace(' ', 'T');
  }
  // Formato 'DD/MM/YYYY HH:MM'
  const [d, t] = (displayDate || '').split(' ');
  if (!t) return '';
  const [dd, mm, yyyy] = d.split('/');
  if (!dd || !mm || !yyyy) return '';
  return `${yyyy}-${mm}-${dd}T${t.slice(0,5)}`;
}

/**
 * Convierte un string de fecha 'dd/mm/YYYY HH:ii' a 'YYYY-MM-DDTHH:ii' para poder ordenarlo.
 */
function parseCustomDate(dateString) {
  if (!dateString) return '1970-01-01T00:00';
  // Formato 'DD/MM/YYYY HH:MM'
  const [d, t] = (dateString || '').split(' ');
  if (!t) return '1970-01-01T00:00'; 
  const [dd, mm, yyyy] = d.split('/');
  if (!dd || !mm || !yyyy) return '1970-01-01T00:00';
  return `${yyyy}-${mm}-${dd}T${t.slice(0,5)}`;
}

/**
 * Devuelve la fecha de hoy en formato 'dd-mm-aa'.
 */
function getFormattedDate() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const aa = String(today.getFullYear()).slice(-2);
  return `${dd}-${mm}-${aa}`;
}