/**
 * @summary Componente de acordeón sencillo que se ejecuta sobre JsNode.
 * @copyright miloter
 * @license MIT
 * @since 2025-06-28
 * @version 0.4.0 2025-06-29
 */
class JsNodeAccordion extends JsNode {
    // Para generar un identificador común en todas las instancias, se toman
    // los últimos 12 caracteres hexadecimales
    static #uid = 'u' + crypto.randomUUID().substring(24);

    static #template = /*html*/`                        
        <div class="${this.#uid}-accordion"></div>
    `;

    #options;

    constructor(selector, options = {}) {
        // Hacemos que this se refiera a la raiz del JsNodeAccordion
        super(JsNode.select(selector).append(JsNodeAccordion.#template).children(-1));
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

    /**
     * Devuelve el identificador único usado en esta clase.
     * @returns {string}
     */
    static getUid() {
        return this.#uid;
    }

    #initialize(options = {}) {
        // Necesario en el interior de las funciones con otro this
        const self = this;
        const uid = JsNodeAccordion.#uid; // Acortamos el nombre

        this.#options = Object.assign(this.#options, options);        

        // Actualiza los estilos
        this.#updateStyles();
        

        for (const section of this.#options.sections) {
            this.append(/*html*/`
                <div class="${uid}-accordion-section">
                    <a class="${uid}-accordion-section-title" href="#${section.id}">${section.title}</a>
                    <div id="${section.id}" class="${uid}-accordion-section-content">${section.content}</div>
                </div>
            `);
        }        

        // Controlamos cuando se pulsa en una sección del acordeón
        this.select(`.${uid}-accordion-section-title`).on('click', function (event) {
            // Obtenemos el ID de la sección del acordeón pulsada
            const href = this.attr('href');
            const isActive = this.hasClass(`${uid}-active`);

            self.#closeSection();
            if (!isActive) {
                // Agrega la clase .active al título
                this.addClass(`${uid}-active`);
                // Muestra el contenido y le agrega la clase .open
                self.select(`${href}`).show(300, 0, 'height').addClass(`${uid}-open`);
            }

            event.preventDefault();
        });
    }

    #closeSection() {
        const uid = JsNodeAccordion.#uid;

        this.select(`.${uid}-accordion-section-title`).removeClass(`${uid}-active`);
        this.select(`.${uid}-accordion-section-content`)
            .hide(300, 0, 'height').removeClass(`${uid}-open`);
    }

    #updateStyles() {
        const uid = JsNodeAccordion.#uid;

        // Le asigna estilos si aun no existen
        if (JsNode.select(`head > style[${uid}]`).length) return;

        JsNode.select('head').append(/*html*/`
            <style ${uid}>
                .${uid}-accordion,
                .${uid}-accordion * {
                    box-sizing: border-box;
                }

                .${uid}-accordion {
                    overflow: hidden;
                    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.25);
                    border-radius: 3px;
                    background-color: #f7f7f7;
                }

                .${uid}-accordion-section-title {
                    width: 100%;
                    padding: 0.5rem;
                    display: inline-block;
                    border-bottom: 1px solid #1a1a1a;
                    background-color: #333;
                    transition: all linear 0.15s;
                    font-size: 1.10rem;
                    text-shadow: 0px 1px 0px #1a1a1a;
                    color: #fff;
                }

                .${uid}-active,
                .${uid}-accordion-section-title:hover {
                    background-color: #4c4c4c;                        
                    text-decoration: none;
                }

                .${uid}-accordion-section:last-child .${uid}-accordion-section-title {
                    border-bottom: none;
                }

                .${uid}-accordion-section-content {
                    padding: 0.5rem;
                    display: none;
                }
            </style>
        `);        
    }
}