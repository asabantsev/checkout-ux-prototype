/* Демонстрационные цены из макета 16262:52547.
 * Цены доступны только от +2 до +19 дней от первой выбранной даты.
 */
(() => {
  const prices = [143730, 199507, 172615, 136279, 117689, 116026, 116026, 116026, 117689, 115644, 118876, 121055, 106326, 91751, 108816, 97019, 92366, 110855];
  const dayNumber = value => Date.parse(value + 'T00:00:00Z') / 86400000;
  window.getCalendarPrice = (value, referenceDate) => {
    const offset = dayNumber(value) - dayNumber(referenceDate);
    if (offset < 2 || offset > 19) return null;
    const amount = prices[offset - 2];
    return {price: String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' '), low: amount < 95000};
  };
})();
