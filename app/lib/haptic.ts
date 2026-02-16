export function hapticLight() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(10);
  }
}

export function hapticMedium() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(20);
  }
}

export function hapticStrong() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([30, 50, 30]);
  }
}

export function hapticError() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([50, 100, 50, 100, 50]);
  }
}
