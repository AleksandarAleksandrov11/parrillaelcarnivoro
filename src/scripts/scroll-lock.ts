/**
 * Bloqueo del scroll del documento mientras hay un diálogo modal abierto (menú, visor,
 * calendario, cookies). Funciona con y sin Lenis; admite diálogos anidados.
 */
let locks = 0;

export function lockScroll() {
  locks++;
  document.documentElement.classList.add('scroll-locked');
  document.dispatchEvent(new Event('lenis:stop'));
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1);
  if (!locks) {
    document.documentElement.classList.remove('scroll-locked');
    document.dispatchEvent(new Event('lenis:start'));
  }
}
