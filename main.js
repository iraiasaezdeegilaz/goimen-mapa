// CONFIGURACIÓN DE ESTADÍSTICAS PRIVADAS --> gx5yIHVrhyxfLntP
const MODO_PRUEBAS = true; 
const SUPABASE_URL = 'https://rzsmaormoixcfnmxxvdz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6c21hb3Jtb2l4Y2ZubXh4dmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMjQ2NDMsImV4cCI6MjEwMDgwMDY0M30.epnwWIdDqRzzLDGtd12g9Z3_c1XqST-vycs1tiyCEmo';

// Inicializamos el cliente de Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.registrarEstadistica = async function(tipo, item) {
    if (!tipo || !item) return;
    const itemLimpio = item.trim();

    try {
        const { data: existenteList, error: errorBusqueda } = await supabaseClient
            .from('estadisticas_clics')
            .select('contador')
            .eq('tipo', tipo)
            .eq('nombre', itemLimpio)
            .limit(1);

        if (errorBusqueda) {
            console.error('Error de búsqueda en Supabase:', errorBusqueda);
            return;
        }

        if (existenteList && existenteList.length > 0) {
            const nuevoContador = (Number(existenteList[0].contador) || 0) + 1;
            
            const { error: errorUpdate } = await supabaseClient
                .from('estadisticas_clics')
                .update({ contador: nuevoContador })
                .eq('tipo', tipo)
                .eq('nombre', itemLimpio);

            if (errorUpdate) {
                console.error('Error al actualizar en Supabase:', errorUpdate);
            }
        } else {
            const { error: errorInsert } = await supabaseClient
                .from('estadisticas_clics')
                .insert([{ tipo: tipo, nombre: itemLimpio, contador: 1 }]);

            if (errorInsert) {
                console.error('Error al insertar en Supabase:', errorInsert);
            }
        }
    } catch (err) {
        console.error('Excepción crítica con Supabase:', err);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Lógica del buscador y estadísticas
    const inputBuscador = document.getElementById('buscador');
    if (inputBuscador) {
        inputBuscador.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const valor = inputBuscador.value.trim();
                if (valor !== "") registrarEstadistica('busqueda', valor);
            }
        });

        inputBuscador.addEventListener('change', (e) => {
            const valor = e.target.value.trim();
            if (valor !== "") registrarEstadistica('busqueda', valor);
        });
    }

    // 2. Adaptación móvil: Botón flotante y cierre por gesto táctil deslizante
    const esMovil = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (esMovil) {
        if (!document.querySelector('.btn-toggle-filtros-movil')) {
            const btnToggleFiltros = document.createElement('button');
            btnToggleFiltros.className = 'btn-toggle-filtros-movil';
            btnToggleFiltros.innerHTML = '🔍 Bilatzailea';
            btnToggleFiltros.style.cssText = 'position: fixed; bottom: 25px; left: 50%; transform: translateX(-50%); z-index: 99999; background: #2d5a27; color: white; border: none; padding: 14px 28px; border-radius: 30px; font-weight: bold; font-size: 0.95em; box-shadow: 0 4px 15px rgba(0,0,0,0.4); cursor: pointer; font-family: Montserrat, sans-serif; transition: opacity 0.3s ease;';
            document.body.appendChild(btnToggleFiltros);

            if (typeof L !== 'undefined' && L.DomEvent) {
                L.DomEvent.disableClickPropagation(btnToggleFiltros);
                L.DomEvent.disableScrollPropagation(btnToggleFiltros);
            }

            // Al hacer clic, abre el panel y oculta el botón flotante
            btnToggleFiltros.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const panelFiltros = document.querySelector('.controles-mapa') || 
                                     document.querySelector('#controles') || 
                                     document.querySelector('.leaflet-control-container');

                if (panelFiltros) {
                    panelFiltros.classList.add('mobile-open');
                    btnToggleFiltros.style.opacity = '0';
                    btnToggleFiltros.style.pointerEvents = 'none';

                    // Creamos dinámicamente una barrita superior (tirador) si no existe para facilitar el gesto
                    if (!panelFiltros.querySelector('.panel-handle')) {
                        const handle = document.createElement('div');
                        handle.className = 'panel-handle';
                        handle.style.cssText = 'width: 45px; height: 5px; background: #cbd5e1; border-radius: 3px; margin: 0 auto 15px auto; cursor: pointer;';
                        panelFiltros.insertBefore(handle, panelFiltros.firstChild);

                        // Gesto táctil aplicado exclusivamente sobre la barrita superior
                        let touchStartY = 0;
                        handle.addEventListener('touchstart', (evt) => {
                            touchStartY = evt.touches[0].screenY;
                        }, { passive: true });

                        handle.addEventListener('touchend', (evt) => {
                            let touchEndY = evt.changedTouches[0].screenY;
                            // Si arrastras la barrita hacia abajo más de 40px, se cierra el panel y vuelve el botón
                            if (touchEndY - touchStartY > 40) {
                                panelFiltros.classList.remove('mobile-open');
                                btnToggleFiltros.style.opacity = '1';
                                btnToggleFiltros.style.pointerEvents = 'auto';
                            }
                        }, { passive: true });
                    }
                } else {
                    alert("No se encontró el contenedor de filtros en el HTML.");
                }
            });
        }
    }
});

// ==========================================
// CÓDIGO COMPLETO INTEGRADO (CORRECCIÓN DE BÚSQUEDA DE EKOIZLE) 
// ==========================================

let mapa;
const capasEkoizleak = L.markerClusterGroup({
    maxClusterRadius: 35,
    spiderfyOnMaxZoom: true,
    zoomToBoundsOnClick: true
});
const capasSalmenta = L.markerClusterGroup({
    maxClusterRadius: 35,
    spiderfyOnMaxZoom: true,
    zoomToBoundsOnClick: true
});
const capasAzokak = L.markerClusterGroup({
    maxClusterRadius: 35,
    spiderfyOnMaxZoom: true,
    zoomToBoundsOnClick: true
});
const capasZerbitzuak = L.markerClusterGroup({
    maxClusterRadius: 35,
    spiderfyOnMaxZoom: true,
    zoomToBoundsOnClick: true
});

let datos, datosSalmenta, datosAzokak, datosZerbitzuak;
let iconoSalmenta, iconoAzoka, iconoZerbitzuak;
let temporizadorBusqueda = null;

const COL_SELLOS = ['Ekologikoa', 'Erregeneratzailea', 'Euskal Sagardoa', 'DO Idiazabal', 'Artzai Gazta'];
const COL_SALMENTA = ['Dendetan', 'Azokak', 'Jatetxeetara', 'Etxetik', 'Harategian', 'Kontsumo taldeak', 'Vending makina', 'Online', 'Biziola', 'Bertatik Bertara', 'Goierriko nekazal koop (GNK)'];
const VERDE_PASTEL = '#a8d5ba'; 
const VERDE_OSCURO = '#2d5a3f'; 
const AZUL_PASTEL = '#a9cce3'; 
const AZUL_OSCURO = '#1a5276';
const ICONOS = { 'ESNEKIAK': '🥛', 'HARAGIA ETA ARRAUTZAK': '🥩', 'BARAZKIAK': '🥕', 'LEKALEAK': '🫘','ERATORRIAK': '🍯', 'ERLEAK': '🐝', 'FRUTA': '🍎', 'FRUITU LEHORRAK': '🥜', 'BASA FRUITUAK': '🍓', 'LANDAREAK': '🌱', 'OGIGINTZA': '🥖', 'EDARIAK': '🍷' };

const normalizarTexto = (texto) => (texto || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

window.onload = async function() {
    registrarEstadistica('visita_web', 'Home');

    // 1. Inicialización del mapa
    mapa = L.map('mapa', {
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true
    }).setView([43.05, -2.25], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(mapa);

    // 2. Carga de datos Excel
    const respuesta = await fetch('./data/Ekoizle potentzialak.xlsx?nocache=' + new Date().getTime());
    const wb = XLSX.read(await respuesta.arrayBuffer(), { type: 'array' });
    datos = XLSX.utils.sheet_to_json(wb.Sheets['Ekoizleak'], { range: 2 });
    datosSalmenta = XLSX.utils.sheet_to_json(wb.Sheets['Salmenta puntuak'], { range: 0 });
    datosAzokak = XLSX.utils.sheet_to_json(wb.Sheets['Azokak'] || {}, { range: 0 });
    datosZerbitzuak = XLSX.utils.sheet_to_json(wb.Sheets['Zerbitzuak'] || {}, { range: 0 });
   
    iconoSalmenta = L.icon({ iconUrl: './icons/salmenta.png', iconSize: [28, 28], iconAnchor: [16, 32] });
    iconoAzoka = L.icon({ iconUrl: './icons/azoka.png', iconSize: [32, 32], iconAnchor: [16, 32] });
    iconoZerbitzuak = L.icon({ iconUrl: './icons/zerbitzuak.png', iconSize: [28, 28], iconAnchor: [18, 34] });
        
    capasEkoizleak.addTo(mapa); 
    capasSalmenta.addTo(mapa);
    capasAzokak.addTo(mapa);
    capasZerbitzuak.addTo(mapa);

    // 3. Creación de contenedor UI
    // 3. Creación de contenedor UI
    const ui = L.DomUtil.create('div', 'controles-mapa');
    ui.id = 'ui';
    ui.style.fontFamily = "'Montserrat', sans-serif";
    ui.innerHTML = `
        <div style="margin-bottom: 4px;">
            <input type="text" id="buscador" class="control-input" list="sugerencias-nombres" placeholder="🔍 Bilatu..." style="width: 100%; padding: 8px; box-sizing: border-box; border-radius: 8px; border: 1px solid #ccc; font-family: 'Montserrat', sans-serif;">
            <datalist id="sugerencias-nombres"></datalist>
        </div>
        
        <div style="font-size: 0.85em; font-weight: bold; color: #2c5e2e; margin: 4px 0 8px 2px; font-family: 'Montserrat', sans-serif;">
            Guztira ikusgai: <span id="contador-visibles">0</span>
        </div>

        <div style="margin-bottom: 10px;">
            <button id="btn-geolocalizar" title="Nire kokapena erakutsi" style="flex: 1; background: #f0f8ff !important; color: #2980b9 !important; border: 1px solid #85c1e9 !important; padding: 4px 6px; border-radius: 4px; cursor: pointer; font-size: 0.65em; font-weight: bold; font-family: 'Montserrat', sans-serif;">📍 Nire kokapena</button>

        <div style="margin-bottom: 14px; margin-top: 2px; display: flex; justify-content: flex-end; align-items: center;">
            <button id="btn-reset-filtros" title="Garbitu hautapenak" style="background: #ff6b6b; color: white; border: none; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-size: 0.65em; font-weight: bold; font-family: 'Montserrat', sans-serif;" aria-label="Garbitu hautapenak">✕ Garbitu iragazkiak</button>
        </div>
        <div id="indicador-activos" style="font-size: 0.8em; color: #d9534f; margin-bottom: 8px; font-weight: bold; display: none; font-family: 'Montserrat', sans-serif;">Filtroak aktibo daude</div>
    `;
    document.body.appendChild(ui);

    // 4. Creación de Acordeones
    const divSalmenta = document.createElement('div');
    divSalmenta.className = 'cat-group';
    divSalmenta.innerHTML = `<div class="cat-header" style="background: #eef2f5; font-weight: bold; cursor: pointer; padding: 8px; border-radius: 6px; margin-bottom: 5px; font-family: 'Montserrat', sans-serif;">🛒 Salmenta Puntuak ▾</div><div class="cat-body" style="display:none; padding-left: 10px;"></div>`;
    ['Harategia', 'Denda', 'Frutategia', 'Okindegia', 'Jatetxea', 'Taberna', 'Ostatua', 'Kooperatiba', 'Klik eta jaso', 'Vending makinak'].forEach(tipo => {
        divSalmenta.querySelector('.cat-body').innerHTML += `<label class="checkbox-item" style="display:block; margin-bottom:3px; font-family: 'Montserrat', sans-serif;"><input type="checkbox" class="filtro-mota" value="${tipo.toLowerCase()}"> ${tipo}</label>`;
    });
    ui.appendChild(divSalmenta);

    const divAzokak = document.createElement('div');
    divAzokak.className = 'cat-group';
    divAzokak.innerHTML = `<div class="cat-header" style="background: #eef2f5; font-weight: bold; cursor: pointer; padding: 8px; border-radius: 6px; margin-bottom: 5px; font-family: 'Montserrat', sans-serif;">🧺 Azokak ▾</div><div class="cat-body" style="display:none; padding-left: 10px;"></div>`;
    ['Asterokoa', 'Azoka berezia'].forEach(tipo => {
        divAzokak.querySelector('.cat-body').innerHTML += `<label class="checkbox-item" style="display:block; margin-bottom:3px; font-family: 'Montserrat', sans-serif;"><input type="checkbox" class="filtro-azoka" value="${tipo.toLowerCase()}"> ${tipo}</label>`;
    });
    ui.appendChild(divAzokak);

    const divZerbitzuak = document.createElement('div');
    divZerbitzuak.className = 'cat-group';
    divZerbitzuak.innerHTML = `<div class="cat-header" style="background: #eef2f5; font-weight: bold; cursor: pointer; padding: 8px; border-radius: 6px; margin-bottom: 5px; font-family: 'Montserrat', sans-serif;">ℹ️ Zerbitzuak ▾</div><div class="cat-body" style="display:none; padding-left: 10px;"></div>`;
    ['Ekitaldia', 'Elkartea', 'Landetxea', 'Makinaria zerbitzua', 'Museo eta interpretazio zentroak', 'Nekazal turismoak', 'Sagardotegia', 'Turismo aktiboa'].forEach(tipo => {
        divZerbitzuak.querySelector('.cat-body').innerHTML += `<label class="checkbox-item" style="display:block; margin-bottom:3px; font-family: 'Montserrat', sans-serif;"><input type="checkbox" class="filtro-zerbitzuak" value="${tipo.toLowerCase()}"> ${tipo}</label>`;
    });
    ui.appendChild(divZerbitzuak);

    const fraseSeparadora = document.createElement('div');
    fraseSeparadora.innerHTML = `<p style="font-size: 0.85em; color: #666; margin: 15px 0 5px 5px; font-style: italic; font-family: 'Montserrat', sans-serif;">Aukeratu produktua:</p>`;
    ui.appendChild(fraseSeparadora);

    // 5. Generación dinámica de productos desde Excel
    const cabeceras = XLSX.utils.sheet_to_json(wb.Sheets['Ekoizleak'], { header: 1 });
    const estructura = {};
    const sellosRef = (typeof COL_SELLOS !== 'undefined') ? COL_SELLOS : [];

    cabeceras[1].forEach((cat, idx) => {
        let nombreColumna = cabeceras[2][idx];
        if (!cat || cat === 'SALMENTA PUNTUAK' || !nombreColumna || sellosRef.includes(nombreColumna)) return;
        let catFinal = (cat === 'HARAGIA' || cat === 'OILOAK') ? 'HARAGIA ETA ARRAUTZAK' : cat;
        if (!estructura[catFinal]) estructura[catFinal] = {};
        let n = nombreColumna.toLowerCase();
        let subgrupo = n.includes('esnea') ? 'Esnea' : n.includes('gazta') ? 'Gazta' : n.includes('txerri') ? 'Txerrikiak' : n.includes('oilasko') ? 'Oilaskoak' : n.includes('arrautza') ? 'Arrautzak' : n.includes('haragia') ? 'Haragia' : nombreColumna;
        if (!estructura[catFinal][subgrupo]) estructura[catFinal][subgrupo] = [];
        estructura[catFinal][subgrupo].push(nombreColumna);
    });

    const iconosRef = (typeof ICONOS !== 'undefined') ? ICONOS : {};
    Object.keys(estructura).forEach(cat => {
        const div = document.createElement('div');
        div.className = 'cat-group';
        div.innerHTML = `<div class="cat-header" style="background: #f9f9f9; font-weight: bold; cursor: pointer; padding: 6px; border-radius: 4px; margin-bottom: 3px; font-size:0.95em; font-family: 'Montserrat', sans-serif;">${iconosRef[cat] || '📦'} ${cat} ▾</div><div class="cat-body" style="display:none; padding-left: 10px;"></div>`;
        Object.keys(estructura[cat]).forEach(sub => {
            div.querySelector('.cat-body').innerHTML += `<label class="checkbox-item" style="display:block; margin-bottom:2px; font-size:0.9em; font-family: 'Montserrat', sans-serif;"><input type="checkbox" data-col="${estructura[cat][sub].join(',')}"> ${sub}</label>`;
        });
        ui.appendChild(div);
    });

    // 6. Función principal de actualización del mapa y contador
    window.actualizarMapa = function() {
    if (typeof capasEkoizleak !== 'undefined' && typeof capasEkoizleak.clearLayers === 'function') {
        capasEkoizleak.clearLayers();
    }

    const textoInput = document.getElementById('buscador');
    const texto = textoInput ? normalizarTexto(textoInput.value) : "";
    let bounds = L.latLngBounds();

    // 1. Recogemos todos los checkboxes marcados
    const checkboxesMarcados = Array.from(ui.querySelectorAll('input[type="checkbox"][data-col]:checked'));

    // 2. Agrupación por contenedor (.cat-group)
    const gruposPorContenedor = new Map();

    checkboxesMarcados.forEach(cb => {
        const catGroup = cb.closest('.cat-group');
        const contenedorClave = catGroup || cb.parentElement;

        if (!gruposPorContenedor.has(contenedorClave)) {
            gruposPorContenedor.set(contenedorClave, []);
        }

        const columnas = cb.getAttribute('data-col').split(',');
        columnas.forEach(col => {
            const cTrim = col.trim();
            const listaColumnas = gruposPorContenedor.get(contenedorClave);
            if (cTrim && !listaColumnas.includes(cTrim)) {
                listaColumnas.push(cTrim);
            }
        });
    });

    const arrayDeBloques = Array.from(gruposPorContenedor.values());

    // 3. Filtrado estricto
    const caseriosFiltrados = datos.filter(p => {
        const baimenaStr = p.BAIMENA ? p.BAIMENA.toString().trim() : "";
        const tieneBaimena = baimenaStr !== "" && baimenaStr !== "0" && baimenaStr.toLowerCase() !== "false";
        if (!tieneBaimena) return false;

        const nombreUsti = normalizarTexto(p.USTIATEGIAREN_IZENA);
        const marca = normalizarTexto(p['SALMENTA MARKA']);
        const cumpleTexto = texto === "" || nombreUsti.includes(texto) || marca.includes(texto);
        
        const cumpleProductos = arrayDeBloques.length === 0 || arrayDeBloques.every(columnasDelBloque => {
            return columnasDelBloque.some(col => {
                const val = p[col];
                if (val === undefined || val === null) return false;
                const valStr = val.toString().trim();
                return valStr !== "" && valStr !== "0" && valStr !== "0.0" && valStr.toLowerCase() !== "false";
            });
        });

        const tieneCoordenadas = p['ycoord (º)'] !== undefined && p['ycoord (º)'] !== null && p['ycoord (º)'].toString().trim() !== "";

        return cumpleTexto && cumpleProductos && tieneCoordenadas;
    });

    // 4. Renderizado en el mapa
    caseriosFiltrados.forEach(p => {
        let lat = parseFloat(p['ycoord (º)']);
        let lng = parseFloat(p['xcoord (º)']);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            const char1 = (p.USTIATEGIAREN_IZENA || "A").charCodeAt(0) % 5;
            const char2 = (p.USTIATEGIAREN_IZENA || "AB").charCodeAt(1 % (p.USTIATEGIAREN_IZENA || "AB").length) % 5;
            lat += (char1 - 2) * 0.00015;
            lng += (char2 - 2) * 0.00015;

            bounds.extend([lat, lng]);
            
            const marker = L.marker([lat, lng]);
            marker.bindPopup(`<b>${p.USTIATEGIAREN_IZENA || ''}</b>`);
            capasEkoizleak.addLayer(marker);
        }
    });

    // 5. DETECCIÓN DIRECTA DESDE EL MAPA: Cuenta exclusivamente lo que hay dibujado en pantalla
    setTimeout(() => {
        let cantidadRealEnMapa = 0;
        
        if (typeof capasEkoizleak !== 'undefined' && typeof capasEkoizleak.getLayers === 'function') {
            cantidadRealEnMapa = capasEkoizleak.getLayers().length;
        } else {
            cantidadRealEnMapa = caseriosFiltrados.length;
        }

        const spanContador = document.getElementById('contador-visibles');
        if (spanContador) {
            spanContador.textContent = cantidadRealEnMapa;
        }
    }, 50);

    if (typeof comprobarFiltrosActivos === 'function') {
        comprobarFiltrosActivos();
    }
};

    // 7. Funciones auxiliares
    function comprobarFiltrosActivos() {
        const totalChecks = ui.querySelectorAll('input[type="checkbox"]:checked').length;
        const textoBus = document.getElementById('buscador')?.value || "";
        const indicador = document.getElementById('indicador-activos');
        const btnReset = document.getElementById('btn-reset-filtros');

        if (totalChecks > 0 || textoBus.trim() !== "") {
            if (indicador) indicador.style.display = 'block';
            if (btnReset) btnReset.style.background = '#d9534f';
        } else {
            if (indicador) indicador.style.display = 'none';
            if (btnReset) btnReset.style.background = '#ff6b6b';
        }
    }

    function actualizarSugerencias(textoBusqueda) {
        const datalist = document.getElementById('sugerencias-nombres');
        if (!datalist) return;
        
        const limpio = normalizarTexto(textoBusqueda);
        if (limpio.length === 0) {
            datalist.innerHTML = '';
            return;
        }

        const nombresUnicos = new Set();
        
        datos.forEach(p => {
            const tieneBaimena = p.BAIMENA && p.BAIMENA.toString().trim() !== "";
            if (tieneBaimena) {
                if (p.USTIATEGIAREN_IZENA && normalizarTexto(p.USTIATEGIAREN_IZENA).includes(limpio)) {
                    nombresUnicos.add(p.USTIATEGIAREN_IZENA.trim());
                }
                if (p['SALMENTA MARKA'] && normalizarTexto(p['SALMENTA MARKA']).includes(limpio)) {
                    nombresUnicos.add(p['SALMENTA MARKA'].trim());
                }
            }
        });

        datosSalmenta.forEach(p => {
            if (p.izena && normalizarTexto(p.izena).includes(limpio)) {
                nombresUnicos.add(p.izena.trim());
            }
        });

        datosAzokak.forEach(p => {
            if (p.izena && normalizarTexto(p.izena).includes(limpio)) {
                nombresUnicos.add(p.izena.trim());
            }
        });

        datosZerbitzuak.forEach(p => {
            const iz = p.izena || p.IZENA;
            if (iz && normalizarTexto(iz).includes(limpio)) {
                nombresUnicos.add(iz.trim());
            }
        });

        let opcionesHTML = '';
        let contador = 0;
        nombresUnicos.forEach(nombre => {
            if (contador < 20) {
                opcionesHTML += `<option value="${nombre}">`;
                contador++;
            }
        });
        datalist.innerHTML = opcionesHTML;
    }

    // 8. Registro de Eventos
    ui.querySelectorAll('.cat-header').forEach(header => {
        header.onclick = (e) => {
            const body = e.currentTarget.nextElementSibling;
            if (body) {
                const estaAbriendo = body.style.display === 'none';
                body.style.display = estaAbriendo ? 'block' : 'none';
                
                if (estaAbriendo) {
                    const tituloCat = e.currentTarget.textContent.trim().replace(' ▾', '');
                    registrarEstadistica('abrir_categoria', tituloCat);
                }
            }
        };
    });

    const inputBuscador = document.getElementById('buscador');
    if (inputBuscador) {
        inputBuscador.addEventListener('input', (e) => {
            actualizarSugerencias(e.target.value);
            window.actualizarMapa();
        });
    }

    ui.querySelectorAll('input[type="checkbox"]').forEach(elemento => {
        elemento.addEventListener('change', () => {
            window.actualizarMapa();
        });
    });

    const btnReset = document.getElementById('btn-reset-filtros');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            ui.querySelectorAll('input[type="checkbox"]').forEach(ch => ch.checked = false);
            if (inputBuscador) inputBuscador.value = '';
            window.actualizarMapa();
        });
    }

    // 9. Primera ejecución
    window.actualizarMapa();

const loader = document.getElementById('loader-overlay');
if (loader) {
    loader.style.opacity = '0';
    loader.style.transition = 'opacity 0.3s ease';
    setTimeout(() => loader.remove(), 300);
}

    // ==========================================
    // RENDERIZADO Y LÓGICA DE MAPA
    // ==========================================

    window.renderizar = function(ajustarZoom = true) {
    capasEkoizleak.clearLayers();
    capasSalmenta.clearLayers();
    capasAzokak.clearLayers();
    capasZerbitzuak.clearLayers();
    
    const textoInput = document.getElementById('buscador')?.value || "";
    const texto = normalizarTexto(textoInput);
    
    // Bandera para saber si la búsqueda ha dado algún resultado real
    let busquedaValida = false;
    
    const checksMotaSalmenta = Array.from(document.querySelectorAll('input.filtro-mota:checked'));
    const checksMotaAzoka = Array.from(document.querySelectorAll('input.filtro-azoka:checked'));
    const checksProducto = Array.from(document.querySelectorAll('input[data-col]:checked'));
    const checksMotaZerbitzuak = Array.from(document.querySelectorAll('input.filtro-zerbitzuak:checked'));

    const especiales = ['esnea', 'haragia', 'gazta'];
    const selEspecial = checksProducto.filter(i => especiales.some(e => i.closest('label').textContent.toLowerCase().includes(e))).flatMap(i => i.dataset.col.split(','));
    const selResto = checksProducto.filter(i => !especiales.some(e => i.closest('label').textContent.toLowerCase().includes(e))).flatMap(i => i.dataset.col.split(','));

    const bounds = L.latLngBounds();
    let marcadoresTotales = 0;
    let elementoBuscadoEspecifico = null;

    if (texto !== "") {
        // 1. Buscar en Ekoizleak
        const matchEkoizle = datos.find(p => {
            const tieneBaimena = p.BAIMENA && p.BAIMENA.toString().trim() !== "";
            if (!tieneBaimena) return false;
            const u = normalizarTexto(p.USTIATEGIAREN_IZENA);
            const m = normalizarTexto(p['SALMENTA MARKA']);
            return u === texto || m === texto || u.includes(texto) || m.includes(texto);
        });
        if (matchEkoizle && matchEkoizle['ycoord (º)']) {
            elementoBuscadoEspecifico = { lat: parseFloat(matchEkoizle['ycoord (º)']), lng: parseFloat(matchEkoizle['xcoord (º)']) };
            busquedaValida = true;
        }

        // 2. Buscar en Salmenta Puntuak si no se encontró antes
        if (!elementoBuscadoEspecifico) {
            const matchSal = datosSalmenta.find(p => p.izena && normalizarTexto(p.izena) === texto || normalizarTexto(p.izena).includes(texto));
            if (matchSal && matchSal['ycoord (º)']) {
                elementoBuscadoEspecifico = { lat: parseFloat(matchSal['ycoord (º)']), lng: parseFloat(matchSal['xcoord (º)']) };
                busquedaValida = true;
            }
        }

        // 3. Buscar en Azokak si no se encontró antes
        if (!elementoBuscadoEspecifico) {
            const matchAzoka = datosAzokak.find(p => p.izena && normalizarTexto(p.izena) === texto || normalizarTexto(p.izena).includes(texto));
            if (matchAzoka && matchAzoka['ycoord (º)']) {
                elementoBuscadoEspecifico = { lat: parseFloat(matchAzoka['ycoord (º)']), lng: parseFloat(matchAzoka['xcoord (º)']) };
                busquedaValida = true;
            }
        }

        // 4. Buscar en Zerbitzuak si no se encontró antes
        if (!elementoBuscadoEspecifico) {
            const matchServ = datosZerbitzuak.find(p => {
                const iz = p.izena || p.IZENA;
                return iz && (normalizarTexto(iz) === texto || normalizarTexto(iz).includes(texto));
            });
            if (matchServ && matchServ['ycoord (º)']) {
                elementoBuscadoEspecifico = { lat: parseFloat(matchServ['ycoord (º)']), lng: parseFloat(matchServ['xcoord (º)']) };
                busquedaValida = true;
            }
        }

        // Si el buscador tiene texto y ha encontrado algo válido, lo registramos acumulativamente
        if (busquedaValida) {
            registrarEstadistica('busqueda', textoInput.trim());
        }
    }

        // ==========================================
        // 1. EKOIZLEAK (Caseríos)
        // ==========================================
        if (typeof capasEkoizleak !== 'undefined' && typeof capasEkoizleak.clearLayers === 'function') {
            capasEkoizleak.clearLayers();
        }

        datos.filter(p => {
            const tieneBaimena = p.BAIMENA && p.BAIMENA.toString().trim() !== "";
            if (!tieneBaimena) return false;

            const nombreUsti = normalizarTexto(p.USTIATEGIAREN_IZENA);
            const marca = normalizarTexto(p['SALMENTA MARKA']);
            const cumpleTexto = texto === "" || nombreUsti.includes(texto) || marca.includes(texto);
            const cumpleEspecial = selEspecial.length === 0 || selEspecial.some(col => p[col.trim()] === 'X');
            const cumpleResto = selResto.length === 0 || selResto.every(col => p[col.trim()] === 'X');

            // Comprobación de vinculación con tiendas (Salmenta)
            let cumpleFiltroTiendaVinculada = true;
            if (checksMotaSalmenta.length > 0) {
                cumpleFiltroTiendaVinculada = false;
                datosSalmenta.forEach(tienda => {
                    const tipoTienda = normalizarTexto(tienda.mota || "");
                    const cumpleMotaTienda = checksMotaSalmenta.some(c => tipoTienda.includes(c.value));
                    if (cumpleMotaTienda && tienda.Ekoizleak) {
                        const ekoizleakTienda = tienda.Ekoizleak.split(',').map(e => normalizarTexto(e.trim()));
                        if (ekoizleakTienda.some(e => nombreUsti.includes(e) || e.includes(nombreUsti) || (marca && (e.includes(marca) || marca.includes(e))))) {
                            cumpleFiltroTiendaVinculada = true;
                        }
                    }
                });
            }

            // REGLA IDÉNTICA A AZOKAK: Si hay filtros activos en otras capas/tiendas y NO hay un filtro propio (ni texto ni producto ni especial), se ocultan.
            // Ocultamos los caseríos si hay checkboxes de Azokak, Zerbitzuak o Salmenta activos, a menos que el usuario esté buscando explícitamente algo de este caserío.
            const hayFiltrosExternosActivos = checksMotaAzoka.length > 0 || checksMotaZerbitzuak.length > 0 || checksMotaSalmenta.length > 0;
            const hayFiltroPropioActivo = checksProducto.length > 0 || selEspecial.length > 0 || (texto !== "" && (nombreUsti.includes(texto) || marca.includes(texto)));

            if (hayFiltrosExternosActivos && !hayFiltroPropioActivo) {
                return false;
            }

            return cumpleTexto && cumpleEspecial && cumpleResto && cumpleFiltroTiendaVinculada && p['ycoord (º)'];
        }).forEach(p => {
            const lat = parseFloat(p['ycoord (º)']);
            const lng = parseFloat(p['xcoord (º)']);
            if (!isNaN(lat) && !isNaN(lng)) {
                bounds.extend([lat, lng]);
                marcadoresTotales++;
            }

            const capitalizar = (t) => t ? t.trim().toLowerCase().charAt(0).toUpperCase() + t.trim().toLowerCase().slice(1) : "";
            const nombreFoto = p.ARGAZKIA ? p.ARGAZKIA.trim() : "";
            const direccionMostrada = (p.HELBIDEA && p.HELBIDEA.trim() !== "") ? p.HELBIDEA : (p.UDALERRIA ? capitalizar(p.UDALERRIA) : "");
            const imagenHTML = nombreFoto !== "" ? `<img src="img/${nombreFoto}" style="width: 100%; height: 150px; object-fit: contain; background-color: #f8f8f8; display: block;" alt="${p.USTIATEGIAREN_IZENA}">` : '';

            let marca = (p['SALMENTA MARKA'] && p['SALMENTA MARKA'].trim() !== "") ? p['SALMENTA MARKA'].trim() : "";
            let nombreUstiategi = (p.USTIATEGIAREN_IZENA && p.USTIATEGIAREN_IZENA.trim() !== "") ? p.USTIATEGIAREN_IZENA.trim() : "Sin nombre";
            let nombreParaMostrar = nombreUstiategi !== "Sin nombre" ? nombreUstiategi : marca;
            let marcaFormateada = marca ? (marca.charAt(0).toUpperCase() + marca.slice(1).toLowerCase()) : null;

            let sellosHTML = COL_SELLOS.filter(s => p[s] === 'X').map(s => 
                `<span style="background:#fff9c4; color:#b8860b; padding:2px 8px; border-radius:10px; font-size:0.75em; border:1px solid #f1c40f; margin:2px; display:inline-block; font-weight:bold; font-family: 'Montserrat', sans-serif;">${s}</span>`
            ).join('');

            let redesHTML = '';
            if (p['SARE SOZIALAK'] && p['SARE SOZIALAK'].trim() !== "") {
                p['SARE SOZIALAK'].split(',').map(l => l.trim()).forEach(link => {
                    let icono = '📱'; let nombreRed = 'Sarea'; let colorFondo = '#f0f0f0';
                    if (link.includes('instagram')) { icono = '📸'; nombreRed = 'Instagram'; colorFondo = 'linear-gradient(135deg, #ffd1dc 0%, #ffe0b2 100%)'; } 
                    else if (link.includes('facebook')) { icono = '👥'; nombreRed = 'Facebook'; colorFondo = '#d1e4ff'; } 
                    else if (link.includes('twitter') || link.includes('x.com')) { icono = '🐦'; nombreRed = 'Twitter'; colorFondo = '#e0e0e0'; }
                    
                    const urlFinal = link.startsWith('http') ? link : 'https://' + link;
                    // Usamos una función segura para dar tiempo a Supabase a registrar la acumulación antes de abrir la red social
                    redesHTML += `<a href="#" onclick="event.preventDefault(); registrarEstadistica('red_${nombreRed.toLowerCase()}', '${nombreParaMostrar}').then(() => window.open('${urlFinal}', '_blank'));" style="display:block; background: ${colorFondo}; padding: 8px; text-align:center; font-size: 0.9em; color: ${VERDE_OSCURO}; text-decoration:none; border-radius: 8px; font-weight: bold; margin-bottom: 8px; border: 1px solid rgba(0,0,0,0.05); font-family: 'Montserrat', sans-serif;">${icono} ${nombreRed}</a>`;
                });
            }

            let websHTML = '';
            if (p['WEB ORRIA'] && p['WEB ORRIA'].trim() !== "") {
                websHTML = p['WEB ORRIA'].split(',').map(w => w.trim()).map(w => {
                    const webFinal = w.startsWith('http') ? w : 'https://' + w;
                    return `<a href="#" onclick="event.preventDefault(); registrarEstadistica('web_externa', '${nombreParaMostrar}').then(() => window.open('${webFinal}', '_blank'));" style="flex:1; background: #f0f0f0; padding: 10px; display: flex; align-items: center; justify-content: center; font-size: 0.9em; color: ${VERDE_OSCURO}; text-decoration:none; border-radius: 8px; font-weight: bold; font-family: 'Montserrat', sans-serif;">🌐 Web</a>`;
                }).join('');
            }

            let marker = L.marker([lat, lng], { 
                icon: L.icon({ iconUrl: './icons/baserria.png', iconSize: [32, 32] }),
                nombreUsti: normalizarTexto(nombreUstiategi),
                marcaUsti: normalizarTexto(marca),
                data: p
            });
            marker.on('click', () => {
                registrarEstadistica('clic_productor', nombreParaMostrar);
            });

            marker.addTo(capasEkoizleak).bindPopup(`
                <div class="popup-card" style="font-family: 'Montserrat', sans-serif; border: 2px solid ${VERDE_PASTEL}; padding: 0; border-radius: 15px; overflow: hidden; width: 280px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    ${imagenHTML}
                    <div style="background: ${VERDE_PASTEL}; padding: 15px; text-align: center;">
                        <h3 style="color: #2c5e2e; margin: 0; font-weight: 700; font-family: 'Montserrat', sans-serif;">${nombreParaMostrar}</h3>
                        ${(marcaFormateada && marcaFormateada.toLowerCase() !== nombreParaMostrar.toLowerCase()) ? `<p style="margin: 8px 0 0 0; font-size: 1.05em; color: #2c5e2e; font-weight: 800; border-top: 1px solid rgba(44,94,46,0.2); padding-top: 5px; font-family: 'Montserrat', sans-serif;">${marcaFormateada}</p>` : ''}
                        ${direccionMostrada ? `<p style="margin: 5px 0 0 0; font-size: 0.85em; color: #444; font-family: 'Montserrat', sans-serif;">${direccionMostrada}</p>` : ''}
                    </div>
                    <div style="padding: 15px;">
                        ${p.TELEFONOA ? `<a href="#" onclick="event.preventDefault(); registrarEstadistica('telefono', '${nombreParaMostrar}').then(() => window.location.href='tel:${p.TELEFONOA}');" style="display: block; background: #fff; border: 2px solid ${VERDE_OSCURO}; color: ${VERDE_OSCURO}; padding: 10px; border-radius: 25px; text-decoration: none; font-weight: 700; text-align: center; margin-bottom: 15px; font-family: 'Montserrat', sans-serif;">📞 ${p.TELEFONOA}</a>` : ''}
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            ${p['EMAIL'] ? `<a href="#" onclick="event.preventDefault(); registrarEstadistica('email', '${nombreParaMostrar}').then(() => window.location.href='mailto:${p['EMAIL']}');" style="flex:1; background: #f0f0f0; padding: 10px; text-align:center; font-size: 0.9em; color: ${VERDE_OSCURO}; text-decoration:none; border-radius: 8px; font-weight: bold; font-family: 'Montserrat', sans-serif;">📧 Mezua idatzi</a>` : ''}
                            ${websHTML}
                        </div>
                        ${redesHTML}
                        <div style="text-align: left; font-size: 0.9em;">
                            <div style="margin-top: 15px; margin-bottom: 10px;">
                                <p style="margin: 0 0 5px 0; color: ${VERDE_OSCURO}; font-weight: 900; font-size: 1.1em; text-transform: uppercase; font-family: 'Montserrat', sans-serif;">PRODUKTUAK</p>
                                <p style="margin: 0; color: #444; font-family: 'Montserrat', sans-serif;">${p['Produktuak'] || '-'}</p>
                            </div>
                            <div style="text-align: center; margin-bottom: 10px;">${sellosHTML}</div>
                            <hr style="margin: 10px 0; border: 0; border-top: 1px solid #ddd;">
                            <div style="margin-top: 10px; margin-bottom: 10px;">
                                <p style="margin: 0 0 5px 0; color: ${VERDE_OSCURO}; font-weight: 900; font-size: 1.1em; text-transform: uppercase; font-family: 'Montserrat', sans-serif;">SALMENTA</p>
                                <p style="margin: 0; color: #444; font-family: 'Montserrat', sans-serif;">${COL_SALMENTA.filter(s => p[s] === 'X').join(', ')}</p>
                            </div>
                        </div>
                    </div>
                </div>`);
        
            marker.addTo(capasEkoizleak).bindPopup(`
                <div class="popup-card" style="font-family: 'Montserrat', sans-serif; border: 2px solid ${VERDE_PASTEL}; padding: 0; border-radius: 15px; overflow: hidden; width: 280px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    ${imagenHTML}
                    <div style="background: ${VERDE_PASTEL}; padding: 15px; text-align: center;">
                        <h3 style="color: #2c5e2e; margin: 0; font-weight: 700; font-family: 'Montserrat', sans-serif;">${nombreParaMostrar}</h3>
                        ${(marcaFormateada && marcaFormateada.toLowerCase() !== nombreParaMostrar.toLowerCase()) ? `<p style="margin: 8px 0 0 0; font-size: 1.05em; color: #2c5e2e; font-weight: 800; border-top: 1px solid rgba(44,94,46,0.2); padding-top: 5px; font-family: 'Montserrat', sans-serif;">${marcaFormateada}</p>` : ''}
                        ${direccionMostrada ? `<p style="margin: 5px 0 0 0; font-size: 0.85em; color: #444; font-family: 'Montserrat', sans-serif;">${direccionMostrada}</p>` : ''}
                    </div>
                    <div style="padding: 15px;">
                        ${p.TELEFONOA ? `<a href="tel:${p.TELEFONOA}" style="display: block; background: #fff; border: 2px solid ${VERDE_OSCURO}; color: ${VERDE_OSCURO}; padding: 10px; border-radius: 25px; text-decoration: none; font-weight: 700; text-align: center; margin-bottom: 15px; font-family: 'Montserrat', sans-serif;">📞 ${p.TELEFONOA}</a>` : ''}
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            ${p['EMAIL'] ? `<a href="mailto:${p['EMAIL']}" style="flex:1; background: #f0f0f0; padding: 10px; text-align:center; font-size: 0.9em; color: ${VERDE_OSCURO}; text-decoration:none; border-radius: 8px; font-weight: bold; font-family: 'Montserrat', sans-serif;">📧 Mezua idatzi</a>` : ''}
                            ${websHTML}
                        </div>
                        ${redesHTML}
                        <div style="text-align: left; font-size: 0.9em;">
                            <div style="margin-top: 15px; margin-bottom: 10px;">
                                <p style="margin: 0 0 5px 0; color: ${VERDE_OSCURO}; font-weight: 900; font-size: 1.1em; text-transform: uppercase; font-family: 'Montserrat', sans-serif;">PRODUKTUAK</p>
                                <p style="margin: 0; color: #444; font-family: 'Montserrat', sans-serif;">${p['Produktuak'] || '-'}</p>
                            </div>
                            <div style="text-align: center; margin-bottom: 10px;">${sellosHTML}</div>
                            <hr style="margin: 10px 0; border: 0; border-top: 1px solid #ddd;">
                            <div style="margin-top: 10px; margin-bottom: 10px;">
                                <p style="margin: 0 0 5px 0; color: ${VERDE_OSCURO}; font-weight: 900; font-size: 1.1em; text-transform: uppercase; font-family: 'Montserrat', sans-serif;">SALMENTA</p>
                                <p style="margin: 0; color: #444; font-family: 'Montserrat', sans-serif;">${COL_SALMENTA.filter(s => p[s] === 'X').join(', ')}</p>
                            </div>
                        </div>
                    </div>
                </div>`);
        });

// ==========================================
// 2. SALMENTA PUNTUAK
// ==========================================
datosSalmenta.forEach(p => {
    const tipo = normalizarTexto(p.mota);
    const nombreSal = normalizarTexto(p.izena);
    const cumpleTexto = texto === "" || nombreSal.includes(texto);
    const cumpleFiltroMota = checksMotaSalmenta.length === 0 || checksMotaSalmenta.some(c => tipo.includes(c.value));

    const hayFiltrosExternosActivos = checksMotaAzoka.length > 0 || checksProducto.length > 0 || selEspecial.length > 0;
    const hayFiltroPropioActivo = checksMotaSalmenta.length > 0 || (texto !== "" && nombreSal.includes(texto));

    if (hayFiltrosExternosActivos && !hayFiltroPropioActivo) {
        return; 
    }

    if (cumpleTexto && cumpleFiltroMota && p['ycoord (º)']) {
        const lat = parseFloat(p['ycoord (º)']);
        const lng = parseFloat(p['xcoord (º)']);
        if (!isNaN(lat) && !isNaN(lng)) {
            bounds.extend([lat, lng]);
            marcadoresTotales++;
        }

        const colPrincipal = AZUL_PASTEL;
        const colTexto = AZUL_OSCURO;
        const colBotonFondo = '#fff';
        const colBotonWebGris = '#f0f0f0';

        // GESTIÓN DE IMAGEN (SALMENTA)
        const argazkiaSal = p.Argazkiak || p.argazkiak || p['ARGAZKIAK'] || '';
        let htmlImagenSal = "";
        if (argazkiaSal.trim() !== "") {
            htmlImagenSal = `<div style="width: 100%; max-height: 160px; overflow: hidden;">
                                <img src="img/${argazkiaSal.trim()}" alt="Argazkia" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                             </div>`;
        }

        let listaProductores = p.Ekoizleak ? p.Ekoizleak.split(',').map(n => {
            const nombreLimpio = n.trim();
            return `<li style="margin-bottom: 3px;"><a href="javascript:void(0);" onclick="abrirPopupEkoizle('${nombreLimpio.replace(/'/g, "\\'")}'); return false;" style="color: ${colTexto}; font-weight: 500; cursor: pointer; text-decoration: underline; font-family: 'Montserrat', sans-serif; display:inline-block;">${nombreLimpio}</a></li>`;
        }).join('') : '';

        const rawWeb = p.web || p.WEB || p['Web orria'] || p['WEB ORRIA'];
        const webURL = rawWeb ? (rawWeb.startsWith('http') ? rawWeb : 'https://' + rawWeb) : null;

        let redesSalmentaHTML = '';
        if (p['Sare sozialak'] && p['Sare sozialak'].trim() !== "") {
            p['Sare sozialak'].split(',').map(l => l.trim()).forEach(link => {
                let config = { icono: '📱', nombre: 'Sarea', fondo: '#f0f0f0' };
                if (link.includes('instagram')) config = { icono: '📸', nombre: 'Instagram', fondo: 'linear-gradient(135deg, #ffd1dc 0%, #ffe0b2 100%)' };
                else if (link.includes('facebook')) config = { icono: '👥', nombre: 'Facebook', fondo: '#d1e4ff' };
                else if (link.includes('twitter') || link.includes('x.com')) config = { icono: '🐦', nombre: 'Twitter', fondo: '#e0e0e0' };
                redesSalmentaHTML += `<a href="${link.startsWith('http') ? link : 'https://' + link}" target="_blank" style="display:block; background: ${config.fondo}; padding: 8px; text-align:center; font-size: 0.9em; color: ${colTexto}; text-decoration:none; border-radius: 8px; font-weight: bold; margin-bottom: 8px; border: 1px solid rgba(0,0,0,0.05); font-family: 'Montserrat', sans-serif;">${config.icono} ${config.nombre}</a>`;
            });
        }

        let markerSal = L.marker([lat, lng], { icon: iconoSalmenta, nombre: p.izena || "" });
        
        // REGISTRAR CLIC EN TIENDA
        markerSal.on('click', () => {
            registrarEstadistica('clic_salmenta', p.izena || 'Tienda sin nombre');
        });

        markerSal.addTo(capasSalmenta).bindPopup(`
            <div class="popup-card" style="font-family: 'Montserrat', sans-serif; border: 2px solid ${colPrincipal}; padding: 0; border-radius: 15px; overflow: hidden; width: 280px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                ${htmlImagenSal}
                <div style="background: ${colPrincipal}; padding: 15px; text-align: center;">
                    <h3 style="color: ${colTexto}; margin: 0; font-weight: 700; font-family: 'Montserrat', sans-serif;">${(p.izena || "").toUpperCase()}</h3>
                </div>
                <div style="padding: 15px;">
                    ${p.telefonoa ? `<a href="tel:${p.telefonoa}" style="display: block; background: ${colBotonFondo}; border: 2px solid ${colPrincipal}; color: ${colTexto}; padding: 10px; border-radius: 25px; text-decoration: none; font-weight: 700; text-align: center; margin-bottom: 10px; font-family: 'Montserrat', sans-serif;">📞 ${p.telefonoa}</a>` : ''}
                    <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" style="display: block; background: ${colBotonFondo}; color: ${colTexto}; padding: 8px; border-radius: 8px; text-decoration: none; font-weight: 700; text-align: center; margin-bottom: 10px; border: 1px solid ${colPrincipal}; font-family: 'Montserrat', sans-serif;">🚗 Nola iritsi</a>
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        ${p.emaila ? `<a href="mailto:${p.emaila}" style="flex:1; background: #f0f0f0; color: ${colTexto}; padding: 8px; border-radius: 8px; text-decoration: none; font-weight: 700; text-align: center; font-size: 0.9em; border: 1px solid ${colPrincipal}; font-family: 'Montserrat', sans-serif;">📧 Email</a>` : ''}
                        ${webURL ? `<a href="${webURL}" target="_blank" style="flex:1; background: ${colBotonWebGris}; color: ${colTexto}; padding: 8px; border-radius: 8px; text-decoration: none; font-weight: 700; text-align: center; font-size: 0.9em; border: 1px solid ${colPrincipal}; font-family: 'Montserrat', sans-serif;">🌐 Web</a>` : ''}
                    </div>
                    ${redesSalmentaHTML}
                    <div style="text-align: left; margin-top: 15px;">
                        <div style="margin-bottom: 15px;">
                            <p style="margin: 0 0 5px 0; color: ${colPrincipal}; font-weight: 900; font-size: 1.1em; text-transform: uppercase; font-family: 'Montserrat', sans-serif;">ORDUTEGIA</p>
                            <p style="margin: 0; font-size: 0.95em; color: #444; font-family: 'Montserrat', sans-serif;">${p.ordutegia ? p.ordutegia.replace(/\n/g, '<br>') : 'Zehaztu gabe'}</p>
                        </div>
                        <p style="margin: 0 0 5px 0; color: ${colPrincipal}; font-weight: 900; font-size: 1.1em; text-transform: uppercase; font-family: 'Montserrat', sans-serif;">EKOIZLEAK</p>
                        <ul style="padding-left: 0; margin: 0; list-style: none;">${listaProductores || '<li style="font-size: 0.95em; font-family: \'Montserrat\', sans-serif;">Ez dago ekoizlerik</li>'}</ul>
                    </div>
                </div>
            </div>`);
    }
});


// ==========================================
// 3. AZOKAK
// ==========================================
datosAzokak.forEach(p => {
    const tipo = normalizarTexto(p.mota);
    const nombreAzoka = normalizarTexto(p.izena);
    const cumpleTexto = texto === "" || nombreAzoka.includes(texto);
    const cumpleFiltroMota = checksMotaAzoka.length === 0 || checksMotaAzoka.some(c => tipo === c.value);

    const hayFiltrosExternosActivos = checksMotaSalmenta.length > 0 || checksProducto.length > 0 || selEspecial.length > 0;
    const hayFiltroPropioActivo = checksMotaAzoka.length > 0 || (texto !== "" && nombreAzoka.includes(texto));

    if (hayFiltrosExternosActivos && !hayFiltroPropioActivo) {
        return; 
    }

    if (cumpleTexto && cumpleFiltroMota && p['ycoord (º)']) {
        const lat = parseFloat(p['ycoord (º)']);
        const lng = parseFloat(p['xcoord (º)']);
        if (!isNaN(lat) && !isNaN(lng)) {
            bounds.extend([lat, lng]);
            marcadoresTotales++;
        }

        const colPrincipal = '#e9d5a1'; 
        const colTexto = '#5d4037';    
        const colBotonFondo = '#fffdf9'; 

        // GESTIÓN DE IMAGEN (AZOKAK)
        const argazkiaAzoka = p.Argazkiak || p.argazkiak || p['ARGAZKIAK'] || '';
        let htmlImagenAzoka = "";
        if (argazkiaAzoka.trim() !== "") {
            htmlImagenAzoka = `<div style="width: 100%; max-height: 160px; overflow: hidden;">
                                 <img src="img/${argazkiaAzoka.trim()}" alt="Argazkia" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                              </div>`;
        }

        let rawEkoizleak = p.Ekoizleak || p.ekoizleak || p['EKOIZLEAK'] || '';
        let listaProductores = rawEkoizleak ? rawEkoizleak.toString().split(',').map(n => {
            const nombreLimpio = n.trim();
            return `<li style="margin-bottom: 3px;"><a href="javascript:void(0);" onclick="abrirPopupEkoizle('${nombreLimpio.replace(/'/g, "\\'")}'); return false;" style="color: ${colTexto}; font-weight: 500; cursor: pointer; text-decoration: underline; font-family: 'Montserrat', sans-serif; display:inline-block;">${nombreLimpio}</a></li>`;
        }).join('') : '';

        const rawWeb = p.web || p.WEB || p['web orria'] || p['WEB ORRIA'];
        const webURL = rawWeb ? (rawWeb.startsWith('http') ? rawWeb : 'https://' + rawWeb) : null;

        let markerAzoka = L.marker([lat, lng], { icon: iconoAzoka, nombre: p.izena || "" });
        
        // REGISTRAR CLIC EN AZOKA
        markerAzoka.on('click', () => {
            registrarEstadistica('clic_azoka', p.izena || 'Azoka');
        });

        markerAzoka.addTo(capasAzokak).bindPopup(`
            <div class="popup-card" style="font-family: 'Montserrat', sans-serif; border: 2px solid ${colPrincipal}; padding: 0; border-radius: 15px; overflow: hidden; width: 280px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                ${htmlImagenAzoka}
                <div style="background: ${colPrincipal}; padding: 15px; text-align: center;">
                    <h3 style="color: ${colTexto}; margin: 0; font-weight: 700; font-family: 'Montserrat', sans-serif;">${(p.izena || "").toUpperCase()}</h3>
                </div>
                <div style="padding: 15px;">
                    <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" style="display: block; background: ${colBotonFondo}; color: ${colTexto}; padding: 8px; border-radius: 8px; text-decoration: none; font-weight: 700; text-align: center; margin-bottom: 10px; border: 1px solid ${colPrincipal}; font-family: 'Montserrat', sans-serif;">🚗 Nola iritsi</a>
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        ${p.emaila ? `<a href="mailto:${p.emaila}" style="flex:1; background: #f0f0f0; color: ${colTexto}; padding: 8px; border-radius: 8px; text-decoration: none; font-weight: 700; text-align: center; font-size: 0.9em; border: 1px solid ${colPrincipal}; font-family: 'Montserrat', sans-serif;">📧 Email</a>` : ''}
                        ${webURL ? `<a href="${webURL}" target="_blank" style="flex:1; background: #f0f0f0; color: ${colTexto}; padding: 8px; border-radius: 8px; text-decoration: none; font-weight: 700; text-align: center; font-size: 0.9em; border: 1px solid ${colPrincipal}; font-family: 'Montserrat', sans-serif;">🌐 Web</a>` : ''}
                    </div>
                    <div style="text-align: left; margin-top: 15px;">
                        <div style="margin-bottom: 15px;">
                            <p style="margin: 0 0 5px 0; color: ${colPrincipal}; font-weight: 900; font-size: 1.1em; text-transform: uppercase; font-family: 'Montserrat', sans-serif;">ORDUTEGIA</p>
                            <p style="margin: 0; font-size: 0.95em; color: #444; font-family: 'Montserrat', sans-serif;">${p.ordutegia || 'Zehaztu gabe'}</p>
                        </div>
                        <p style="margin: 0 0 5px 0; color: ${colPrincipal}; font-weight: 900; font-size: 1.1em; text-transform: uppercase; font-family: 'Montserrat', sans-serif;">EKOIZLEAK</p>
                        <ul style="padding-left: 0; margin: 0; list-style: none;">${listaProductores || '<li style="font-size: 0.95em; font-family: \'Montserrat\', sans-serif;">Ez dago ekoizlerik</li>'}</ul>
                    </div>
                </div>
            </div>`);
        
        markerAzoka.addTo(capasAzokak).bindPopup(`
            <div class="popup-card" style="font-family: 'Montserrat', sans-serif; border: 2px solid ${colPrincipal}; padding: 0; border-radius: 15px; overflow: hidden; width: 280px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                ${htmlImagenAzoka}
                <div style="background: ${colPrincipal}; padding: 15px; text-align: center;">
                    <h3 style="color: ${colTexto}; margin: 0; font-weight: 700; font-family: 'Montserrat', sans-serif;">${(p.izena || "").toUpperCase()}</h3>
                </div>
                <div style="padding: 15px;">
                    <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" style="display: block; background: ${colBotonFondo}; color: ${colTexto}; padding: 8px; border-radius: 8px; text-decoration: none; font-weight: 700; text-align: center; margin-bottom: 10px; border: 1px solid ${colPrincipal}; font-family: 'Montserrat', sans-serif;">🚗 Nola iritsi</a>
                    <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                        ${p.emaila ? `<a href="mailto:${p.emaila}" style="flex:1; background: #f0f0f0; color: ${colTexto}; padding: 8px; border-radius: 8px; text-decoration: none; font-weight: 700; text-align: center; font-size: 0.9em; border: 1px solid ${colPrincipal}; font-family: 'Montserrat', sans-serif;">📧 Email</a>` : ''}
                        ${webURL ? `<a href="${webURL}" target="_blank" style="flex:1; background: #f0f0f0; color: ${colTexto}; padding: 8px; border-radius: 8px; text-decoration: none; font-weight: 700; text-align: center; font-size: 0.9em; border: 1px solid ${colPrincipal}; font-family: 'Montserrat', sans-serif;">🌐 Web</a>` : ''}
                    </div>
                    <div style="text-align: left; margin-top: 15px;">
                        <div style="margin-bottom: 15px;">
                            <p style="margin: 0 0 5px 0; color: ${colPrincipal}; font-weight: 900; font-size: 1.1em; text-transform: uppercase; font-family: 'Montserrat', sans-serif;">ORDUTEGIA</p>
                            <p style="margin: 0; font-size: 0.95em; color: #444; font-family: 'Montserrat', sans-serif;">${p.ordutegia || 'Zehaztu gabe'}</p>
                        </div>
                        <p style="margin: 0 0 5px 0; color: ${colPrincipal}; font-weight: 900; font-size: 1.1em; text-transform: uppercase; font-family: 'Montserrat', sans-serif;">EKOIZLEAK</p>
                        <ul style="padding-left: 0; margin: 0; list-style: none;">${listaProductores || '<li style="font-size: 0.95em; font-family: \'Montserrat\', sans-serif;">Ez dago ekoizlerik</li>'}</ul>
                    </div>
                </div>
            </div>`);
    }
});

        // 4. ZERBITZUAK
        datosZerbitzuak.forEach(p => {
            const m = p.mota || p.MOTA || "";
            const tipoDato = normalizarTexto(m);
            const valoresSeleccionados = checksMotaZerbitzuak.map(c => normalizarTexto(c.value));
            const cumpleFiltro = valoresSeleccionados.length === 0 || valoresSeleccionados.includes(tipoDato);

            const izena = p.IZENA || p.izena || "SIN NOMBRE";
            const nombreServ = normalizarTexto(izena);
            const cumpleTexto = texto === "" || nombreServ.includes(texto);

            const telefonoa = p.TELEFONOA || p.telefonoa || p.Telefonoa;
            const emaila = p.EMAILA || p.emaila || p.Emaila;
            const infoTemporal = p.data || p.DATA || p.ordutegia || p.ORDUTEGIA || 'Zehaztu gabe';
            const tituloTemporal = (p.data || p.DATA) ? "DATA" : "ORDUTEGIA";
            const sare = p['SARE SOZIALAK'] || p['Sare sozialak'] || p['sare sozialak'];
            const helbidea = p.helbidea || p.HELBIDEA || p.Helbidea || "";
            const udalerri = p.udalerri || p.UDALERRIA || p.Udalerri || "";
            const infoUbicacion = helbidea.trim() !== "" ? helbidea : udalerri;

            if (cumpleTexto && cumpleFiltro && p['ycoord (º)']) {
                const lat = parseFloat(p['ycoord (º)']);
                const lng = parseFloat(p['xcoord (º)']);
                if (!isNaN(lat) && !isNaN(lng)) {
                    bounds.extend([lat, lng]);
                    marcadoresTotales++;
                }

                const colPrincipal = '#616161';    
                const colTexto = '#212121';        
                const colBoton = '#eeeeee';

                const rawWeb = p.WEB || p.web || p['WEB ORRIA'] || p['web orria'];
                const webURL = rawWeb ? (rawWeb.toString().startsWith('http') ? rawWeb : 'https://' + rawWeb) : null;

                let redesSalmentaHTML = '';
                if (sare && sare.trim() !== "") {
                    sare.split(',').map(l => l.trim()).forEach(link => {
                        let config = { icono: '📱', nombre: 'Sarea', fondo: '#f0f0f0' };
                        if (link.includes('instagram')) config = { icono: '📸', nombre: 'Instagram', fondo: 'linear-gradient(135deg, #ffd1dc 0%, #ffe0b2 100%)' };
                        else if (link.includes('facebook')) config = { icono: '👥', nombre: 'Facebook', fondo: '#d1e4ff' };
                        else if (link.includes('twitter') || link.includes('x.com')) config = { icono: '🐦', nombre: 'Twitter', fondo: '#e0e0e0' };
                        
                        redesSalmentaHTML += `
                            <a href="${link.startsWith('http') ? link : 'https://' + link}" target="_blank" 
                               style="display:block; background: ${config.fondo}; padding: 8px; text-align:center; font-size: 0.9em; color: ${colTexto}; text-decoration:none; border-radius: 8px; font-weight: bold; margin-bottom: 8px; border: 1px solid ${colPrincipal}; font-family: 'Montserrat', sans-serif;">
                               ${config.icono} ${config.nombre}
                            </a>`;
                    });
                }
                
                let markerServ = L.marker([lat, lng], { icon: iconoZerbitzuak, nombre: izena || "" });
                markerServ.addTo(capasZerbitzuak).bindPopup(`
                    <div class="popup-card" style="font-family: 'Montserrat', sans-serif; border: 2px solid ${colPrincipal}; padding: 0; border-radius: 15px; overflow: hidden; width: 280px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <div style="background: ${colPrincipal}; padding: 15px; text-align: center;">
                            <h3 style="color: white; margin: 0; font-weight: 700; font-family: 'Montserrat', sans-serif;">${izena.toString().toUpperCase()}</h3>
                            <p style="color: #eee; margin: 5px 0 0 0; font-size: 0.85em; font-weight: 400; font-family: 'Montserrat', sans-serif;">${infoUbicacion}</p>
                        </div>
                        <div style="padding: 15px;">
                            ${telefonoa ? `<a href="tel:${telefonoa}" style="display: block; background: #fff; border: 2px solid ${colPrincipal}; color: ${colTexto}; padding: 10px; border-radius: 25px; text-decoration: none; font-weight: 700; text-align: center; margin-bottom: 10px; font-family: 'Montserrat', sans-serif;">📞 ${telefonoa}</a>` : ''}
                            <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" style="display: block; background: ${colBoton}; color: ${colTexto}; padding: 8px; border-radius: 8px; text-decoration: none; font-weight: 700; text-align: center; margin-bottom: 10px; font-size: 0.9em; border: 1px solid ${colPrincipal}; font-family: 'Montserrat', sans-serif;">🚗 Nola iritsi</a>
                            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                                ${emaila ? `<a href="mailto:${emaila}" style="flex:1; background: #f0f0f0; color: ${colTexto}; padding: 8px; border-radius: 8px; text-decoration: none; font-weight: 700; text-align: center; font-size: 0.9em; border: 1px solid ${colPrincipal}; font-family: 'Montserrat', sans-serif;">📧 Email</a>` : ''}
                                ${webURL ? `<a href="${webURL}" target="_blank" style="flex:1; background: #f0f0f0; color: ${colTexto}; padding: 8px; border-radius: 8px; text-decoration: none; font-weight: 700; text-align: center; font-size: 0.9em; border: 1px solid ${colPrincipal}; font-family: 'Montserrat', sans-serif;">🌐 Web</a>` : ''}
                            </div>
                            ${redesSalmentaHTML}
                            <div style="text-align: left; margin-top: 15px;">
                                <p style="margin: 0 0 5px 0; color: ${colPrincipal}; font-weight: 900; font-size: 1.1em; text-transform: uppercase; font-family: 'Montserrat', sans-serif;">${tituloTemporal}</p>
                                <p style="margin: 0; font-size: 0.95em; color: ${colTexto}; font-weight: 400; font-family: 'Montserrat', sans-serif;">${infoTemporal.toString().replace(/\n/g, '<br>')}</p>
                            </div>
                        </div>
                    </div>`);
            }
        });

    // Evento para el botón de geolocalización
    let marcadorUsuario = null;
    const btnGeolocalizar = document.getElementById('btn-geolocalizar');
    if (btnGeolocalizar) {
        btnGeolocalizar.addEventListener('click', () => {
            if (!navigator.geolocation) {
                alert('Zure nabigatzaileak ez du geolokalizazioa onartzen.');
                return;
            }

            btnGeolocalizar.textContent = '⏳ Kokapena bilatzen...';

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const precision = position.coords.accuracy;

                    btnGeolocalizar.textContent = '📍 Nire kokapena';

                    if (marcadorUsuario) {
                        mapa.removeLayer(marcadorUsuario);
                    }

                    marcadorUsuario = L.layerGroup();

                    const circuloPrecision = L.circle([lat, lng], {
                        radius: precision,
                        color: '#1a5276',
                        fillColor: '#a9cce3',
                        fillOpacity: 0.4,
                        weight: 1
                    });

                    const puntoUsuario = L.marker([lat, lng], {
                        icon: L.divIcon({
                            className: 'user-geo-marker',
                            html: '<div style="background-color: #1a5276; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
                            iconSize: [14, 14],
                            iconAnchor: [7, 7]
                        })
                    }).bindPopup('<b>Hemen ou zaude</b>');

                    marcadorUsuario.addLayer(circuloPrecision);
                    marcadorUsuario.addLayer(puntoUsuario);
                    marcadorUsuario.addTo(mapa);

                    mapa.setView([lat, lng], 15);
                },
                (error) => {
                    btnGeolocalizar.textContent = '📍 Nire kokapena';
                    console.error(error);
                    alert('Ezin izan da zure kokapena lortu.');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }
        // ==========================================
        // CONTROL DEFINITIVO DE VISIBILIDAD DE CAPAS
        // ==========================================
        
        const hayFiltroSalmenta = checksMotaSalmenta.length > 0;
        const hayFiltroAzoka = checksMotaAzoka.length > 0;
        const hayFiltroZerbitzu = checksMotaZerbitzuak.length > 0;
        const hayFiltroProducto = checksProducto.length > 0 || texto.trim() !== "";

        // 1. Capa de Salmenta Puntuak (Tiendas/Carritos)
        if (hayFiltroSalmenta) {
            if (!mapa.hasLayer(capasSalmenta)) capasSalmenta.addTo(mapa);
        } else {
            if (mapa.hasLayer(capasSalmenta)) mapa.removeLayer(capasSalmenta);
        }

        // 2. Capa de Azokak
        if (hayFiltroAzoka) {
            if (!mapa.hasLayer(capasAzokak)) capasAzokak.addTo(mapa);
        } else {
            if (mapa.hasLayer(capasAzokak)) mapa.removeLayer(capasAzokak);
        }

        // 3. Capa de Zerbitzuak
        if (hayFiltroZerbitzu) {
            if (!mapa.hasLayer(capasZerbitzuak)) capasZerbitzuak.addTo(mapa);
        } else {
            if (mapa.hasLayer(capasZerbitzuak)) mapa.removeLayer(capasZerbitzuak);
        }

        // 4. Capa de Ekoizleak (Caseríos)
        // Definimos la variable si no existe para evitar el error
        const ekoizleakPermitidos = window.ekoizleakPermitidos || new Set();
        
        const mostrarEkoizleakPorTienda = hayFiltroSalmenta && ekoizleakPermitidos.size > 0;
        const mostrarEkoizleakPorProducto = !hayFiltroSalmenta && !hayFiltroAzoka && !hayFiltroZerbitzu;

        if (mostrarEkoizleakPorProducto || mostrarEkoizleakPorTienda || (hayFiltroProducto && !hayFiltroAzoka && !hayFiltroZerbitzu)) {
            if (!mapa.hasLayer(capasEkoizleak)) capasEkoizleak.addTo(mapa);
        } else {
            if (mapa.hasLayer(capasEkoizleak)) mapa.removeLayer(capasEkoizleak);
        }

        comprobarFiltrosActivos();

        // AJUSTE DE ZOOM INTELIGENTE Y APERTURA DE POPUP AUTOMÁTICA
        if (ajustarZoom) {
            if (texto !== "" && marcadoresTotales > 0) {
                if (elementoBuscadoEspecifico) {
                    mapa.flyTo([elementoBuscadoEspecifico.lat, elementoBuscadoEspecifico.lng], 16, {
                        duration: 1.5,
                        easeLinearity: 0.25
                    });
                    
                    setTimeout(() => {
                        let encontradoPopup = false;
                        const buscarEnCapa = (capaGrupo) => {
                            if (encontradoPopup) return;
                            capaGrupo.eachLayer(layer => {
                                const nombreLayer = normalizarTexto(layer.options.nombre || "");
                                if (nombreLayer === texto || nombreLayer.includes(texto)) {
                                    if (!mapa.hasLayer(capaGrupo)) capaGrupo.addTo(mapa);
                                    layer.openPopup();
                                    encontradoPopup = true;
                                }
                            });
                        };
                        buscarEnCapa(capasEkoizleak);
                        buscarEnCapa(capasSalmenta);
                        buscarEnCapa(capasAzokak);
                        buscarEnCapa(capasZerbitzuak);
                    }, 800);

                } else if (bounds.isValid()) {
                    mapa.flyToBounds(bounds, {
                        padding: [50, 50],
                        maxZoom: 16,
                        duration: 1.5,
                        easeLinearity: 0.25
                    });
                }
            } else if (texto === "") {
                mapa.flyTo([43.05, -2.25], 12, {
                    duration: 1.5,
                    easeLinearity: 0.25
                });
            }
        }
    };

    window.abrirPopupEkoizle = function(nombreEkoizle) {
        if (!nombreEkoizle) return;
        const nombreClicado = normalizarTexto(nombreEkoizle);
        mapa.closePopup();

        let match = datos.find(p => {
            const u = normalizarTexto(p.USTIATEGIAREN_IZENA);
            const m = normalizarTexto(p['SALMENTA MARKA']);
            return u === nombreClicado || m === nombreClicado;
        });

        if (!match) {
            match = datos.find(p => {
                const u = normalizarTexto(p.USTIATEGIAREN_IZENA);
                const m = normalizarTexto(p['SALMENTA MARKA']);
                return (u && (u.includes(nombreClicado) || nombreClicado.includes(u))) ||
                       (m && (m.includes(nombreClicado) || nombreClicado.includes(m)));
            });
        }

        if (!match) {
            const palabrasClave = nombreClicado.split(' ').filter(w => w.length > 2);
            if (palabrasClave.length > 0) {
                match = datos.find(p => {
                    const u = normalizarTexto(p.USTIATEGIAREN_IZENA);
                    const m = normalizarTexto(p['SALMENTA MARKA']);
                    return palabrasClave.some(palabra => (u && u.includes(palabra)) || (m && m.includes(palabra)));
                });
            }
        }

        if (match && match['ycoord (º)'] && match['xcoord (º)']) {
            const lat = parseFloat(match['ycoord (º)']);
            const lng = parseFloat(match['xcoord (º)']);

            if (!isNaN(lat) && !isNaN(lng)) {
                // LIMPIEZA DE CAPAS: Ocultamos las demás para que no emborronen el mapa
                if (typeof capasSalmenta !== 'undefined' && mapa.hasLayer(capasSalmenta)) mapa.removeLayer(capasSalmenta);
                if (typeof capasAzokak !== 'undefined' && mapa.hasLayer(capasAzokak)) mapa.removeLayer(capasAzokak);
                if (typeof capasZerbitzuak !== 'undefined' && mapa.hasLayer(capasZerbitzuak)) mapa.removeLayer(capasZerbitzuak);

                // Aseguramos que solo esté visible la de productores
                if (typeof capasEkoizleak !== 'undefined' && !mapa.hasLayer(capasEkoizleak)) {
                    capasEkoizleak.addTo(mapa);
                }

                mapa.setView([lat, lng], 16);

                setTimeout(() => {
                    let encontradoLayer = false;
                    capasEkoizleak.eachLayer(layer => {
                        if (encontradoLayer) return;
                        
                        const latLayer = layer.getLatLng ? layer.getLatLng().lat : null;
                        const lngLayer = layer.getLatLng ? layer.getLatLng().lng : null;

                        const coincideCoordenadas = latLayer && lngLayer && 
                            Math.abs(latLayer - lat) < 0.00001 && 
                            Math.abs(lngLayer - lng) < 0.00001;

                        if (coincideCoordenadas) {
                            if (typeof layer.openPopup === 'function') {
                                layer.openPopup();
                            } else {
                                layer.fire('click');
                            }
                            encontradoLayer = true;
                        }
                    });

                    if (!encontradoLayer) {
                        const markerTemporal = L.marker([lat, lng], { 
                            icon: L.icon({ iconUrl: './icons/baserria.png', iconSize: [32, 32] })
                        });
                        
                        const capitalizar = (t) => t ? t.trim().toLowerCase().charAt(0).toUpperCase() + t.trim().toLowerCase().slice(1) : "";
                        const nombreFoto = match.ARGAZKIA ? match.ARGAZKIA.trim() : "";
                        const direccionMostrada = (match.HELBIDEA && match.HELBIDEA.trim() !== "") ? match.HELBIDEA : (match.UDALERRIA ? capitalizar(match.UDALERRIA) : "");
                        const imagenHTML = nombreFoto !== "" ? `<img src="img/${nombreFoto}" style="width: 100%; height: 150px; object-fit: contain; background-color: #f8f8f8; display: block;" alt="${match.USTIATEGIAREN_IZENA}">` : '';

                        let sellosHTML = COL_SELLOS.filter(s => match[s] === 'X').map(s => 
                            `<span style="background:#fff9c4; color:#b8860b; padding:2px 8px; border-radius:10px; font-size:0.75em; border:1px solid #f1c40f; margin:2px; display:inline-block; font-weight:bold; font-family: 'Montserrat', sans-serif;">${s}</span>`
                        ).join('');

                        let redesHTML = '';
                        if (match['SARE SOZIALAK'] && match['SARE SOZIALAK'].trim() !== "") {
                            match['SARE SOZIALAK'].split(',').map(l => l.trim()).forEach(link => {
                                let icono = '📱'; let nombreRed = 'Sarea'; let colorFondo = '#f0f0f0';
                                if (link.includes('instagram')) { icono = '📸'; nombreRed = 'Instagram'; colorFondo = 'linear-gradient(135deg, #ffd1dc 0%, #ffe0b2 100%)'; } 
                                else if (link.includes('facebook')) { icono = '👥'; nombreRed = 'Facebook'; colorFondo = '#d1e4ff'; } 
                                else if (link.includes('twitter') || link.includes('x.com')) { icono = '🐦'; nombreRed = 'Twitter'; colorFondo = '#e0e0e0'; }
                                redesHTML += `<a href="${link.startsWith('http') ? link : 'https://' + link}" target="_blank" style="display:block; background: ${colorFondo}; padding: 8px; text-align:center; font-size: 0.9em; color: ${VERDE_OSCURO}; text-decoration:none; border-radius: 8px; font-weight: bold; margin-bottom: 8px; border: 1px solid rgba(0,0,0,0.05); font-family: 'Montserrat', sans-serif;">${icono} ${nombreRed}</a>`;
                            });
                        }

                        let websHTML = '';
                        if (match['WEB ORRIA'] && match['WEB ORRIA'].trim() !== "") {
                            websHTML = match['WEB ORRIA'].split(',').map(w => w.trim()).map(w => `<a href="${w.startsWith('http') ? w : 'https://' + w}" target="_blank" style="flex:1; background: #f0f0f0; padding: 10px; display: flex; align-items: center; justify-content: center; font-size: 0.9em; color: ${VERDE_OSCURO}; text-decoration:none; border-radius: 8px; font-weight: bold; font-family: 'Montserrat', sans-serif;">🌐 Web</a>`).join('');
                        }

                        let marca = (match['SALMENTA MARKA'] && match['SALMENTA MARKA'].trim() !== "") ? match['SALMENTA MARKA'].trim() : "";
                        let nombreUstiategi = (match.USTIATEGIAREN_IZENA && match.USTIATEGIAREN_IZENA.trim() !== "") ? match.USTIATEGIAREN_IZENA.trim() : "Sin nombre";
                        let nombreParaMostrar = nombreUstiategi !== "Sin nombre" ? nombreUstiategi : marca;
                        let marcaFormateada = marca ? (marca.charAt(0).toUpperCase() + marca.slice(1).toLowerCase()) : null;

                        markerTemporal.bindPopup(`
                            <div class="popup-card" style="font-family: 'Montserrat', sans-serif; border: 2px solid ${VERDE_PASTEL}; padding: 0; border-radius: 15px; overflow: hidden; width: 280px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                                ${imagenHTML}
                                <div style="background: ${VERDE_PASTEL}; padding: 15px; text-align: center;">
                                    <h3 style="color: #2c5e2e; margin: 0; font-weight: 700; font-family: 'Montserrat', sans-serif;">${nombreParaMostrar}</h3>
                                    ${(marcaFormateada && marcaFormateada.toLowerCase() !== nombreParaMostrar.toLowerCase()) ? `<p style="margin: 8px 0 0 0; font-size: 1.05em; color: #2c5e2e; font-weight: 800; border-top: 1px solid rgba(44,94,46,0.2); padding-top: 5px; font-family: 'Montserrat', sans-serif;">${marcaFormateada}</p>` : ''}
                                    ${direccionMostrada ? `<p style="margin: 5px 0 0 0; font-size: 0.85em; color: #444; font-family: 'Montserrat', sans-serif;">${direccionMostrada}</p>` : ''}
                                </div>
                                <div style="padding: 15px;">
                                    ${match.TELEFONOA ? `<a href="tel:${match.TELEFONOA}" style="display: block; background: #fff; border: 2px solid ${VERDE_OSCURO}; color: ${VERDE_OSCURO}; padding: 10px; border-radius: 25px; text-decoration: none; font-weight: 700; text-align: center; margin-bottom: 15px; font-family: 'Montserrat', sans-serif;">📞 ${match.TELEFONOA}</a>` : ''}
                                    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                                        ${match['EMAIL'] ? `<a href="mailto:${match['EMAIL']}" style="flex:1; background: #f0f0f0; padding: 10px; text-align:center; font-size: 0.9em; color: ${VERDE_OSCURO}; text-decoration:none; border-radius: 8px; font-weight: bold; font-family: 'Montserrat', sans-serif;">📧 Mezua idatzi</a>` : ''}
                                        ${websHTML}
                                    </div>
                                    ${redesHTML}
                                    <div style="text-align: left; font-size: 0.9em;">
                                        <div style="margin-top: 15px; margin-bottom: 10px;">
                                            <p style="margin: 0 0 5px 0; color: ${VERDE_OSCURO}; font-weight: 900; font-size: 1.1em; text-transform: uppercase; font-family: 'Montserrat', sans-serif;">PRODUKTUAK</p>
                                            <p style="margin: 0; color: #444; font-family: 'Montserrat', sans-serif;">${match['Produktuak'] || '-'}</p>
                                        </div>
                                        <div style="text-align: center; margin-bottom: 10px;">${sellosHTML}</div>
                                        <hr style="margin: 10px 0; border: 0; border-top: 1px solid #ddd;">
                                        <div style="margin-top: 10px; margin-bottom: 10px;">
                                            <p style="margin: 0 0 5px 0; color: ${VERDE_OSCURO}; font-weight: 900; font-size: 1.1em; text-transform: uppercase; font-family: 'Montserrat', sans-serif;">SALMENTA</p>
                                            <p style="margin: 0; color: #444; font-family: 'Montserrat', sans-serif;">${COL_SALMENTA.filter(s => match[s] === 'X').join(', ')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>`);

                        markerTemporal.addTo(mapa).openPopup();
                    }
                }, 200);
            }
        }
    };
// Función auxiliar para capitalizar (Primera letra en mayúscula, resto minúsculas)
function capitalizarTexto(texto) {
    if (!texto) return "";
    return texto.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
}

// 1. Reemplazar el buscador para limpiar cualquier rastro anterior
const buscadorAntiguo = document.getElementById('buscador');
if (buscadorAntiguo) {
    const buscador = buscadorAntiguo.cloneNode(true);
    buscadorAntiguo.parentNode.replaceChild(buscador, buscadorAntiguo);

    // Actualizar sugerencias mientras se escribe
    buscador.addEventListener('input', (e) => {
        const valorBruto = e.target.value;
        if (typeof actualizarSugerencias === 'function') {
            actualizarSugerencias(valorBruto);
        }

        if (valorBruto.trim() === "" && typeof window.renderizar === 'function') {
            if (typeof texto !== 'undefined') texto = "";
            if (typeof capasEkoizleak !== 'undefined' && !mapa.hasLayer(capasEkoizleak)) capasEkoizleak.addTo(mapa);
            if (typeof capasSalmenta !== 'undefined' && mapa.hasLayer(capasSalmenta)) mapa.removeLayer(capasSalmenta);
            if (typeof capasAzokak !== 'undefined' && mapa.hasLayer(capasAzokak)) mapa.removeLayer(capasAzokak);
            if (typeof capasZerbitzuak !== 'undefined' && mapa.hasLayer(capasZerbitzuak)) mapa.removeLayer(capasZerbitzuak);
            window.renderizar(true);
        }
    });

    // BÚSQUEDA EXACTA AL SELECCIONAR O CAMBIAR EL VALOR (INCLUYENDO MARCA)
    buscador.addEventListener('change', (e) => {
        const valorBruto = e.target.value;
        if (!valorBruto || valorBruto.trim() === "") return;

        let nombreBusqueda = valorBruto;
        let puebloBusqueda = "";

        if (valorBruto.includes('(')) {
            const partes = valorBruto.split('(');
            nombreBusqueda = partes[0].trim();
            if (partes[1]) {
                puebloBusqueda = partes[1].replace(')', '').trim();
            }
        }

        const nombreNormalizado = normalizarTexto(nombreBusqueda);
        const puebloNormalizado = puebloBusqueda ? normalizarTexto(puebloBusqueda) : "";

        let matchEncontrado = null;
        let tipoDatoEncontrado = null;

        const datasets = [
            { data: typeof datos !== 'undefined' ? datos : [], tipo: 'ekoizle' },
            { data: typeof datosSalmenta !== 'undefined' ? datosSalmenta : [], tipo: 'salmenta' },
            { data: typeof datosAzokak !== 'undefined' ? datosAzokak : [], tipo: 'azoka' }
        ];

        // Buscar coincidencia exacta por NOMBRE o por MARCA, y opcionalmente por municipio
        for (const ds of datasets) {
            matchEncontrado = ds.data.find(p => {
                const nom = normalizarTexto(p.USTIATEGIAREN_IZENA || p.izena || '');
                const marka = normalizarTexto(p['SALMENTA MARKA'] || '');
                const pue = normalizarTexto(
                    p.udalerria || p.Udalerria || p.UDALERRIA || 
                    p.herria || p.Herria || p.HERRIA || 
                    p.pueblo || p.Pueblo || p.PUEBLO || 
                    p.herri || p.HERRI || ''
                );
                
                // Comprobamos si coincide con el nombre o con la marca
                const coincideNombreOMarka = (nom === nombreNormalizado || marka === nombreNormalizado);
                if (!coincideNombreOMarka) return false;

                if (puebloNormalizado !== "") {
                    return pue === puebloNormalizado;
                }
                return true;
            });

            if (matchEncontrado) {
                tipoDatoEncontrado = ds.tipo;
                break;
            }
        }

        if (!matchEncontrado) return;

        const lat = parseFloat(matchEncontrado['ycoord (º)'] || matchEncontrado.lat);
        const lng = parseFloat(matchEncontrado['xcoord (º)'] || matchEncontrado.lng);

        if (!isNaN(lat) && !isNaN(lng) && typeof mapa !== 'undefined') {
            if (typeof texto !== 'undefined') texto = "___BLOQUEADO___";

            mapa.setView([lat, lng], 16);

            // Limpieza absoluta de capas en el mapa
            if (typeof capasEkoizleak !== 'undefined' && mapa.hasLayer(capasEkoizleak)) mapa.removeLayer(capasEkoizleak);
            if (typeof capasSalmenta !== 'undefined' && mapa.hasLayer(capasSalmenta)) mapa.removeLayer(capasSalmenta);
            if (typeof capasAzokak !== 'undefined' && mapa.hasLayer(capasAzokak)) mapa.removeLayer(capasAzokak);
            if (typeof capasZerbitzuak !== 'undefined' && mapa.hasLayer(capasZerbitzuak)) mapa.removeLayer(capasZerbitzuak);

            let grupoCorrecto = null;
            if (tipoDatoEncontrado === 'ekoizle') grupoCorrecto = capasEkoizleak;
            else if (tipoDatoEncontrado === 'salmenta') grupoCorrecto = capasSalmenta;
            else if (tipoDatoEncontrado === 'azoka') grupoCorrecto = capasAzokak;

            if (grupoCorrecto) {
                grupoCorrecto.addTo(mapa);
                
                setTimeout(() => {
                    let encontradoLayer = false;
                    grupoCorrecto.eachLayer(layer => {
                        if (encontradoLayer) return;

                        const latLayer = layer.getLatLng ? layer.getLatLng().lat : null;
                        const lngLayer = layer.getLatLng ? layer.getLatLng().lng : null;

                        const coincideCoordenadas = latLayer && lngLayer && 
                            Math.abs(latLayer - lat) < 0.00001 && 
                            Math.abs(lngLayer - lng) < 0.00001;

                        if (coincideCoordenadas) {
                            if (typeof layer.openPopup === 'function') {
                                layer.openPopup();
                            } else {
                                layer.fire('click');
                            }
                            encontradoLayer = true;
                        }
                    });
                }, 250);
            }
        }
    });
}

const btnResetFiltros = document.getElementById('btn-reset-filtros');
if (btnResetFiltros) {
    btnResetFiltros.addEventListener('click', () => {
        ui.querySelectorAll('input[type="checkbox"]').forEach(chk => chk.checked = false);
        if (buscador) buscador.value = '';
        actualizarSugerencias('');
        window.renderizar(true);
    });
}
// Asegurar que cualquier cambio en los checkboxes de la izquierda ejecute el renderizado
// Asegurar que cualquier cambio en los checkboxes de la izquierda ejecute el renderizado y guarde estadística
ui.addEventListener('change', (e) => {
    if (e.target.matches('input[type="checkbox"]') && e.target.id !== 'btn-reset-filtros') {
        if (typeof window.renderizar === 'function') {
            window.renderizar(false);
        }
        
        // Registrar estadística si se acaba de marcar
        if (e.target.checked) {
            let nombreFiltro = e.target.parentElement.textContent.trim();
            registrarEstadistica('filtro_marcado', nombreFiltro);
        }
    }
});

if (typeof window.renderizar === 'function') {
    window.renderizar(false);
}

function actualizarSugerencias(valor) {
    const datalist = document.getElementById('sugerencias-nombres');
    if (!datalist) return;
    
    datalist.innerHTML = ''; 
    
    const textoFiltro = normalizarTexto(valor);
    if (textoFiltro.length === 0) return;

    const sugerenciasSet = new Set();

    if (typeof datos !== 'undefined') {
        datos.forEach(p => {
            const nombre = p.USTIATEGIAREN_IZENA || p.izena || '';
            const marca = p['SALMENTA MARKA'] || '';
            const puebloBruto = p.udalerria || p.Udalerria || p.UDALERRIA || p.herria || p.Herria || p.HERRIA || p.pueblo || p.Pueblo || p.herri || p.HERRI || '';
            const pueblo = capitalizarTexto(puebloBruto);
            
            const coincideNombre = normalizarTexto(nombre).includes(textoFiltro);
            const coincideMarca = normalizarTexto(marca).includes(textoFiltro);

            if (coincideNombre || coincideMarca) {
                // Si lo que coincide es la marca, sugerimos usando la marca como texto principal (o combinada)
                let textoOpcion = nombre;
                if (coincideMarca && marca.trim() !== '') {
                    textoOpcion = marca.trim();
                }

                if (pueblo && pueblo.trim() !== '') {
                    textoOpcion += ` (${pueblo.trim()})`;
                }
                sugerenciasSet.add(textoOpcion);
            }
        });
    }

    if (typeof datosSalmenta !== 'undefined') {
        datosSalmenta.forEach(p => {
            const nombre = p.izena || '';
            const puebloBruto = p.udalerria || p.Udalerria || p.UDALERRIA || p.herria || p.Herria || p.HERRIA || p.pueblo || p.Pueblo || p.herri || p.HERRI || '';
            const pueblo = capitalizarTexto(puebloBruto);
            
            if (normalizarTexto(nombre).includes(textoFiltro)) {
                let textoOpcion = nombre;
                if (pueblo && pueblo.trim() !== '') {
                    textoOpcion += ` (${pueblo.trim()})`;
                }
                sugerenciasSet.add(textoOpcion);
            }
        });
    }

    if (typeof datosAzokak !== 'undefined') {
        datosAzokak.forEach(p => {
            const nombre = p.izena || '';
            const puebloBruto = p.udalerria || p.Udalerria || p.UDALERRIA || p.herria || p.Herria || p.HERRIA || p.pueblo || p.Pueblo || p.herri || p.HERRI || '';
            const pueblo = capitalizarTexto(puebloBruto);
            
            if (normalizarTexto(nombre).includes(textoFiltro)) {
                let textoOpcion = nombre;
                if (pueblo && pueblo.trim() !== '') {
                    textoOpcion += ` (${pueblo.trim()})`;
                }
                sugerenciasSet.add(textoOpcion);
            }
        });
    }

    let contador = 0;
    sugerenciasSet.forEach(textoOpcion => {
        if (contador >= 20) return;
        const option = document.createElement('option');
        option.value = textoOpcion;
        datalist.appendChild(option);
        contador++;
    });
}
};