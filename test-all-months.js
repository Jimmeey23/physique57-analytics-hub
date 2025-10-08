// Test to show all months that will be displayed
function generateStandardMonthRange() {
  const months = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const startDate = new Date(2024, 0, 1);   // January 2024 (0-indexed)
  const currentDate = new Date(2025, 9, 1); // October 2025 (0-indexed)

  let iterYear = startDate.getFullYear();
  let iterMonth = startDate.getMonth();

  while (iterYear < currentDate.getFullYear() ||
         (iterYear === currentDate.getFullYear() && iterMonth <= currentDate.getMonth())) {
    const monthName = monthNames[iterMonth];
    months.push({
      key: `${iterYear}-${String(iterMonth + 1).padStart(2, '0')}`,
      display: `${monthName} ${iterYear}`,
      year: iterYear,
      month: iterMonth + 1,
    });

    // Move to next month
    iterMonth++;
    if (iterMonth > 11) {
      iterMonth = 0;
      iterYear++;
    }
  }

  return months;
}

const months = generateStandardMonthRange();
console.log('Total months:', months.length);
console.log('\nAll months that will now be displayed (starting from Jan 2024):');
months.forEach((month, i) => {
  console.log(`${i}: ${month.key} - ${month.display}`);
});