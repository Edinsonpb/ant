const uvt_vigente = 49799;

function formatNumberInput(input) {
    let value = input.value.replace(/\D/g, '');
    input.value = new Intl.NumberFormat('es-CO').format(value);
}

async function fetchAjusteFiscal(year) {
    try {
        const response = await fetch('./datos/ajuste_fiscal_art_73.json');
        const ajusteFiscal = await response.json();
        if (ajusteFiscal[year] !== undefined) {
            return ajusteFiscal[year];
        } else {
            throw new Error(`No se encontró ajuste fiscal para el año ${year}`);
        }
    } catch (error) {
        console.error('Error al cargar el ajuste fiscal:', error);
        return null;
    }
}

async function fetchImpuestoTimbre() {
    try {
        const response = await fetch('./datos/impuesto_timbre.json');
        return await response.json();
    } catch (error) {
        console.error('Error al cargar el impuesto de timbre:', error);
        return null;
    }
}

function getRangoValue(rangos, value) {
    let position = 0;
    for (const rango in rangos) {
        const [min, max] = rango.split('-').map(Number);
        if (value >= min && value <= max) {
            return { value: parseFloat(rangos[rango]), position: position };
        }
        position++;
    }
    return null;
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('benefits-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const year = document.getElementById('year').value;
        const value1 = parseFloat(document.getElementById('value1').value.replace(/\./g, '').replace(',', '.'));
        const value2 = parseFloat(document.getElementById('value2').value.replace(/\./g, '').replace(',', '.'));
        const value3 = parseFloat(document.getElementById('value3').value.replace(/\./g, '').replace(',', '.'));
        const ajuste = await fetchAjusteFiscal(year);
        if (ajuste !== null) {
            const result = value2 * ajuste;
            document.getElementById('result').textContent = `El ajuste fiscal para el año ${year} es ${ajuste}`;
            document.getElementById('multiplication-result').textContent = `El costo fiscal ajustado por el art 73 E.T. es ${new Intl.NumberFormat('es-CO').format(result)}`;
            const maxValue = Math.min(Math.max(result, value2, value3), value1);
            document.getElementById('max-value').textContent = `${new Intl.NumberFormat('es-CO').format(maxValue)}`;
            const ganancia = value1 - maxValue;
            document.getElementById('ganancia-result').textContent = `La ganancia ocasional gravada es ${new Intl.NumberFormat('es-CO').format(ganancia)}`;
            const impuestoGanancia = ganancia * 0.15;
            document.getElementById('impuesto-ganancia-ocasional').textContent = `El impuesto a las ganancias ocasionales del 15% es ${new Intl.NumberFormat('es-CO').format(impuestoGanancia)}`;
        } else {
            document.getElementById('result').textContent = `No se encontró ajuste fiscal para el año ${year}`;
            document.getElementById('multiplication-result').textContent = '';
            document.getElementById('max-value').textContent = '';
            document.getElementById('ganancia-result').textContent = 'Error en el cálculo de la ganancia ocasional';
            document.getElementById('impuesto-ganancia-ocasional').textContent = '';
        }
    });

    const calculateImpuestosButton = document.getElementById('calculate-impuestos');
    calculateImpuestosButton.addEventListener('click', async () => {
        const value1 = parseFloat(document.getElementById('value1').value.replace(/\./g, '').replace(',', '.'));
        const impuestoTimbre = await fetchImpuestoTimbre();
        let valor_impuesto_timbre = 0;
        if (impuestoTimbre !== null) {
            const value1DivUVT = (value1 / uvt_vigente).toFixed(2);
            const rangoResult = getRangoValue(impuestoTimbre, value1DivUVT);
            if (rangoResult !== null) {
                if (rangoResult.position === 0) {
                    valor_impuesto_timbre = value1DivUVT * rangoResult.value;
                } else if (rangoResult.position === 1) {
                    valor_impuesto_timbre = ((value1DivUVT - 20000) * rangoResult.value / 100) / 2 * uvt_vigente;
                } else if (rangoResult.position === 2) {
                    valor_impuesto_timbre = (((value1DivUVT - 50000) * rangoResult.value / 100) + (30000 * 0.015)) / 2 * uvt_vigente;
                }
                valor_impuesto_timbre = Math.round(valor_impuesto_timbre);
                document.getElementById('rango-value').textContent = `El valor del impuesto de timbre a cargo del vendedor es ${new Intl.NumberFormat('es-CO').format(valor_impuesto_timbre)}`;
            } else {
                document.getElementById('rango-value').textContent = 'No se encontró un rango correspondiente';
            }
        } else {
            document.getElementById('rango-value').textContent = 'Error al cargar el impuesto de timbre';
        }
        const reteFuente = value1 * 1 / 100;
        document.getElementById('reteFuente').textContent = `La retención en la fuente del 1% que paga el vendedor es ${new Intl.NumberFormat('es-CO').format(reteFuente)}`;
        const impoRegistro = Math.round(value1 * 1.104 / 100 / 2);
        document.getElementById('impo_Registro').textContent = `El 50% impuesto de registro que paga el vendedor es ${new Intl.NumberFormat('es-CO').format(impoRegistro)}`;
        const impoGobernacion = Math.round(value1 * 1 / 100 / 2);
        document.getElementById('impo_Gobernacion').textContent = `El 50% impuesto de la gobernación que paga el vendedor es ${new Intl.NumberFormat('es-CO').format(impoGobernacion)}`;
        const gastos_Notariales = Math.round(value1 * 0.54 / 100);
        document.getElementById('gastos_Notariales').textContent = `Los gastos notariales que paga el vendedor es ${new Intl.NumberFormat('es-CO').format(gastos_Notariales)}`;
        const total_Gastos = valor_impuesto_timbre + reteFuente + impoRegistro + impoGobernacion + gastos_Notariales;
        document.getElementById('total_Gastos').textContent = `El total de gastos de escrituración que paga el vendedor es ${new Intl.NumberFormat('es-CO').format(total_Gastos)}`;
        const gastos_Netos = total_Gastos - reteFuente - valor_impuesto_timbre;
        document.getElementById('gastos_Netos').textContent = `El total de gastos de escrituración que paga el vendedor es ${new Intl.NumberFormat('es-CO').format(gastos_Netos)}`;
    });
});