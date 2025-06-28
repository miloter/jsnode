/**
 * @summary Componente de acordeón sencillo que se ejecuta sobre JsNode.
 * @copyright miloter
 * @license MIT
 * @since 2025-06-28
 * @version 0.3.0 2025-06-28
 */
class JsNodeAccordion extends JsNode {
    static #styleUid = 'data-' + crypto.randomUUID();

    static #template = /*html*/`                        
        <div class="accordion"></div>
    `;

    #options;

    constructor(selector, options = {}) {
        super(selector).addClass(JsNodeAccordion.#styleUid);
        this.#options = {
            sections: [{
                id: 'sect1',
                title: '¡Hola Mundo!',
                content: '<h1>¡Hola Mundo!</h1>'
            }, {
                id: 'sect2',
                title: '¡Buenos días!',
                content: '<h1>Buenas Tardes!</h1>'
            }]
        };
        this.#initialize(options);
    }

    #initialize(options = {}) {
        // Necesario para dentro de las funciones con otro this
        const self = this;

        this.#options = Object.assign(this.#options, options);

        // Inyectamos la plantilla en la selección actual
        this.html(JsNodeAccordion.#template);

        // Actualiza los estilos
        this.#updateStyles();

        // Padre de las secciones del acordeón
        const accordion = this.select('.accordion');

        for (const section of this.#options.sections) {
            accordion.append(/*html*/`
                <div class="accordion-section">
                    <a class="accordion-section-title" href="#${section.id}">${section.title}</a>
                    <div id="${section.id}" class="accordion-section-content">${section.content}</div>
                </div>
            `);
        }        

        // Controlamos cuando se pulsa en una sección del acordeón
        this.select('.accordion-section-title').on('click', function (event) {
            // Obtenemos el ID de la sección del acordeón pulsada
            const href = this.attr('href');
            const isActive = this.hasClass('active');

            self.#closeSection();
            if (!isActive) {
                // Add active class to section title
                this.addClass('active');
                // Open up the hidden content panel
                self.select(`.accordion ${href}`)
                    .show(300, 0, 'height').addClass('open');
            }

            event.preventDefault();
        });
    }

    #closeSection() {
        this.select('.accordion .accordion-section-title').removeClass('active');
        this.select('.accordion .accordion-section-content')
            .hide(300, 0, 'height').removeClass('open');
    }

    #updateStyles() {
        // Le asigna estilos si aun no existen
        if (!JsNode.select(`head > style[${JsNodeAccordion.#styleUid}]`).length) {
            JsNode.select('head').append(/*html*/`
                <style ${JsNodeAccordion.#styleUid}>
                    .${JsNodeAccordion.#styleUid} .accordion,
                    .${JsNodeAccordion.#styleUid} .accordion * {
                        box-sizing: border-box;
                    }

                    .${JsNodeAccordion.#styleUid} .accordion {
                        overflow: hidden;
                        box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.25);
                        border-radius: 3px;
                        background-color: #f7f7f7;
                    }

                    .${JsNodeAccordion.#styleUid} .accordion-section-title {
                        width: 100%;
                        padding: 15px;
                        display: inline-block;
                        border-bottom: 1px solid #1a1a1a;
                        background-color: #333;
                        transition: all linear 0.15s;
                        font-size: 1.200em;
                        text-shadow: 0px 1px 0px #1a1a1a;
                        color: #fff;
                    }

                    .${JsNodeAccordion.#styleUid} .accordion-section-title.active,
                    .${JsNodeAccordion.#styleUid} .accordion-section-title:hover {
                        background-color: #4c4c4c;                        
                        text-decoration: none;
                    }

                    .${JsNodeAccordion.#styleUid} .accordion-section:last-child .accordion-section-title {
                        border-bottom: none;
                    }

                    .${JsNodeAccordion.#styleUid} .accordion-section-content {
                        padding: 15px;
                        display: none;
                    }
                </style>
            `);
        }
    }
}