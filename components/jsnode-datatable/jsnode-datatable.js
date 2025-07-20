/**
 * @summary Datatable sencillo que se ejecuta sobre JsNode.
 * @copyright miloter
 * @license MIT
 * @since 2025-05-07
 * @version 0.5.1 2025-07-08
 */
class JsNodeDataTable extends JsNode {
    // Para generar un identificador común en todas las instancias, se toman
    // los últimos 12 caracteres hexadecimales
    static #uid = 'u' + crypto.randomUUID().substring(24);
    // Plantilla que se inyectará en la página
    static #template = /*html*/`
        <div class="${this.#uid}-datatable">
            <div class="${this.#uid}-datatable-header">        
                <div>    
                    Filas/Pág. <select class="${this.#uid}-select-rows-per-page"></select>            
                </div>
                <button type="button" class="${this.#uid}-filters-unapply" title="Quita la ordenación y el filtrado">
                    &#x1F704;
                </button>
                <a href="#" class="${this.#uid}-csv-export" title="Exporta el filtrado actual a un archivo CSV">CSV</a>
                <div class="${this.#uid}-columns-multiselect">                        
                    <button type="button" class="${this.#uid}-toggle-columns-multiselect">
                        Mostrar/ocultar columnas
                    </button>                            
                    <div class="${this.#uid}-columns-multiselect-checkboxes">
                        <label class="${this.#uid}-columns-multiselect-label-main">
                            <input type="checkbox" class="${this.#uid}-chk-main">
                            - Todas Visibles -
                        </label>
                        <div class="${this.#uid}-columns-multiselect-labels"></div>
                    </div>
                </div>
                <div class="${this.#uid}-custom"></div>
            </div>
            <table class="${this.#uid}-datatable-table">
                <thead></thead>
                <tbody></tbody>
            </table>
            <div class="${this.#uid}-datatable-footer">                        
                <button class="${this.#uid}-previous-page">Ant.</button>
                &nbsp;
                Página <input type="number" class="${this.#uid}-current-page"
                    min = "1" max="1" value="1" length="4"> de <span>101</span>
                &nbsp;
                <button class="${this.#uid}-next-page">Sig.</button>            
            </div>       
        </div>
    `;
    // Ayuda para el manejo de fechas
    static #reGroupedIsoDate = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{1,2})(?::(\d{1,2})(?:\.(\d{1,9})Z?)?)?)?$/;
    // Ayuda para el manejo de fechas
    static #reGroupedSpainDate = /^(\d{1,2})(?:\/|-)(\d{1,2})(?:\/|-)(\d{4})(?:,? (\d{1,2}):(\d{1,2})(?::(\d{1,2})(?:\.(\d{1,9}))?)?)?$/;        
    #options;
    #currentPage;
    #keys;
    #header;
    #rows;
    #filteredRowsCache;
    #filteredRowsCacheChanged;
    #sortMetaDataCache;
    #sortMetaDataCacheChanged;
    // Nombre de clase única para cada instancia
    #classUid;

    constructor(selector, options = {}) {
        // Selecciona la ubicación e inyecta la plantilla y construye
        // el objeto haciendo que this se refiera al JsNodeDataTable
        super(
            JsNode.select(selector)
                .append(JsNodeDataTable.#template)
                .children(-1)
        );
        this.#options = {
            columns: [
                { key: 'id', text: 'ID', inputFilterSize: 5 },
                { key: 'title', text: 'Título', inputFilterSize: 8 },
                { key: 'description', text: 'Descripción', inputFilterSize: 16 },
                { key: 'actions', text: 'Acciones', noCsv: true },
            ],
            rows: [
                { id: 1, title: 'tarea 1', description: 'tarea número 1', actions: '<button type="button" data-id="1">Eliminar</button>' },
                { id: 2, title: 'tarea 2', description: 'tarea número 2', actions: '<button type="button" data-id="2">Eliminar</button>' },
                { id: 3, title: 'tarea 3', description: 'tarea número 3', actions: '<button type="button" data-id="3">Eliminar</button>' }
            ],
            maxRowsPerPage: 2,
            maxRowsPerPageList: [2, 5, 10, 20, 50, 100],
            onPageChanged: undefined
        };
        this.#classUid = 'c' + crypto.randomUUID().substring(24);
        this.#initialize(options);
    }

    /**
     * Devuelve el identificador único usado en esta clase.
     * @returns {string}
     */
    static getUid() {
        return JsNodeDataTable.#uid;
    }

    #initialize(options = {}) {
        // Para las funciones que tienen su propio this
        const self = this;
        // Para acceso rápido al identificador único de clase
        const uid = JsNodeDataTable.#uid;

        this.#currentPage = 1;
        this.#options = Object.assign(this.#options, options);
        this.#filteredRowsCacheChanged = true;
        this.#sortMetaDataCacheChanged = true;

        // <select> máximo de filas visibles por página
        const select = this.select(`.${uid}-select-rows-per-page`).html('');
        for (const n of this.#options.maxRowsPerPageList) {
            select.append(`<option value="${n}">${n}</option>`);
        }
        select.val(this.#options.maxRowsPerPage).on('change', function () {
            self.#currentPage = 1;
            self.#options.maxRowsPerPage = parseInt(this.val());
            self.#updateRows();
        });

        // <.csv-export> enlace de descarga del CSV ordenado y/o filtrado
        this.select(`.${uid}-csv-export`).on('click', function (event) {
            event.preventDefault();
            self.#downloadCsv();
        });

        // <.columns-multiselect>: Si se pulsa ESC se oculta la lista de
        // los checkboxes de selección de columnas
        this.select(`.${uid}-columns-multiselect`).on('keyup', function (event) {
            if (event.key === 'Escape') {
                this.select(`.${uid}-columns-multiselect-checkboxes`).hide();
            }
        })
            // Se le agrega además una clase única para esta instancia para diferenciarlo de las demás
            .addClass(this.#classUid);

        // <button.toggle-columns-multiselect>: alterna la visualización de
        // los checboxes de selección de columnas
        this.select(`.${uid}-toggle-columns-multiselect`).on('click', function () {
            // .next() => <.columns-multiselect-checkboxes>
            this.next().toggle();
        }).click(); // Inicialmente oculto    

        // <document>: si se pulsa click con la selección de columnas abiertas
        // se cierran
        JsNode.select(document).on('click', event => {
            const checkboxesList = this.select(`.${uid}-columns-multiselect-checkboxes`);

            // Si no está abierto no hace nada
            if (!checkboxesList.visible()) return;

            // La técnica consiste en saber si donde estamos haciendo click es
            // en el propio elemento, con lo que el lugar del click estaría
            // contenido por el elemento <.columns-multiselect.<uid>>, o bien no
            // está contenido y por tanto deber cerrarse la lista de selección
            // de columnas
            if (!JsNode.select(event.target).parents(
                `.${uid}-columns-multiselect.${this.#classUid}`).length) {
                checkboxesList.hide();
            }
        });

        // <div class="columns-multiselect-labels">: las columnas que se pueden
        // visualizar/ocultar
        const cml = this.select(`.${uid}-columns-multiselect-labels`);
        for (let i = 0; i < this.#options.columns.length; i++) {
            const col = this.#options.columns[i];
            cml.append(/*html*/`
                <label>
                    <input type="checkbox"${col.noVisible ? '' : ' checked'}
                        data-col-index="${i}">
                    ${col.text}
                </label>
            `);
        }

        // Creamos un evento para poner o quitar la selección de cada una
        cml.select('[type="checkbox"]').on('change', function () {
            self.#options.columns[this.prop('dataset').colIndex].noVisible = !this.prop('checked');

            // Actualizamos el selector de mostrar/ocultar todas
            self.select(`.${uid}-chk-main`).prop('checked', !self.#options.columns.some(c => c.noVisible));

            // Reseamos el estado de ordenación y filtrado
            self.#resetSortOrFilter();            
        });

        // Creamos un evento para poner o quitar la selección de todas
        this.select(`.${uid}-chk-main`).on('change', function () {
            const checked = this.prop('checked');

            for (const col of self.#options.columns) {
                col.noVisible = !checked;
            }
            cml.select('[type="checkbox"]').prop('checked', checked);
            
            // Reseamos el estado de ordenación y filtrado
            self.#resetSortOrFilter();            
        });
        // Inicialmente su valor depende de lo selecionado
        this.select(`.${uid}-chk-main`).prop('checked', !this.#options.columns.some(c => c.noVisible));

        // <.filters-unapply>: desaplicar filtros
        this.select(`.${uid}-filters-unapply`).hide().on('click', function () {
            // Reseamos el estado de ordenación y filtrado
            self.#resetSortOrFilter();            
        });

        // Contenido personalizado opcional
        if (this.#options.custom) {
            this.select(`.${uid}-custom`).html(this.#options.custom);
        }

        // INPUT/number de páginas
        this.select(`.${uid}-current-page`).on('change', function () {
            self.#currentPage = parseInt(this.val());
            self.#updateRows();
        });

        // Botones adelante atrás
        this.select(`.${uid}-previous-page`).filterText('Ant.').on('click', function () {
            self.#currentPage--;
            self.#updateRows();
        });
        this.select(`.${uid}-next-page`).filterText('Sig.').on('click', function () {
            self.#currentPage++;
            self.#updateRows();
        });

        // Actualizar cabecera y filas
        this.#updateHeader();
        this.#updateRows();

        // Actualiza los estilos
        this.#updateStyles();

        this.#updateSortingOrFilterStyles();
    }

    #resetSortOrFilter() {
        for (const col of this.#options.columns) {
            col.orderType = 0;
            col.orderPos = 0;
            col.filter = '';
        }
        this.#filteredRowsCacheChanged = true;
        this.#sortMetaDataCacheChanged = true;
        this.#currentPage = 1;
        this.#updateHeader();
        this.#updateRows();

        // Ocultamos el botón de quitar filtros
        this.select(`.${JsNodeDataTable.#uid}-filters-unapply`).hide();
    }

    #updateHeader() {
        // Para acceso rápido al identificador único de clase
        const uid = JsNodeDataTable.#uid;

        this.#makeHeader();
        this.select(`.${uid}-datatable-table thead`).html(this.#header);

        // Actualiza los eventos de la ordenación y los filtros
        const self = this;
        for (const col of this.#options.columns) {
            if (col.noVisible) continue;

            if (col.filter === undefined) col.filter = '';
            if (col.orderType === undefined) col.orderType = 0;
            if (col.orderPos === undefined) col.orderPos = 0;

            this.select(`.${uid}-datatable-table thead span[data-key="${col.key}"]`)
                .html(JsNodeDataTable.#iconOrder(col))
                .css('cursor', 'pointer')
                .off().on('click', function () {
                    self.#setOrderType(col);
                    self.#updateRows();
                    self.#updateSortingOrFilterStyles();
                });

            this.select(`.${uid}-datatable-table thead input[type="text"][data-key="${col.key}"]`)
                .off().on('input', function () {
                    col.filter = this.val();
                    self.#currentPage = 1;
                    self.#filteredRowsCacheChanged = true;
                    self.#updateRows();
                    self.#updateSortingOrFilterStyles();
                }).val(col.filter);            
        }
    }

    #updateRows() {
        // Para acceso rápido al identificador único de clase
        const uid = JsNodeDataTable.#uid;

        this.#makeRows();
        this.select(`.${uid}-datatable-table tbody`).html(this.#rows);

        // Actualiza los contadores de página
        this.select(`.${uid}-current-page[type="number"`)
            .val(this.#currentPage)
            .attr('max', this.#maxPage)
            .next().text(this.#maxPage);

        // Actualiza los botones de anterior/siguiente
        this.select(`.${uid}-previous-page`).prop('disabled', this.#currentPage == 1);
        this.select(`.${uid}-next-page`).prop('disabled', this.#currentPage >= this.#maxPage);

        // Avisa de la actualización de la página
        if (typeof(this.#options.onPageChanged) === 'function') {
            this.#options.onPageChanged(this.rowsInCurrentPage);
        }
    }

    get #maxPage() {
        return Math.ceil(this.#filteredRowsCache.length / this.#options.maxRowsPerPage);
    }

    #makeHeader() {
        const html = ['<tr>']
        this.#keys = [];
        for (const col of this.#options.columns) {
            if (col.noVisible) continue;

            let inputFilter;

            this.#keys.push(col.key);

            // Solo hay filtrado y ordenación si la propiedad inputFilterSize
            // se ha suministrado y el valor del tamaño es mayor que 0
            if (col.inputFilterSize > 0) {
                inputFilter = /*html*/`
                    <span class="${JsNodeDataTable.#uid}-sort-control" data-key="${col.key}"></span>
                    <input type="text" size="${col.inputFilterSize}" data-key="${col.key}">
                    <br>
                `;
            } else {
                inputFilter = '';
            }
            html.push(/*html*/`
                <th${col.maxWidth ? ` style="max-width: ${col.maxWidth}rem;"` : ''}>
                    ${inputFilter}                    
                    ${col.text}
                    ${col.html ?? ''}
                </th$>
            `);
        }
        html.push('</tr>');
        this.#header = html.join('');
    }

    #makeRows() {
        const html = [];
        for (const row of this.rowsInCurrentPage) {
            html.push('<tr>');
            for (const key of this.#keys) {
                const col = this.#options.columns.find(c => c.key === key);
                
                html.push(`<td${col.maxWidth ?
                    ` style="max-width: ${col.maxWidth}rem; overflow: auto;"` :
                    ''}>${row[key]}</td$>`);
            }
            html.push('</tr>');
        }
        this.#rows = html.join('');
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
        // Para acortar los nombres        
        const uid = JsNodeDataTable.#uid;

        // Le asigna estilos si aun no existen
        if (JsNode.select(`head > style[${uid}]`).length) return;

        JsNode.select('head').append(/*html*/`
            <style ${uid}>
                .${uid}-datatable {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                .${uid}-datatable-header {
                    display: flex;                        
                    justify-content: center;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 0.25rem;
                }

                .${uid}-datatable-table {
                    border-collapse: collapse;    
                    margin-bottom: 0.25rem;
                }

                .${uid}-datatable-table th, .${uid}-datatable-table td {
                    border: 1px solid black;    
                    padding: 0.5rem;    
                }
            
                .${uid}-datatable-table thead th {
                    text-align: center;
                }
            
                .${uid}-datatable-table tr:nth-child(even) {
                    background-color: rgba(192, 192, 192, 0.205);
                } /* Formato de filas pares */
            
            
                /* Color de fondo al pasar sobre una fila */
                .${uid}-datatable-table tr:hover > td:not(tfoot td) {
                    background-color: rgba(154, 228, 241, 0.301);
                }

                .${uid}-sort-control {
                    padding: 0.25rem;                                                
                }

                .${uid}-sort-apply {
                    background-color: lightblue;
                    border: 1px solid black;
                    border-radius: 50%;                                              
                }

                .${uid}-filters-unapply {
                    background-color: tomato;
                }

                .${uid}-columns-multiselect {
                    position: relative;
                    margin: 0.16rem;
                }

                .${uid}-columns-multiselect-checkboxes {
                    position: absolute;
                    z-index: 1;
                    background-color: lightgray;
                    border: 1px solid black;
                    max-height: ${this.columnsMultiselectMaxHeight}rem;
                    overflow: auto;
                }

                .${uid}-columns-multiselect-checkboxes label {
                    display: block;
                }

                .${uid}-columns-multiselect-label-main {
                    background-color: #fff5cc;"
                }
            </style>
        `);
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

            if ((valA instanceof Date) && (valB instanceof Date)) {
                return orderType * (valA > valB ? 1 : -1);
            }

            if (JsNodeDataTable.#isSpainDate(valA) && JsNodeDataTable.#isSpainDate(valB)) {
                return orderType * JsNodeDataTable.#compareSpainDate(valA, valB);
            }

            if (JsNodeDataTable.#isIsoDate(valA) && JsNodeDataTable.#isIsoDate(valB)) {
                return orderType * JsNodeDataTable.#compareIsoDate(valA, valB);
            }

            if (JsNode.isNumber(valA) && JsNode.isNumber(valB)) {
                return orderType * Math.sign(valA - valB);
            } else {
                return orderType * valA.localeCompare(valB);
            }
        }
    }

    static #isIsoDate(date) {
        return /^\d{4}-\d{1,2}-\d{1,2}(?:[T ]\d{1,2}:\d{1,2}(?::\d{1,2}(?:\.\d{1,9}Z?)?)?)?$/.test(date);
    }

    static #isSpainDate(date) {
        return /^\d{1,2}(?:\/|-)\d{1,2}(?:\/|-)\d{4}(?:,? \d{1,2}:\d{1,2}(?::\d{1,2}(?:\.\d{1,9})?)?)?$/.test(date);
    }

    static #replaceIsoDate(full, year, month, day, hours, minutes, seconds, milliseconds) {            
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds ?? 0}.${milliseconds ?? 0}`;
    }

    /**
     * Compara dos fechas en formato ISO Y-m-d H:i:s:u, la parte de hora
     * es opcional y dentro de ella los segundos y los milisegundos.
     * @param {string} valA Fecha en formato ISO.
     * @param {string} valB Fecha en formato ISO.
     * @returns
     */
    static #compareIsoDate(valA, valB) {        
        const dateA = new Date(valA.replace(JsNodeDataTable.#reGroupedIsoDate, this.#replaceIsoDate));
        const dateB = new Date(valB.replace(JsNodeDataTable.#reGroupedIsoDate, this.#replaceIsoDate));

        return dateA > dateB ? 1 : -1;
    }

    static #replaceSpainDate(full, day, month, year, hours, minutes, seconds, milliseconds) {            
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds ?? 0}.${milliseconds ?? 0}`;
    }

    /**
     * Compara dos fechas en formato español d/m/Y H:i:s:u, la parte de hora
     * es opcional y dentro de ella los segundos y los milisegundos.
     * @param {string} valA Fecha en formato español.
     * @param {string} valB Fecha en formato español.
     * @returns
     */
    static #compareSpainDate(valA, valB) {        
        const dateA = new Date(valA.replace(JsNodeDataTable.#reGroupedSpainDate, this.#replaceSpainDate));
        const dateB = new Date(valB.replace(JsNodeDataTable.#reGroupedSpainDate, this.#replaceSpainDate));

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
        // Para acceso rápido al identificador único de clase
        const uid = JsNodeDataTable.#uid;

        let hasFilters = false;

        for (const col of this.#options.columns) {
            const span = this.select(`.${uid}-datatable-table thead span[data-key="${col.key}"]`);

            span.html(JsNodeDataTable.#iconOrder(col));
            if (col.orderType !== 0) {
                span.addClass(`${uid}-sort-apply`);
            } else {
                span.removeClass(`${uid}-sort-apply`);
            }

            if (col.filter) {
                hasFilters = true;
            }
        }

        const button = this.select(`.${uid}-filters-unapply`);

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
            if (columns[i].noVisible) continue;

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
                if (columns[i].noVisible) continue;

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
     * Devuelve las filas de la página actual.
     * @returns {Array}
     */
    get rowsInCurrentPage() {
        const start = (this.#currentPage - 1) * this.#options.maxRowsPerPage;
        return this.#orderedRows.slice(start, start + this.#options.maxRowsPerPage);
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
        this.select(`.${JsNodeDataTable.#uid}-filters-unapply`).show().click();
    }

    /**
     * Devuelve el contenido actual de las opciones.
     * @returns {object}
     */
    get options() {
        return this.#options;
    }
}