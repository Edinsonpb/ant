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
            return { value: rangos[rango], position: position };
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
        if (impuestoTimbre !== null) {
            const value1DivUVT = (value1 / uvt_vigente).toFixed(2);
            const rangoResult = getRangoValue(impuestoTimbre, value1DivUVT);
            if (rangoResult !== null) {
                document.getElementById('rango-value').textContent = `El valor correspondiente al rango de ${value1DivUVT} es ${rangoResult.value} en la posición ${rangoResult.position}`;
            } else {
                document.getElementById('rango-value').textContent = 'No se encontró un rango correspondiente';
            }
        } else {
            document.getElementById('rango-value').textContent = 'Error al cargar el impuesto de timbre';
        }
    });
});