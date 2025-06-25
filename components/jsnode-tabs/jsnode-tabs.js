class JsNodeTabs extends JsNode {
    static #styleUid = 'data-' + crypto.randomUUID();

    static #template = /*html*/`                        
        <ul class="tab-links"></ul>
        <div class="tab-content"></div>        
    `;

    #options;

    constructor(selector, options = {}) {
        super(selector).addClass(JsNodeTabs.#styleUid);
        this.#options = {
            tabs: [
                { id: 'tab1', text: 'Hola Mundo', content: '<h1>Hola JsNode</h1>'}
            ],
            activeTabId: 'tab1',
            onActiveTab: undefined
        };
        this.#updateAll(options);
    }

    #updateAll(options = {}) {
        this.#options = Object.assign(this.#options, options);

        // Inyectamos la plantilla en la selección actual
        this.html(JsNodeTabs.#template);

        // Actualiza los estilos
        this.#updateStyles();

        // Construimos el componente
        const tabLinks = this.select('.tab-links');
        const tabContent = this.select('.tab-content');

        for (const tab of this.#options.tabs) {
            tabLinks.append(/*html*/`
                <li>
                    <a href="#${tab.id}">
                        ${tab.text}
                    </a>
                </li>
            `);
            tabContent.append(/*html*/`
                <div id="${tab.id}" class="tab">
                    ${tab.content}
                </div>
            `);
        }

        // Establece la ficha activa
        if (this.#options.activeTabId) {
            tabLinks.select(`a[href="#${this.#options.activeTabId}"]`)
                .parent('li').addClass('active');            
            
            // Comunica el cambio de pestaña
            if (onActiveTab) onActiveTab(this.#options.activeTabId);

            // Muestra la pestaña
            tabContent.select(`#${this.#options.activeTabId}`).show();
        }

        // Evento para controlar la selección de ficha
        this.select(`.tab-links a`).on('click', function (event) {
            const section = this.attr('href');

            // Agrega la clase 'active' en el link actual y la elimina
            // del link activo previo
            this.parent('li').addClass('active').siblings().removeClass('active');

            // Muestra/Oculta pestañas (this referencia a la etiqueta <a>) y
            // tab a la nueva pestaña que debe visualizarse
            const tab = this.parents('ul', `.${JsNodeTabs.#styleUid}`).next().select(`${section}`);
            // Oculta las pestañas
            tab.siblings().hide();
            
            // Comunica el cambio de pestaña
            if (onActiveTab) onActiveTab(section.substring(1));

            // Muestra la pestaña seleccionada con una animación
            tab.show(800, 0, 'opacity');                      

            // Previene la navegación de enlaces
            event.preventDefault();
        });        
    }

    #updateStyles() {
        // Le asigna estilos si aun no existen
        if (!JsNode.select(`head > style[${JsNodeTabs.#styleUid}]`).length) {
            JsNode.select('head').append(/*html*/`
                <style ${JsNodeTabs.#styleUid}>
                    .${JsNodeTabs.#styleUid} {
                        width: 100%;
                        display: inline-block;
                    }                                        
                    
                    .${JsNodeTabs.#styleUid} .tab-links:after {
                        display: block;
                        clear: both;
                        content: '';
                    }
                    
                    .${JsNodeTabs.#styleUid} .tab-links li {
                        margin: 0px 5px;
                        float: left;
                        list-style: none;
                    }

                    .${JsNodeTabs.#styleUid} .tab-links a {
                        padding: 9px 15px;
                        display: inline-block;
                        border-radius: 3px 3px 0px 0px;
                        background: #7FB5DA;
                        font-size: 16px;
                        font-weight: 600;
                        color: #4c4c4c;
                        transition: all linear 0.15s;
                    }

                    .${JsNodeTabs.#styleUid} .tab-links a:hover {
                        background: #a7cce5;
                        text-decoration: none;
                    }

                    .${JsNodeTabs.#styleUid} li.active a,
                    .${JsNodeTabs.#styleUid} li.active a:hover {
                        background-color: lightgreen;
                        color: #4c4c4c;
                    }
                    
                    .${JsNodeTabs.#styleUid} .tab-content {
                        padding: 15px;
                        border-radius: 3px;
                        box-shadow: -1px 1px 1px rgba(0, 0, 0, 0.15);
                        background: #fff;
                    }

                    .${JsNodeTabs.#styleUid} .tab {
                        display: none;
                    }                    
                </style>
            `);
        }
    }
}