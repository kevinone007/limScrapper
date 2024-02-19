const fs = require('fs');
const pdf = require('pdf-parse');
const {calcularDigitoVerificador} = require('./util/util');

const readFile = async (file) => {
    try {
        const data = await pdf(fs.readFileSync(file));

        // Extraer el número (rut)
        const rutMatch = data.text.match(/Nombre\s*:\s*(\d+)/);
        const rut = (rutMatch && rutMatch[1] ? rutMatch[1] : null) + '-' + calcularDigitoVerificador(rutMatch[1]);

        // Extraer los periodos de vacaciones
        const sections = data.text.match(/[0-9]+(\n|)P[A-Z]+ V[A-Z]+ \d{4}-\d{4}\**\n\d{2}\/\d{2}\/\d{4}\n\d{2}\/\d{2}\/\d{4}/g);
        const periodos = sections.map(d => {
            let aux = d.match(/\d{2}\/\d{2}\/\d{4}\n\d{2}\/\d{2}\/\d{4}/g)[0];
            let dias = d.match(/^\d+/g)[0];
            let desde = aux.split(/\n/)[0];
            let hasta = aux.split(/\n/)[1];
            let obs = d.match(/\d+(\n|)P[A-Z]+ V[A-Z]+ \d{4}-\d{4}\**\n/g)[0].replace(/\n/g, '').replace(/^\d*/g, '');
            return {dias, desde, hasta, obs};
        });

        return {
            rut: rut,
            periodos
        };
    } catch (error) {
        console.error('Error al leer el PDF:', error);
        return {
            rut: null,
            periodos: []
        };
    }
};

module.exports = {
    readFile
};
