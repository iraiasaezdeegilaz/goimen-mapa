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

// ==========================================
// VARIABLES GLOBALES Y SISTEMA DE IDIOMAS
// ==========================================
let mapa;
let latUsuario = null;
let lngUsuario = null;
let idiomaActual = 'eu'; // 'eu' o 'es'
let modoVistaActual = 'mapa'; // 'mapa' o 'lista'
let radioKmSeleccionado = null; // null = sin filtro de radio

const TRADUCCIONES = {
    eu: {
        placeholderBusqueda: "🔍 Bilatu...",
        guztiraIkusgai: "Guztira ikusgai:",
        filtrosActivosTitulo: "Hautatutako iragazkiak:",
        btnGeolocalizar: "📍 Nire kokapena",
        txtFavoritos: "Gogokoenak",
        txtAbiertoAhora: "Zabalik orain",
        btnAlternarVista: "Ikusi Zerrenda",
        btnAlternarMapa: "🗺️ Ikusi Mapa",
        btnReset: "✕ Garbitu iragazkiak",
        filtrosActivosIndicador: "Filtroak aktibo daude",
        seleccionarProducto: "Aukeratu produktua:",
        catSalmenta: "🛒 Salmenta Puntuak",
        catAzokak: "🧺 Azokak",
        catZerbitzuak: "ℹ️ Zerbitzuak",
        catSellos: "🏅 Kalitate Zigiluak",
        btnAlternarMovil: "🔍 Bilatzailea",
        geoBuscando: "⏳ Kokapena bilatzen...",
        geoErrorPermiso: "Zure nabigatzaileak ez du geolokalizazioa onartzen.",
        geoErrorGeneral: "Ezin izan da zure kokapena lortu.",
        popupHemenZaude: "Hemen zaude",
        popupSinNombre: "Sin nombre",
        popupGogokoGorde: "Gogokoetan gorde",
        popupTelefonoa: "📞",
        popupEmail: "📧 Mezua idatzi",
        popupWeb: "🌐 Bisitatu",
        popupProduktuak: "PRODUKTUAK",
        popupSalmenta: "SALMENTA",
        popupOrdutegia: "ORDUTEGIA",
        popupEkoizleak: "EKOIZLEAK",
        popupNolaIritsi: "🚗 Nola iritsi",
        popupEzDagoEkoizlerik: "Ez dago ekoizlerik",
        popupZehaztuGabe: "Zehaztu gabe",
        estadoAbiertoNow: "Zabalik orain",
        estadoCerradoNow: "🔴 Itxita",
        tipoProductor: "Ekoizlea",
        tipoPuntoVenta: "Salmenta puntua",
        tipoMercado: "Azoka",
        tipoServicio: "Zerbitzua",
        btnVerEnMapa: "🗺️ Ikusi Mapan",
        noResultados: "Ez da elementurik aurkitu",
        radioTodos: "📡 Distantzia guztiak",
        radio5: "📍 < 5 km",
        radio10: "📍 < 10 km",
        radio15: "📍 < 15 km",
        radio20: "📍 < 20 km",
        opcionesSalmenta: {
            'Harategia': 'Harategia',
            'Denda': 'Denda',
            'Frutategia': 'Frutategia',
            'Okindegia': 'Okindegia',
            'Jatetxea': 'Jatetxea',
            'Taberna': 'Taberna',
            'Ostatua': 'Ostatua',
            'Kooperatiba': 'Kooperatiba',
            'Klik eta jaso': 'Klik eta jaso',
            'Vending makinak': 'Vending makinak'
        },
        opcionesAzokak: {
            'Asterokoa': 'Asterokoa',
            'Azoka berezia': 'Azoka berezia'
        },
        opcionesZerbitzuak: {
            'Ekitaldia': 'Ekitaldia',
            'Elkartea': 'Elkartea',
            'Landetxea': 'Landetxea',
            'Makinaria zerbitzua': 'Makinaria zerbitzua',
            'Museo eta interpretazio zentroak': 'Museo eta interpretazio zentroak',
            'Nekazal turismoak': 'Nekazal turismoak',
            'Sagardotegia': 'Sagardotegia',
            'Txakolindegia': 'Txakolindegia',
            'Turismo aktiboa': 'Turismo aktiboa'
        },
        categoriasProd: {
            'ESNEKIAK': 'ESNEKIAK',
            'HARAGIA ETA ARRAUTZAK': 'HARAGIA ETA ARRAUTZAK',
            'BARAZKIAK': 'BARAZKIAK',
            'ERATORRIAK': 'ERATORRIAK',
            'LEKALEAK': 'LEKALEAK',
            'ERLEAK': 'ERLEAK',
            'FRUTA': 'FRUTA',
            'FRUITU LEHORRAK': 'FRUITU LEHORRAK',
            'BASA FRUITUAK': 'BASA FRUITUAK',
            'LANDAREAK': 'LANDAREAK',
            'OGIGINTZA': 'OGIGINTZA',
            'EDARIAK': 'EDARIAK'
        },
        subgruposProd: {}
    },
    es: {
        placeholderBusqueda: "🔍 Buscar...",
        guztiraIkusgai: "Visibles en total:",
        filtrosActivosTitulo: "Filtros seleccionados:",
        btnGeolocalizar: "📍 Mi ubicación",
        txtFavoritos: "Favoritos",
        txtAbiertoAhora: "Abierto ahora",
        btnAlternarVista: "📋 Ver Listado",
        btnAlternarMapa: "🗺️ Ver Mapa",
        btnReset: "✕ Limpiar filtros",
        filtrosActivosIndicador: "Filtros activos",
        seleccionarProducto: "Selecciona producto:",
        catSalmenta: "🛒 Puntos de venta",
        catAzokak: "🧺 Mercado",
        catZerbitzuak: "ℹ️ Servicios",
        catSellos: "🏅 Sellos de Calidad",
        btnAlternarMovil: "🔍 Buscador",
        geoBuscando: "⏳ Buscando ubicación...",
        geoErrorPermiso: "Tu navegador no soporta geolokalización.",
        geoErrorGeneral: "No se pudo obtener tu ubicación.",
        popupHemenZaude: "Estás aquí",
        popupSinNombre: "Sin nombre",
        popupGogokoGorde: "Guardar en favoritos",
        popupTelefonoa: "📞",
        popupEmail: "📧 Escribir mensaje",
        popupWeb: "🌐 Visitar",
        popupProduktuak: "PRODUCTOS",
        popupSalmenta: "VENTA",
        popupOrdutegia: "HORARIO",
        popupEkoizleak: "PRODUCTORES",
        popupNolaIritsi: "🚗 Cómo llegar",
        popupEzDagoEkoizlerik: "No hay productores",
        popupZehaztuGabe: "Sin especificar",
        estadoAbiertoNow: "Abierto ahora",
        estadoCerradoNow: "🔴 Cerrado",
        tipoProductor: "Productor",
        tipoPuntoVenta: "Punto de Venta",
        tipoMercado: "Mercado / Azoka",
        tipoServicio: "Servicio",
        btnVerEnMapa: "🗺️ Ver en Mapa",
        noResultados: "No se encontraron resultados",
        radioTodos: "📡 Todas las distancias",
        radio5: "📍 < 5 km",
        radio10: "📍 < 10 km",
        radio15: "📍 < 15 km",
        radio20: "📍 < 20 km",
        opcionesSalmenta: {
            'Harategia': 'Carnicería',
            'Denda': 'Tienda',
            'Frutategia': 'Frutería',
            'Okindegia': 'Panadería',
            'Jatetxea': 'Restaurante',
            'Taberna': 'Taberna',
            'Ostatua': 'Alojamiento / Hostal',
            'Kooperatiba': 'Cooperativa',
            'Klik eta jaso': 'Click y recoge',
            'Vending makinak': 'Máquinas expendedoras'
        },
        opcionesAzokak: {
            'Asterokoa': 'Semanal',
            'Azoka berezia': 'Mercado especial'
        },
        opcionesZerbitzuak: {
            'Ekitaldia': 'Evento',
            'Elkartea': 'Asociación',
            'Landetxea': 'Casa rural',
            'Makinaria zerbitzua': 'Servicio de maquinaria',
            'Museo eta interpretazio zentroak': 'Museos y centros de interpretación',
            'Nekazal turismoak': 'Agroturismo',
            'Sagardotegia': 'Sidrería',
            'Txakolindegia': 'Txakolindegi',
            'Turismo aktiboa': 'Turismo activo'
        },
        categoriasProd: {
            'ESNEKIAK': 'LÁCTEOS',
            'HARAGIA ETA ARRAUTZAK': 'CARNE Y HUEVOS',
            'BARAZKIAK': 'VERDURAS / HORTALIZAS',
            'ERATORRIAK': 'DERIVADOS',
            'LEKALEAK': 'LEGUMBRES',
            'ERLEAK': 'APICULTURA',
            'FRUTA': 'FRUTA',
            'FRUITU LEHORRAK': 'FRUTOS SECOS',
            'BASA FRUITUAK': 'FRUTAS DEL BOSQUE',
            'LANDAREAK': 'PLANTA Y VIVERO',
            'OGIGINTZA': 'PANADERÍA',
            'EDARIAK': 'BEBIDAS'
        },
        subgruposProd: {
            'Esnea': 'Leche',
            'Gazta': 'Queso',
            'Iogurtak': 'Jogures',
            'Irabiatuak': 'Batidos',
            'Izozkiak': 'Helados',
            'Gurina': 'Mantequilla',
            'Mamia': 'Cuajada',
            'Txerrikiak': 'Cerdo y derivados',
            'Oilaskoak': 'Pollos',
            'Arrautzak': 'Huevos',
            'Haragia': 'Carne',
            'Barazkiak aire librean': 'Verduras/hortalizas al aire libre',
            'Barazkiak negutegian': 'Verduras/hortalizas en invernadero',
            'Barazki transformatuak': 'Verduras/hortalizas transformadas',
            'Fruta transformatuak': 'Frutas transformadas',
            'Piperminak': 'Guindillas',
            'Membriloa': 'Membrillo',
            'Babarrunak': 'Alubias',
            'Ogia': 'Pan',
            'Eztia': 'Miel',
            'Polena': 'Polen',
            'Propoleoa': 'Propoleo',
            'Ardoa': 'Vino',
            'Sagardoa': 'Sidra',
            'Garraztagarriak': 'Cítricos',
            'Sagarrak': 'Manzanas',
            'Madaria': 'Peras',
            'Gereziak': 'Cerezas',
            'Pikuak': 'Higos',
            'Aranak': 'Ciruelas',
            'Kiwia': 'Kiwi',
            'Kakia': 'Kaki',
            'Intxaurrak': 'Nueces',
            'Urrak': 'Avellanas',
            'Franbuesa': 'Frambuesa',
            'Ahabia': 'Arándano',
            'Marrubiak': 'Fresas',
            'Masustak': 'Moras',
            'Sendabelarrak': 'Plantas medicinales',
            'Fruta arbolak': 'Árboles frutales',
            'Opilak': 'Tartas',
            'Madalenak': 'Magdalenas',
            'Pastak': 'Pastas',
            'Txakolina': 'Txakoli',
            'Garagardoa': 'Cerveza',
            'Zukuak': 'Zumos',
            'Konbutxa': 'Kombucha',
            'Lekaleak': 'Legumbres',
            'Landareak': 'Plantas'
        }
    }
};

function t(clave) {
    return TRADUCCIONES[idiomaActual][clave] || clave;
}

function traducirCatProd(catOriginal) {
    const mapaCat = TRADUCCIONES[idiomaActual].categoriasProd;
    return mapaCat[catOriginal] || catOriginal;
}

function traducirSubgrupo(subOriginal) {
    if (idiomaActual === 'eu') return subOriginal;
    const mapaSub = TRADUCCIONES['es'].subgruposProd;
    return mapaSub[subOriginal] || subOriginal;
}

function traducirOpcionSalmenta(opOriginal) {
    if (idiomaActual === 'eu') return opOriginal;
    const mapaSal = TRADUCCIONES['es'].opcionesSalmenta;
    return mapaSal[opOriginal] || opOriginal;
}

function traducirOpcionAzoka(opOriginal) {
    if (idiomaActual === 'eu') return opOriginal;
    const mapaAzo = TRADUCCIONES['es'].opcionesAzokak;
    return mapaAzo[opOriginal] || opOriginal;
}

function traducirOpcionZerbitzu(opOriginal) {
    if (idiomaActual === 'eu') return opOriginal;
    const mapaSer = TRADUCCIONES['es'].opcionesZerbitzuak;
    return mapaSer[opOriginal] || opOriginal;
}

window.cambiarIdioma = function(nuevoIdioma) {
    if (nuevoIdioma !== 'eu' && nuevoIdioma !== 'es') return;
    idiomaActual = nuevoIdioma;
    
    const inputB = document.getElementById('buscador');
    if (inputB) inputB.placeholder = t('placeholderBusqueda');

    const spanCont = document.getElementById('label-contador-visibles');
    if (spanCont) spanCont.textContent = t('guztiraIkusgai');

    const btnGeo = document.getElementById('btn-geolocalizar');
    if (btnGeo) btnGeo.textContent = t('btnGeolocalizar');

    const txtFav = document.getElementById('label-texto-favoritos');
    if (txtFav) txtFav.textContent = t('txtFavoritos');

    const txtAb = document.getElementById('label-texto-abierto');
    if (txtAb) txtAb.textContent = t('txtAbiertoAhora');

    const btnVista = document.getElementById('btn-alternar-vista-modo');
    if (btnVista) {
        btnVista.textContent = modoVistaActual === 'mapa' ? t('btnAlternarVista') : t('btnAlternarMapa');
    }

    const btnRes = document.getElementById('btn-reset-filtros');
    if (btnRes) btnRes.textContent = t('btnReset');

    const indAct = document.getElementById('indicador-activos');
    if (indAct) indAct.textContent = t('filtrosActivosIndicador');

    const lblProd = document.getElementById('label-seleccionar-producto');
    if (lblProd) lblProd.textContent = t('seleccionarProducto');

    const btnMovil = document.querySelector('.btn-toggle-filtros-movil');
    if (btnMovil) btnMovil.textContent = t('btnAlternarMovil');

    const selectRadio = document.getElementById('select-radio-distancia');
    if (selectRadio) {
        selectRadio.options[0].text = t('radioTodos');
        selectRadio.options[1].text = t('radio5');
        selectRadio.options[2].text = t('radio10');
        selectRadio.options[3].text = t('radio15');
        selectRadio.options[4].text = t('radio20');
    }

    const headerSalmenta = document.getElementById('header-cat-salmenta');
    if (headerSalmenta) headerSalmenta.innerHTML = `${t('catSalmenta')} ▾`;

    const headerAzokak = document.getElementById('header-cat-azokak');
    if (headerAzokak) headerAzokak.innerHTML = `${t('catAzokak')} ▾`;

    const headerZerbitzuak = document.getElementById('header-cat-zerbitzuak');
    if (headerZerbitzuak) headerZerbitzuak.innerHTML = `${t('catZerbitzuak')} ▾`;

    const headerSellos = document.getElementById('header-cat-sellos');
    if (headerSellos) headerSellos.innerHTML = `${t('catSellos')} ▾`;

    document.querySelectorAll('.filtro-mota-label').forEach(lbl => {
        const original = lbl.getAttribute('data-original');
        if (original) lbl.textContent = ` ${traducirOpcionSalmenta(original)}`;
    });

    document.querySelectorAll('.filtro-azoka-label').forEach(lbl => {
        const original = lbl.getAttribute('data-original');
        if (original) lbl.textContent = ` ${traducirOpcionAzoka(original)}`;
    });

    document.querySelectorAll('.filtro-zerbitzuak-label').forEach(lbl => {
        const original = lbl.getAttribute('data-original');
        if (original) lbl.textContent = ` ${traducirOpcionZerbitzu(original)}`;
    });

    document.querySelectorAll('.cat-group-producto').forEach(grupo => {
        const catKey = grupo.getAttribute('data-cat-key');
        const headerEl = grupo.querySelector('.cat-header');
        if (catKey && headerEl) {
            const icono = headerEl.getAttribute('data-icono') || '📦';
            headerEl.innerHTML = `${icono} ${traducirCatProd(catKey)} ▾`;
        }

        grupo.querySelectorAll('.subgrupo-label').forEach(lbl => {
            const original = lbl.getAttribute('data-original');
            if (original) lbl.textContent = ` ${traducirSubgrupo(original)}`;
        });
    });

    window.renderizar(false);
};

const capasEkoizleak = L.markerClusterGroup({ maxClusterRadius: 35, spiderfyOnMaxZoom: true, zoomToBoundsOnClick: true });
const capasSalmenta = L.markerClusterGroup({ maxClusterRadius: 35, spiderfyOnMaxZoom: true, zoomToBoundsOnClick: true });
const capasAzokak = L.markerClusterGroup({ maxClusterRadius: 35, spiderfyOnMaxZoom: true, zoomToBoundsOnClick: true });
const capasZerbitzuak = L.markerClusterGroup({ maxClusterRadius: 35, spiderfyOnMaxZoom: true, zoomToBoundsOnClick: true });

let datos, datosSalmenta, datosAzokak, datosZerbitzuak;
let iconoSalmenta, iconoAzoka, iconoZerbitzuak;

const COL_SELLOS = ['Ekologikoa', 'Erregeneratzailea', 'Euskal Sagardoa', 'DO Idiazabal', 'Artzai Gazta'];
const ICONOS_SELLOS = {
    'Ekologikoa': '🌿',
    'Erregeneratzailea': '🌱',
    'Euskal Sagardoa': '🍏',
    'DO Idiazabal': '🧀',
    'Artzai Gazta': '🏔️'
};

const COL_SALMENTA = ['Dendetan', 'Azokak', 'Jatetxeetara', 'Etxetik', 'Harategian', 'Kontsumo taldeak', 'Vending makina', 'Online', 'Biziola', 'Bertatik Bertara', 'Goierriko nekazal koop (GNK)'];
const VERDE_PASTEL = '#a8d5ba'; 
const VERDE_OSCURO = '#2d5a3f'; 
const AZUL_PASTEL = '#a9cce3'; 
const AZUL_OSCURO = '#1a5276';
const ICONOS = { 'ESNEKIAK': '🥛', 'HARAGIA ETA ARRAUTZAK': '🥩', 'BARAZKIAK': '🥕', 'LEKALEAK': '🫘','ERATORRIAK': '🍯', 'ERLEAK': '🐝', 'FRUTA': '🍎', 'FRUITU LEHORRAK': '🥜', 'BASA FRUITUAK': '🍓', 'LANDAREAK': '🌱', 'OGIGINTZA': '🥖', 'EDARIAK': '🍷' };

// ==========================================
// GESTIÓN DE FAVORITOS (localStorage)
// ==========================================
function obtenerFavoritos() {
    try {
        return JSON.parse(localStorage.getItem('eko_favoritos') || '[]');
    } catch (e) {
        return [];
    }
}

function esFavorito(nombre) {
    if (!nombre) return false;
    const favs = obtenerFavoritos();
    return favs.includes(nombre.trim());
}

window.toggleFavorito = function(nombre) {
    if (!nombre) return;
    const nombreLimpio = nombre.trim();
    let favs = obtenerFavoritos();
    
    if (favs.includes(nombreLimpio)) {
        favs = favs.filter(item => item !== nombreLimpio);
        registrarEstadistica('quitar_favorito', nombreLimpio);
    } else {
        favs.push(nombreLimpio);
        registrarEstadistica('añadir_favorito', nombreLimpio);
    }
    
    localStorage.setItem('eko_favoritos', JSON.stringify(favs));
    
    document.querySelectorAll('.btn-favorito-popup').forEach(btn => {
        if (btn.getAttribute('data-nombre') === nombreLimpio) {
            const activo = favs.includes(nombreLimpio);
            const spanIcono = btn.querySelector('.icono-corazon-span');
            if (activo) {
                btn.classList.add('activo');
                btn.style.background = '#ffebee';
                btn.style.borderColor = '#e53935';
                if (spanIcono) {
                    spanIcono.textContent = '❤️';
                    spanIcono.style.filter = 'none';
                }
            } else {
                btn.classList.remove('activo');
                btn.style.background = '#ffffff';
                btn.style.borderColor = '#ccc';
                if (spanIcono) {
                    spanIcono.textContent = '🤍';
                    spanIcono.style.filter = 'drop-shadow(0 0 1px rgba(0,0,0,0.8))';
                }
            }
        }
    });

    const checkFavs = document.getElementById('filtro-solo-favoritos');
    if (checkFavs && checkFavs.checked) {
        window.renderizar(false);
    }
};

const normalizarTexto = (texto) => (texto || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

function capitalizarTexto(texto) {
    if (!texto) return "";
    return texto.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
}

function calcularDistanciaHTML(latItem, lngItem) {
    if (latUsuario === null || lngUsuario === null || !latItem || !lngItem) return '';
    const distMetros = L.latLng(latUsuario, lngUsuario).distanceTo(L.latLng(latItem, lngItem));
    const distTexto = distMetros < 1000 ? Math.round(distMetros) + ' m' : (distMetros / 1000).toFixed(1) + ' km';
    const textoDistanciaUI = idiomaActual === 'eu' ? `📍 Zu gandik ${distTexto}-tara` : `📍 A ${distTexto} de ti`;
    return `<div style="margin-top: 5px; font-size: 0.8em; font-weight: 700; opacity: 0.85; font-family: 'Montserrat', sans-serif;">${textoDistanciaUI}</div>`;
}

function cumpleFiltroRadio(latItem, lngItem) {
    if (radioKmSeleccionado === null || latUsuario === null || lngUsuario === null || !latItem || !lngItem) return true;
    const distMetros = L.latLng(latUsuario, lngUsuario).distanceTo(L.latLng(latItem, lngItem));
    return distMetros <= (radioKmSeleccionado * 1000);
}

// ==========================================
// LÓGICA DE COMPROBACIÓN "ABIERTO AHORA"
// ==========================================
function estaAbiertoAhora(textoHorario) {
    if (!textoHorario || typeof textoHorario !== 'string') return true; 
    const textoNorm = normalizarTexto(textoHorario);
    if (textoNorm.includes('24h') || textoNorm.includes('beti') || textoNorm.includes('siempre')) return true;

    const ahora = new Date();
    const diaSemana = ahora.getDay(); 
    const horaActualMinutos = ahora.getHours() * 60 + ahora.getMinutes();

    const diasMap = {
        0: ['igandea', 'domingo', 'igandetan', 'domeka'],
        1: ['astelehena', 'lunes', 'astelehenetan'],
        2: ['asteartea', 'martes', 'astearteetan'],
        3: ['asteazkena', 'miércoles', 'miercoles', 'asteazkenetan'],
        4: ['osteguna', 'jueves', 'ostegunetan'],
        5: ['ostirala', 'viernes', 'ostiraletan'],
        6: ['larunbata', 'sábado', 'sabado', 'larunbatetan']
    };

    const regexHoras = /(\d{1,2}):(\d{2})\s*[-–a-toz]\s*(\d{1,2}):(\d{2})/g;
    let match;
    let hayCoincidenciaHorariaValida = false;
    let analizadoAlgunaFranja = false;

    while ((match = regexHoras.exec(textoHorario)) !== null) {
        analizadoAlgunaFranja = true;
        const hInicio = parseInt(match[1]) * 60 + parseInt(match[2]);
        const hFin = parseInt(match[3]) * 60 + parseInt(match[4]);
        if (horaActualMinutos >= hInicio && horaActualMinutos <= hFin) {
            hayCoincidenciaHorariaValida = true;
        }
    }

    if (!analizadoAlgunaFranja) {
        const palabrasDia = diasMap[diaSemana] || [];
        const mencionaDias = Object.values(diasMap).flat().some(d => textoNorm.includes(d));
        if (!mencionaDias) return true; 
        return palabrasDia.some(d => textoNorm.includes(d));
    }

    return hayCoincidenciaHorariaValida;
}

// ==========================================
// GESTIÓN DE DISPONIBILIDAD DE FILTROS
// ==========================================
function actualizarDisponibilidadFiltroAbierto() {
    const ui = document.getElementById('ui');
    if (!ui) return;

    const checkAbierto = document.getElementById('filtro-abierto-ahora');
    const contenedorFiltroAbierto = document.getElementById('contenedor-filtro-abierto');
    if (!checkAbierto || !contenedorFiltroAbierto) return;

    const checksSalmenta = ui.querySelectorAll('input.filtro-mota:checked').length;
    const checksAzoka = ui.querySelectorAll('input.filtro-azoka:checked').length;
    const checksZerbitzuak = ui.querySelectorAll('input.filtro-zerbitzuak:checked').length;
    const checksProductos = ui.querySelectorAll('input[type="checkbox"][data-col]:checked').length;
    const checksSellos = ui.querySelectorAll('input.filtro-sello:checked').length;
    const textoBusqueda = document.getElementById('buscador')?.value?.trim() || "";

    const hayFiltroSeleccionado = checksSalmenta > 0 || checksAzoka > 0 || checksZerbitzuak > 0 || checksProductos > 0 || checksSellos > 0 || textoBusqueda !== "";

    if (hayFiltroSeleccionado) {
        contenedorFiltroAbierto.style.opacity = '1';
        contenedorFiltroAbierto.style.pointerEvents = 'auto';
        checkAbierto.disabled = false;
    } else {
        contenedorFiltroAbierto.style.opacity = '0.4';
        contenedorFiltroAbierto.style.pointerEvents = 'none';
        checkAbierto.checked = false;
    }
}

function actualizarDisponibilidadRadioDistancia() {
    const selectRadio = document.getElementById('select-radio-distancia');
    if (!selectRadio) return;

    if (latUsuario !== null && lngUsuario !== null) {
        selectRadio.style.opacity = '1';
        selectRadio.style.pointerEvents = 'auto';
        selectRadio.disabled = false;
    } else {
        selectRadio.style.opacity = '0.4';
        selectRadio.style.pointerEvents = 'none';
        selectRadio.disabled = true;
    }
}

function actualizarResumenFiltros() {
    const contenedorResumen = document.getElementById('resumen-filtros-activos');
    if (!contenedorResumen) return;

    const ui = document.getElementById('ui');
    if (!ui) return;

    let seleccionados = [];

    const textoBus = document.getElementById('buscador')?.value?.trim();
    if (textoBus) {
        seleccionados.push(`🔍 ${idiomaActual === 'eu' ? 'Bilaketa' : 'Búsqueda'}: "${textoBus}"`);
    }

    if (radioKmSeleccionado !== null) {
        seleccionados.push(`📍 < ${radioKmSeleccionado} km`);
    }

    const soloFavoritos = document.getElementById('filtro-solo-favoritos')?.checked;
    if (soloFavoritos) {
        seleccionados.push(`❤️ ${t('txtFavoritos')}`);
    }

    const abiertoAhora = document.getElementById('filtro-abierto-ahora')?.checked;
    if (abiertoAhora) {
        seleccionados.push(`🟢 ${t('txtAbiertoAhora')}`);
    }

    ui.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        if (cb.id === 'filtro-solo-favoritos' || cb.id === 'filtro-abierto-ahora') return;
        const labelText = cb.parentElement.textContent.trim();
        if (labelText) {
            seleccionados.push(labelText);
        }
    });

    if (seleccionados.length > 0) {
        contenedorResumen.style.display = 'block';
        contenedorResumen.innerHTML = `
            <div style="font-size: 0.75em; font-weight: 700; color: #2c5e2e; margin-bottom: 4px; text-transform: uppercase; font-family: 'Montserrat', sans-serif;">${t('filtrosActivosTitulo')}</div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                ${seleccionados.map(item => `<span style="background: #e2f0d9; color: #274e13; padding: 2px 8px; border-radius: 10px; font-size: 0.75em; border: 1px solid #b6d7a8; font-family: 'Montserrat', sans-serif;">${item}</span>`).join('')}
            </div>
        `;
    } else {
        contenedorResumen.style.display = 'none';
        contenedorResumen.innerHTML = '';
    }
}

function comprobarFiltrosActivos() {
    const ui = document.getElementById('ui');
    if (!ui) return;
    const totalChecks = ui.querySelectorAll('input[type="checkbox"]:checked').length;
    const textoBus = document.getElementById('buscador')?.value || "";
    const indicador = document.getElementById('indicador-activos');
    const btnReset = document.getElementById('btn-reset-filtros');

    actualizarDisponibilidadFiltroAbierto();
    actualizarDisponibilidadRadioDistancia();
    actualizarResumenFiltros();

    if (totalChecks > 0 || textoBus.trim() !== "" || radioKmSeleccionado !== null) {
        if (indicador) indicador.style.display = 'block';
        if (btnReset) btnReset.style.background = '#d9534f';
    } else {
        if (indicador) indicador.style.display = 'none';
        if (btnReset) btnReset.style.background = '#ff6b6b';
    }
}

// ==========================================
// FUNCIÓN PRINCIPAL DE RENDERIZADO Y VISTAS
// ==========================================
window.renderizar = function(ajustarZoom = true) {
    capasEkoizleak.clearLayers();
    capasSalmenta.clearLayers();
    capasAzokak.clearLayers();
    capasZerbitzuak.clearLayers();

    const inputBuscador = document.getElementById('buscador');
    const texto = inputBuscador ? normalizarTexto(inputBuscador.value) : "";
    let bounds = L.latLngBounds();
    let elementoBuscadoEspecifico = null;
    let listaElementosParaTabla = [];

    const ui = document.getElementById('ui');
    if (!ui) return;

    const soloFavoritos = document.getElementById('filtro-solo-favoritos')?.checked || false;
    const soloAbiertoAhora = document.getElementById('filtro-abierto-ahora')?.checked || false;
    const listaFavs = obtenerFavoritos();

    const checkboxesProductos = Array.from(ui.querySelectorAll('input[type="checkbox"][data-col]:checked'));
    const filtrosProductosActivos = checkboxesProductos.map(cb => cb.getAttribute('data-col').split(',').map(c => c.trim()).filter(Boolean));

    const checksMotaSalmenta = Array.from(ui.querySelectorAll('input.filtro-mota:checked'));
    const checksMotaAzoka = Array.from(ui.querySelectorAll('input.filtro-azoka:checked'));
    const checksMotaZerbitzuak = Array.from(ui.querySelectorAll('input.filtro-zerbitzuak:checked'));
    const checksSellos = Array.from(ui.querySelectorAll('input.filtro-sello:checked'));

    if (texto !== "" && texto !== "___BLOQUEADO___") {
        let match = datos?.find(p => {
            const tieneBaimena = p.BAIMENA && p.BAIMENA.toString().trim() !== "";
            if (!tieneBaimena) return false;
            const u = normalizarTexto(p.USTIATEGIAREN_IZENA);
            const m = normalizarTexto(p['SALMENTA MARKA']);
            return u === texto || m === texto || u.includes(texto) || m.includes(texto);
        });
        if (match && match['ycoord (º)']) {
            elementoBuscadoEspecifico = { lat: parseFloat(match['ycoord (º)']), lng: parseFloat(match['xcoord (º)']) };
        } else {
            let matchSal = datosSalmenta?.find(p => p.izena && normalizarTexto(p.izena).includes(texto));
            if (matchSal && matchSal['ycoord (º)']) {
                elementoBuscadoEspecifico = { lat: parseFloat(matchSal['ycoord (º)']), lng: parseFloat(matchSal['xcoord (º)']) };
            } else {
                let matchAzoka = datosAzokak?.find(p => p.izena && normalizarTexto(p.izena).includes(texto));
                if (matchAzoka && matchAzoka['ycoord (º)']) {
                    elementoBuscadoEspecifico = { lat: parseFloat(matchAzoka['ycoord (º)']), lng: parseFloat(matchAzoka['xcoord (º)']) };
                } else {
                    let matchServ = datosZerbitzuak?.find(p => normalizarTexto(p.izena || p.IZENA || "").includes(texto));
                    if (matchServ && matchServ['ycoord (º)']) {
                        elementoBuscadoEspecifico = { lat: parseFloat(matchServ['ycoord (º)']), lng: parseFloat(matchServ['xcoord (º)']) };
                    }
                }
            }
        }
        registrarEstadistica('busqueda', inputBuscador.value.trim());
    }

    const hayFiltroSalmenta = checksMotaSalmenta.length > 0;
    const hayFiltroAzoka = checksMotaAzoka.length > 0;
    const hayFiltroZerbitzu = checksMotaZerbitzuak.length > 0;

    // 1. EKOIZLEAK
    const mostrarEkoizleak = (!hayFiltroSalmenta && !hayFiltroAzoka && !hayFiltroZerbitzu) || filtrosProductosActivos.length > 0 || checksSellos.length > 0;

    if (typeof datos !== 'undefined' && mostrarEkoizleak) {
        datos.forEach(p => {
            const baimenaStr = p.BAIMENA ? p.BAIMENA.toString().trim() : "";
            const tieneBaimena = baimenaStr !== "" && baimenaStr !== "0" && baimenaStr.toLowerCase() !== "false";
            if (!tieneBaimena) return;

            let lat = p['ycoord (º)'] ? parseFloat(p['ycoord (º)']) : null;
            let lng = p['xcoord (º)'] ? parseFloat(p['xcoord (º)']) : null;
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

            if (!cumpleFiltroRadio(lat, lng)) return;

            let marcaReal = (p['SALMENTA MARKA'] && p['SALMENTA MARKA'].trim() !== "") ? p['SALMENTA MARKA'].trim() : "";
            let nombreUstiategi = (p.USTIATEGIAREN_IZENA && p.USTIATEGIAREN_IZENA.trim() !== "") ? p.USTIATEGIAREN_IZENA.trim() : t('popupSinNombre');
            let nombreParaMostrar = nombreUstiategi !== t('popupSinNombre') ? nombreUstiategi : marcaReal;

            if (soloFavoritos && !listaFavs.includes(nombreParaMostrar)) return;
            if (soloAbiertoAhora && !estaAbiertoAhora(p.ordutegia || p.ORDUTEGIA)) return;

            const nombreUsti = normalizarTexto(p.USTIATEGIAREN_IZENA);
            const marca = normalizarTexto(p['SALMENTA MARKA']);
            const cumpleTexto = texto === "" || texto === "___BLOQUEADO___" || nombreUsti.includes(texto) || marca.includes(texto);
            
            let cumpleProductos = true;
            if (filtrosProductosActivos.length > 0) {
                cumpleProductos = filtrosProductosActivos.every(columnaGrupo => {
                    return columnaGrupo.some(col => {
                        const val = p[col];
                        if (val === undefined || val === null) return false;
                        const valStr = val.toString().trim().toUpperCase();
                        return valStr !== "" && valStr !== "0" && valStr !== "0.0" && valStr !== "NO" && valStr !== "FALSE";
                    });
                });
            }

            let cumpleSellos = true;
            if (checksSellos.length > 0) {
                cumpleSellos = checksSellos.every(cb => {
                    const selloKey = cb.value;
                    return p[selloKey] === 'X';
                });
            }
            
            if (cumpleTexto && cumpleProductos && cumpleSellos) {
                bounds.extend([lat, lng]);

                const nombreFoto = p.ARGAZKIA ? p.ARGAZKIA.trim() : "";
                const direccionMostrada = (p.HELBIDEA && p.HELBIDEA.trim() !== "") ? capitalizarTexto(p.HELBIDEA) : (p.UDALERRIA ? capitalizarTexto(p.UDALERRIA) : "");
                const imagenHTML = nombreFoto !== "" ? `<img src="img/${nombreFoto}" style="width: 100%; height: 150px; object-fit: contain; background-color: #f8f8f8; display: block;" alt="${p.USTIATEGIAREN_IZENA}">` : '';

                let marcaFormateada = marcaReal ? capitalizarTexto(marcaReal) : null;
                let distanciaHTML = calcularDistanciaHTML(lat, lng);

                let sellosHTML = COL_SELLOS.filter(s => p[s] === 'X').map(s => 
                    `<span style="background:#fff9c4; color:#b8860b; padding:2px 8px; border-radius:10px; font-size:0.75em; border:1px solid #f1c40f; margin:2px; display:inline-block; font-weight:bold; font-family: 'Montserrat', sans-serif;">${ICONOS_SELLOS[s] || '🏅'} ${s}</span>`
                ).join('');

                let redesHTML = '';
                if (p['SARE SOZIALAK'] && p['SARE SOZIALAK'].trim() !== "") {
                    p['SARE SOZIALAK'].split(',').map(l => l.trim()).forEach(link => {
                        let icono = '📱'; let nombreRed = 'Sarea'; let colorFondo = '#f0f0f0';
                        if (link.includes('instagram')) { icono = '📸'; nombreRed = 'Instagram'; colorFondo = 'linear-gradient(135deg, #ffd1dc 0%, #ffe0b2 100%)'; } 
                        else if (link.includes('facebook')) { icono = '👥'; nombreRed = 'Facebook'; colorFondo = '#d1e4ff'; } 
                        else if (link.includes('twitter') || link.includes('x.com')) { icono = '🐦'; nombreRed = 'Twitter'; colorFondo = '#e0e0e0'; }
                        const urlFinal = link.startsWith('http') ? link : 'https://' + link;
                        redesHTML += `<a href="#" onclick="event.preventDefault(); registrarEstadistica('red_${nombreRed.toLowerCase()}', '${nombreParaMostrar}').then(() => window.open('${urlFinal}', '_blank'));" style="display:block; background: ${colorFondo}; padding: 8px; text-align:center; font-size: 0.9em; color: ${VERDE_OSCURO}; text-decoration:none; border-radius: 8px; font-weight: bold; margin-bottom: 8px; border: 1px solid rgba(0,0,0,0.05); font-family: 'Montserrat', sans-serif;">${icono} ${nombreRed}</a>`;
                    });
                }

                let websHTML = '';
                if (p['WEB ORRIA'] && p['WEB ORRIA'].trim() !== "") {
                    websHTML = p['WEB ORRIA'].split(',').map(w => w.trim()).map(w => {
                        const webFinal = w.startsWith('http') ? w : 'https://' + w;
                        return `<a href="#" onclick="event.preventDefault(); registrarEstadistica('web_externa', '${nombreParaMostrar}').then(() => window.open('${webFinal}', '_blank'));" style="flex:1; background: #f0f0f0; padding: 10px; display: flex; align-items: center; justify-content: center; font-size: 0.9em; color: ${VERDE_OSCURO}; text-decoration:none; border-radius: 8px; font-weight: bold; font-family: 'Montserrat', sans-serif;">${t('popupWeb')}</a>`;
                    }).join('');
                }

                const esFav = esFavorito(nombreParaMostrar);

                let marker = L.marker([lat, lng], { 
                    icon: L.icon({ iconUrl: './icons/baserria.png', iconSize: [32, 32] }),
                    nombre: nombreUstiategi
                });
                
                marker.on('click', () => registrarEstadistica('clic_productor', nombreParaMostrar));

                marker.bindPopup(`
                    <div class="popup-card" style="font-family: 'Montserrat', sans-serif; border: 2px solid ${VERDE_PASTEL}; padding: 0; border-radius: 15px; overflow: hidden; width: 280px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); position: relative;">
                        <button class="btn-favorito-popup ${esFav ? 'activo' : ''}" data-nombre="${nombreParaMostrar}" onclick="toggleFavorito('${nombreParaMostrar.replace(/'/g, "\\'")}')" style="position: absolute; top: 10px; right: 10px; z-index: 10; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: ${esFav ? '#ffebee' : '#ffffff'}; border: 1px solid ${esFav ? '#e53935' : '#ccc'}; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.15); transition: all 0.2s;" title="${t('popupGogokoGorde')}">
                            <span class="icono-corazon-span" style="font-size: 14px; line-height: 1; filter: ${esFav ? 'none' : 'drop-shadow(0 0 1px rgba(0,0,0,0.8))'};">${esFav ? '❤️' : '🤍'}</span>
                        </button>

                        ${imagenHTML}
                        <div style="background: ${VERDE_PASTEL}; padding: ${nombreFoto !== '' ? '15px' : '22px 15px 15px 15px'}; text-align: center; position: relative;">
                            <div style="padding-left: 25px; padding-right: 25px;">
                                <span style="font-weight: 700; display: inline-block; font-size: 1.15em; line-height: 1.3; color: #2c5e2e; font-family: 'Montserrat', sans-serif;">${nombreParaMostrar}</span>
                            </div>
                            ${(marcaFormateada && marcaFormateada.toLowerCase() !== nombreParaMostrar.toLowerCase()) ? `<p style="margin: 6px 0 0 0; font-size: 0.95em; color: #2c5e2e; font-weight: 700; font-family: 'Montserrat', sans-serif;">${marcaFormateada}</p>` : ''}
                            ${direccionMostrada ? `<div style="margin-top: 8px; color: #2c5e2e; font-weight: 600; font-size: 0.85em; font-family: 'Montserrat', sans-serif;">${direccionMostrada}</div>` : ''}
                            ${distanciaHTML}
                        </div>
                        <div style="padding: 15px; background: #ffffff;">
                            ${p.TELEFONOA ? `<a href="#" onclick="event.preventDefault(); registrarEstadistica('telefono', '${nombreParaMostrar}').then(() => window.location.href='tel:${p.TELEFONOA}');" style="display: block; background: #fff; border: 2px solid ${VERDE_OSCURO}; color: ${VERDE_OSCURO}; padding: 10px; border-radius: 25px; text-decoration: none; font-weight: 700; text-align: center; margin-bottom: 15px; font-family: 'Montserrat', sans-serif;">${t('popupTelefonoa')} ${p.TELEFONOA}</a>` : ''}
                            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                                ${p['EMAIL'] ? `<a href="#" onclick="event.preventDefault(); registrarEstadistica('email', '${nombreParaMostrar}').then(() => window.location.href='mailto:${p['EMAIL']}');" style="flex:1; background: #f0f0f0; padding: 10px; text-align:center; font-size: 0.9em; color: ${VERDE_OSCURO}; text-decoration:none; border-radius: 8px; font-weight: bold; font-family: 'Montserrat', sans-serif;">${t('popupEmail')}</a>` : ''}
                                ${websHTML}
                            </div>
                            ${redesHTML}
                            <div style="text-align: left; font-size: 0.9em;">
                                <div style="margin-top: 15px; margin-bottom: 10px;">
                                    <p style="margin: 0 0 5px 0; color: ${VERDE_OSCURO}; font-weight: 700; font-size: 1.05em; text-transform: uppercase; font-family: 'Montserrat', sans-serif;">${t('popupProduktuak')}</p>
                                    <p style="margin: 0; color: #444; font-family: 'Montserrat', sans-serif;">${p['Produktuak'] || '-'}</p>
                                </div>
                                <div style="text-align: center; margin-bottom: 10px;">${sellosHTML}</div>
                                <hr style="margin: 10px 0; border: 0; border-top: 1px solid #ddd;">
                                <div style="margin-top: 10px; margin-bottom: 10px;">
                                    <p style="margin: 0 0 5px 0; color: ${VERDE_OSCURO}; font-weight: 700; font-size: 1.05em; text-transform: uppercase; font-family: 'Montserrat', sans-serif;">${t('popupSalmenta')}</p>
                                    <p style="margin: 0; color: #444; font-family: 'Montserrat', sans-serif;">${COL_SALMENTA.filter(s => p[s] === 'X').join(', ')}</p>
                                </div>
                            </div>
                        </div>
                    </div>`);
                
                capasEkoizleak.addLayer(marker);
                listaElementosParaTabla.push({
                    tipo: t('tipoProductor'),
                    nombre: nombreParaMostrar,
                    subtitulo: direccionMostrada,
                    lat: lat,
                    lng: lng,
                    telefono: p.TELEFONOA,
                    web: p['WEB ORRIA'],
                    imagen: nombreFoto ? `./img/${nombreFoto}` : null,
                    iconoTipo: '🏠',
                    categoriaOriginal: 'ekoizle'
                });
            }
        });
    }

    // 2. SALMENTA PUNTUAK
    if (typeof datosSalmenta !== 'undefined' && hayFiltroSalmenta) {
        datosSalmenta.forEach(p => {
            let lat = p['ycoord (º)'] ? parseFloat(p['ycoord (º)']) : null;
            let lng = p['xcoord (º)'] ? parseFloat(p['xcoord (º)']) : null;
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

            if (!cumpleFiltroRadio(lat, lng)) return;

            const nombreSalName = p.izena || "";
            if (soloFavoritos && !listaFavs.includes(nombreSalName.trim())) return;
            if (soloAbiertoAhora && !estaAbiertoAhora(p.ordutegia)) return;

            const tipo = normalizarTexto(p.mota);
            const nombreSal = normalizarTexto(nombreSalName);
            const cumpleTexto = texto === "" || texto === "___BLOQUEADO___" || nombreSal.includes(texto);
            const cumpleFiltroMota = checksMotaSalmenta.length === 0 || checksMotaSalmenta.some(c => tipo.includes(c.value));

            if (cumpleTexto && cumpleFiltroMota) {
                bounds.extend([lat, lng]);

                const argazkiaSal = p.Argazkiak || p.argazkiak || p['ARGAZKIAK'] || '';
                const ubicacionSal = capitalizarTexto(p.udalerria || p.UDALERRIA || p.Udalerria || "");
                const rawWeb = p.web || p.WEB || p['Web orria'] || p['WEB ORRIA'];
                const webURL = rawWeb ? (rawWeb.startsWith('http') ? rawWeb : 'https://' + rawWeb) : null;

                const esFav = esFavorito(nombreSalName);
                let markerSal = L.marker([lat, lng], { icon: iconoSalmenta, nombre: nombreSalName });
                markerSal.on('click', () => registrarEstadistica('clic_salmenta', nombreSalName || 'Tienda sin nombre'));

                markerSal.bindPopup(`
                    <div class="popup-card" style="font-family: 'Montserrat', sans-serif; border: 2px solid ${AZUL_PASTEL}; padding: 0; border-radius: 15px; overflow: hidden; width: 280px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); position: relative;">
                        <button class="btn-favorito-popup ${esFav ? 'activo' : ''}" data-nombre="${nombreSalName}" onclick="toggleFavorito('${nombreSalName.replace(/'/g, "\\'")}')" style="position: absolute; top: 10px; right: 10px; z-index: 10; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: ${esFav ? '#ffebee' : '#ffffff'}; border: 1px solid ${esFav ? '#e53935' : '#ccc'}; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.15); transition: all 0.2s;" title="${t('popupGogokoGorde')}">
                            <span class="icono-corazon-span" style="font-size: 14px; line-height: 1; filter: ${esFav ? 'none' : 'drop-shadow(0 0 1px rgba(0,0,0,0.8))'};">${esFav ? '❤️' : '🤍'}</span>
                        </button>

                        ${argazkiaSal.trim() !== '' ? `<div style="width: 100%; max-height: 160px; overflow: hidden;"><img src="img/${argazkiaSal.trim()}" alt="Argazkia" style="width: 100%; height: 100%; object-fit: cover; display: block;"></div>` : ''}
                        <div style="background: ${AZUL_PASTEL}; padding: ${argazkiaSal.trim() !== '' ? '15px' : '22px 15px 15px 15px'}; text-align: center; position: relative;">
                            <div style="padding-left: 25px; padding-right: 25px;">
                                <span style="font-weight: 700; display: inline-block; font-size: 1.15em; line-height: 1.3; color: ${AZUL_OSCURO}; font-family: 'Montserrat', sans-serif;">${nombreSalName.toUpperCase()}</span>
                            </div>
                            ${ubicacionSal ? `<div style="margin-top: 8px; color: ${AZUL_OSCURO}; font-weight: 600; font-size: 0.85em; font-family: 'Montserrat', sans-serif;">${ubicacionSal}</div>` : ''}
                            ${calcularDistanciaHTML(lat, lng)}
                        </div>
                    </div>`);

                capasSalmenta.addLayer(markerSal);
                listaElementosParaTabla.push({
                    tipo: t('tipoPuntoVenta'),
                    nombre: nombreSalName,
                    subtitulo: ubicacionSal,
                    lat: lat,
                    lng: lng,
                    telefono: p.telefonoa,
                    web: webURL,
                    imagen: argazkiaSal.trim() ? `./img/${argazkiaSal.trim()}` : null,
                    iconoTipo: '🛒',
                    categoriaOriginal: 'salmenta'
                });
            }
        });
    }

    // 3. AZOKAK
    if (typeof datosAzokak !== 'undefined' && hayFiltroAzoka) {
        datosAzokak.forEach(p => {
            let lat = p['ycoord (º)'] ? parseFloat(p['ycoord (º)']) : null;
            let lng = p['xcoord (º)'] ? parseFloat(p['xcoord (º)']) : null;
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

            if (!cumpleFiltroRadio(lat, lng)) return;

            const nombreAzokaName = p.izena || "";
            if (soloFavoritos && !listaFavs.includes(nombreAzokaName.trim())) return;
            if (soloAbiertoAhora && !estaAbiertoAhora(p.ordutegia)) return;

            const tipo = normalizarTexto(p.mota);
            const nombreAzoka = normalizarTexto(nombreAzokaName);
            const cumpleTexto = texto === "" || texto === "___BLOQUEADO___" || nombreAzoka.includes(texto);
            const cumpleFiltroMota = checksMotaAzoka.length === 0 || checksMotaAzoka.some(c => tipo === c.value);

            if (cumpleTexto && cumpleFiltroMota) {
                bounds.extend([lat, lng]);

                const colPrincipal = '#e9d5a1'; 
                const colTexto = '#5d4037';    
                const argazkiaAzoka = p.Argazkiak || p.argazkiak || p['ARGAZKIAK'] || '';
                const ubicacionAzoka = capitalizarTexto(p.udalerria || p.UDALERRIA || p.Udalerria || "");
                const rawWeb = p.web || p.WEB || p['web orria'] || p['WEB ORRIA'];
                const webURL = rawWeb ? (rawWeb.startsWith('http') ? rawWeb : 'https://' + rawWeb) : null;

                const esFav = esFavorito(nombreAzokaName);
                let markerAzoka = L.marker([lat, lng], { icon: iconoAzoka, nombre: nombreAzokaName });
                markerAzoka.on('click', () => registrarEstadistica('clic_azoka', nombreAzokaName || 'Azoka'));

                markerAzoka.bindPopup(`
                    <div class="popup-card" style="font-family: 'Montserrat', sans-serif; border: 2px solid ${colPrincipal}; padding: 0; border-radius: 15px; overflow: hidden; width: 280px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); position: relative;">
                        <button class="btn-favorito-popup ${esFav ? 'activo' : ''}" data-nombre="${nombreAzokaName}" onclick="toggleFavorito('${nombreAzokaName.replace(/'/g, "\\'")}')" style="position: absolute; top: 10px; right: 10px; z-index: 10; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: ${esFav ? '#ffebee' : '#ffffff'}; border: 1px solid ${esFav ? '#e53935' : '#ccc'}; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.15); transition: all 0.2s;" title="${t('popupGogokoGorde')}">
                            <span class="icono-corazon-span" style="font-size: 14px; line-height: 1; filter: ${esFav ? 'none' : 'drop-shadow(0 0 1px rgba(0,0,0,0.8))'};">${esFav ? '❤️' : '🤍'}</span>
                        </button>

                        ${argazkiaAzoka.trim() !== '' ? `<div style="width: 100%; max-height: 160px; overflow: hidden;"><img src="img/${argazkiaAzoka.trim()}" alt="Argazkia" style="width: 100%; height: 100%; object-fit: cover; display: block;"></div>` : ''}
                        <div style="background: ${colPrincipal}; padding: ${argazkiaAzoka.trim() !== '' ? '15px' : '22px 15px 15px 15px'}; text-align: center; position: relative;">
                            <div style="padding-left: 25px; padding-right: 25px;">
                                <span style="font-weight: 700; display: inline-block; font-size: 1.15em; line-height: 1.3; color: ${colTexto}; font-family: 'Montserrat', sans-serif;">${nombreAzokaName.toUpperCase()}</span>
                            </div>
                            ${ubicacionAzoka ? `<div style="margin-top: 8px; color: ${colTexto}; font-weight: 600; font-size: 0.85em; font-family: 'Montserrat', sans-serif;">${ubicacionAzoka}</div>` : ''}
                            ${calcularDistanciaHTML(lat, lng)}
                        </div>
                    </div>`);

                capasAzokak.addLayer(markerAzoka);
                listaElementosParaTabla.push({
                    tipo: t('tipoMercado'),
                    nombre: nombreAzokaName,
                    subtitulo: ubicacionAzoka,
                    lat: lat,
                    lng: lng,
                    telefono: null,
                    web: webURL,
                    imagen: argazkiaAzoka.trim() ? `./img/${argazkiaAzoka.trim()}` : null,
                    iconoTipo: '🧺',
                    categoriaOriginal: 'azoka'
                });
            }
        });
    }

    // 4. ZERBITZUAK
    if (typeof datosZerbitzuak !== 'undefined' && hayFiltroZerbitzu) {
        datosZerbitzuak.forEach(p => {
            let lat = p['ycoord (º)'] ? parseFloat(p['ycoord (º)']) : null;
            let lng = p['xcoord (º)'] ? parseFloat(p['xcoord (º)']) : null;
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

            if (!cumpleFiltroRadio(lat, lng)) return;

            const izena = p.IZENA || p.izena || "SIN NOMBRE";
            if (soloFavoritos && !listaFavs.includes(izena.trim())) return;
            if (soloAbiertoAhora && !estaAbiertoAhora(p.ordutegia || p.ORDUTEGIA || p.data)) return;

            const m = p.mota || p.MOTA || "";
            const tipoDato = normalizarTexto(m);
            const valoresSeleccionados = checksMotaZerbitzuak.map(c => normalizarTexto(c.value));
            const cumpleFiltro = valoresSeleccionados.length === 0 || valoresSeleccionados.includes(tipoDato);

            const nombreServ = normalizarTexto(izena);
            const cumpleTexto = texto === "" || texto === "___BLOQUEADO___" || nombreServ.includes(texto);

            if (cumpleTexto && cumpleFiltro) {
                bounds.extend([lat, lng]);

                const colPrincipal = '#616161';    
                const telefonoa = p.TELEFONOA || p.telefonoa || p.Telefonoa;
                const rawUbicacion = (p.helbidea || p.HELBIDEA || p.Helbidea || "").trim() !== "" ? (p.helbidea || p.HELBIDEA || p.Helbidea) : (p.udalerri || p.UDALERRIA || p.Udalerri || "");
                const infoUbicacion = capitalizarTexto(rawUbicacion);
                const rawWeb = p.WEB || p.web || p['WEB ORRIA'] || p['web orria'];
                const webURL = rawWeb ? (rawWeb.toString().startsWith('http') ? rawWeb : 'https://' + rawWeb) : null;

                const esFav = esFavorito(izena);
                let markerServ = L.marker([lat, lng], { icon: iconoZerbitzuak, nombre: izena });

                markerServ.bindPopup(`
                    <div class="popup-card" style="font-family: 'Montserrat', sans-serif; border: 2px solid ${colPrincipal}; padding: 0; border-radius: 15px; overflow: hidden; width: 280px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); position: relative;">
                        <button class="btn-favorito-popup ${esFav ? 'activo' : ''}" data-nombre="${izena}" onclick="toggleFavorito('${izena.toString().replace(/'/g, "\\'")}')" style="position: absolute; top: 10px; right: 10px; z-index: 10; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: ${esFav ? '#ffebee' : '#ffffff'}; border: 1px solid ${esFav ? '#e53935' : '#ccc'}; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.15); transition: all 0.2s;" title="${t('popupGogokoGorde')}">
                            <span class="icono-corazon-span" style="font-size: 14px; line-height: 1; filter: ${esFav ? 'none' : 'drop-shadow(0 0 1px rgba(0,0,0,0.8))'};">${esFav ? '❤️' : '🤍'}</span>
                        </button>

                        <div style="background: ${colPrincipal}; padding: 22px 15px 15px 15px; text-align: center; position: relative;">
                            <div style="padding-left: 25px; padding-right: 25px; margin-bottom: 6px;">
                                <span style="font-weight: 700; display: inline-block; font-size: 1.15em; line-height: 1.3; color: white; font-family: 'Montserrat', sans-serif;">${izena.toString().toUpperCase()}</span>
                            </div>
                            ${infoUbicacion ? `<div style="margin-top: 8px; color: white; font-weight: 600; font-size: 0.85em; font-family: 'Montserrat', sans-serif;">${infoUbicacion}</div>` : ''}
                            ${calcularDistanciaHTML(lat, lng)}
                        </div>
                    </div>`);

                capasZerbitzuak.addLayer(markerServ);
                listaElementosParaTabla.push({
                    tipo: t('tipoServicio'),
                    nombre: izena,
                    subtitulo: infoUbicacion,
                    lat: lat,
                    lng: lng,
                    telefono: telefonoa,
                    web: webURL,
                    imagen: null,
                    iconoTipo: 'ℹ️',
                    categoriaOriginal: 'zerbitzu'
                });
            }
        });
    }

    if (soloFavoritos) {
        if (!mapa.hasLayer(capasSalmenta)) capasSalmenta.addTo(mapa);
        if (!mapa.hasLayer(capasAzokak)) capasAzokak.addTo(mapa);
        if (!mapa.hasLayer(capasZerbitzuak)) capasZerbitzuak.addTo(mapa);
        if (!mapa.hasLayer(capasEkoizleak)) capasEkoizleak.addTo(mapa);
    } else {
        if (hayFiltroSalmenta) { if (!mapa.hasLayer(capasSalmenta)) capasSalmenta.addTo(mapa); } else { if (mapa.hasLayer(capasSalmenta)) mapa.removeLayer(capasSalmenta); }
        if (hayFiltroAzoka) { if (!mapa.hasLayer(capasAzokak)) capasAzokak.addTo(mapa); } else { if (mapa.hasLayer(capasAzokak)) mapa.removeLayer(capasAzokak); }
        if (hayFiltroZerbitzu) { if (!mapa.hasLayer(capasZerbitzuak)) capasZerbitzuak.addTo(mapa); } else { if (mapa.hasLayer(capasZerbitzuak)) mapa.removeLayer(capasZerbitzuak); }

        if (mostrarEkoizleak) {
            if (!mapa.hasLayer(capasEkoizleak)) capasEkoizleak.addTo(mapa);
        } else {
            if (mapa.hasLayer(capasEkoizleak)) mapa.removeLayer(capasEkoizleak);
        }
    }

    comprobarFiltrosActivos();

    const spanContador = document.getElementById('contador-visibles');
    if (spanContador) {
        let totalPintadoReal = 0;
        if (mapa.hasLayer(capasEkoizleak)) totalPintadoReal += capasEkoizleak.getLayers().length;
        if (mapa.hasLayer(capasSalmenta)) totalPintadoReal += capasSalmenta.getLayers().length;
        if (mapa.hasLayer(capasAzokak)) totalPintadoReal += capasAzokak.getLayers().length;
        if (mapa.hasLayer(capasZerbitzuak)) totalPintadoReal += capasZerbitzuak.getLayers().length;
        
        spanContador.textContent = totalPintadoReal;
    }

    actualizarVistaListaContenido(listaElementosParaTabla);

    if (ajustarZoom && modoVistaActual === 'mapa') {
        if (elementoBuscadoEspecifico) {
            mapa.flyTo([elementoBuscadoEspecifico.lat, elementoBuscadoEspecifico.lng], 16, { duration: 1.5, easeLinearity: 0.25 });
        } else if (bounds.isValid() && (texto !== "" || checkboxesProductos.length > 0 || checksSellos.length > 0 || hayFiltroSalmenta || hayFiltroAzoka || hayFiltroZerbitzu || soloFavoritos || soloAbiertoAhora || radioKmSeleccionado !== null)) {
            mapa.flyToBounds(bounds, { padding: [50, 50], maxZoom: 16, duration: 1.5, easeLinearity: 0.25 });
        } else if (texto === "" && checkboxesProductos.length === 0 && checksSellos.length === 0 && !hayFiltroSalmenta && !hayFiltroAzoka && !hayFiltroZerbitzu && !soloFavoritos && !soloAbiertoAhora && radioKmSeleccionado === null) {
            mapa.flyTo([43.05, -2.25], 12, { duration: 1.5, easeLinearity: 0.25 });
        }
    }
};

// ==========================================
// VISTA DE LISTA / TABLA ALTERNATIVA (ZERRENDA)
// ==========================================
function actualizarVistaListaContenido(elementos) {
    const contenedorLista = document.getElementById('contenedor-vista-lista');
    if (!contenedorLista) return;

    if (elementos.length === 0) {
        contenedorLista.innerHTML = `<div style="text-align: center; padding: 40px; color: #666; font-family: 'Montserrat', sans-serif;">${t('noResultados')}</div>`;
        return;
    }

    if (latUsuario !== null && lngUsuario !== null) {
        elementos.sort((a, b) => {
            const distA = L.latLng(latUsuario, lngUsuario).distanceTo(L.latLng(a.lat, a.lng));
            const distB = L.latLng(latUsuario, lngUsuario).distanceTo(L.latLng(b.lat, b.lng));
            return distA - distB;
        });
    } else {
        elementos.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    let html = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; padding: 20px; font-family: 'Montserrat', sans-serif;">`;
    elementos.forEach(item => {
        const esFav = esFavorito(item.nombre);
        const imagenItem = item.imagen ? `<img src="${item.imagen}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 8px 8px 0 0;" alt="${item.nombre}">` : `<div style="width: 100%; height: 80px; background: #eef2f5; display: flex; align-items: center; justify-content: center; font-size: 2em; border-radius: 8px 8px 0 0;">${item.iconoTipo}</div>`;
        
        let distanciaTextoHTML = '';
        if (latUsuario !== null && lngUsuario !== null) {
            const dMetros = L.latLng(latUsuario, lngUsuario).distanceTo(L.latLng(item.lat, item.lng));
            const dTxt = dMetros < 1000 ? Math.round(dMetros) + ' m' : (dMetros / 1000).toFixed(1) + ' km';
            distanciaTextoHTML = `<div style="font-size: 0.8em; color: #2e7d32; font-weight: bold; margin-top: 4px;">📍 Zu gandik ${dTxt}-tara</div>`;
        }

        html += `
            <div style="background: white; color: #333; border: 1px solid #e0e0e0; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
                <button onclick="toggleFavorito('${item.nombre.replace(/'/g, "\\'")}')" style="position: absolute; top: 10px; right: 10px; z-index: 10; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: ${esFav ? '#ffebee' : '#ffffff'}; border: 1px solid ${esFav ? '#e53935' : '#ccc'}; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.15);" title="${t('popupGogokoGorde')}">
                    <span style="font-size: 14px;">${esFav ? '❤️' : '🤍'}</span>
                </button>
                ${imagenItem}
                <div style="padding: 15px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <span style="background: #e8f5e9; color: #2e7d32; font-size: 0.7em; padding: 2px 8px; border-radius: 6px; font-weight: bold; text-transform: uppercase;">${item.iconoTipo} ${item.tipo}</span>
                        <h3 style="margin: 8px 0 4px 0; font-size: 1.1em; color: #2c3e50; font-weight: bold;">${item.nombre}</h3>
                        <p style="margin: 0; font-size: 0.85em; color: #666;">${item.subtitulo || ''}</p>
                        ${distanciaTextoHTML}
                    </div>
                    <div style="margin-top: 15px; display: flex; gap: 8px;">
                        <button onclick="cambiarAMapaYCentrar(${item.lat}, ${item.lng}, '${item.nombre.replace(/'/g, "\\'")}', '${item.categoriaOriginal}')" style="flex: 1; background: #2d5a3f; color: white; border: none; padding: 8px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.85em;">${t('btnVerEnMapa')}</button>
                        ${item.telefono ? `<a href="tel:${item.telefono}" style="background: #eef2f5; color: #2d5a3f; border: 1px solid #ccc; padding: 8px 12px; border-radius: 6px; text-decoration: none; font-weight: bold; text-align: center; font-size: 0.85em;">📞</a>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    html += `</div>`;
    contenedorLista.innerHTML = html;
}

window.cambiarAMapaYCentrar = function(lat, lng, nombre, categoriaOriginal) {
    const btnAlternar = document.getElementById('btn-alternar-vista-modo');
    if (modoVistaActual === 'lista' && btnAlternar) {
        btnAlternar.click(); 
    }
    
    setTimeout(() => {
        if (!mapa) return;
        
        let capaObjetivo;
        if (categoriaOriginal === 'ekoizle') {
            capaObjetivo = capasEkoizleak;
        } else if (categoriaOriginal === 'salmenta') {
            capaObjetivo = capasSalmenta;
        } else if (categoriaOriginal === 'azoka') {
            capaObjetivo = capasAzokak;
        } else if (categoriaOriginal === 'zerbitzu') {
            capaObjetivo = capasZerbitzuak;
        }

        if (capaObjetivo && !mapa.hasLayer(capaObjetivo)) {
            capaObjetivo.addTo(mapa);
        }

        mapa.setView([lat, lng], 17);

        setTimeout(() => {
            let encontradoLayer = false;
            const nombreBusqueda = normalizarTexto(nombre);
            
            const buscarYAbrirPopup = (capa) => {
                if (encontradoLayer || !capa) return;
                capa.eachLayer(layer => {
                    if (encontradoLayer) return;
                    
                    const latL = layer.getLatLng?.().lat;
                    const lngL = layer.getLatLng?.().lng;
                    const layerNombre = normalizarTexto(layer.options?.nombre || '');
                    
                    const coincidePosicion = latL && lngL && Math.abs(latL - lat) < 0.00001 && Math.abs(lngL - lng) < 0.00001;
                    const coincideNombre = layerNombre && (layerNombre === nombreBusqueda || layerNombre.includes(nombreBusqueda));

                    if (coincidePosicion || coincideNombre) {
                        if (typeof capa.zoomToShowLayer === 'function') {
                            capa.zoomToShowLayer(layer, () => {
                                layer.openPopup();
                            });
                        } else if (typeof layer.openPopup === 'function') {
                            layer.openPopup();
                        } else {
                            layer.fire('click');
                        }
                        encontradoLayer = true;
                    }
                });
            };

            if (capaObjetivo) {
                buscarYAbrirPopup(capaObjetivo);
            }
            if (!encontradoLayer) {
                [capasEkoizleak, capasSalmenta, capasAzokak, capasZerbitzuak].forEach(c => buscarYAbrirPopup(c));
            }
        }, 400);
    }, 200);
};

window.abrirPopupEkoizle = function(nombreEkoizle) {
    if (!nombreEkoizle) return;
    const nombreClicado = normalizarTexto(nombreEkoizle);
    mapa.closePopup();

    let match = datos?.find(p => {
        const u = normalizarTexto(p.USTIATEGIAREN_IZENA);
        const m = normalizarTexto(p['SALMENTA MARKA']);
        return u === nombreClicado || m === nombreClicado || (u && u.includes(nombreClicado)) || (m && m.includes(nombreClicado));
    });

    if (match && match['ycoord (º)'] && match['xcoord (º)']) {
        const lat = parseFloat(match['ycoord (º)']);
        const lng = parseFloat(match['xcoord (º)']);

        if (!isNaN(lat) && !isNaN(lng)) {
            if (mapa.hasLayer(capasSalmenta)) mapa.removeLayer(capasSalmenta);
            if (mapa.hasLayer(capasAzokak)) mapa.removeLayer(capasAzokak);
            if (mapa.hasLayer(capasZerbitzuak)) mapa.removeLayer(capasZerbitzuak);
            if (!mapa.hasLayer(capasEkoizleak)) capasEkoizleak.addTo(mapa);

            mapa.setView([lat, lng], 16);

            setTimeout(() => {
                let encontradoLayer = false;
                capasEkoizleak.eachLayer(layer => {
                    if (encontradoLayer) return;
                    const latL = layer.getLatLng?.().lat;
                    const lngL = layer.getLatLng?.().lng;
                    if (latL && lngL && Math.abs(latL - lat) < 0.00001 && Math.abs(lngL - lng) < 0.00001) {
                        if (typeof layer.openPopup === 'function') {
                            layer.openPopup();
                        } else {
                            layer.fire('click');
                        }
                        encontradoLayer = true;
                    }
                });
            }, 200);
        }
    }
};

function actualizarSugerencias(valor) {
    const datalist = document.getElementById('sugerencias-nombres');
    if (!datalist) return;
    datalist.innerHTML = ''; 
    const textoFiltro = normalizarTexto(valor);
    if (textoFiltro.length === 0) return;

    const sugerenciasSet = new Set();

    datos?.forEach(p => {
        const nombre = p.USTIATEGIAREN_IZENA || p.izena || '';
        const marca = p['SALMENTA MARKA'] || '';
        const pueblo = capitalizarTexto(p.udalerria || p.Udalerria || p.UDALERRIA || p.herria || p.Herria || p.HERRIA || p.pueblo || p.Pueblo || '');
        
        if (normalizarTexto(nombre).includes(textoFiltro) || normalizarTexto(marca).includes(textoFiltro)) {
            let textoOpcion = (normalizarTexto(marca).includes(textoFiltro) && marca.trim() !== '') ? marca.trim() : nombre;
            if (pueblo) textoOpcion += ` (${pueblo})`;
            sugerenciasSet.add(textoOpcion);
        }
    });

    datosSalmenta?.forEach(p => {
        const nombre = p.izena || '';
        const pueblo = capitalizarTexto(p.udalerria || p.Udalerria || p.UDALERRIA || '');
        if (normalizarTexto(nombre).includes(textoFiltro)) {
            sugerenciasSet.add(pueblo ? `${nombre} (${pueblo})` : nombre);
        }
    });

    datosAzokak?.forEach(p => {
        const nombre = p.izena || '';
        const pueblo = capitalizarTexto(p.udalerria || p.Udalerria || p.UDALERRIA || '');
        if (normalizarTexto(nombre).includes(textoFiltro)) {
            sugerenciasSet.add(pueblo ? `${nombre} (${pueblo})` : nombre);
        }
    });

    let contador = 0;
    sugerenciasSet.forEach(textoOpcion => {
        if (contador >= 20) return;
        const option = document.createElement('option');
        option.value = textoOpcion;
        datalist.appendChild(option);
        contador++;
    });
}

window.onload = async function() {
    registrarEstadistica('visita_web', 'Home');

    const contenedorListaDOM = document.createElement('div');
    contenedorListaDOM.id = 'contenedor-vista-lista';
    contenedorListaDOM.style.cssText = 'display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #f8f9fa; z-index: 1000; overflow-y: auto; padding: 15px 15px 15px 340px; box-sizing: border-box;';
    document.body.appendChild(contenedorListaDOM);

    mapa = L.map('mapa', { zoomAnimation: true, fadeAnimation: true, markerZoomAnimation: true }).setView([43.05, -2.25], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(mapa);

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

    const ui = L.DomUtil.create('div', 'controles-mapa');
    ui.id = 'ui';
    ui.style.fontFamily = "'Montserrat', sans-serif";
    ui.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <button id="btn-alternar-vista-modo" style="background: #2d5a3f; color: white; border: none; border-radius: 6px; padding: 4px 8px; font-size: 0.75em; font-weight: bold; cursor: pointer; font-family: 'Montserrat', sans-serif;">📋 ${t('btnAlternarVista')}</button>
            <select id="select-idioma" onchange="cambiarIdioma(this.value)" style="background: #ffffff; border: 1px solid #ccc; border-radius: 6px; padding: 3px 6px; font-size: 0.8em; font-weight: bold; color: #2c5e2e; cursor: pointer; font-family: 'Montserrat', sans-serif;">
                <option value="eu" selected>Euskara (EU)</option>
                <option value="es">Castellano (CAS)</option>
            </select>
        </div>

        <div style="margin-bottom: 4px;">
            <input type="text" id="buscador" class="control-input" list="sugerencias-nombres" placeholder="${t('placeholderBusqueda')}" style="width: 100%; padding: 8px; box-sizing: border-box; border-radius: 8px; border: 1px solid #ccc; font-family: 'Montserrat', sans-serif;">
            <datalist id="sugerencias-nombres"></datalist>
        </div>
        
        <div style="font-size: 0.85em; font-weight: bold; color: #2c5e2e; margin: 4px 0 8px 2px; font-family: 'Montserrat', sans-serif;">
            <span id="label-contador-visibles">${t('guztiraIkusgai')}</span> <span id="contador-visibles">0</span>
        </div>

        <div id="resumen-filtros-activos" style="display: none; background: #f4f9f1; border: 1px dashed #a8d5ba; padding: 8px; border-radius: 8px; margin-bottom: 10px;"></div>

        <div style="margin-bottom: 10px; display: flex; gap: 6px;">
            <button id="btn-geolocalizar" title="Nire kokapena erakutsi" style="flex: 1; background: #f0f8ff !important; color: #2980b9 !important; border: 1px solid #85c1e9 !important; padding: 4px 6px; border-radius: 4px; cursor: pointer; font-size: 0.65em; font-weight: bold; font-family: 'Montserrat', sans-serif;">${t('btnGeolocalizar')}</button>
            <select id="select-radio-distancia" disabled style="background: #ffffff; border: 1px solid #85c1e9; border-radius: 4px; padding: 3px; font-size: 0.7em; font-weight: bold; color: #2980b9; cursor: pointer; font-family: 'Montserrat', sans-serif; opacity: 0.4; pointer-events: none;">
                <option value="" selected>${t('radioTodos')}</option>
                <option value="5">${t('radio5')}</option>
                <option value="10">${t('radio10')}</option>
                <option value="15">${t('radio15')}</option>
                <option value="20">${t('radio20')}</option>
            </select>
        </div>

        <div style="margin-bottom: 8px; display: flex; flex-direction: column; gap: 4px;">
            <label style="display: flex; align-items: center; gap: 6px; font-size: 0.85em; font-weight: bold; color: #c0392b; cursor: pointer; font-family: 'Montserrat', sans-serif;">
                <input type="checkbox" id="filtro-solo-favoritos" style="cursor: pointer;"> ❤️ <span id="label-texto-favoritos">${t('txtFavoritos')}</span>
            </label>
        </div>

        <div style="margin-bottom: 14px; margin-top: 2px; display: flex; justify-content: flex-end; align-items: center;">
            <button id="btn-reset-filtros" title="Garbitu hautapenak" style="background: #ff6b6b; color: white; border: none; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-size: 0.65em; font-weight: bold; font-family: 'Montserrat', sans-serif;" aria-label="Garbitu hautapenak">${t('btnReset')}</button>
        </div>
        <div id="indicador-activos" style="font-size: 0.8em; color: #d9534f; margin-bottom: 8px; font-weight: bold; display: none; font-family: 'Montserrat', sans-serif;">${t('filtrosActivosIndicador')}</div>
    `;
    document.body.appendChild(ui);

    document.getElementById('select-radio-distancia').addEventListener('change', (e) => {
        const val = e.target.value;
        radioKmSeleccionado = val ? parseInt(val) : null;
        window.renderizar(false);
    });

    document.getElementById('btn-alternar-vista-modo').addEventListener('click', () => {
        const mapaDiv = document.getElementById('mapa');
        if (modoVistaActual === 'mapa') {
            modoVistaActual = 'lista';
            mapaDiv.style.display = 'none';
            contenedorListaDOM.style.display = 'block';
            document.getElementById('btn-alternar-vista-modo').textContent = t('btnAlternarMapa');
            window.renderizar(false);
        } else {
            modoVistaActual = 'mapa';
            contenedorListaDOM.style.display = 'none';
            mapaDiv.style.display = 'block';
            document.getElementById('btn-alternar-vista-modo').textContent = t('btnAlternarVista');
            mapa.invalidateSize();
        }
    });

    const divSellos = document.createElement('div');
    divSellos.className = 'cat-group';
    divSellos.innerHTML = `<div id="header-cat-sellos" class="cat-header" style="background: #fffde7; border: 1px solid #f9a825; font-weight: bold; cursor: pointer; padding: 8px; border-radius: 6px; margin-bottom: 5px; font-family: 'Montserrat', sans-serif; color: #f57f17;">${t('catSellos')} ▾</div><div class="cat-body" style="display:none; padding-left: 10px;"></div>`;
    COL_SELLOS.forEach(sello => {
        const iconoPropio = ICONOS_SELLOS[sello] || '🏅';
        divSellos.querySelector('.cat-body').innerHTML += `<label class="checkbox-item" style="display:block; margin-bottom:4px; font-family: 'Montserrat', sans-serif; font-weight: 500;"><input type="checkbox" class="filtro-sello" value="${sello}"> <span>${iconoPropio} ${sello}</span></label>`;
    });
    ui.appendChild(divSellos);

    const divSalmenta = document.createElement('div');
    divSalmenta.className = 'cat-group';
    divSalmenta.innerHTML = `<div id="header-cat-salmenta" class="cat-header" style="background: #eef2f5; font-weight: bold; cursor: pointer; padding: 8px; border-radius: 6px; margin-bottom: 5px; font-family: 'Montserrat', sans-serif;">${t('catSalmenta')} ▾</div><div class="cat-body" style="display:none; padding-left: 10px;"></div>`;
    ['Harategia', 'Denda', 'Frutategia', 'Okindegia', 'Jatetxea', 'Taberna', 'Ostatua', 'Kooperatiba', 'Klik eta jaso', 'Vending makinak'].forEach(tipo => {
        divSalmenta.querySelector('.cat-body').innerHTML += `<label class="checkbox-item" style="display:block; margin-bottom:3px; font-family: 'Montserrat', sans-serif;"><input type="checkbox" class="filtro-mota" value="${tipo.toLowerCase()}"> <span class="filtro-mota-label" data-original="${tipo}">${traducirOpcionSalmenta(tipo)}</span></label>`;
    });
    ui.appendChild(divSalmenta);

    const divAzokak = document.createElement('div');
    divAzokak.className = 'cat-group';
    divAzokak.innerHTML = `<div id="header-cat-azokak" class="cat-header" style="background: #eef2f5; font-weight: bold; cursor: pointer; padding: 8px; border-radius: 6px; margin-bottom: 5px; font-family: 'Montserrat', sans-serif;">${t('catAzokak')} ▾</div><div class="cat-body" style="display:none; padding-left: 10px;"></div>`;
    ['Asterokoa', 'Azoka berezia'].forEach(tipo => {
        divAzokak.querySelector('.cat-body').innerHTML += `<label class="checkbox-item" style="display:block; margin-bottom:3px; font-family: 'Montserrat', sans-serif;"><input type="checkbox" class="filtro-azoka" value="${tipo.toLowerCase()}"> <span class="filtro-azoka-label" data-original="${tipo}">${traducirOpcionAzoka(tipo)}</span></label>`;
    });
    ui.appendChild(divAzokak);

    const divZerbitzuak = document.createElement('div');
    divZerbitzuak.className = 'cat-group';
    divZerbitzuak.innerHTML = `<div id="header-cat-zerbitzuak" class="cat-header" style="background: #eef2f5; font-weight: bold; cursor: pointer; padding: 8px; border-radius: 6px; margin-bottom: 5px; font-family: 'Montserrat', sans-serif;">${t('catZerbitzuak')} ▾</div><div class="cat-body" style="display:none; padding-left: 10px;"></div>`;
    ['Ekitaldia', 'Elkartea', 'Landetxea', 'Makinaria zerbitzua', 'Museo eta interpretazio zentroak', 'Nekazal turismoak', 'Sagardotegia', 'Txakolindegia', 'Turismo aktiboa'].forEach(tipo => {
        divZerbitzuak.querySelector('.cat-body').innerHTML += `<label class="checkbox-item" style="display:block; margin-bottom:3px; font-family: 'Montserrat', sans-serif;"><input type="checkbox" class="filtro-zerbitzuak" value="${tipo.toLowerCase()}"> <span class="filtro-zerbitzuak-label" data-original="${tipo}">${traducirOpcionZerbitzu(tipo)}</span></label>`;
    });
    ui.appendChild(divZerbitzuak);

    const divAbiertoAhoraContainer = document.createElement('div');
    divAbiertoAhoraContainer.id = 'contenedor-filtro-abierto';
    divAbiertoAhoraContainer.style.cssText = 'margin: 10px 0 15px 2px; opacity: 0.4; pointer-events: none; transition: opacity 0.3s ease;';
    divAbiertoAhoraContainer.innerHTML = `
        <label style="display: flex; align-items: center; gap: 6px; font-size: 0.85em; font-weight: bold; color: #27ae60; cursor: pointer; font-family: 'Montserrat', sans-serif;">
            <input type="checkbox" id="filtro-abierto-ahora" style="cursor: pointer;" disabled> 🟢 <span id="label-texto-abierto">${t('txtAbiertoAhora')}</span>
        </label>
    `;
    ui.appendChild(divAbiertoAhoraContainer);

    const fraseSeparadora = document.createElement('div');
    fraseSeparadora.innerHTML = `<p id="label-seleccionar-producto" style="font-size: 0.85em; color: #666; margin: 15px 0 5px 5px; font-style: italic; font-family: 'Montserrat', sans-serif;">${t('seleccionarProducto')}</p>`;
    ui.appendChild(fraseSeparadora);

    const cabeceras = XLSX.utils.sheet_to_json(wb.Sheets['Ekoizleak'], { header: 1 });
    const estructura = {};
    cabeceras[1].forEach((cat, idx) => {
        let nombreColumna = cabeceras[2][idx];
        if (!cat || cat === 'SALMENTA PUNTUAK' || !nombreColumna || COL_SELLOS.includes(nombreColumna)) return;
        let catFinal = (cat === 'HARAGIA' || cat === 'OILOAK') ? 'HARAGIA ETA ARRAUTZAK' : cat;
        if (!estructura[catFinal]) estructura[catFinal] = {};
        let n = nombreColumna.toLowerCase();
        let subgrupo = n.includes('esnea') ? 'Esnea' : n.includes('gazta') ? 'Gazta' : n.includes('txerri') ? 'Txerrikiak' : n.includes('oilasko') ? 'Oilaskoak' : n.includes('arrautza') ? 'Arrautzak' : n.includes('haragia') ? 'Haragia' : nombreColumna;
        if (!estructura[catFinal][subgrupo]) estructura[catFinal][subgrupo] = [];
        estructura[catFinal][subgrupo].push(nombreColumna);
    });

    Object.keys(estructura).forEach(cat => {
        const div = document.createElement('div');
        div.className = 'cat-group cat-group-producto';
        div.setAttribute('data-cat-key', cat);
        const iconoCat = ICONOS[cat] || '📦';
        div.innerHTML = `<div class="cat-header" data-icono="${iconoCat}" style="background: #f9f9f9; font-weight: bold; cursor: pointer; padding: 6px; border-radius: 4px; margin-bottom: 3px; font-size:0.95em; font-family: 'Montserrat', sans-serif;">${iconoCat} ${traducirCatProd(cat)} ▾</div><div class="cat-body" style="display:none; padding-left: 10px;"></div>`;
        Object.keys(estructura[cat]).forEach(sub => {
            div.querySelector('.cat-body').innerHTML += `<label class="checkbox-item" style="display:block; margin-bottom:2px; font-size:0.9em; font-family: 'Montserrat', sans-serif;"><input type="checkbox" data-col="${estructura[cat][sub].join(',')}"> <span class="subgrupo-label" data-original="${sub}">${traducirSubgrupo(sub)}</span></label>`;
        });
        ui.appendChild(div);
    });

    ui.querySelectorAll('.cat-header').forEach(header => {
        header.onclick = (e) => {
            const body = e.currentTarget.nextElementSibling;
            if (body) {
                const estaAbriendo = body.style.display === 'none';
                body.style.display = estaAbriendo ? 'block' : 'none';
                if (estaAbriendo) registrarEstadistica('abrir_categoria', e.currentTarget.textContent.trim().replace(' ▾', ''));
            }
        };
    });

    const inputBuscador = document.getElementById('buscador');
    if (inputBuscador) {
        inputBuscador.addEventListener('input', (e) => {
            actualizarSugerencias(e.target.value);
            window.renderizar(false);
        });

        inputBuscador.addEventListener('change', (e) => {
            const valor = e.target.value;
            if (valor.trim() !== "") {
                window.renderizar(true);
            }
        });
    }

    ui.addEventListener('change', (e) => {
        if (e.target.matches('input[type="checkbox"]')) {
            window.renderizar(false);
            if (e.target.checked) {
                registrarEstadistica('filtro_marcado', e.target.parentElement.textContent.trim());
            }
        }
    });

    const btnReset = document.getElementById('btn-reset-filtros');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            ui.querySelectorAll('input[type="checkbox"]').forEach(ch => ch.checked = false);
            if (inputBuscador) inputBuscador.value = '';
            const selectRadio = document.getElementById('select-radio-distancia');
            if (selectRadio) {
                selectRadio.value = '';
                selectRadio.disabled = true;
                selectRadio.style.opacity = '0.4';
                selectRadio.style.pointerEvents = 'none';
            }
            radioKmSeleccionado = null;
            latUsuario = null;
            lngUsuario = null;
            actualizarSugerencias('');
            window.renderizar(true);
        });
    }

    let marcadorUsuario = null;
    const btnGeolocalizar = document.getElementById('btn-geolocalizar');
    if (btnGeolocalizar) {
        btnGeolocalizar.addEventListener('click', () => {
            if (!navigator.geolocation) { alert(t('geoErrorPermiso')); return; }
            btnGeolocalizar.textContent = t('geoBuscando');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    latUsuario = position.coords.latitude;
                    lngUsuario = position.coords.longitude;
                    btnGeolocalizar.textContent = t('btnGeolocalizar');
                    if (marcadorUsuario) mapa.removeLayer(marcadorUsuario);
                    marcadorUsuario = L.layerGroup([
                        L.circle([latUsuario, lngUsuario], { radius: position.coords.accuracy, color: '#1a5276', fillColor: '#a9cce3', fillOpacity: 0.4, weight: 1 }),
                        L.marker([latUsuario, lngUsuario], { icon: L.divIcon({ className: 'user-geo-marker', html: '<div style="background-color: #1a5276; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>', iconSize: [14, 14], iconAnchor: [7, 7] }) }).bindPopup(`<b>${t('popupHemenZaude')}</b>`)
                    ]).addTo(mapa);
                    mapa.setView([latUsuario, lngUsuario], 15);
                    
                    // Habilitamos el selector de distancias al obtener la ubicación con éxito
                    const selectRadio = document.getElementById('select-radio-distancia');
                    if (selectRadio) {
                        selectRadio.disabled = false;
                        selectRadio.style.opacity = '1';
                        selectRadio.style.pointerEvents = 'auto';
                    }

                    window.renderizar(false); 
                },
                () => { btnGeolocalizar.textContent = t('btnGeolocalizar'); alert(t('geoErrorGeneral')); },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    }

    const esMovil = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (esMovil && !document.querySelector('.btn-toggle-filtros-movil')) {
        const btnToggleFiltros = document.createElement('button');
        btnToggleFiltros.className = 'btn-toggle-filtros-movil';
        btnToggleFiltros.innerHTML = t('btnAlternarMovil');
        btnToggleFiltros.style.cssText = 'position: fixed; bottom: 25px; left: 50%; transform: translateX(-50%); z-index: 99999; background: #2d5a27; color: white; border: none; padding: 14px 28px; border-radius: 30px; font-weight: bold; font-size: 0.95em; box-shadow: 0 4px 15px rgba(0,0,0,0.4); cursor: pointer; font-family: Montserrat, sans-serif;';
        document.body.appendChild(btnToggleFiltros);

        btnToggleFiltros.addEventListener('click', (e) => {
            e.stopPropagation();
            const panelFiltros = document.querySelector('.controles-mapa');
            if (panelFiltros) {
                panelFiltros.classList.add('mobile-open');
                btnToggleFiltros.style.display = 'none';

                if (!panelFiltros.querySelector('.panel-handle')) {
                    const handle = document.createElement('div');
                    handle.className = 'panel-handle';
                    handle.style.cssText = 'width: 45px; height: 5px; background: #cbd5e1; border-radius: 3px; margin: 0 auto 15px auto; cursor: pointer;';
                    panelFiltros.insertBefore(handle, panelFiltros.firstChild);
                    let touchStartY = 0;
                    handle.addEventListener('touchstart', (evt) => { touchStartY = evt.touches[0].screenY; }, { passive: true });
                    handle.addEventListener('touchend', (evt) => {
                        if (evt.changedTouches[0].screenY - touchStartY > 40) {
                            panelFiltros.classList.remove('mobile-open');
                            btnToggleFiltros.style.display = 'block';
                        }
                    }, { passive: true });
                }
            }
        });
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn && (btn.innerText.includes('Garbitu') || btn.id.includes('limpiar') || btn.innerText.includes('Limpiar'))) {
            const cerrarCategorias = () => document.querySelectorAll('.cat-body').forEach(c => c.style.setProperty('display', 'none', 'important'));
            cerrarCategorias();
            setTimeout(cerrarCategorias, 50);
            setTimeout(cerrarCategorias, 150);
        }
    });

    window.renderizar(true);

    const loader = document.getElementById('loader-overlay');
    if (loader) {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.3s ease';
        setTimeout(() => loader.remove(), 300);
    }
};