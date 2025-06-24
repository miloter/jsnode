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

            ],
            activeTabId: undefined
        };
        this.#updateAll(options);
    }

    #updateAll(options = {}) {
        this.#options = Object.assign(this.#options, options);

        // Inyectamos la plantilla en la selección actual
        this.html(JsNodeTabs.#template);

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
        tabLinks.select(`a[href="#${this.#options.activeTabId}"]`)
            .parent('li').addClass('active');
        tabContent.select(`#${this.#options.activeTabId}`).addClass('active');

        // Evento para controlar la selección de ficha
        this.select(`.tab-links a`).on('click', function (event) {
            const section = this.attr('href');

            // Agrega la clase 'active' en la pestaña actual y la elimina
            // de la pestaña activa previa
            this.parent('li').addClass('active').siblings().removeClass('active');

            // Muestra/Oculta pestañas (this referencia a la etiqueta <a>)
            this.parents('ul', `.${JsNodeTabs.#styleUid}`).next().select(`${section}`)
                .show(400, 0, 'height').siblings().hide();            

            // Previene la navegación de enlaces
            event.preventDefault();
        });

        // Actualiza los estilos
        this.#updateStyles();
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

                    .${JsNodeTabs.#styleUid} .tab.active {
                        display: block;
                    }
                </style>
            `);
        }
    }
}