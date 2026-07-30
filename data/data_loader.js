export async function obtenerDatosExcel(url, nombreHoja) {
    const respuesta = await fetch(url);
    const arrayBuffer = await respuesta.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const worksheet = workbook.Sheets[nombreHoja];
    return XLSX.utils.sheet_to_json(worksheet);
}