// Por si se desea usar el símbolo $. Se usa <var> para poder
// ser compatible con librerías que usen dicho símbolo.
var $, $$;

/**
 * @summary JsNode es similar a un jQuery reducido usando solo ES6+ y
 * el sistema de Promises/async/await donde es necesario.
 * @copyright miloter
 * @license MIT
 * @since 2025-06-06 
 * @version 0.6.0 2025-06-23
 */
class JsNode {
    // Constantes de utilidad
    static #dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    static #dayNames3L = JsNode.#dayNames.map(d => d.substring(0, 3));
    static #monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    static #monthNames3L = JsNode.#monthNames.map(m => m.substring(0, 3));
    static #blockTagNames = ['ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'CANVAS',
            'DD', 'DIV', 'DL', 'DT', 'FIELDSET',
            'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1',
            'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER',
            'HR', 'LI', 'MAIN', 'NAV', 'NOSCRIPT',
            'OL', 'P', 'PRE', 'SECTION', 'TABLE',
            'TFOOT', 'UL', 'VIDEO'];

    // Fotogramas por animación: La duración se divide en fpa partes animadas
    static #fpa = 60;
    // Cola de animaciones
    static #queue = [];

    // Flag que obliga a detener la animación actual si es true
    static #stopAnimation = false;

    // Nodos DOM de la instancia actual
    #nodes;

    /**
     * Crea un nuevo JsNode.         
     * @param {Array} nodes Un Array de nodos del DOM.
     */
    constructor(nodes = []) {
        if (!(nodes instanceof Array)) {
            nodes = [nodes];
        }
        this.#nodes = nodes;
    }

    static #removeListeners(node, eventName) {
        if (!node.listeners) return;

        const listeners = node.listeners[eventName];

        if (!listeners) return;

        for (const listener of listeners) {
            node.removeEventListener(eventName, listener);
        }
        delete node.listeners[eventName];
    }

    static #removeAllListeners(node) {
        if (!node.listeners) return;

        for (const eventName in node.listeners) {
            JsNode.#removeListeners(node, eventName);
        }
    }

    static #removeData(node) {
        if (node.displayComputed) {
            delete node.displayComputed;
        }        
    }

    static #setAttr(node, name, value) {
        if (value === null) {
            node.removeAttribute(name);
        } else {
            node.setAttribute(name, value)
        }
    }

    static async #buildResponse(r, contentType) {
        const resp = {};

        resp.response = r;
        if (contentType === 'json') {
            resp.data = await r.json();
        } else if (contentType === 'text') {
            resp.data = await r.text();
        } else {
            resp.data = await r.blob();
        }
        return resp;
    }

    static async #postOrPut(url, method, bodyObject, contentType) {
        let headers, body;

        contentType = contentType.toLowerCase();
        if (contentType === 'json') {
            headers = { 'Content-Type': 'application/json' };
            body = JSON.stringify(bodyObject);
        } else {
            headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            body = JsNode.objectToUrlEncoded(bodyObject);
        }

        return fetch(url, {
            credentials: 'include',
            headers,
            method,
            body
        }).then(r => JsNode.#buildResponse(r, contentType));
    }

    static async #getOrDelete(url, method, params, contentType) {
        contentType = contentType.toLowerCase();
        params = JsNode.objectToUrlEncoded(params);
        if (params) {
            url += '?' + params
        }
        return fetch(url, {
            credentials: 'include',
            method
        }).then(r => JsNode.#buildResponse(r, contentType));
    }

    static #sleep(ms = 1) {
        if (JsNode.#stopAnimation) {
            return Promise.resolve();
        }
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static #getCssComputed(node) {
        const { display, width, height, opacity, overflow } = getComputedStyle(node);

        return { display, width, height, opacity, overflow };
    }

    static async #showAnimateNode(node, ms, effect) {
        const msPart = ms / JsNode.#fpa; // Milisegundos por animación        
        const cs = JsNode.#buildCssComputed(node);
        let width, height, opacity, widthPart, heightPart, opacityPart;

        // Si el display es inline, el efecto solo puede ser opacity
        if (cs.display === 'inline') {
            effect = 'opacity';
        }
        
        // Prepara variables de animación
        if (cs.display !== 'inline') {
            width = (effect === 'all' || effect === 'width' ? 0 : parseFloat(cs.width));
            height = (effect === 'all' || effect === 'height' ? 0 : parseFloat(cs.height));
            widthPart = parseFloat(cs.width) / JsNode.#fpa;
            heightPart = parseFloat(cs.height) / JsNode.#fpa;
            // Estilos de animación a los valores iniciales
            node.style.width = width + 'px';
            node.style.height = height + 'px';
        }

        opacity = (effect === 'all' || effect === 'opacity' ? 0 : cs.opacity);
        opacityPart = cs.opacity / JsNode.#fpa;        
        node.style.opacity = opacity;
        node.style.display = cs.display;
        
        // Para impedir que el texto salga de la caja
        node.style.overflow = 'hidden';

        while (ms > 0) {
            if (effect === 'all' || effect === 'width') {
                width += widthPart;
                node.style.width = width + 'px';
            }

            if (effect === 'all' || effect === 'height') {
                height += heightPart;
                node.style.height = height + 'px';
            }

            if (effect === 'all' || effect === 'opacity') {
                opacity += opacityPart;
                node.style.opacity = opacity;
            }


            await JsNode.#sleep(msPart);

            if (JsNode.#stopAnimation) break;

            ms -= msPart;
        }

        // Ajusta el css del nodo al computado        
        Object.assign(node.style, cs);
    }

    static async #hideAnimateNode(node, ms, effect) {
        const msPart = ms / JsNode.#fpa; // Milisegundos por animación                
        const cs = JsNode.#buildCssComputed(node);
        let width, height, opacity, widthPart, heightPart, opacityPart;

        // Si el display es inline, el efecto solo puede ser opacity
        if (cs.display === 'inline') {
            effect = 'opacity';
        }
        
        // Prepara variables de animación
        if (cs.display !== 'inline') {        
            width = parseFloat(cs.width);
            height = parseFloat(cs.height);
            widthPart = width / JsNode.#fpa;
            heightPart = height / JsNode.#fpa;
        }
        
        opacity = cs.opacity;
        opacityPart = opacity / JsNode.#fpa;
        
        // Para impedir que el texto salga de la caja
        node.style.overflow = 'hidden';

        while (ms > 0) {
            if (effect === 'all' || effect === 'width') {
                width -= widthPart;
                node.style.width = width + 'px';
            }

            if (effect === 'all' || effect === 'height') {
                height -= heightPart;
                node.style.height = height + 'px';
            }

            if (effect === 'all' || effect === 'opacity') {
                opacity -= opacityPart;
                node.style.opacity = opacity;
            }

            await JsNode.#sleep(msPart);

            if (JsNode.#stopAnimation) break;

            ms -= msPart;
        }

        // Restauramos el CSS computado antes de ocultar el nodo
        Object.assign(node.style, cs);
        // Finalmente se oculta el elemento
        JsNode.#setDisplayValue(node, false);        
    }

    /**
     * Permite envolver llamadas a funciones que se pueden almacenar en un array o cola.
     * @param {Function} fn La función a envolver.
     * @param {object} context El objeto this dentro de la función llamada.
     * @param {array} params Un array de argumentos para pasar a la función envuelta.
     * @returns {Function} Una función contenedora sin argumentos que llamará gracias
     * a la clausura a la función contenida con los argumentos correctos.
     */
    static #wrapFunction(fn, context, params) {
        return function () {
            fn.apply(context, params);
        }
    }

    // Establece el valor adecuado de display en el nodo
    static #setDisplayValue(node, isShow) {
        if (isShow) {
            // Selecciona el display en función del computado o
            // del nombre de la etiqueta
            node.style.display = node.style.displayComputed ||
                JsNode.#getDisplayValue(node.tagName);                        
        } else {
            // Guarda el valor del display computado actual
            node.style.displayComputed = getComputedStyle(node).display;
            node.style.display = 'none';
        }
    }

    /**
     * Devuelve el CSS computado del nodo suministrado. El CSS
     * devuelto equivale al que tendría el elemento en estado visible.
     * @param {HTMLElement} node
     * @returns {Object}
     */
    static #buildCssComputed(node) {
        let cs = JsNode.#getCssComputed(node);
                
        // Si no tenemos medidas de ancho y alto, forzamos su recálculo
        if (cs.display === 'none' || cs.width === 'auto' || cs.height === 'auto' ||
            cs.width === '0px' || cs.height === '0px'
        ) {
            const display = node.style.display;
            
            // Comprobamos si hay un display original
            if (cs.display === 'none' && node.style.displayComputed) {
                cs.display = node.style.displayComputed;
            }

            node.style.display = (cs.display !== 'none' ? cs.display : JsNode.#getDisplayValue(node.tagName));
            cs = JsNode.#getCssComputed(node);
            node.style.display = display;
        }

        return cs;
    }

    static #getDisplayValue(tagName) {
        if (JsNode.#blockTagNames.includes(tagName)) {
            return 'block';
        } else {
            return 'inline';
        }
    }

    /**
     * Este método permite usar $ como sustituto de <JsNode.select>.
     * @returns {JsNode} Una referencia a la clase.
     */
    static use$() {
        if ($) {
            console.warn('$ ya estaba definido. Se sobrescribe con <JsNode.select>');
        }
        $ = JsNode.select;
        $$ = JsNode;

        return JsNode;
    }

    /**
     * Retorna una promesa que se cumple cuando el DOM está disponible.
     * @returns {Promise<void>}
     */
    static domLoaded() {
        return new Promise((resolve, reject) => {
            try {
                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                    resolve(new JsNode());
                } else {
                    document.addEventListener('DOMContentLoaded', () => resolve(new JsNode()));
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Carga librerías JavaScript y CSS de forma síncrona usando JavaScript puro.     
     * @example JsNode.loadLibs(['lib1.css', 'lib2.css',
     *              'lib1.js',
     *              {path: 'lib2.js', endBody: true, type: 'module' },
     *              {path: 'lib3.js', endBody: true, noExtension: true },
     *          ])
     *          .then(() => console.log('Todo cargado!!!'));
     * @param {string|object|Array<(string|object)>} libs string indicando la
     * ruta de la librería, object con información de la librería a cargar
     * array de string con las rutas de las librerías, o array de object, donde
     * cada objeto contiene información de las librerías a cargar.
     * @returns {Promise<boolean>}
     */
    static loadLibs(libs) {
        return new Promise((resolve, reject) => {
            try {
                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                    resolve(_load(libs));
                } else {
                    document.addEventListener('DOMContentLoaded', () => resolve(_load(libs)));
                }
            } catch (error) {
                reject(error);
            }
        });

        async function _load(libs) {
            // Admite una librería individual en forma de ruta de cadena o envuelta en un objeto
            if (typeof(libs) === 'string' || typeof(libs) === 'object') {
                libs = [libs];
            }

            for (let lib of libs) {
                let loaded;
                const type = typeof (lib);
                try {
                    if (type === 'string') {
                        loaded = await load(lib);
                    } else if (type === 'object') {
                        loaded = await load(lib.path, lib.endBody, lib.type, lib.noExtension);
                    } else {
                        loaded = false;
                    }
                } catch {
                    throw new Error(`No se pudo cargar: '${type === 'string' ? lib : lib.path}'`);
                }
            }

            return true;
        }

        function load(path, endBody, type, noExtension) {
            return new Promise((resolve, reject) => {
                let el;
                let fileType;
                if (path.toLowerCase().endsWith('.js')) {
                    el = document.createElement('script');
                    el.src = path;
                    fileType = 'js';
                } else if (path.toLowerCase().endsWith('.css')) {
                    el = document.createElement('link');
                    el.href = path;
                    el.rel = 'stylesheet';
                    fileType = 'css';
                } else if (noExtension) {
                    el = document.createElement('script');
                    el.src = path;
                    fileType = 'noExtension';
                }

                if (!fileType) return reject(false);

                if (type && typeof (type) === 'string') {
                    el.type = type;
                }

                el.onload = function (e) {
                    resolve(true);
                }

                el.onerror = function (e) {
                    reject(false);
                }

                try {
                    if (endBody) {
                        document.body.append(el);
                    } else {
                        document.head.append(el);
                    }
                } catch {
                    reject(false);
                }
            });
        }
    }

    /**
     * Selecciona elementos HTML en función de un selector CSS. También puede
     * crearse la selección con un elemento HTML, una lista de elementos HTML
     * o un objeto JsNode.
     * @param {string|HTMLElement|NodeList|Array|JsNode} selector Selector CSS Válido.
     * @returns Un objeto JsNode con la selección.
     */
    static select(selector) {
        let nodes;
        try {
            if (typeof (selector) === 'string') {
                nodes = Array.from(document.querySelectorAll(selector));
            } else if (selector instanceof HTMLElement) {
                nodes = selector;
            } else if (selector instanceof NodeList) {
                nodes = Array.from(selector);
            } else if (selector instanceof Array) {
                nodes = selector;
            } else if (selector instanceof JsNode) {
                nodes = selector.nodes;
            }
        } catch (error) {
            nodes = [];
            console.error(error);
            console.info('Se continúa sin nodos seleccionados');
        }

        return new JsNode(nodes);
    }

    /**
     * Devuelve las partes de una fecha, como valores numéricos, en un objeto:
     * {     
     * 
     *      year,           // Año
     *      mon,            // Mes (1: enero)
     *      mday,           // Día del mes
     *      hours,          // Horas
     *      minutes,        // Minutos
     *      seconds,        // Segundos
     *      milliseconds,   // Milisegundos
     *      wday,           // Dia de las semana (1: lunes, ..., 7: domingo)
     *      weekday,        // Nombre del día de la semana (string): lunes, ..., domingo
     *      month,          // Nombre del mes (string): enero, ..., diciembre
     *      yday,           // Días transcurridos desde el principio del año
     *      epoch,          // Milisegundos desde 1970-01-01 00:00:00.000 UTC
     *      offset          // Diferencia en minutos entre UTC y la hora local: UTC - Local
     * 
     * }
     * @param {Date} [date] Una fecha JavaScript opcional. Si no se suminstra
     * se toma la fecha actual.
     * @returns {string[]} Un array de cadenas con los componentes.
     */
    static dateParts(date = undefined) {
        // Expresión regular para extraer los componentes
        const RE_DATE = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d).(\d{3})Z$/;
        const datePartsNames = ['year', 'mon', 'mday', 'hours', 'minutes', 'seconds', 'milliseconds'];
        const parts = {};

        // Para evitar efectos secundarios
        if (date !== undefined) {
            date = new Date(date);
        } else {
            date = new Date();
        }

        // Extrae información para después
        const wday = date.getDay();

        /* Como se va a convertir a ISO, se le resta el desplazamiento que
        la hora UTC tiene con respecto a la hora local */
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

        const parseParts = RE_DATE.exec(date.toISOString());
        // Agrega los componentes extra
        parseParts.push(wday, JsNode.#dayNames[wday], JsNode.#monthNames[parts.mon - 1]);

        // Calcula los componentes base
        datePartsNames.forEach((name, index) => parts[name] = parseInt(parseParts[index + 1]));

        // Agrega los componentes extra
        parts.weekday = JsNode.#dayNames[wday];
        // El día lo modifica para 1: lunes, ... 7: domingo
        parts.wday = (wday === 0 ? 7 : wday);
        parts.month = JsNode.#monthNames[parts.mon - 1];
        // Para calcular los días desde el principio del año, se crea una nueva
        // fecha representando el 1 de enero del año de la fecha argumento
        const janOne = new Date(date.getFullYear(), 0, 1);
        // Calcular la diferencia en milisegundos entre la fecha proporcionada y el 1 de enero
        // Sumar 1 para considerar la fecha actual
        // Dividir entre la cantidad de milisegundos en un día (86400000) para convertir milisegundos a días
        // Redondear al número entero más cercano usando Math.ceil()
        parts.yday = Math.ceil((date - janOne + 1) / 86400000);
        parts.epoch = date.getTime();
        parts.offset = date.getTimezoneOffset();

        return parts;
    }

    /**
     * Da formato de cadena a una fecha a partir de una cadena de formato:
     * {
     *
     *      'D': Abreviatura del día de la semana (tres letras).
     *      'F': Nombre del mes completo.
     *      'G': Hora sin ceros.
     *      'H': Hora con ceros.
     *      'L': Si el año es bisiesto devuelve '1', si no '0'.
     *      'M': Abreviatura del mes (tres letras).
     *      'U': Milisegundos desde 1970-01-01 00:00:00.000 UTC.
     *      'Y': Año con 4 cifras.
     *      'Z': Diferencia en minutos entre UTC y la hora local: UTC - Local.                    
     *      'd': Dia del mes con ceros.                    
     *      'i': Minutos con ceros.                    
     *      'j': Día del mes sin ceros.                    
     *      'l': Día de la semana en letra completo.                    
     *      'm': Mes con ceros.                    
     *      'n': Mes sin ceros.                    
     *      's': Segundos con ceros.                    
     *      't': Número de días del mes (28 a 31)                    
     *      'u': Millisegundos con ceros.                    
     *      'w': Día de la semana en número (1: lunes, ..., 7: domingo).                    
     *      'y': Año con dos cifras.                    
     *      'z': Días transcurridos desde el principio del año.                    
     *      '\\': Escape
     * 
     * }
     * @param {string} format Formato de cadena para la fecha.
     * @param {Date|string|number|undefined} date Una Fecha opcional JavaScript. Por defecto
     * se toma la fecha actual, también admite una cadena de fecha válida, o un timestamp.
     * @returns {string}
     */
    static dateFormat(format = 'd/m/Y H:i:s:u', date = undefined) {
        const parts = JsNode.dateParts(date);

        const out = [];

        function addPart(name, len = 2) {
            const s = parts[name].toString();

            if (len >= 0) {
                out.push(s.padStart(len, '0'));
            } else {
                out.push(s);
            }
        }

        let isEscape = false;

        for (const ch of format) {
            if (isEscape) {
                out.push(ch);
                isEscape = false;
                continue;
            }
            switch (ch) {
                case 'D': // Abreviatura del día de la semana (tres letras)
                    out.push(parts.weekday.substring(0, 3));
                    break;
                case 'F': // Nombre del mes completo
                    addPart('month');
                    break;
                case 'G': // Hora sin ceros
                    addPart('hours', -1);
                    break;
                case 'H': // Hora con ceros
                    addPart('hours');
                    break;
                case 'L': // Si el año es bisiesto devuelve '1', si no '0'
                    out.push(JsNode.isLeapYear(parts.year) ? '1' : '0');
                    break;
                case 'M': // Abreviatura del mes (tres letras)
                    out.push(parts.month.substring(0, 3));
                    break;
                case 'U': // Milisegundos desde 1970-01-01 00:00:00.000 UTC
                    addPart('epoch', -1);
                    break;
                case 'Y': // Año con 4 cifras
                    addPart('year', 4);
                    break;
                case 'Z': // Diferencia en minutos entre UTC y la hora local: UTC - Local
                    addPart('offset', -1);
                    break;
                case 'd': // Dia del mes con ceros
                    addPart('mday');
                    break;
                case 'i': // Minutos con ceros
                    addPart('minutes');
                    break;
                case 'j': // Día del mes sin ceros
                    addPart('mday', -1);
                    break;
                case 'l': // Día de la semana en letra completo
                    addPart('weekday');
                    break;
                case 'm': // Mes con ceros
                    addPart('mon');
                    break;
                case 'n': // Mes sin ceros
                    addPart('mon', -1);
                    break;
                case 's': // Segundos con ceros
                    addPart('seconds');
                    break;
                case 't': // Número de días del mes (28 a 31)
                    let n;
                    if ([1, 3, 5, 7, 8, 10, 12].includes(parts.mon)) {
                        n = '31'
                    } else if ([4, 6, 9, 11].includes(parts.mon)) {
                        n = '30';
                    } else {
                        n = JsNode.isLeapYear(parts.year) ? '29' : '28';
                    }
                    out.push(n);
                    break;
                case 'u': // Millisegundos con ceros
                    addPart('milliseconds', 3);
                    break;
                case 'w': // Día de la semana en número (1: lunes, ..., 7: domingo)
                    addPart('wday', 1);
                    break;
                case 'y': // Año con dos cifras
                    out.push(parts.year.toString().padStart(4, '0').substring(2));
                    break;
                case 'z': // Días transcurridos desde el principio del año
                    addPart('yday', -1);
                    break;
                case '\\': // Escape
                    isEscape = true;
                    break;
                default:
                    out.push(ch);
            }
        }

        return out.join('');
    }

    /**
     * Convierte una cadena de fecha a una fecha JavaScript a partir de un formato:
     * {
     *
     *      'D': Abreviatura del día de la semana (tres letras).
     *      'F': Nombre del mes completo.
     *      'G': Hora sin ceros.
     *      'H': Hora con ceros.
     *      'L': Si el año es bisiesto devuelve '1', si no '0'.
     *      'M': Abreviatura del mes (tres letras).
     *      'U': Milisegundos desde 1970-01-01 00:00:00.000 UTC.
     *      'Y': Año con 4 cifras.
     *      'Z': Diferencia en minutos entre UTC y la hora local: UTC - Local.                    
     *      'd': Dia del mes con ceros.                    
     *      'i': Minutos con ceros.                    
     *      'j': Día del mes sin ceros.                    
     *      'l': Día de la semana en letra completo.                    
     *      'm': Mes con ceros.                    
     *      'n': Mes sin ceros.                    
     *      's': Segundos con ceros.                    
     *      't': Número de días del mes (28 a 31)                    
     *      'u': Millisegundos con ceros.                    
     *      'w': Día de la semana en número (1: lunes, ..., 7: domingo).                    
     *      'y': Año con dos cifras.                    
     *      'z': Días transcurridos desde el principio del año.                    
     *      '\\': Escape. Por ejemplo, H literal se pone como \\H.
     * 
     * }
     * 
     * @param {string} format Formato de cadena para la fecha siguiendo los
     * formatos admitidos.     
     * @param {string} date Fecha en forma de string que debe verificar el
     * formato del primer argumento.
     * @returns {Date|NaN} Una fecha JavaScript si la conversión es correcta o
     * NaN si no se puede convertir.
     */
    static dateParse(format = 'd/m/Y', date = '01/01/1970') {
        // Patrón de expresión regular que se irá formando
        const pattern = ['^'];
        // Contendrá los caracteres de formato en orden de grupo de captura.
        // Por ejemplo: ['d', 'm', 'Y', 'H', 'i', 's', 'u']        
        const charsGroup = [];
        let isEscape = false;

        for (const ch of format) {
            if (isEscape) {
                // Escapa el caracter de escape en las expresiones regulares
                pattern.push((ch === '\\' ? ch : '') + ch);
                isEscape = false;
                continue;
            }
            switch (ch) {
                case 'D': // Abreviatura del día de la semana (tres letras)
                    pattern.push(`(${JsNode.#dayNames3L.join('|')})`);
                    charsGroup.push(ch);
                    break;
                case 'F': // Nombre del mes completo
                    pattern.push(`(${JsNode.#monthNames.join('|')})`);
                    charsGroup.push(ch);
                    break;
                case 'G': // Hora sin ceros
                    pattern.push('(\\d{1,2})')
                    charsGroup.push(ch);
                    break;
                case 'H': // Hora con ceros
                    pattern.push('(\\d{2})')
                    charsGroup.push(ch);
                    break;
                case 'L': // Si el año es bisiesto devuelve '1', si no '0'
                    pattern.push('([01])')
                    charsGroup.push(ch);
                    break;
                case 'M': // Abreviatura del mes (tres letras)
                    pattern.push(`(${JsNode.#monthNames3L.join('|')})`);
                    charsGroup.push(ch);
                    break;
                case 'U': // Milisegundos desde 1970-01-01 00:00:00.000 UTC
                    pattern.push('(-?\\d{1,16})');
                    charsGroup.push(ch);
                    break;
                case 'Y': // Año con 4 cifras
                    pattern.push('(\\d{4})');
                    charsGroup.push(ch);
                    break;
                case 'Z': // Diferencia en minutos entre UTC y la hora local: UTC - Local
                    pattern.push('(-?\\d{1,3})');
                    charsGroup.push(ch);
                    break;
                case 'd': // Dia del mes con ceros
                    pattern.push('(\\d{2})');
                    charsGroup.push(ch);
                    break;
                case 'i': // Minutos con ceros
                    pattern.push('(\\d{2})');
                    charsGroup.push(ch);
                    break;
                case 'j': // Día del mes sin ceros
                    pattern.push('(\\d{1,2})');
                    charsGroup.push(ch);
                    break;
                case 'l': // Día de la semana en letra completo
                    pattern.push(`(${JsNode.#dayNames.join('|')})`);
                    charsGroup.push(ch);
                    break;
                case 'm': // Mes con ceros
                    pattern.push('(\\d{2})');
                    charsGroup.push(ch);
                    break;
                case 'n': // Mes sin ceros
                    pattern.push('(\\d{1,2})');
                    charsGroup.push(ch);
                    break;
                case 's': // Segundos con ceros
                    pattern.push('(\\d{2})');
                    charsGroup.push(ch);
                    break;
                case 't': // Número de días del mes (28 a 31)
                    pattern.push('(\\d{2})');
                    charsGroup.push(ch);
                    break;
                case 'u': // Millisegundos con ceros
                    pattern.push('(\\d{3})');
                    charsGroup.push(ch);
                    break;
                case 'w': // Día de la semana en número (1: lunes, ..., 7: domingo)
                    pattern.push('([1-7])');
                    charsGroup.push(ch);
                    break;
                case 'y': // Año con dos cifras
                    pattern.push('(\\d{2})');
                    charsGroup.push(ch);
                    break;
                case 'z': // Días transcurridos desde el principio del año
                    pattern.push('(\\d{1,3})');
                    charsGroup.push(ch);
                    break;
                case '\\': // Escape
                    isEscape = true;
                    break;
                default:
                    // Si es un metacarácter de expresión regular lo escapa
                    const isMeta = ['^', '$', '|', '.', '?', '*', '+',
                        '(', ')', '[', ']', '{', '}'
                    ].includes(ch);
                    pattern.push((isMeta ? '\\' : '') + ch);
            }
        }
        pattern.push('$');

        const res = date.match(pattern.join(''));
        const mapFormat = {};
        if (res) {
            // Mapea los valores en variables de formato
            for (let i = 0; i < charsGroup.length; i++) {
                mapFormat[charsGroup[i]] = res[i + 1];
            }
            // La fecha solo se puede construir si existe al menos el Año
            let year, month = 0, day = 1, hours = 0, minutes = 0, seconds = 0, milliseconds = 0;
            if (mapFormat.Y) {
                year = mapFormat.Y;
            } else if (mapFormat.y) {
                // Toma los dos primeros dígitos del año actual
                year = new Date().getFullYear().toString()
                    .padStart(4, '0').substring(0, 2) + mapFormat.y;
            }
            if (mapFormat.m) {
                month = parseInt(mapFormat.m) - 1;
            } else if (mapFormat.n) {
                month = parseInt(mapFormat.n) - 1;
            } else if (mapFormat.F) {
                month = JsNode.#monthNames.indexOf(mapFormat.F);
            } else if (mapFormat.M) {
                month = JsNode.#monthNames3L.indexOf(mapFormat.M);
            }
            if (mapFormat.d) {
                day = mapFormat.d;
            } else if (mapFormat.j) {
                day = mapFormat.j;
            }
            if (mapFormat.H) {
                hours = mapFormat.H;
            } else if (mapFormat.G) {
                hours = mapFormat.G;
            }
            if (mapFormat.i) {
                minutes = mapFormat.i;
            }
            if (mapFormat.s) {
                seconds = mapFormat.s;
            }
            if (mapFormat.u) {
                milliseconds = mapFormat.u;
            }

            if (year !== undefined) {
                return new Date(year, month, day, hours, minutes, seconds, milliseconds);
            } else if (mapFormat.U) {
                return new Date(parseInt(mapFormat.U));
            } else {
                return NaN;
            }
        } else {
            return NaN;
        }
    }

    /**
     * Devuelve un valor que indica si un año es bisiesto.
     * @param {number} year Año que se comprobará.
     * @returns {boolean}
     */
    static isLeapYear(year) {
        if (
            ((year % 4) === 0 && (year % 100) !== 0) ||
            (year % 400) === 0) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Codifica los pares (nombre: valor) de un objeto, a un formato
     * apto para viajar e la URL.
     * @param {Object} o obteto con la forma: {p0: a0, p1: a1, ..., pn: an}.
     * @returns {string} Cadena codificada apta para URL.
     */
    static objectToUrlEncoded(o) {
        let encoded = '';
        for (let name in o) {
            if (encoded) {
                encoded += '&';
            }
            encoded += name + '=' + encodeURIComponent(o[name]);
        }
        return encoded;
    }

    /**
     * Envía una petición POST a una URL.
     * @param {string} url 
     * @param {object} bodyObject 
     * @param {string} contentType 
     * @returns {Promise<object>}
     */
    static async post(url, bodyObject = {}, contentType = 'text') {
        return JsNode.#postOrPut(url, 'POST', bodyObject, contentType);
    }

    /**
     * Envía una petición PUT a una URL.
     * @param {string} url 
     * @param {object} bodyObject 
     * @param {string} contentType 
     * @returns {Promise<object>}
     */
    static async put(url, bodyObject = {}, contentType = 'text') {
        return JsNode.#postOrPut(url, 'PUT', bodyObject, contentType);
    }

    /**
     * Envía una petición GET a una URL.
     * @param {string} url 
     * @param {object} params 
     * @param {string} contentType 
     * @returns {Promise<object>}
     */
    static async get(url, params = {}, contentType = 'text') {
        return JsNode.#getOrDelete(url, 'GET', params, contentType);
    }

    /**
     * Envía una petición GET a una URL.
     * @param {string} url 
     * @param {object} params 
     * @param {string} contentType 
     * @returns {Promise<object>}
     */
    static async delete(url, params = {}, contentType = 'text') {
        return JsNode.#getOrDelete(url, 'DELETE', params, contentType);
    }

    /** 
     * Convierte una cadena a base 64. 
     * @param {string} str Cadena a convertir. 
     * @returns 
     */
    static strToB64(str) {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
            (match, g1) => String.fromCharCode(parseInt(g1, 16))));
    }

    /** 
     * Convierte una cadena en base 64 a una cadena normal. 
     * @param {string} strB64 Cadena en base 64. 
     * @returns 
     */
    static b64ToStr(strB64) {
        const text = atob(strB64);
        const length = text.length;
        const bytes = new Uint8Array(length);

        for (let i = 0; i < length; i++) {
            bytes[i] = text.charCodeAt(i);
        }

        return (new TextDecoder()).decode(bytes);
    }

    /** 
     * Convierte un objeto de tipo File a datos en formato URL para incrustar en un elemento HTML. 
     * @param {File} file Objeto de tipo File. 
     * @return {Promise<string>} Cadena de datos en formato DataUrl. 
     */
    static fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            try {
                const fr = new FileReader();
                fr.addEventListener('load', e => resolve(e.target.result));
                fr.readAsDataURL(file);
            } catch (error) {
                reject(error);
            }
        });
    }

    /** 
     * Convierte una cadena en base 64 a un objeto Uint8Array. 
     * @param {string} strB64 Cadena en base 64. 
     * @returns {Uint8Array} Un objeto de tipo Uint8Array. 
     */
    static b64ToUint8(strB64) {
        const text = atob(strB64);
        const length = text.length;
        const bytes = new Uint8Array(length);

        for (let i = 0; i < length; i++) {
            bytes[i] = text.charCodeAt(i);
        }

        return bytes;
    }

    /** 
     * Convierte una cadena a un Uint8array. 
     * @param {string} str 
     * @returns {Uint8Array} 
     */
    static strToUint8(str) {
        return (new TextEncoder()).encode(str);
    };

    /** 
     * Convierte un objeto de tipo Uint8Array a cadena. 
     * @param {Uint8Array} arr 
     * @returns {string} 
     */
    static uInt8ToStr(arr) {
        return (new TextDecoder()).decode(arr);
    }

    /** 
     * Convierte un objeto de tipo Blob a Uint8Array. 
     * @param {Blob} blob Objeto de tipo Blob. 
     * @returns {Promise<Uint8Array>} Un objeto de tipo Uint8Array. 
     */
    static blobToUint8(blob) {
        return new Promise(async (resolve, reject) => {
            try {
                resolve(new Uint8Array(await blob.arrayBuffer()));
            } catch (error) {
                reject(error);
            }
        });
    }

    /** 
     * Convierte un objeto Uint8Array a Blob.
     * @param {Uint8Array} ui8 Array de enteros de 8 bit sin signo. 
     * @param {string} type Un tipo Mime como por ejemplo 'text/plain'. 
     * @returns {Blob} Un objeto de tipo Blob. 
     */
    static uInt8ToBlob(ui8, type) {
        return new Blob([ui8], { type: type });
    }

    /** 
     * Convierte un objeto Blob a un objeto File. 
     * @param {Blob} blob Objeto de tipo Blob. 
     * @param {string} filename Nombre de archivo con la extensión. 
     * @returns {File} Un objeto de tipo File. 
     */
    static blobToFile(blob, filename) {
        return new File([blob], filename, { type: blob.type });
    }

    /** 
     * Convierte desde un objeto File a otro objeto Blob. 
     * @param {File} file Objeto de tipo File. 
     * @returns {Blob} Objeto Blob equivalente. 
     */
    static fileToBlob(file) {
        return new Promise(async (resolve, reject) => {
            try {
                const arr = await file.arrayBuffer();
                const blob = new Blob([new Uint8Array(arr)], { type: file.type });
                resolve(blob);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Devuelve true si su argumento es un número.
     * @param {any} n Una expresión evaluable como un número.
     * @returns {boolean}
     */
    static isNumber(n) {
        return isFinite(Number(n));
    }

    /**
     * Devuelve true si su argumento es un número entero.
     * @param {any} n Una expresión evaluable como un número.
     * @returns {boolean}
     */
    static isInteger(n) {
        return JsNode.isNumber(n) && n == Math.floor(n);
    }

    /**
     * Devuelve un número entero aleatorio entre dos valores.
     * @param {number|string} min valor mínimo incluido.
     * @param {number|string} max valor máximo incluido.
     * @returns {number}
     */
    static randInt(min, max) {
        return Math.floor((max - min + 1) * Math.random() + 1 * min);
    }

    /**
     * Devuelve un número decimal aleatorio entre dos valores.
     * @param {number|string} min valor mínimo incluido.
     * @param {number|string} max valor máximo incluido.
     */
    static randDec(min, max) {
        return (max - min) * Math.random() + 1 * min;
    }

    /**
     * Redondea un número al número de decimales especificado.
     * Nota: El método .toFixed(decimalDigits) también redondea, pero
     * devuelve una cadena y el redondeo no se comporta predeciblemente
     * cuando la cifra siguiente a la de redondeo es la última con valor 5:    
     * 
     * (1.835).toFixed(2) => '1.83' 
     *      
     * (1.875).toFixed(2) => '1.88' 
     * 
     * @param {number|string} x Número o cadena representando un número.
     * @param {number} decimalDigits Número entero de cifras decimales deseadas.
     * Por defecto es 0. Para los casos anteriores:
     * 
     * JsNode.round(1.835, 2) => 1.84
     * 
     * JsNode.round(1.875, 2) => 1.88
     * 
     * @returns {number} El número redondeado a los decimales especificados.
     */
    static round(x, decimalDigits = 0) {
        // Factor para multiplicar/dividir
        const y = Math.pow(10.0, decimalDigits);

        return Math.round(x * y) / y;
    }

    /**
     * Establece el valor de una cookie:
     * @param {string} name: el nombre de la cookie.
     * @param {any } value: su valor.
     * @param {Date} expires: una fecha indicando cuando caduca.
     * @param {string} domain: el dominio al que será enviada.
     * @param {string} path: la ruta dentro del dominico donde será enviada.
     * @param {boolean} secure: un booleano que indica si será o no segura (HTTPS).
     */
    static setCookie(name, value, expires = undefined, domain = undefined, path = undefined, secure = undefined) {
        // Agregamos el nombre de la cookie y su valor
        let cookie = name + '=' + encodeURIComponent(value);

        // Comprobamos si hemos recibido la caducidad
        if (expires !== undefined) {
            cookie += '; expires=' + expires.toGMTString();
        }

        // El dominio
        if (domain !== undefined) {
            cookie += '; domain=' + domain;
        }

        // La ruta
        if (path !== undefined) {
            cookie += '; path=' + path;
        }

        // ¿Es segura?
        if (secure !== undefined && secure) {
            cookie += '; secure';
        }

        document.cookie = cookie;
    }

    /**
     * Devuelve el valor de una cookie, o una cadena vacía si no existe.
     * @param {string} name Nombre de la cookie.
     */
    static getCookie(name) {
        if (document.cookie.length != 0) { // Solo buscamos, si hay cookies
            let i = document.cookie.indexOf(name + '='); // Posición de inicio del nombre de la cookie
            if (i >= 0) {
                i += name.length + 1; // Posición de inicio del valor
                let j = document.cookie.indexOf(';', i); // Fin del valor
                j = (j >= 0 ? j : document.cookie.length); // Fin del valor haya o no más cookies
                return decodeURIComponent(document.cookie.substring(i, j));
            }
        }

        return undefined; // Si no hay cookies, o no existe
    }

    /**
     * Devuelve el nombre del tipo de una expresión.
     * @param {any} expr Cualquier expresión JavaScript.
     * @returns {string} El nombre de su tipo.
     * @example
     * getTypeName(undefined) => 'Undefined'
     * getTypeName(null) => 'Null'
     * getTypeName('hola') => 'String'
     * getTypeName(2) => 'Number'
     * getTypeName(true) => 'Boolean'
     * getTypeName({ a: 1 }) => 'Object'
     * getTypeName(new Date()) => 'Date'
     */
    static getTypeName(expr) {
        return /^\[object (\w+)\]$/.exec(Object.prototype.toString.call(expr))[1];
    }

    /**
     * Devuelve un mapa de objeto con los parámetros y sus valores en la
     * cadena de consulta.
     * @returns {object}
     */
    static get qsMap() {
        const map = {};
        // Obtenemos la cadea de consulta, reemplazando los '+' por un espacio en blanco
        const qs = decodeURIComponent(location.search.substring(1).replace(/\+/g, ' '));
        if (qs) {
            // Separa cada par nombre=valor
            const args = qs.split('&');
            for (let i = 0; i < args.length; i++) {
                // Establece el nombre y el valor
                map[args[i].substring(0, args[i].indexOf('='))] =
                    args[i].substring(args[i].indexOf('=') + 1);
            }
        }
        return map;
    }

    /**
     * Detiene la animación actual y borra la cola de animaciones.
     */
    static stop() {
        if (JsNode.#stopAnimation) return;

        // Primero borra la cola
        JsNode.#queue = [];

        // Ordena detener la animación en curso, si la hubiere
        JsNode.#stopAnimation = true;
    }    

    /**
     * Devuelve el valor de una propiedad CSS, establece el valor de una o
     * varias propiedades CSS o borra los estilos establecidos por código.
     * @param {string|object|undefined} name Nombre de propiedad, objeto con
     * nombres de propiedad y valores o bien undefined para borrar el css.
     * @param {string|undefined} value Valor de la propiedad.
     * @returns {string|undefined} Valor de la propiedad, cuando solo
     * se recibe como argumento el nombre de la propiedad.
     */
    css(name = undefined, value = undefined) {
        if (value !== undefined) {
            this.#nodes.forEach(node => {
                node.style[name] = value;
            });
            return this;
        } else {
            if (typeof (name) === 'object') {
                this.#nodes.forEach(node => {
                    for (const key in name) {
                        node.style[key] = name[key];
                    }
                });

                return this;
            } else if (name === undefined) {
                this.#nodes.forEach(node => {
                    // Las propiedades establecidas tienen clave numérica
                    while (node.style[0]) {
                        node.style[node.style[0]] = '';
                    }
                });

                return this;
            } else {
                return this.#nodes[0]?.style[name];
            }
        }
    }

    /**
     * Devuelve un objeto JsNode con los elementos que contengan un texto
     * o los que no lo cumplan si negate es true.
     * @param {string} text Texto que será buscado.
     * @param {boolean} ignoreCase Si es true no se distingue entre mayúsculas, minúsculas, ni acentos.
     * Por defecto es false.
     * @param {boolean} negate Si es true devuelve los nodos que no cumplan el
     * patrón y si es false los que lo cumplan. Por defecto es false.     
     * @returns {JsNode} Un objeto JsNode con los elementos que cumplan el patrón
     * o los que no lo cumplan si negate es true.
     */
    filterText(text, ignoreCase = false, negate = false) {
        if (ignoreCase) {
            text = text.normalize('NFD').toLowerCase().replace(/[\u0300-\u036f]/g, '')
        }
        this.#nodes = this.#nodes.filter(node => {
            let res;
            if (ignoreCase) {
                res = node.innerText.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().indexOf(text) >= 0;
            } else {
                res = node.innerText.indexOf(text) >= 0;
            }
            return negate ? !res : res;
        });

        return this;
    }

    /**
     * Devuelve un objeto JsNode con los elementos que cumplan el patrón
     * o los que no lo cumplan si negate es true.
     * @param {string} pattern Patrón de expresión regular.
     * @param {string} [flags] Flags usados en la búsqueda, por defecto ninguno.     
     * @param {Function} callback Función de devolución de
     * llamada opcional que recibirá como primer argumento un Array de n elementos
     * con la forma:
     * 
     * [0]: Primer texto coincidente con el patrón.
     * 
     * ...
     * 
     * [n - 1]: Texto capturado en el el grupo n-ésimo.
     * 
     * index: Posición de la primera coincidencia.
     * 
     * input: Texto con el que se compara el patrón.
     * 
     * Además recibe como segundo argumento el índice de dicho nodo en la selección.
     * Dentro de la función this hará referencia al nodo actual como un JsNode.
     * La función debe devolver true si acepta la coincidencia o false si no la acepta.
     * @returns {JsNode} Un objeto JsNode con los elementos que cumplan el patrón.
     */
    filterRegExp(pattern, flags = '', callback) {
        const re = new RegExp(pattern, flags);
        this.#nodes = this.#nodes.filter((node, index) => {
            let res;
            if (typeof (callback) === 'function') {
                res = re.exec(node.innerText)
                if (res) {
                    res = callback.call(new JsNode(node), res, index);
                }
                // Para valores no booleanos
                res = !!res;
            } else {
                res = re.test(node.innerText);
            }
            return res;
        });
        return this;
    }

    /**
     * Selecciona elementos HTML en función de un selector CSS.
     * @param {string} selector Selector CSS Válido.
     * @returns {JsNode} Un objeto JsNode con la selección.
     */
    select(selector) {
        let selectedNodes = [];

        for (const node of this.#nodes) {
            const nodes = Array.from(node.querySelectorAll(selector));
            selectedNodes = selectedNodes.concat(nodes);
        }

        return new JsNode(selectedNodes);
    }

    /**
     * Itera por la selección actual pasando a un callback el índice que ocupa
     * en la selección, el this en la función es una instancia de JsNode para
     * cada nodo DOM de la selección. El retorno del callback no se tiene en cuenta.
     * @param {Function} callback Función que recibirá como primer argumento
     * el íncide que ocupa en la selección el elemento representado por this
     * cuando se active el callback.
     * @returns {JsNode} La misma selección actual.
     */
    each(callback) {
        this.#nodes.forEach((node, index) => callback.call(new JsNode(node), index));

        return this;
    }

    /**
     * Devuelve un JsNode conteniendo los elementos filtrados de la selección actual.
     * @param {string|Function} selector Selector CSS o función de devolución de
     * llamada que recibe el nodo actual como un JsNode y el índice en la lista de nodos, si
     * devuelve true el nodo se agrega a la selección, y no se agrega si
     * devuelve false.     
     * @returns {JsNode} Un objeto JsNode con el resultado del filtrado.
     */
    filter(selector) {
        this.#nodes = this.#nodes.filter((node, index) => {
            let res;

            if (typeof (selector) === 'function') {
                res = !!selector.call(new JsNode(node), index);
            } else {
                res = node.matches(selector);
            }
            return res
        });

        return this;
    }

    /**
     * Devuelve un subconjunto de la selección actual.
     * @param {number} start Índice de comienzo de la selección (base 0). Si es
     * negativo indica un desplazamiento desde el final de la selección..     
     * @param {number} end Índice en el que los elementos dejan de seleccionarse.
     * Si es negativo indica un desplazamiento desde el final de la selección.
     * Si se omite se selecciona desde start hasta el final de la selección.
     * @returns {JsNode} Un objeto JsNode con la nueva selección.
     */
    slice(start = 0, end = undefined) {
        this.#nodes = this.#nodes.slice(start, end);

        return this;
    }

    /**
     * Devuelve o estable un texto a la selección actual.
     * Si se establece se devuelve un referencia a la selección, pero
     * si se devuelve, solo retorna el texto interno de los elementos seleccionados.
     * @param {string|Function} newText Texto que se establecerá o una función
     * de callback que recibirá el texto original y el índice del nodo actual, y
     * devolverá el nuevo texto.
     * @returns {JsNode}
     */
    text(newText = undefined) {
        if (newText === undefined) {
            let s = '';
            for (const node of this.#nodes) {
                s += node.textContent;
            }

            return s;
        } else {
            this.empty();
            this.#nodes.forEach((node, index) => {
                if (typeof (newText) !== 'function') {
                    node.textContent = newText;
                } else {
                    node.textContent = newText(node.textContent, index);
                }
            });

            return this;
        }
    }

    /**
     * Devuelve o estable el HTML a la selección actual.
     * Si se establece se devuelve un referencia a la selección, pero
     * si se devuelve, solo retorna el HTML interno del primer elemento seleccionado.
     * @param {string|Function} newHtml HTML que se establecerá o una función
     * de callback que recibirá el HTML original y el índice del nodo actual y
     * devolverá el nuevo HTML.
     * @returns {JsNode}
     */
    html(newHtml = undefined) {
        if (newHtml === undefined) {
            return this.#nodes[0]?.innerHTML;
        } else {
            this.empty();
            this.#nodes.forEach((node, index) => {
                if (typeof (newHtml) !== 'function') {
                    node.innerHTML = newHtml;
                } else {
                    node.innerHTML = newHtml(node.innerHTML, index);
                }
            });

            return this;
        }
    }

    /**
     * Devuelve o establece el valor  de la propiedad 'value' de un
     * elemento HTML. Si se establece devuelve la selección y si se
     * devuelve, retorna el valor de la propiedad 'value' del primer elemento.
     * @param {string|Function} newValue Valor que se establecerá o una función
     * de callback que recibirá el valor original y el índice del nodo actual, y
     * devolverá el nuevo valor.
     * @returns {JsNode|string}
     */
    val(newValue = undefined) {
        if (newValue === undefined) {
            return this.#nodes[0]?.value;
        } else {
            this.#nodes.forEach((node, index) => {
                if (typeof (newValue) !== 'function') {
                    node.value = newValue;
                } else {
                    node.value = newValue(node.value, index);
                }
            });

            return this;
        }
    }

    /**
     * Estable un atributo o un objeto de pares atributo y valor a la
     * selección actual, o bien devuevle el valor del atributo del primer
     * elemento seleccionado.
     * @param {string|object} name Nombre de atributo u objeto formado por
     * nombres de atributo y valores.
     * @param {string|Function} value Valor del atributo. También puede ser una
     * función de callback que recibirá el valor original y el índice del nodo
     * actual, y devolverá el nuevo valor del atributo.
     * @returns {JsNode|string|null}
     */
    attr(name, value = undefined) {
        if (value !== undefined) {
            this.#nodes.forEach((node, index) => {
                if (typeof (value) !== 'function') {
                    JsNode.#setAttr(node, name, value);
                } else {
                    JsNode.#setAttr(node, name, value(node.getAttribute(name), index));
                }
            });
            return this;
        } else {
            if (typeof (name) === 'object') {
                this.#nodes.forEach(node => {
                    for (const key in name) {
                        JsNode.#setAttr(node, key, name[key]);
                    }
                });
                return this;
            } else {
                return this.#nodes[0]?.getAttribute(name);
            }
        }
    }

    /**
     * Estable una prpiedad o un objeto de pares propiedad y valor a la
     * selección actual, o bien devuevle el valor de la propiedad del primer
     * elemento seleccionado.
     * @param {string|object} name Nombre de la propiedad u objeto formado por
     * nombres de propiedad y valores.
     * @param {any|Function} value Valor de la propiedad. También puede ser una
     * función de callback que recibirá el valor original y el índice del nodo
     * actual, y devolverá el nuevo valor de la propiedad.
     * @returns {JsNode|any|undefined}
     */
    prop(name, value = undefined) {
        if (value !== undefined) {
            this.#nodes.forEach((node, index) => {
                if (typeof (value) !== 'function') {
                    node[name] = value;
                } else {
                    node[name] = value(node[name], index);
                }
            });
            return this;
        } else {
            if (typeof (name) === 'object') {
                this.#nodes.forEach(node => {
                    for (const key in name) {
                        node[key] = name[key];
                    }
                });
                return this;
            } else {
                return this.#nodes[0]?.[name];
            }
        }
    }

    /**
     * Agrega HTML, un elemento HTML, una colección de elementos HTML
     * un array de elementos HTML o un JsNode después de cada elemento
     * seleccionado.
     * @param {string|HTMLElement|NodeList|Array|JsNode} html 
     * @returns {JsNode}
     */
    after(html) {
        for (const node of this.#nodes) {
            if (typeof (html) === 'string') {
                node.insertAdjacentHTML('afterend', html);
            } else if (html instanceof HTMLElement) {
                node.insertAdjacentElement('afterend', html);
            } else if (html instanceof NodeList || html instanceof Array) {
                html.forEach(e => node.insertAdjacentElement('afterend', e));
            } else if (html instanceof JsNode) {
                html.nodes.forEach(e => node.insertAdjacentElement('afterend', e));
            }
        }

        return this;
    }

    /**
     * Agrega HTML, un elemento HTML, una colección de elementos HTML
     * un array de elementos HTML o un JsNode antes de cada elemento seleccionado.
     * @param {string|HTMLElement|NodeList|Array|JsNode} html 
     * @returns {JsNode}
     */
    before(html) {
        for (const node of this.#nodes) {
            if (typeof (html) === 'string') {
                node.insertAdjacentHTML('beforebegin', html);
            } else if (html instanceof HTMLElement) {
                node.insertAdjacentElement('beforebegin', html);
            } else if (html instanceof NodeList || html instanceof Array) {
                html.forEach(e => node.insertAdjacentElement('beforebegin', e));
            } else if (html instanceof JsNode) {
                html.nodes.forEach(e => node.insertAdjacentElement('beforebegin', e));
            }
        }

        return this;
    }

    /**
     * Agrega HTML, un elemento HTML, una colección de elementos HTML
     * un array de elementos HTML o un JsNode después del último elemento hijo
     * de cada elemento seleccionado.
     * @param {string|HTMLElement|NodeList|Array|JsNode} html 
     * @returns {JsNode}
     */
    append(html) {
        for (const node of this.#nodes) {
            if (typeof (html) === 'string') {
                node.insertAdjacentHTML('beforeend', html);
            } else if (html instanceof HTMLElement) {
                node.insertAdjacentElement('beforeend', html);
            } else if (html instanceof NodeList || html instanceof Array) {
                html.forEach(e => node.insertAdjacentElement('beforeend', e));
            } else if (html instanceof JsNode) {
                html.nodes.forEach(e => node.insertAdjacentElement('beforeend', e));
            }
        }

        return this;
    }

    /**
     * Agrega HTML, un elemento HTML, una colección de elementos HTML
     * un array de elementos HTML o un JsNode antes del primer hijo de cada
     * elemento seleccionado.
     * @param {string|HTMLElement|NodeList|Array|JsNode} html 
     * @returns {JsNode}
     */
    prepend(html) {
        for (const node of this.#nodes) {
            if (typeof (html) === 'string') {
                node.insertAdjacentHTML('afterbegin', html);
            } else if (html instanceof HTMLElement) {
                node.insertAdjacentElement('afterbegin', html);
            } else if (html instanceof NodeList || html instanceof Array) {
                html.forEach(e => node.insertAdjacentElement('afterbegin', e));
            } else if (html instanceof JsNode) {
                html.nodes.forEach(e => node.insertAdjacentElement('afterbegin', e));
            }
        }

        return this;
    }

    /**
     * Realiza una copia de cada elemento de la selección actual. La copia
     * incluye el contenido interno de cada elemento. No incluye los datos
     * almacenados por JsNode para su trabajo interno.
     * @returns {JsNode} Un JsNode a la copia.
     */
    clone() {
        const clones = [];

        for (const node of this.#nodes) {
            clones.push(node.cloneNode(true));
        }

        return new JsNode(clones);
    }

    /**
     * Selecciona el o los elementos padre de la selección actual.     
     * @param {string} selector Un selector opcional que hará que solo
     * se seleccionen los padres que coincidan con dicho selector.
     * @returns {JsNode}
     */
    parent(selector = undefined) {
        const items = [];

        for (const node of this.#nodes) {
            const item = node.parentElement;
            if (item && !items.includes(item) &&
                (selector === undefined || item.matches(selector))) {
                items.push(item);
            }
        }

        return new JsNode(items);
    }

    /**
     * Selecciona todos los ancestros de la selección actual.     
     * @param {string} selector Un selector opcional que hará que solo
     * se seleccionen los ancestros que coincidan con dicho selector.     
     * @param {string|undefined} until Selector opcional no incluido que
     * detendrá la búsqueda.
     * @returns {JsNode}
     */
    parents(selector = undefined, until = undefined) {
        const items = [];

        for (const node of this.#nodes) {
            let item = node.parentElement;
            while (item && (until === undefined || !item.matches(until))) {
                if (!items.includes(item) &&
                    (selector === undefined || item.matches(selector))) {
                    items.push(item);
                }
                item = item.parentElement;
            }
        }

        return new JsNode(items);
    }

    /**
     * Selecciona todos los ancestros de la selección actual hasta llegar
     * a un selector no incluido.     
     * @param {string|undefined} selector Un selector opcional que hará que solo
     * se seleccionen los ancestros que no coincidan con dicho selector.     
     * @returns {JsNode}
     */
    parentsUntil(selector = undefined) {
        return this.parents(undefined, selector);
    }

    /**
     * Selecciona los hijos de cada elemento de la selección actual.
     * @param {string|number|undefined} Selector opcional que debe verificar cada hijo
     * para agregarse a la selección o número de índice del
     * hijo que será seleccionado. Si no se pasa ningún argumento o es
     * undefined se devuelven todos los hijos.
     * @returns {JsNode}
     */
    children(selector = undefined) {
        const selectorIsNumber = JsNode.isNumber(selector);
        let children = [];

        for (const node of this.#nodes) {
            const array = Array.from(node.children);
            let number;

            if (selectorIsNumber) {
                if (selector < 0) {
                    number = array.length + selector;
                } else {
                    number = selector;
                }
            }
            const list = array.filter((node, index) => {
                if (selector === undefined) {
                    return true;
                } else if (selectorIsNumber) {
                    // Para números de cadena
                    return number == index;
                } else {
                    return node.matches(selector);
                }
            });
            children = children.concat(list);
        }

        return new JsNode(children);
    }

    /**
     * Selecciona los hermanos de cada elemento de la selección actual.
     * @param {string} Selector opcional que debe verificar cada hermano
     * para agregarse a la selección.
     * @param {number} direction Dirección de selección:
     *  0: Hermanos anteriores y posteriores.
     * -1: Hermanos anteriores.
     *  1: Hermanos posteriores.
     * @param {string|undefined} until Selector opcional no incluido que
     * detendrá la búsqueda si coincide con algún hermano.
     * @returns {JsNode}
     */
    siblings(selector = undefined, direction = 0, until = undefined) {
        let items = [];

        for (const node of this.#nodes) {
            let item;
            if (direction <= 0) {
                // Hermanos anteriores
                item = node.previousElementSibling;
                while (item && (selector === undefined || item.matches(selector)) &&
                    !items.includes(item) && (until === undefined || !item.matches(until))) {
                    items.unshift(item);
                    item = item.previousElementSibling;
                }
            }

            if (direction >= 0) {
                // Hermanos posteriores
                item = node.nextElementSibling;
                while (item && (selector === undefined || item.matches(selector)) &&
                    !items.includes(item) && (until === undefined || !item.matches(until))) {
                    items.push(item);
                    item = item.nextElementSibling;
                }
            }
        }

        return new JsNode(items);
    }

    /**
     * Selecciona el nodo siguiente de cada elemento en la selección actual.
     * @param {string} selector Selector opcional que si está presente el
     * elemento siguiente debe coincidir con este selector.    
     * @returns {JsNode}
     */
    next(selector = undefined) {
        const items = [];

        for (const node of this.#nodes) {
            const item = node.nextElementSibling;
            if (item && (selector === undefined || item.matches(selector))) {
                items.push(item);
            }
        }

        return new JsNode(items);
    }

    /**
     * Selecciona los hermanos siguientes de cada elemento de la selección actual.
     * @param {string} Selector opcional que debe verificar cada hermano
     * para agregarse a la selección.
     * @returns {JsNode}
     */
    nextAll(selector = undefined) {
        return this.siblings(selector, 1);
    }

    /**
     * Selecciona los hermanos siguientes de cada elemento de la selección actual
     * hasta llegar a un selector no incluido.
     * @param {string|undefined} Selector opcional no incluido que detendrá
     * la búsqueda.
     * @returns {JsNode}
     */
    nextUntil(selector = undefined) {
        return this.siblings(undefined, 1, selector);
    }

    /**
     * Selecciona el nodo anterior de cada elemento en la selección actual.
     * @param {string} selector Selector opcional que si está presente el
     * elemento previo debe coincidir con este selector.
     * @returns {JsNode}
     */
    prev(selector = undefined) {
        const items = [];

        for (const node of this.#nodes) {
            const item = node.previousElementSibling;
            if (item && (selector === undefined || item.matches(selector))) {
                items.push(node.previousElementSibling);
            }
        }

        return new JsNode(items);
    }

    /**
     * Selecciona los hermanos anteriores de cada elemento de la selección actual.
     * @param {string} Selector opcional que debe verificar cada hermano
     * para agregarse a la selección.
     * @returns {JsNode}
     */
    prevAll(selector = undefined) {
        return this.siblings(selector, -1);
    }

    /**
     * Selecciona los hermanos anteriores de cada elemento de la selección actual
     * hasta llegar a un selector no incluido en la selección.
     * @param {string|undefined} Selector opcional no includio que detendrá la búsqueda.
     * @returns {JsNode}
     */
    prevUntil(selector = undefined) {
        return this.siblings(undefined, -1, selector);
    }

    /**
     * Agrega la clase o clases a cada elemento de la selección actual.
     * Si hay más de una clase se separarán por un espacio.
     * @param {string} className 
     * @returns {JsNode}
     */
    addClass(className) {
        const classes = className.trim().split(/\s+/);
        this.#nodes.forEach(node => {
            classes.forEach(c => node.classList.add(c));
        });

        return this;
    }

    /**
     * Elimina la clase o clases a cada elemento de la selección actual.
     * Si hay más de una clase se separarán por un espacio.
     * @param {string} className 
     * @returns {JsNode}
     */
    removeClass(className) {
        const classes = className.trim().split(/\s+/);
        this.#nodes.forEach(node => {
            classes.forEach(c => node.classList.remove(c));
        });

        return this;
    }

    /**
     * Agrega o elimina la clase o clases a cada elemento de la selección actual.
     * Si hay más de una clase se separarán por un espacio.
     * @param {string} className 
     * @returns {JsNode}
     */
    toggleClass(className) {
        const classes = className.trim().split(/\s+/);
        this.#nodes.forEach(node => {
            classes.forEach(c => {
                if (node.classList.contains(c)) {
                    node.classList.remove(c);
                } else {
                    node.classList.add(c);
                }
            });
        });

        return this;
    }

    /**
     * Muestra la selección con la posibilidad de una animación.
     * @param {number} duration Tiempo en milisegundos de duración de la
     * animación, antes de mostrar la selección.
     * @param {number} delay Tiempo en milegundos de retraso antes de
     * comenzar la animación.
     * @param {string} effect Tipo de efecto deseado:
     * 
     * 'all': Se aumentan anchura, altura y opacidad.
     * 
     * 'width': Se aumenta solo la anchura.
     * 
     * 'height': Se aumenta solo la altura.
     * 
     * 'opacity': Efector por defecto. Se aumenta solo la opacidad.     
     * 
     * @param {Function|undefined} Función de callback opcional que será invocada
     * cuando la animación acabe.
     * @returns {JsNode}
     */
    show(duration = undefined, delay = 0, effect = 'opacity', callback = undefined) {
        if (duration !== undefined) {
            // Si hay nodos animándose, la llamada se almacena en la cola para después
            if (this.#nodes.some(n => n.isAnimating)) {
                JsNode.#queue.push(JsNode.#wrapFunction(this.show, this, [duration, delay, effect, callback]));
            } else {
                new Promise(async resolve => {
                    effect = effect.toLowerCase();

                    // Prepara los nodos que se tiene que animar
                    this.#nodes.forEach((node, index) => {
                        // Solo si no está visible se muestra
                        if (!this.visible(index)) {
                            node.isAnimating = true;
                        }
                    });

                    // Comprueba si debe aplicar un retraso
                    if (delay !== undefined && delay > 0) {
                        await JsNode.#sleep(delay);
                    }

                    const promises = [];
                    this.#nodes.forEach((node, index) => {
                        // Solo si no está visible se muestra
                        if (!this.visible(index)) {
                            promises.push(JsNode.#showAnimateNode(node, duration, effect));
                        }
                    });
                    Promise.all(promises).then(() => {
                        // Borra indicadores de animación
                        this.#nodes.forEach(node => delete node.isAnimating);

                        // Si hay llamadas en cola, llama a la primera
                        if (JsNode.#queue.length) setTimeout(JsNode.#queue.shift());

                        if (JsNode.#stopAnimation) {
                            JsNode.#stopAnimation = false;
                        } else {
                            if (typeof (callback) === 'function') {
                                callback.call(this);
                            }
                        }
                        resolve();
                    });
                });
            }
        } else {
            // Si hay nodos animándose, la llamada se almacena en la cola para después
            if (this.#nodes.some(n => n.isAnimating)) {
                JsNode.#queue.push(JsNode.#wrapFunction(this.show, this, [duration, delay, effect, callback]));
            } else {
                this.#nodes.forEach((node, index) => {
                    if (!this.visible(index)) {         
                        JsNode.#setDisplayValue(node, true);                        
                    }
                });

                // Si hay llamadas en cola, llama a la primera
                if (JsNode.#queue.length) setTimeout(JsNode.#queue.shift());
            }
        }

        return this;
    }

    /**
     * Oculta la selección con la posibilidad de una animación.
     * @param {number} duration Tiempo en milisegundos de duración de la
     * animación, antes de ocultar la selección.
     * @param {number} delay Tiempo en milegundos de retraso antes de
     * comenzar la animación.
     * @param {string} effect Tipo de efecto deseado:
     * 
     * 'all': Se disminuyen anchura, altura y opacidad.
     * 
     * 'width': Se disminuye solo la anchura.
     * 
     * 'height': Se disminuye solo la altura.
     * 
     * 'opacity': Efector por defecto. Se disminuye solo la opacidad.
     *     
     * @param {Function|undefined} Función de callback opcional que será invocada
     * cuando la animación acabe, dentro del callback, this referencia al JsNode actual.
     * @returns {JsNode}
     */
    hide(duration = undefined, delay = 0, effect = 'opacity', callback = undefined) {
        if (duration !== undefined) {
            // Si hay nodos animándose, la llamada se almacena en la cola para después
            if (this.#nodes.some(n => n.isAnimating)) {
                JsNode.#queue.push(JsNode.#wrapFunction(this.hide, this, [duration, delay, effect, callback]));
            } else {
                new Promise(async resolve => {
                    effect = effect.toLowerCase();

                    // Prepara los nodos que se tiene que animar
                    this.#nodes.forEach((node, index) => {
                        // Solo si está visible se oculta
                        if (this.visible(index)) {
                            node.isAnimating = true;
                        }
                    });

                    // Comprueba si debe aplicar un retraso
                    if (delay !== undefined && delay > 0) {
                        await JsNode.#sleep(delay);
                    }

                    const promises = [];
                    this.#nodes.forEach((node, index) => {
                        // Solo si esta visible se oculta
                        if (this.visible(index)) {
                            promises.push(JsNode.#hideAnimateNode(node, duration, effect));
                        }
                    });
                    Promise.all(promises).then(() => {
                        // Borra indicadores de animación
                        this.#nodes.forEach(node => delete node.isAnimating);

                        // Si hay llamadas en cola, llama a la primera
                        if (JsNode.#queue.length) setTimeout(JsNode.#queue.shift());

                        if (JsNode.#stopAnimation) {
                            JsNode.#stopAnimation = false;
                        } else {
                            if (typeof (callback) === 'function') {
                                callback.call(this);
                            }
                        }
                        resolve();
                    });
                });
            }
        } else {
            // Si hay nodos animándose, la llamada se almacena en la cola para después
            if (this.#nodes.some(n => n.isAnimating)) {
                JsNode.#queue.push(JsNode.#wrapFunction(this.hide, this, [duration, delay, effect, callback]));
            } else {
                this.#nodes.forEach((node, index) => {
                    if (this.visible(index)) {
                        JsNode.#setDisplayValue(node, false);                        
                    }
                });

                // Si hay llamadas en cola, llama a la primera
                if (JsNode.#queue.length) setTimeout(JsNode.#queue.shift());
            }
        }

        return this;
    }

    /**
     * Muestra u oculta la selección con la posibilidad de una animación.
     * @param {number} duration Tiempo en milisegundos de duración de la
     * animación, antes de mostrar/ocultar la selección.
     * @param {number} delay Tiempo en milegundos de retraso antes de
     * comenzar la animación.
     * @param {string} effect Tipo de efecto deseado:
     * 
     * 'all': Se aumentan/disminuyen anchura, altura y opacidad.
     * 
     * 'width': Se aumenta/disminuye solo la anchura.
     * 
     * 'height': Se aumenta/disminuye solo la altura.
     * 
     * 'opacity': Efector por defecto. Se aumenta/disminuye solo la opacidad.     
     * 
     * @param {Function|undefined} Función de callback opcional que será invocada
     * cuando la animación acabe, dentro del callback, this referencia al JsNode actual.
     * @returns {JsNode}
     */
    toggle(duration = undefined, delay = 0, effect = 'opacity', callback = undefined) {
        if (duration !== undefined) {
            // Si hay nodos animándose, la llamada se almacena en la cola para después
            if (this.#nodes.some(n => n.isAnimating)) {
                JsNode.#queue.push(JsNode.#wrapFunction(this.toggle, this, [duration, delay, effect, callback]));
            } else {
                new Promise(async resolve => {
                    effect = effect.toLowerCase();

                    // Prepara los nodos que se tiene que animar
                    this.#nodes.forEach(node => {
                        node.isAnimating = true;
                    });

                    // Comprueba si debe aplicar un retraso
                    if (delay !== undefined && delay > 0) {
                        await JsNode.#sleep(delay);
                    }

                    const promises = [];
                    this.#nodes.forEach((node, index) => {
                        if (this.visible(index)) {                            
                            promises.push(JsNode.#hideAnimateNode(node, duration, effect));
                        } else {
                            promises.push(JsNode.#showAnimateNode(node, duration, effect));
                        }
                    });
                    Promise.all(promises).then(() => {
                        // Borra indicadores de animación
                        this.#nodes.forEach(node => delete node.isAnimating);

                        // Si hay llamadas en cola, llama a la primera
                        if (JsNode.#queue.length) setTimeout(JsNode.#queue.shift());

                        if (JsNode.#stopAnimation) {
                            JsNode.#stopAnimation = false;
                        } else {
                            if (typeof (callback) === 'function') {
                                callback.call(this);
                            }
                        }
                        resolve();
                    });
                });
            }
        } else {
            // Si hay nodos animándose, la llamada se almacena en la cola para después
            if (this.#nodes.some(n => n.isAnimating)) {
                JsNode.#queue.push(JsNode.#wrapFunction(this.toggle, this, [duration, delay, effect, callback]));
            } else {
                this.#nodes.forEach((node, index) => {
                    JsNode.#setDisplayValue(node, !this.visible(index));                    
                });

                // Si hay llamadas en cola, llama a la primera
                if (JsNode.#queue.length) setTimeout(JsNode.#queue.shift());
            }
        }

        return this;
    }

    /**
     * Establece el foco en el último elemento de la selección pero empezando
     * por el primero.
     * @returns {JsNode}
     */
    focus() {
        for (const node of this.#nodes) {
            node.focus();
        }

        return this;
    }

    /**
     * Realiza la acción de click sobre cada elemento de la selección.
     * @returns {JsNode}
     */
    click() {
        for (const node of this.#nodes) {
            node.click();
        }

        return this;
    }

    /**
     * Elimina los elementos seleccionado.
     * @returns {JsNode}
     */
    remove() {
        while (this.#nodes.length) {
            const node = this.#nodes.at(-1);
            JsNode.#removeAllListeners(node);
            JsNode.#removeData(node);
            node.remove();
            this.#nodes.pop();
        }

        return this;
    }

    /**
     * Elimina los elementos hijos de cada elemento de la selección.
     * El método se asegura de liberar los datos extra para evitar
     * fugas de memoria.
     * @returns {JsNode}
     */
    empty() {
        for (const node of this.#nodes) {
            // Se selección todos los nodos, incluidos los de texto
            JsNode.select(node.childNodes).remove();
        }

        // Como consecuencia del vaciado algunos elementos pueden haberse
        // quedado desconectados del DOM, por lo que se deben eliminar
        let i = 0;
        while (i < this.#nodes.length) {
            const node = this.#nodes[i];
            if (node.isConnected) {
                i++;
            } else {
                node.remove();
                this.#nodes.splice(i, 1);
            }
        }


        return this;
    }

    /**
     * Selecciona el elemento apuntado por el índice (base cero) especificado.
     * @param {number} index 
     * @returns {JsNode}
     */
    one(index = 0) {
        return new JsNode(this.#nodes.at(index));
    }

    /**
     * Agrega un nuevo controlador de eventos a los elementos actualmente seleccionados.
     * @param {string} eventName Nombre del evento.
     * @param {Function} callback Función que se llamará cuando se produzca el evento.
     * Como primer parámetro recibirá el evento y el this interno será una instancia
     * de JsNode donde se haya producido el evento.
     * @returns {JsNode} Una instancia JsNode con la selección actual.
     */
    on(eventName, callback) {
        for (const node of this.#nodes) {
            if (!node.listeners) {
                node.listeners = {};
            }
            if (!node.listeners[eventName]) {
                node.listeners[eventName] = [];
            }
            const newCallback = callback.bind(new JsNode(node));
            node.addEventListener(eventName, newCallback);
            node.listeners[eventName].push(newCallback);
        }

        return this;
    }

    /**
     * Elimina todos los controladores de un evento en la selección actual.
     * @param {string} eventName Nombre del evento.
     * @returns {JsNode} Una instancia JsNode con la selección actual.
     */
    off(eventName) {
        for (const node of this.#nodes) {
            if (eventName) {
                JsNode.#removeListeners(node, eventName);
            } else {
                JsNode.#removeAllListeners(node);
            }
        }

        return this;
    }

    /**
     * Devuelve o establece la anchura de la seleción sin padding, border ni margin.
     * Si es una devolución solo se devuelve respecto al primer elemento
     * de la selección.
     * @param {number|string|Function} newWidth Valor de la nueva anchura.
     * Los números se convierten a cadenas en píxeles, si es una función se
     * llama pasándole el ancho actual y el índice de cada elemento, y se
     * establece el nuevo ancho en el valor retornado.
     * @returns {JsNode}
     */
    width(newWidth = undefined) {
        if (newWidth === undefined) {
            if (this.#nodes[0]) {
                return parseFloat(getComputedStyle(this.#nodes[0]).width);
            } else {
                return undefined;
            }
        } else {
            if (JsNode.isNumber(newWidth)) {
                newWidth += 'px';
            }
            this.#nodes.forEach((node, index) => {
                if (typeof (newWidth) !== 'function') {
                    node.style.width = newWidth;
                } else {
                    let width = newWidth(parseFloat(getComputedStyle(node).width), index);
                    if (JsNode.isNumber(width)) {
                        width += 'px';
                    }
                    node.style.width = width;
                }
            });

            return this;
        }
    }

    /**
     * Devuelve o establece la altura de la seleción sin padding, border ni margin.
     * Si es una devolución solo se devuelve respecto al primer elemento de
     * la selección.
     * @param {number|string|Function} newHeight Valor de la nueva altura.
     * Los números se convierten a cadenas en píxeles, si es una función se
     * llama pasándole el alto actual y el índice de cada elemento, y se
     * establece el nuevo alto en el valor retornado.
     * @returns {JsNode}
     */
    height(newHeight = undefined) {
        if (newHeight === undefined) {
            if (this.#nodes[0]) {
                return parseFloat(getComputedStyle(this.#nodes[0]).height);
            } else {
                return undefined;
            }
        } else {
            if (JsNode.isNumber(newHeight)) {
                newHeight += 'px';
            }
            this.#nodes.forEach((node, index) => {
                if (typeof (newHeight) !== 'function') {
                    node.style.height = newHeight;
                } else {
                    let height = newHeight(parseFloat(getComputedStyle(node).height), index);
                    if (JsNode.isNumber(height)) {
                        height += 'px';
                    }
                    node.style.height = height;
                }
            });

            return this;
        }
    }

    /**
     * Devuelve o establece la anchura de la seleción con el padding, pero sin
     * el border ni el margin. Si es una devolución solo se devuelve respecto
     * al primer elemento de la selección.
     * @param {number|string|Function} newWidth Valor de la nueva anchura.
     * Los números se convierten a cadenas en píxeles, si es una función se
     * llama pasándole el ancho actual y el índice de cada elemento, y se
     * establece el nuevo ancho en el valor retornado.
     * @returns {JsNode}
     */
    innerWidth(newWidth = undefined) {
        if (newWidth === undefined) {
            if (this.#nodes[0]) {
                const cs = getComputedStyle(this.#nodes[0]);
                return parseFloat(cs.width) +
                    parseFloat(cs.paddingLeft) +
                    parseFloat(cs.paddingRight);
            } else {
                return undefined;
            }
        } else {
            if (JsNode.isNumber(newWidth)) {
                newWidth += 'px';
            }
            this.#nodes.forEach((node, index) => {
                const cs = getComputedStyle(node);
                const paddings = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);

                if (typeof (newWidth) !== 'function') {
                    node.style.width = newWidth;
                } else {
                    let width = newWidth(parseFloat(cs.width) + paddings, index);
                    if (JsNode.isNumber(width)) {
                        width += 'px';
                    }
                    node.style.width = width;
                }
                // A la anchura hay que restarle los padding derecho e izquierdo                                
                node.style.width = (parseFloat(cs.width) - paddings) + 'px';
            });

            return this;
        }
    }

    /**
     * Devuelve o establece la altura de la seleción con el padding, pero sin
     * el border ni el margin. Si es una devolución solo se devuelve respecto
     * al primer elemento de la selección.
     * @param {number|string|Function} newHeight Valor de la nueva alturaa.
     * Los números se convierten a cadenas en píxeles, si es una función se
     * llama pasándole el alto actual y el índice de cada elemento, y se
     * establece el nuevo alto en el valor retornado.
     * @returns {JsNode}
     */
    innerHeight(newHeight = undefined) {
        if (newHeight === undefined) {
            if (this.#nodes[0]) {
                const cs = getComputedStyle(this.#nodes[0]);
                return parseFloat(cs.height) +
                    parseFloat(cs.paddingTop) +
                    parseFloat(cs.paddingBottom);
            } else {
                return undefined;
            }
        } else {
            if (JsNode.isNumber(newHeight)) {
                newHeight += 'px';
            }
            this.#nodes.forEach((node, index) => {
                const cs = getComputedStyle(node);
                const paddings = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);

                if (typeof (newHeight) !== 'function') {
                    node.style.height = newHeight;
                } else {
                    let height = newHeight(parseFloat(cs.height) + paddings, index);
                    if (JsNode.isNumber(height)) {
                        height += 'px';
                    }
                    node.style.height = height;
                }
                // A la anchura hay que restarle los padding derecho e izquierdo                                
                node.style.height = (parseFloat(cs.height) - paddings) + 'px';
            });

            return this;
        }
    }

    /**
     * Devuelve o establece la anchura de la seleción con el padding y el borde
     * pero sin el margin. Si es una devolución solo se devuelve respecto
     * al primer elemento de la selección.
     * @param {number|string|Function|boolean} newWidth Valor de la nueva anchura.
     * Los números se convierten a cadenas en píxeles, si es una función se
     * llama pasándole el ancho actual y el índice de cada elemento, y se
     * establece el nuevo ancho en el valor retornado. Si es un booelano con
     * valor true, se incluye el margin.
     * @param {boolean} Si es true se incluye el margin, y no se incluye en
     * caso contrario.
     * @returns {JsNode}
     */
    outerWidth(newWidth = undefined, withMargin = false) {
        if (newWidth === undefined || typeof (newWidth) === 'boolean') {
            if (this.#nodes[0]) {
                const cs = getComputedStyle(this.#nodes[0]);
                return parseFloat(cs.width) +
                    parseFloat(cs.paddingLeft) +
                    parseFloat(cs.paddingRight) +
                    parseFloat(cs.borderLeftWidth) +
                    parseFloat(cs.borderRightWidth) +
                    (newWidth ? (parseFloat(cs.marginLeft) + parseFloat(cs.marginRight)) : 0);
            } else {
                return undefined;
            }
        } else {
            if (JsNode.isNumber(newWidth)) {
                newWidth += 'px';
            }
            this.#nodes.forEach((node, index) => {
                const cs = getComputedStyle(node);
                const extra = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) +
                    parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth) +
                    (withMargin ? (parseFloat(cs.marginLeft) + parseFloat(cs.marginRight)) : 0);

                if (typeof (newWidth) !== 'function') {
                    node.style.width = newWidth;
                } else {
                    let width = newWidth(parseFloat(cs.width) + extra, index);
                    if (JsNode.isNumber(width)) {
                        width += 'px';
                    }
                    node.style.width = width;
                }
                // A la anchura hay que restarle las dimensioes extra
                node.style.width = (parseFloat(cs.width) - extra) + 'px';
            });

            return this;
        }
    }

    /**
     * Devuelve o establece la altura de la seleción con el padding y el borde
     * pero sin el margin. Si es una devolución solo se devuelve respecto
     * al primer elemento de la selección.
     * @param {number|string|Function|boolean} newHeight Valor de la nueva altura.
     * Los números se convierten a cadenas en píxeles, si es una función se
     * llama pasándole el ancho actual y el índice de cada elemento, y se
     * establece el nuevo ancho en el valor retornado. Si es un booelano con
     * valor true, se incluye el margin.
     * @param {boolean} Si es true se incluye el margin, y no se incluye en
     * caso contrario.
     * @returns {JsNode}
     */
    outerHeight(newHeight = undefined, withMargin = false) {
        if (newHeight === undefined || typeof (newHeight) === 'boolean') {
            if (this.#nodes[0]) {
                const cs = getComputedStyle(this.#nodes[0]);
                return parseFloat(cs.height) +
                    parseFloat(cs.paddingTop) +
                    parseFloat(cs.paddingBottom) +
                    parseFloat(cs.borderTopWidth) +
                    parseFloat(cs.borderBottomWidth) +
                    (newHeight ? (parseFloat(cs.marginTop) + parseFloat(cs.marginBottom)) : 0);
            } else {
                return undefined;
            }
        } else {
            if (JsNode.isNumber(newHeight)) {
                newHeight += 'px';
            }
            this.#nodes.forEach((node, index) => {
                const cs = getComputedStyle(node);
                const extra = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) +
                    parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) +
                    (withMargin ? (parseFloat(cs.marginTop) + parseFloat(cs.marginBottom)) : 0);

                if (typeof (newHeight) !== 'function') {
                    node.style.height = newHeight;
                } else {
                    let height = newHeight(parseFloat(cs.height) + extra, index);
                    if (JsNode.isNumber(height)) {
                        height += 'px';
                    }
                    node.style.height = height;
                }
                // A la anchura hay que restarle las dimensioes extra
                node.style.height = (parseFloat(cs.height) - extra) + 'px';
            });

            return this;
        }
    }

    /**
     * Devuelve como propiedad la lista de nodos de la selección actual.
     * @returns {Array<HTMLElement>}
     */
    get nodes() {
        return this.#nodes;
    }

    /**
     * Devuelve como propiedad el número de elementos de la selección actual.
     * @returns {number}
     */
    get length() {
        return this.#nodes.length;
    }

    /**
     * Devuelve un valor que indica si el elemento apuntado por el
     * índice especificado es visible.
     * @param {number|undefined} Un índice basado en cero al elemento
     * que se desea comprobar. Por defecto se toma el primer elemento.
     * @returns {boolean|undefined} Un booleano indicando el estado
     * de visibilidad o undefined si no existe el elemento.
     */
    visible(index = 0) {
        const node = this.#nodes[index];

        if (node) {
            const cs = getComputedStyle(node);

            return cs.display !== 'none' && cs.visibility !== 'hidden';
        } else {
            return undefined;
        }
    }
}
