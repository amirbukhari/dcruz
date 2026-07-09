(() => {
  const input = document.getElementById("lpSliderInput");
  const over = document.getElementById("lpSliderOver");
  const handle = document.getElementById("lpSliderHandle");
  if (!input || !over || !handle) return;

  const apply = (value) => {
    const pct = Math.min(100, Math.max(0, Number(value)));
    over.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    handle.style.left = `${pct}%`;
  };

  input.addEventListener("input", (e) => apply(e.target.value));
  apply(input.value);
})();
