// Suponiendo que tienes un módulo "combinationsUtils" que contiene las funciones necesarias

function main() {
    // Definir la lista de montos y el pago
    const montos = [
        '5', '10', '5', '10', '2', '3', '10', '5'
    ].map(val => new Decimal(val));
    const pago = new Decimal('35');

    // Buscar combinaciones de montos que sumen al valor del pago
    for (let i = 1; i <= montos.length; i++) {
        const combos = combinations(montos, i);
        for (const combo of combos) {
            if (sum(combo).cmp(pago) === 0) {
                console.log("La combinación de montos que suman al pago es: " + combo.join(', '));
                return;
            }
        }
    }
    console.log("No se encontró una combinación de montos que sumen al pago");
}

main();
