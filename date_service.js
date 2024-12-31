const currentYearTwoDigits = getCurrentYear() % 100;
const currentMonth = getCurrentMonth();
const numericRepresentation = `${currentMonth}-${currentYearTwoDigits}`;

export const contractDates = {
    FIRST_FOURTH: { textual: `MAR${currentYearTwoDigits}`, numeric: numericRepresentation },
    SECOND_FOURTH: { textual: `JUNE${currentYearTwoDigits}`, numeric: numericRepresentation },
    THIRD_FOURTH: { textual: `SEP${currentYearTwoDigits}`, numeric: numericRepresentation },
    FOUR_FOURTH: { textual: `DEC${currentYearTwoDigits}`, numeric: numericRepresentation },
};
function getCurrentMonth() {
    const month = new Date().getMonth() + 1;
    return month < 10 ? '0' + month : month.toString();
}

function getCurrentYear(){
    return new Date().getFullYear();
}


export function getCurrentContractDate() {
    const currentMonth = new Date().getMonth() + 1;
    let contractKey;

    if (currentMonth >= 1 && currentMonth <= 3) {
        contractKey = 'FIRST_FOURTH';
    } else if (currentMonth >= 4 && currentMonth <= 6) {
        contractKey = 'SECOND_FOURTH';
    } else if (currentMonth >= 7 && currentMonth <= 9) {
        contractKey = 'THIRD_FOURTH';
    } else if (currentMonth >= 10 && currentMonth <= 12) {
        contractKey = 'FOUR_FOURTH';
    }

    return contractDates[contractKey];
}
console.log(getCurrentYear());
console.log(getCurrentContractDate());
console.log(getCurrentMonth());