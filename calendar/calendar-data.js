/* Демонстрационные цены из макета 16262:52547.
 * Повторяем образец для любых дат относительно стартового вылета.
 * Опорная дата фиксируется при открытии страницы: выбор диапазона
 * и переключение месяцев не меняют цену одного и того же дня.
 */
(() => {
  const prices = [143730, 199507, 172615, 136279, 117689, 116026, 116026, 116026, 117689, 115644, 118876, 121055, 106326, 91751, 108816, 97019, 92366, 110855];
  const dayNumber = value => Date.parse(value + 'T00:00:00Z') / 86400000;
  window.getCalendarPrice = (value, referenceDate) => {
    const offset = dayNumber(value) - dayNumber(referenceDate);
    const index = ((offset + 5) % prices.length + prices.length) % prices.length;
    const amount = prices[index];
    return {price: String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' '), low: amount < 95000};
  };
})();
