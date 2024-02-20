const fs = require('fs');
const pdf = require('pdf-parse');
const {calcularDigitoVerificador} = require('./util/util');

const readFile = async (file) => {
    try {
        const data = await pdf(fs.readFileSync(file));

        // Extraer el número (rut)
        const rutMatch = data.text.match(/Nombre\s*:\s*(\d+)/);
        const rut = (rutMatch && rutMatch[1] ? rutMatch[1] : null) + '-' + calcularDigitoVerificador(rutMatch[1]);
        const progresivasMatch = data.text.match(/Progresivas \(\+\)Adicionales \(\+\)\n\d+\.00(\d+\.00)/);
        const progresivas = (progresivasMatch && progresivasMatch[1] ? progresivasMatch[1] : null);
        // Extraer los periodos de vacaciones
        const sections = data.text.match(/\d+(\n|)P[A-Z]+ V[A-Z]+ \d{4}\s*?-?\s*?\d{4}\s*([-*]*)\s*\n\d{2}\/\d{2}\/\d{4}\n\d{2}\/\d{2}\/\d{4}/g);
        const periodos = sections.map(d => {
            let aux = d.match(/\d{2}\/\d{2}\/\d{4}\n\d{2}\/\d{2}\/\d{4}/g)[0];
            let dias = d.match(/^\d+/g)[0];
            let desde = aux.split(/\n/)[0];
            let hasta = aux.split(/\n/)[1];
            let obs = d.match(/\d+(\n|)P[A-Z]+ V[A-Z]+ \d{4}\s*?-?\s*?\d{4}\s*([-*]*)\s*\n/g)[0].replace(/\n/g, '').replace(/^\d*/g, '');
            let isProgresiva = false;
            return {dias, desde, hasta, obs, isProgresiva};
        });

        return {
            rut: rut,
            progresivasQty: progresivas,
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
