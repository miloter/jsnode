/**
 * @summary Componente de diálogo con mensaje sencillo que se ejecuta sobre JsNode.
 * @copyright miloter
 * @license MIT
 * @since 2025-07-05
 * @version 0.3.0 2025-07-05
 */
class JsNodeDialog102 extends JsNode {
    static #styleUid = 'data-' + crypto.randomUUID();

    static #template = /*html*/`                        
        <dialog>
            <h2 class="title"></h2>
            <div class="content"></div>
        </dialog>
    `;

    #options;
    // Referencia al cuadro de diálogo de la instancia
    #dialog;
    
    constructor(selector, options = {}) {
        super(selector).addClass(JsNodeDialog102.#styleUid);
        this.#options = {            
            title: 'Título del mensaje',
            content: 'Contenido del mensaje',
            onCancel: console.log,
        };
        this.#initialize(options);
    }

    #initialize(options = {}) {
        // Agregamos la plantilla en la selección actual
        this.#dialog = this.append(JsNodeDialog102.#template).children('dialog').nodes[0];

        // Actualizamos las opciones
        this.#_updateOptions(options);

        // Evento que controla que no se pueda cerrar pulsando Escape
        this.select('dialog').on('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault();
            }
        });

        // Actualiza los estilos
        this.#updateStyles();
    }

    #_updateOptions(options) {
        Object.assign(this.#options, options);
        this.select('.title').html(this.#options.title);
        this.select('.content').html(this.#options.content);
    }

    #updateStyles() {
        // Le asigna estilos si aun no existen
        if (JsNode.select(`head > style[${JsNodeDialog102.#styleUid}]`).length) return;

        JsNode.select('head').append(/*html*/`
            <style ${JsNodeDialog102.#styleUid}>
                .${JsNodeDialog102.#styleUid} dialog {
                    background-color: yellowgreen;
                    max-width: 50%;
                }                                    

                .${JsNodeDialog102.#styleUid} .title {
                    text-align: center;
                }                                    

                .${JsNodeDialog102.#styleUid} .content {
                    text-align: justify;
                    font-family: monospace;
                    font-size: 111%;
                }                                    
            </style>
        `);
    }

    /**
     * Muestra el cuadro de diálogo.
     * @param {object} Objeto de opciones con el título y el contenido del
     * mensaje. Si no se suministra se usarán el título y contenido actuales.
     */
    showModal(options = {}) {
        this.#_updateOptions(options);
        this.#dialog.showModal();
    }

    /**
     * Actualiza las opciones del cuadro de diálogo.
     * @param {object} Objeto de opciones con el título y el contenido del
     * mensaje. Si no se suministra se usarán el título y contenido actuales.
     */
    updateOptions(options = {}) {
        this.#_updateOptions(options);        
    }


    /**
     * Cierra el cuadro de diálogo.
     */
    close() {
        this.#dialog.close();
    }
}