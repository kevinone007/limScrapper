function calcularDigitoVerificador(rut) {
    // Paso 1: Convertir el RUT a un array de dígitos y reversarlo
    const digitos = rut.toString().split('').reverse().map(d => parseInt(d));

    // Paso 2: Calcular la suma ponderada de los dígitos
    let suma = 0;
    let multiplicador = 2;
    for (let digito of digitos) {
        suma += digito * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    // Paso 3: Calcular el dígito verificador como el módulo 11 de la suma
    const digitoVerificador = 11 - (suma % 11);

    // Paso 4: Manejar casos especiales
    switch (digitoVerificador) {
        case 11:
            return '0';
        case 10:
            return 'K';
        default:
            return digitoVerificador.toString();
    }
}

module.exports = {
    calcularDigitoVerificador
};
