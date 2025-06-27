/**
 * @summary Datatable sencillo que se ejecuta sobre JsNode.
 * @copyright miloter
 * @license MIT
 * @since 2025-05-07
 * @version 0.4.0 2025-06-27
 */
class JsNodeDataTable {
    static #styleUid = 'data-' + crypto.randomUUID();
    static #template = /*html*/`                
        <div>        
            <div>    
                Filas/Pág. <select></select>            
            </div>
            <button type="button" class="filters-unapply" title="Quita la ordenación y el filtrado">
                &#x1F704;
            </button>
            <a href="#" class="csv-export" title="Exporta el filtrado actual a un archivo CSV">CSV</a>
        </div>
        <table>
            <thead></thead>
            <tbody></tbody>
        </table>
        <div>                        
            <button>Ant.</button>
            &nbsp;
            Página <input type="number" min = "1" max="1" value="1" length="4"> de <span>101</span>
            &nbsp;
            <button>Sig.</button>            
        </div>        
    `;
    static #reGroupedDateString = /^(\d{2})(?:\/|-)(\d{2})(?:\/|-)(\d{4})$/;

    #el;
    #options;
    #currentPage;
    #keys;
    #header;
    #rows;
    #filteredRowsCache;
    #filteredRowsCacheChanged;
    #sortMetaDataCache;
    #sortMetaDataCacheChanged;

    constructor(selector, options = {}) {
        this.#el = JsNode.select(selector).addClass(JsNodeDataTable.#styleUid);
        this.#options = {
            columns: [
                { key: 'id', text: 'ID', inputFilterSize: 5 },
                { key: 'title', text: 'Título', inputFilterSize: 8 },
                { key: 'description', text: 'Descripción', inputFilterSize: 16 },
                { key: 'actions', text: 'Acciones', noCsv: true },
            ],
            rows: [
                {id: 1, title: 'tarea 1', description: 'tarea número 1', actions: '<button type="button" data-id="1">Eliminar</button>'},
                {id: 2, title: 'tarea 2', description: 'tarea número 2', actions: '<button type="button" data-id="2">Eliminar</button>'},
                {id: 3, title: 'tarea 3', description: 'tarea número 3', actions: '<button type="button" data-id="3">Eliminar</button>'}
            ],
            maxRowsPerPage: 2,
            maxRowsPerPageList: [2, 5, 10, 20, 50, 100]
        };
        this.#updateAll(options);
    }

    #updateAll(options = {}) {
        this.#currentPage = 1;
        this.#options = Object.assign(this.#options, options);
        this.#filteredRowsCacheChanged = true;
        this.#sortMetaDataCacheChanged = true;

        // Inyecta la plantila
        this.#el.html(JsNodeDataTable.#template);

        const self = this;

        // SELECT máximo de filas visibles por página
        const select = this.#el.select('select').html('');
        for (const n of this.#options.maxRowsPerPageList) {
            select.append(`<option value="${n}">${n}</option>`);
        }
        select.val(this.#options.maxRowsPerPage).off('change').on('change', function () {
            self.#currentPage = 1;
            self.#options.maxRowsPerPage = parseInt(this.val());
            self.#updateRows();
        });

        // BUTTON desaplicar filtros
        this.#el.select('button.filters-unapply').hide()
            .off('click').on('click', function () {
                for (const col of self.#options.columns) {
                    col.orderType = 0;
                    col.orderPos = 0;
                    col.filter = 0;
                }
                self.#currentPage = 1;
                self.#filteredRowsCacheChanged = true;
                self.#sortMetaDataCacheChanged = true;
                self.#updateHeader();
                self.#updateRows();
                this.hide();
            });

        // A enlace de descarga del CSV ordenado y/o filtrado
        this.#el.select('a.csv-export').off('click').on('click', function (event) {
            event.preventDefault();
            self.#downloadCsv();
        });

        // INPUT/number de páginas
        this.#el.select('[type="number"').off('change').on('change', function () {
            self.#currentPage = parseInt(this.val());
            self.#updateRows();
        });

        // Botones adelante atrás
        this.#el.select('button').filterText('Ant.').off('click').on('click', function () {
            self.#currentPage--;
            self.#updateRows();
        });
        this.#el.select('button').filterText('Sig.').off('click').on('click', function () {
            self.#currentPage++;
            self.#updateRows();
        });

        // Actualizar cabecera y filas
        this.#updateHeader();
        this.#updateRows();

        // Actualiza los estilos
        this.#updateStyles();
    }

    #updateHeader() {
        this.#makeHeader();
        this.#el.select('thead').html(this.#header);

        // Actualiza los eventos de la ordenación y los filtros
        const self = this;
        for (const col of this.#options.columns) {
            col.filter = '';
            col.orderType = 0;
            col.orderPos = 0;

            this.#el.select(`span[data-key="${col.key}"]`)
                .html(JsNodeDataTable.#iconOrder(col))
                .off('click').css('cursor', 'pointer')
                .on('click', function () {
                    self.#setOrderType(col);
                    self.#updateRows();
                    self.#updateSortingOrFilterStyles();
                });

            this.#el.select(`input[type="text"][data-key="${col.key}"]`)
                .off('input').on('input', function () {
                    col.filter = this.val();
                    self.#currentPage = 1;
                    self.#filteredRowsCacheChanged = true;
                    self.#updateRows();
                    self.#updateSortingOrFilterStyles();
                });
        }
    }

    #updateRows() {
        this.#makeRows();
        this.#el.select('tbody').html(this.#rows);

        // Actualiza los contadores de página
        this.#el.select('[type="number"')
            .val(this.#currentPage)
            .attr('max', this.#maxPage)
            .next().text(this.#maxPage);

        // Actualiza los botones de anterior/siguiente
        this.#el.select('button').filterText('Ant.').prop('disabled', this.#currentPage == 1);
        this.#el.select('button').filterText('Sig.').prop('disabled', this.#currentPage >= this.#maxPage);
    }

    get #maxPage() {
        return Math.ceil(this.#filteredRowsCache.length / this.#options.maxRowsPerPage);
    }

    #makeHeader() {
        const html = ['<tr>']
        this.#keys = [];
        for (const col of this.#options.columns) {
            let inputFilter;

            this.#keys.push(col.key);

            // Solo hay filtrado y ordenación si la propiedad inputFilterSize
            // se ha suministrado y el valor del tamaño es mayor que 0
            if (col.inputFilterSize > 0) {
                inputFilter = /*html*/`
                    <span class="sort-control" data-key="${col.key}"></span>
                    <input type="text" size="${col.inputFilterSize}" data-key="${col.key}">
                    <br>
                `;
            } else {
                inputFilter = '';
            }
            html.push(/*html*/`
                <th>
                    ${inputFilter}                    
                    ${col.text}
                </th>
            `);
        }
        html.push('</tr>');
        this.#header = html.join('');
    }

    #makeRows() {
        const html = [];
        for (const row of this.#rowsInCurrentPage) {
            html.push('<tr>');
            for (const key of this.#keys) {
                html.push(`<td>${row[key]}</td>`);
            }
            html.push('</tr>');
        }
        this.#rows = html.join('');
    }

    get #rowsInCurrentPage() {
        const start = (this.#currentPage - 1) * this.#options.maxRowsPerPage;
        return this.#orderedRows.slice(start, start + this.#options.maxRowsPerPage);
    }

    get #orderedRows() {
        if (!this.#sortMetaData.length) {
            return this.#filteredRows;
        }

        const rows = [...this.#filteredRows];

        for (let i = this.#sortMetaData.length - 1; i >= 0; i--) {
            const { key, orderType } = this.#sortMetaData[i];
            rows.sort(this.#comparer(key, orderType));
        }

        return rows;
    }

    /**
     * Devuelve las filas que pasan el filtrado.
     */
    get #filteredRows() {
        if (!this.#filteredRowsCacheChanged) {
            return this.#filteredRowsCache;
        }

        // Comprueba solo los filtros con contenido
        const filters = [];
        for (const col of this.#options.columns) {
            if (!col.filter) continue;
            filters.push({ key: col.key, filter: JsNodeDataTable.#normalize(col.filter) });
        }

        this.#filteredRowsCache = [];
        for (const row of this.#options.rows) {
            let add = true;
            for (const f of filters) {
                const match = JsNodeDataTable.#normalize(String(row[f.key])).indexOf(f.filter) >= 0;
                if (!match) {
                    add = false;
                    break;
                }
            }
            if (add) {
                this.#filteredRowsCache.push(row);
            }
        }
        this.#filteredRowsCacheChanged = false;

        return this.#filteredRowsCache;
    }

    #updateStyles() {
        // Le asigna estilos si aun no existen
        if (!JsNode.select(`head > style[${JsNodeDataTable.#styleUid}]`).length) {
            JsNode.select('head').append(/*html*/`
                <style ${JsNodeDataTable.#styleUid}>
                    .${JsNodeDataTable.#styleUid} {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }

                    .${JsNodeDataTable.#styleUid} > div:nth-child(1) {
                        display: flex;
                        justify-content: center;
                        gap: 1rem;
                        margin-bottom: 0.25rem;
                    }

                    .${JsNodeDataTable.#styleUid} table {
                        border-collapse: collapse;    
                        margin-bottom: 0.25rem;
                    }

                    .${JsNodeDataTable.#styleUid} table th, .${JsNodeDataTable.#styleUid} table td {
                        border: 1px solid black;    
                        padding: 0.5rem;    
                    }
                
                    .${JsNodeDataTable.#styleUid} table thead th {
                        text-align: center;
                    }
                
                    .${JsNodeDataTable.#styleUid} table tr:nth-child(even) {
                        background-color: rgba(192, 192, 192, 0.205);
                    } /* Formato de filas pares */
                
                
                    /* Color de fondo al pasar sobre una fila */
                    .${JsNodeDataTable.#styleUid} table tr:hover > td:not(tfoot td) {
                        background-color: rgba(154, 228, 241, 0.301);
                    }

                    .${JsNodeDataTable.#styleUid} .sort-control {
                        padding: 0.25rem;                                                
                    }

                    .${JsNodeDataTable.#styleUid} .sort-apply {
                        background-color: lightblue;
                        border: 1px solid black;
                        border-radius: 50%;                                              
                    }

                    .${JsNodeDataTable.#styleUid} .filters-unapply {
                        background-color: tomato;
                    }
                </style>
            `);
        }
    }

    static #normalize(text) {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    /**
     * Establece el tipo de orden en una columna.        
     * @param {object} col La columna que se ha seleccionado para ordenar.
     * El orden es cíciclo: 0 -> 1 -> -1 -> 0.
     * @return {object} La columna afectada.
     */
    #setOrderType(col) {
        if (col.orderType === 0) {
            col.orderType = 1;
            col.orderPos = this.#sortMetaData.length + 1;
        } else if (col.orderType === 1) {
            col.orderType = -1;
        } else {
            col.orderType = 0;
            col.orderPos = 0;
        }
        this.#sortMetaDataCacheChanged = true;

        return col;
    }



    /**
     * Devuelve los datos para poder replicar la ordenación.
     */
    get #sortMetaData() {
        if (!this.#sortMetaDataCacheChanged) {
            return this.#sortMetaDataCache;
        }

        this.#sortMetaDataCache = [];
        for (const col of this.#options.columns) {
            if (col.orderType) {
                this.#sortMetaDataCache.push(col);
            }
        }

        this.#sortMetaDataCacheChanged = false;

        // Se devuelve ordenada por orden de aplicación        
        const res = this.#sortMetaDataCache.sort((o1, o2) => o1.orderPos - o2.orderPos);

        // Se actualizan las posiciones debido a que se puede haber eliminado
        // alguna posición antes de la última
        let n = 1;
        for (const order of res) {
            order.orderPos = n;
            n++;
        }

        return res;
    }

    /**
     * El comparador, usa una expresión regular para verificar si el valor de
     * la celda es una fecha, en cuyo caso se usa un comparador personalizado.
     * @param {string} key Clave del campo de ordenación.
     * @param {num} orderType Tipo de orden: 1 ascendente y -1 descendente
     * @returns
     */
    #comparer(key, orderType) {
        return function (a, b) {
            const valA = a[key], valB = b[key];

            if (JsNodeDataTable.#isDateString(valA) && JsNodeDataTable.#isDateString(valB)) {
                return orderType * JsNodeDataTable.#compareDate(valA, valB);
            }

            if (JsNode.isNumber(valA) && JsNode.isNumber(valB)) {
                return orderType * Math.sign(valA - valB);
            } else {
                return orderType * valA.localeCompare(valB);
            }
        }
    }

    static #isDateString(date) {
        return /^\d{2}(?:\/|-)\d{2}(?:\/|-)\d{4}$/.test(date);
    }

    static #isNumeric(expr) {
        if (typeof (expr) === 'number' || typeof (expr) === 'bigint') {
            return true;
        } else if (typeof (expr) === 'string') {
            return /^\s*[+-]?\d+(?:\.\d+)?(?:[Ee][+-]?\d+)?\s*$/.test(expr);
        } else {
            return false;
        }
    }

    /**
     * Compara dos fechas en formato dd/mm/aaaa o dd-mm-aaaa.    
     * @param {string} valA Fecha en formato dd/mm/aaaa o dd-mm-aaaa.
     * @param {string} valB Fecha en formato dd/mm/aaaa o dd-mm-aaaa.
     * @returns
     */
    static #compareDate(valA, valB) {
        const dateA = new Date(valA.replace(JsNodeDataTable.#reGroupedDateString, "$2/$1/$3"));
        const dateB = new Date(valB.replace(JsNodeDataTable.#reGroupedDateString, "$2/$1/$3"));

        return dateA > dateB ? 1 : -1;
    }

    /**
     * Devuelve el tipo de icono en función del orden actual.
     * @param {object} col Información de la columna, conteniendo el
     * tipo de orden: 0, 1, -1 y la posición.
     * @returns {string}
     * 0: &udarr;        
     * 1: &uarr;
     * -1: &darr;
     */
    static #iconOrder(col) {
        if (col.orderType === 0) return '&nbsp;  &udarr;'
        if (col.orderType === 1) return col.orderPos + ' &uarr;'
        return col.orderPos + ' &darr;'
    }

    #updateSortingOrFilterStyles() {
        let hasFilters = false;

        for (const col of this.#options.columns) {
            const span = this.#el.select(`span[data-key="${col.key}"]`);

            span.html(JsNodeDataTable.#iconOrder(col));
            if (col.orderType !== 0) {
                span.addClass('sort-apply');
            } else {
                span.removeClass('sort-apply');
            }

            if (col.filter) {
                hasFilters = true;
            }
        }

        const button = this.#el.select('button.filters-unapply');

        if (this.#sortMetaDataCache.length || hasFilters) {
            button.show();
        } else {
            button.hide();
        }
    }

    #downloadCsv(event) {
        const date = new Date();
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        const filename = 'csv_' + date.toISOString()
            .replace(/[T:.-]/g, '_')
            .replace('Z', '') + '.csv';

        this.#downloadFileCSV(filename, this.#getRowsToCsv());
    }

    // Descarga un fichero simulando un click
    #downloadFileCSV(filename, content) {
        /* Se le agrega el BOM U+FEFF que indica
        condificación UTF-16 Big-Endian, y es requerido para
        que  Excel lo interprete correctamente */
        content = '\ufeff' + content;

        // Lo inyecta en un Blob
        const blob = new Blob([content], { type: 'text/csv' });

        // Utiliza la técnica de la descarga al hacer click
        JsNode.select('body').append(`
            <a href="${URL.createObjectURL(blob)}" download="${filename}"></a>
        `).children('a').one(-1).click().remove();
    }

    /**
     * Devuelve la filas en una cadena con formato CSV.
     * @returns {string}
     */
    #getRowsToCsv() {
        // Nueva línea estándar en un CSV
        const nl = '\r\n';
        // Caracter de entrecomillado para campos que lo requieran
        const quotes = '"';
        const dblQuotes = quotes + quotes;
        // Carácter separador de campos
        const sep = ';';
        // Generamos la cadena en formato CSV            
        const sb = [];

        // Trabajaremos con las columnas
        const columns = this.#options.columns;

        // Escribe el valor actual en el array
        function writeValue(sb, value) {
            const hasSep = value.includes(sep);
            const hasQuotes = value.includes(quotes);
            const hasLines = value.includes('\r') || value.includes('\n');

            if (hasSep || hasQuotes || hasLines) {
                sb.push(quotes);
            }
            if (hasQuotes) {
                value = value.replaceAll(quotes, dblQuotes);
            }
            sb.push(value);
            if (hasSep || hasQuotes || hasLines) {
                sb.push(quotes);
            }
        }

        // Cabeceras del CSV            
        for (let i = 0; i < columns.length; i++) {
            if (columns[i].noCsv) continue;

            const value = columns[i].text;

            writeValue(sb, value);
            if (i < (columns.length - 1)) {
                sb.push(sep);
            }
        }
        if (sb.length) {
            sb.push(nl);
        }

        // Cuerpo del CSV 
        let nRows = 0;
        for (const row of this.#orderedRows) {
            for (let i = 0; i < columns.length; i++) {
                if (columns[i].noCsv) continue;

                const value = String(row[columns[i].key] ?? '');

                writeValue(sb, value);
                if (i < (columns.length - 1)) {
                    sb.push(sep);
                }
            }
            nRows++;
            if (nRows < this.#orderedRows.length) {
                sb.push(nl);
            }
        }

        return sb.join('');
    }

    /**
     * Establece un nuevo array de filas en el componente.
     * @param {Array<Object>} rows Array de objetos, donde
     * cada objeto contiene los nombres de campo y sus valores.
     */
    setRows(rows) {
        this.#options.rows = rows;
        this.#currentPage = 1;
        this.#filteredRowsCacheChanged = true;
        this.#sortMetaDataCacheChanged = true;
        this.#updateRows();
    }

    /**
     * Agrega una fila al final de la colección.
     * @param {Object} row 
     */
    addRow(row) {
        this.#options.rows.push(row);
        this.#filteredRowsCacheChanged = true;
        this.#sortMetaDataCacheChanged = true;
        this.#updateRows();
    }

    /**
     * Actualiza una fila de la colección.
     * @param {Object} row 
     */
    updateRow(key, value, data) {
        const row = this.#options.rows.find(r => r[key] === value);

        Object.assign(row, data);
        this.#filteredRowsCacheChanged = true;
        this.#sortMetaDataCacheChanged = true;
        this.#updateRows();
    }

    /**
     * Elimina una fila de la colección.
     * @param {string} key Nombre de la clave de búsqueda.
     * @value {any} Valor de la clave en la fila que se eliminará.
     */
    deleteRow(key, value) {
        this.#options.rows = this.#options.rows.filter(r => r[key] !== value);
        this.#el.select('button.filters-unapply').show().click();
    }

    /**
     * Devuelve el contenido actual de las opciones.
     * @returns {object}
     */
    get options() {
        return this.#options;
    }
}