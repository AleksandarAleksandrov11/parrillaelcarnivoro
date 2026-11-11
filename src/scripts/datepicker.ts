/**
 * Selector de fecha accesible (patrón «Date Picker Dialog» de WAI-ARIA APG):
 * - Se abre en un <dialog> modal: foco atrapado, Esc cierra y devuelve el foco.
 * - Flechas (día/semana), Inicio/Fin (semana), RePág/AvPág (mes), Intro/Espacio (elegir).
 * - Deshabilita las fechas pasadas y los días de cierre (martes y miércoles).
 * Fechas calculadas en la zona horaria del restaurante (Europe/Madrid).
 */
export interface DatePickerOptions {
  closedWeekdays: number[];
  maxDays: number;
  onChange: (iso: string) => void;
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DAYS_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Fecha de hoy en Madrid como {y, m, d}. */
export function madridToday(): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const [y, m, d] = parts.split('-').map(Number);
  return { y, m: m - 1, d };
}

const iso = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
export const parseIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const longDate = (dt: Date) => `${DAYS_LONG[dt.getDay()]}, ${dt.getDate()} de ${MONTHS[dt.getMonth()]} de ${dt.getFullYear()}`;

export function initDatePicker(root: HTMLElement, opts: DatePickerOptions) {
  const trigger = root.querySelector<HTMLButtonElement>('[data-date-trigger]')!;
  const text = root.querySelector<HTMLElement>('[data-date-text]')!;
  const dialog = root.querySelector<HTMLDialogElement>('[data-calendar]')!;
  const title = dialog.querySelector<HTMLElement>('[data-cal-title]')!;
  const tbody = dialog.querySelector<HTMLTableSectionElement>('[data-cal-body]')!;
  const prev = dialog.querySelector<HTMLButtonElement>('[data-cal-prev]')!;
  const next = dialog.querySelector<HTMLButtonElement>('[data-cal-next]')!;

  const t = madridToday();
  const today = new Date(t.y, t.m, t.d);
  const max = new Date(t.y, t.m, t.d + opts.maxDays);
  let selected: Date | null = null;
  let focus = new Date(today);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);

  const isDisabled = (dt: Date) => dt < today || dt > max || opts.closedWeekdays.includes(dt.getDay());
  const same = (a: Date | null, b: Date) => !!a && a.getTime() === b.getTime();

  function render() {
    title.textContent = `${MONTHS[view.getMonth()]} de ${view.getFullYear()}`;
    prev.disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
    next.disabled = new Date(view.getFullYear(), view.getMonth() + 1, 1) > max;
    tbody.textContent = '';
    // La semana empieza en lunes.
    const offset = (view.getDay() + 6) % 7;
    let day = new Date(view.getFullYear(), view.getMonth(), 1 - offset);
    for (let r = 0; r < 6; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < 7; c++) {
        const td = document.createElement('td');
        const inMonth = day.getMonth() === view.getMonth();
        if (inMonth) {
          const b = document.createElement('button');
          const dis = isDisabled(day);
          const closed = opts.closedWeekdays.includes(day.getDay());
          b.type = 'button';
          b.className = 'cal-day';
          b.textContent = String(day.getDate());
          b.dataset.date = iso(day);
          b.tabIndex = same(focus, day) ? 0 : -1;
          b.setAttribute('aria-label', `${longDate(day)}${dis ? (closed ? ', cerrado' : ', no disponible') : ''}`);
          if (dis) b.setAttribute('aria-disabled', 'true');
          if (closed) b.classList.add('is-closed');
          if (same(selected, day)) b.setAttribute('aria-pressed', 'true');
          if (same(today, day)) {
            b.classList.add('is-today');
            b.setAttribute('aria-current', 'date');
          }
          td.appendChild(b);
        }
        tr.appendChild(td);
        day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
      }
      // Omite filas vacías al final.
      if (Array.from(tr.children).some((td) => td.childElementCount)) tbody.appendChild(tr);
    }
  }

  function focusDay(dt: Date) {
    if (dt < new Date(today.getFullYear(), today.getMonth(), 1)) dt = new Date(today);
    if (dt > max) dt = new Date(max);
    focus = dt;
    if (dt.getMonth() !== view.getMonth() || dt.getFullYear() !== view.getFullYear()) {
      view = new Date(dt.getFullYear(), dt.getMonth(), 1);
    }
    render();
    tbody.querySelector<HTMLButtonElement>(`[data-date="${iso(dt)}"]`)?.focus();
  }

  function firstAvailable(from: Date) {
    const d = new Date(from);
    for (let i = 0; i < 14 && isDisabled(d); i++) d.setDate(d.getDate() + 1);
    return d;
  }

  function open() {
    focus = selected ?? firstAvailable(today);
    view = new Date(focus.getFullYear(), focus.getMonth(), 1);
    render();
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    document.dispatchEvent(new Event('lenis:stop'));
    tbody.querySelector<HTMLButtonElement>(`[data-date="${iso(focus)}"]`)?.focus();
  }
  function close() {
    dialog.close();
  }
  function choose(dt: Date) {
    if (isDisabled(dt)) return;
    selected = dt;
    text.textContent = longDate(dt);
    trigger.classList.add('has-value');
    opts.onChange(iso(dt));
    close();
  }

  trigger.addEventListener('click', open);
  dialog.addEventListener('close', () => {
    trigger.setAttribute('aria-expanded', 'false');
    document.dispatchEvent(new Event('lenis:start'));
    trigger.focus();
  });
  dialog.querySelector('[data-cal-close]')?.addEventListener('click', close);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });
  prev.addEventListener('click', () => {
    view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
    focus = new Date(view);
    render();
  });
  next.addEventListener('click', () => {
    view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
    focus = new Date(view);
    render();
  });
  tbody.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.cal-day');
    if (b) choose(parseIso(b.dataset.date!));
  });
  tbody.addEventListener('keydown', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.cal-day');
    if (!b) return;
    const d = parseIso(b.dataset.date!);
    const move = (days: number) => focusDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
    switch (e.key) {
      case 'ArrowRight':
        move(1);
        break;
      case 'ArrowLeft':
        move(-1);
        break;
      case 'ArrowDown':
        move(7);
        break;
      case 'ArrowUp':
        move(-7);
        break;
      case 'Home':
        move(-((d.getDay() + 6) % 7));
        break;
      case 'End':
        move(6 - ((d.getDay() + 6) % 7));
        break;
      case 'PageDown':
        focusDay(new Date(d.getFullYear(), d.getMonth() + 1, Math.min(d.getDate(), 28)));
        break;
      case 'PageUp':
        focusDay(new Date(d.getFullYear(), d.getMonth() - 1, Math.min(d.getDate(), 28)));
        break;
      case 'Enter':
      case ' ':
        choose(d);
        break;
      default:
        return;
    }
    e.preventDefault();
  });

  return {
    get value() {
      return selected ? iso(selected) : '';
    },
    isDisabled: (s: string) => isDisabled(parseIso(s)),
    focusTrigger: () => trigger.focus(),
  };
}
