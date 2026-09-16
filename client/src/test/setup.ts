import "@testing-library/jest-dom/vitest";

// jsdom non implementa Element.scrollTo (usato da ChatPanel per l'auto-scroll):
// senza questo polyfill ogni test che monta un ChatPanel fallirebbe per un
// gap di jsdom, non per un bug del componente.
if (typeof Element !== "undefined" && !Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {};
}
