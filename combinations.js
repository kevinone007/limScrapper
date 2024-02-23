const findCombination = (arr, total) => {
    let result = { combination: [], indices: [] };

    const backtrack = (startIndex, target, path, indices) => {
        if (target === 0) {
            result.combination = [...path];
            result.indices = [...indices];
            return true; // Indicar que se ha encontrado una combinación exitosa
        }

        for (let i = startIndex; i < arr.length; i++) {
            if (target - arr[i] >= 0) {
                path.push(arr[i]);
                indices.push(i);
                // Si se encuentra una combinación exitosa, detener la búsqueda
                if (backtrack(i + 1, target - arr[i], path, indices)) {
                    return true;
                }
                path.pop();
                indices.pop();
            }
        }
        return false; // Indicar que no se encontró una combinación exitosa
    };

    backtrack(0, total, [], []);

    return result;
};

const markProgressiveTransactions = async (periodos, n) => {
    return new Promise((resolve, reject) => {
        const diasList = periodos.map(periodo => periodo.dias);
        const { combination, indices } = findCombination(diasList, n);

        if (combination.length > 0) {
            const markedIndexes = new Set();

            indices.forEach(index => {
                const periodo = periodos[index];
                if (!markedIndexes.has(index)) {
                    periodo.isProgresiva = true;
                    markedIndexes.add(index);
                }
            });

            console.log("La primera combinación de montos que suman al pago ha sido marcada.");
            console.log("Transacciones marcadas correctamente.");
            resolve();
        } else {
            console.log("No se encontró ninguna combinación que sume al pago.");
            resolve();
        }
    });
};





module.exports = {markProgressiveTransactions};
