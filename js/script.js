/*
  Pesta.in — konfigurasi integrasi
  Ganti nilai placeholder di bawah sebelum website dipublikasikan.
*/
const CONFIG = {
  // Gunakan format internasional tanpa tanda +, spasi, atau strip. Contoh: 6281234567890
  whatsappNumber: "628XXXXXXXXXX",
  // Tempel URL Google Forms milik tim Pesta.in di sini.
  googleFormUrl: "https://forms.gle/ISI_LINK_FORM"
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const toast = (message) => {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  window.clearTimeout(toast.timeout);
  toast.timeout = window.setTimeout(() => element.classList.remove("show"), 3600);
};

// Mobile navigation
const menuToggle = $(".menu-toggle");
const primaryNav = $(".primary-nav");
menuToggle?.addEventListener("click", () => {
  const isOpen = primaryNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
});
$$(".primary-nav a").forEach((link) => link.addEventListener("click", () => {
  primaryNav.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
}));

// Gallery category filters
$$(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".filter-button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const selected = button.dataset.filter;
    $$(".gallery-item").forEach((item) => {
      const shouldShow = selected === "all" || item.dataset.category === selected;
      item.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

// Package buttons preselect the order form package.
const packageSelect = $("#package-select");
$$(".choose-package").forEach((button) => {
  button.addEventListener("click", () => {
    const packageName = button.dataset.package;
    const option = [...packageSelect.options].find((item) => item.value.startsWith(packageName + " —"));
    if (option) packageSelect.value = option.value;
    $("#pemesanan").scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => $("[name='name']")?.focus({ preventScroll: true }), 650);
  });
});

// Date field: do not allow selecting a date in the past.
const dateInput = $("#event-date");
if (dateInput) {
  const localToday = new Date();
  const offset = localToday.getTimezoneOffset();
  const today = new Date(localToday.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
  dateInput.min = today;
}

const orderForm = $("#order-form");
const orderDialog = $("#order-dialog");
const summaryElement = $("#order-summary");
const dialogHint = $("#dialog-hint");
let currentOrderMessage = "";

function cleanPhone(value) {
  return value.replace(/[^\d+]/g, "").replace(/^0/, "62");
}

function formatDate(value) {
  if (!value) return "Belum ditentukan";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function getOrderMessage(formData) {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const event = String(formData.get("event") || "").trim();
  const selectedPackage = String(formData.get("package") || "").trim();
  const date = formatDate(String(formData.get("date") || ""));
  const location = String(formData.get("location") || "").trim() || "Belum ditentukan";
  const notes = String(formData.get("notes") || "").trim() || "Tidak ada catatan tambahan";

  return [
    "Halo Pesta.in! Saya ingin konsultasi dan memesan undangan digital.",
    "",
    "*RINGKASAN PESANAN*",
    `Nama: ${name}`,
    `Nomor WhatsApp: ${phone}`,
    `Jenis acara: ${event}`,
    `Paket: ${selectedPackage}`,
    `Tanggal acara: ${date}`,
    `Lokasi: ${location}`,
    `Catatan: ${notes}`,
    "",
    "Mohon informasi langkah selanjutnya. Terima kasih!"
  ].join("\n");
}

function hasConfiguredWhatsApp() {
  return /^62\d{8,13}$/.test(CONFIG.whatsappNumber) && !CONFIG.whatsappNumber.includes("X");
}

function hasConfiguredGoogleForm() {
  return /^https:\/\//.test(CONFIG.googleFormUrl) && !CONFIG.googleFormUrl.includes("ISI_LINK_FORM");
}

orderForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!orderForm.reportValidity()) return;
  const formData = new FormData(orderForm);
  currentOrderMessage = getOrderMessage(formData);
  summaryElement.textContent = currentOrderMessage;
  dialogHint.textContent = hasConfiguredWhatsApp()
    ? "Detail sudah siap. Pilih Lanjut ke WhatsApp untuk mengirim ringkasan."
    : "Nomor WhatsApp masih berupa placeholder. Ringkasan dapat disalin, atau atur nomor bisnis di js/script.js.";
  orderDialog.showModal();
  document.body.classList.add("dialog-open");
});

function closeDialog() {
  orderDialog.close();
  document.body.classList.remove("dialog-open");
}
$(".dialog-close")?.addEventListener("click", closeDialog);
orderDialog?.addEventListener("click", (event) => {
  if (event.target === orderDialog) closeDialog();
});
orderDialog?.addEventListener("close", () => document.body.classList.remove("dialog-open"));

$("#send-whatsapp")?.addEventListener("click", () => {
  if (!hasConfiguredWhatsApp()) {
    toast("Nomor WhatsApp belum diatur. Buka js/script.js dan ganti whatsappNumber.");
    return;
  }
  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(currentOrderMessage)}`;
  window.open(url, "_blank", "noopener,noreferrer");
});

$("#copy-summary")?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(currentOrderMessage);
    toast("Ringkasan pesanan berhasil disalin.");
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = currentOrderMessage;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    const copied = document.execCommand("copy");
    textArea.remove();
    toast(copied ? "Ringkasan pesanan berhasil disalin." : "Salin ringkasan secara manual dari kotak teks.");
  }
});

$("#google-form-link")?.addEventListener("click", (event) => {
  event.preventDefault();
  if (!hasConfiguredGoogleForm()) {
    toast("Link Google Forms belum diatur. Buka js/script.js dan ganti googleFormUrl.");
    return;
  }
  window.open(CONFIG.googleFormUrl, "_blank", "noopener,noreferrer");
});

// Reveal sections as they enter the viewport.
const revealElements = $$(".reveal");
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

// Footer year
$("#current-year").textContent = new Date().getFullYear();
