/**
 * Reserva por WhatsApp sin backend: valida el formulario, compone un mensaje
 * bien formateado (URL-encoded, con acentos, emojis y saltos de línea) y abre
 * https://wa.me/34915013983 — en una pestaña nueva en escritorio y en la app en móvil.
 * No se guarda ni se envía ningún dato a un servidor.
 */
import { closedWeekdays, business } from '../data/site';
import { initDatePicker, longDate, madridToday, parseIso } from './datepicker';
import { track } from './analytics';

type Field = 'name' | 'people' | 'date' | 'time';

const SLOT_LABEL: Record<string, string> = { desayuno: 'desayuno', comida: 'comida', cena: 'cena' };
const ZONE_LABEL: Record<string, string> = { salon: 'Salón', terraza: 'Terraza', indiferente: 'Indiferente' };

function madridMinutesNow() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const h = Number(p.find((x) => x.type === 'hour')?.value);
  const m = Number(p.find((x) => x.type === 'minute')?.value);
  return h * 60 + m;
}
const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const isMobile = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));

export function buildMessage(d: { name: string; people: string; date: string; time: string; slot: string; zone: string; notes: string }) {
  const lines = [
    'Hola, me gustaría reservar mesa en El Carnívoro 🥩',
    '',
    `👤 Nombre: ${d.name}`,
    `👥 Personas: ${d.people === '+20' ? 'más de 20' : d.people}`,
    `📅 Fecha: ${longDate(parseIso(d.date))}`,
    `🕒 Hora: ${d.time}${d.slot ? ` (${SLOT_LABEL[d.slot] ?? d.slot})` : ''}`,
    `📍 Zona: ${ZONE_LABEL[d.zone] ?? 'Indiferente'}`,
  ];
  if (d.notes.trim()) lines.push(`📝 Comentarios: ${d.notes.trim()}`);
  lines.push('', '¡Gracias!');
  return lines.join('\n');
}

export function initReservation() {
  const form = document.querySelector<HTMLFormElement>('[data-reservation]');
  if (!form) return;
  // Sin JS el botón queda deshabilitado: el formulario nunca se envía de forma nativa.
  form.querySelector<HTMLButtonElement>('[type="submit"]')?.removeAttribute('disabled');
  const summary = form.querySelector<HTMLElement>('[data-rf-summary]')!;
  const done = form.querySelector<HTMLElement>('[data-rf-done]')!;
  const time = form.querySelector<HTMLSelectElement>('select[name="time"]')!;
  const dateInput = form.querySelector<HTMLInputElement>('input[name="date"]')!;
  const timeHint = form.querySelector<HTMLElement>('[data-time-hint]');

  const picker = initDatePicker(form.querySelector<HTMLElement>('[data-datepicker]')!, {
    closedWeekdays,
    maxDays: 180,
    // Después de la última franja (menos el margen de 30 min) ya no se puede reservar para hoy.
    todayIsOver: () => madridMinutesNow() + 30 > lastSlotMinutes(),
    onChange: (value) => {
      dateInput.value = value;
      if (value) clearError('date');
      updateTimes();
    },
  });

  function lastSlotMinutes() {
    const values = Array.from(time.options).map((o) => o.value).filter(Boolean).map(toMinutes);
    return Math.max(...values);
  }

  function todayIso() {
    const t = madridToday();
    return `${t.y}-${String(t.m + 1).padStart(2, '0')}-${String(t.d).padStart(2, '0')}`;
  }

  /** Si la fecha es hoy, deshabilita las horas que ya han pasado (con 30 min de margen). */
  function updateTimes() {
    const isToday = dateInput.value === todayIso();
    const now = madridMinutesNow() + 30;
    let available = 0;
    Array.from(time.options).forEach((o) => {
      if (!o.value) return;
      const past = isToday && toMinutes(o.value) < now && toMinutes(o.value) >= 10 * 60;
      o.disabled = past;
      if (!past) available++;
      if (past && o.selected) time.value = '';
    });
    if (timeHint) timeHint.textContent = isToday ? (available ? 'Para hoy solo se muestran las horas aún disponibles.' : 'Hoy ya no quedan horas disponibles: elige otro día.') : '';
  }

  const errors: Partial<Record<Field, string>> = {};
  function setError(field: Field, msg: string) {
    errors[field] = msg;
    const el = form!.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
    const control = form!.querySelector<HTMLElement>(`[data-control="${field}"]`);
    if (el) {
      el.textContent = msg;
      el.hidden = false;
    }
    control?.setAttribute('aria-invalid', 'true');
  }
  function clearError(field: Field) {
    delete errors[field];
    const el = form!.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
    if (el) {
      el.textContent = '';
      el.hidden = true;
    }
    form!.querySelector<HTMLElement>(`[data-control="${field}"]`)?.removeAttribute('aria-invalid');
  }

  form.addEventListener('input', (e) => {
    const name = (e.target as HTMLInputElement).name as Field;
    if (name && errors[name]) clearError(name);
  });
  form.addEventListener('change', (e) => {
    const name = (e.target as HTMLInputElement).name as Field;
    if (name && errors[name]) clearError(name);
  });

  // Se recalcula al volver a la pestaña y al enfocar la hora (el tiempo pasa).
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && updateTimes());
  time.addEventListener('focus', updateTimes);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    (['name', 'people', 'date', 'time'] as Field[]).forEach(clearError);
    picker.revalidate();
    summary.hidden = true;
    done.hidden = true;

    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const people = String(data.get('people') || '');
    const date = dateInput.value;
    const timeValue = String(data.get('time') || '');
    const zone = String(data.get('zone') || 'indiferente');
    const notes = String(data.get('notes') || '');
    const slot = time.selectedOptions[0]?.closest('optgroup')?.dataset.slot ?? '';

    if (name.length < 2) setError('name', 'Escribe tu nombre.');
    if (!people) setError('people', 'Indica cuántas personas seréis.');
    if (!date) setError('date', 'Elige una fecha en el calendario.');
    else if (picker.isDisabled(date)) setError('date', 'Ese día no abrimos o ya ha pasado: elige otra fecha (cerramos martes y miércoles).');
    if (!timeValue) setError('time', 'Elige una hora.');
    else if (date && date === todayIso() && toMinutes(timeValue) >= 10 * 60 && toMinutes(timeValue) < madridMinutesNow() + 30)
      setError('time', 'Esa hora ya ha pasado o es demasiado pronto: elige otra.');
    updateTimes();

    const keys = Object.keys(errors) as Field[];
    if (keys.length) {
      summary.innerHTML = '';
      const p = document.createElement('p');
      p.textContent = keys.length === 1 ? 'Revisa el campo marcado:' : `Revisa los ${keys.length} campos marcados:`;
      const ul = document.createElement('ul');
      keys.forEach((k) => {
        const li = document.createElement('li');
        li.textContent = errors[k]!;
        ul.appendChild(li);
      });
      summary.append(p, ul);
      summary.hidden = false;
      const first = keys[0];
      if (first === 'date') picker.focusTrigger();
      else form.querySelector<HTMLElement>(`[data-control="${first}"]`)?.focus();
      return;
    }

    const message = buildMessage({ name, people, date, time: timeValue, slot, zone, notes });
    const url = `https://wa.me/${business.phone.whatsapp}?text=${encodeURIComponent(message)}`;

    // Solo se registra que se ha enviado (sin ningún dato del formulario).
    track('generate_lead', { method: 'whatsapp', form_name: 'reserva' });
    track('reservation_whatsapp', { method: 'whatsapp' });

    const fallback = done.querySelector<HTMLAnchorElement>('[data-rf-link]');
    if (fallback) fallback.href = url;
    done.hidden = false;

    if (isMobile()) {
      window.location.href = url;
    } else {
      // Con la característica «noopener» window.open() siempre devuelve null, así que
      // se corta la referencia a mano y solo se usa la misma pestaña si hay bloqueo.
      const w = window.open(url, '_blank');
      if (w) w.opener = null;
      else window.location.href = url;
    }
  });
}
