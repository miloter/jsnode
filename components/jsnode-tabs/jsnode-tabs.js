/**
 * @summary Componente de pestañas sencillo que se ejecuta sobre JsNode.
 * @copyright miloter
 * @license MIT
 * @since 2025-05-07
 * @version 0.3.0 2025-06-27
 */
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
            tabs: [{
                id: 'tab1',
                text: '¡Hola Mundo!',
                content: '<h1>¡Hola Mundo!</h1>',
                activateOnlyByCode: false
            }, {
                id: 'tab2',
                text: 'Hello World!',
                content: '<h1>Hello World!</h1>',
                activateOnlyByCode: false
            }],
            activeTabId: 'tab1',
            onActiveTab: undefined,
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
                    <a href="#${tab.id}"${tab.activateOnlyByCode ? ' class="link-disabled"': ''}>
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
        
        // Necesario para dentro de las funciones con otro this
        const self = this;        
        // Evento para controlar la selección de ficha
        this.select(`.tab-links a`).on('click', function (event) {            
            // Previene la navegación de enlaces
            event.preventDefault();

            const section = this.attr('href');
            const id = section.substring(1);

            if (self.#options.tabs.find(tab => tab.id === id).activateOnlyByCode) return;

            self.activeTab(id);            
        });

        // Establece la ficha activa
        const tab = this.#options.tabs.find(task => task.id === this.#options.activeTabId);
        if (tab && !tab.activateOnlyByCode) {
            this.activeTab(tab.id);            
        }
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
                        background-color: #7FB5DA;
                        font-size: 16px;
                        font-weight: 600;
                        color: #4c4c4c;
                        transition: all linear 0.15s;
                    }

                    .${JsNodeTabs.#styleUid} .tab-links a.link-disabled {
                        opacity: 0.49999;
                        text-decoration: none;
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
                </style>
            `);
        }
    }

    /**
     * Activa una pestaña a partir de su identificador.
     * @param {*} id 
     */
    activeTab(id) {
        const link = this.select(`.tab-links a[href="#${id}"]`);

        // Agrega la cl<ase 'active' en el link actual y la elimina
        // del link activo previo
        link.parent('li').addClass('active').siblings().removeClass('active');
        
        // tab es la nueva pestaña que debe visualizarse
        const tab = link.parents('ul', `.${JsNodeTabs.#styleUid}`).next().select(`#${id}`);
        
        // Oculta todas las pestañas    
        tab.hide().siblings().hide();
            
        // Comunica el cambio de pestaña
        if (this.#options.onActiveTab) onActiveTab(id);

        // Muestra la pestaña seleccionada con una animación
        tab.show(400, 0, 'height');        
    }
}