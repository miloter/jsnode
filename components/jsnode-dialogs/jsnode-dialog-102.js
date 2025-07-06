/**
 * @summary Componente de diálogo con mensaje sencillo que se ejecuta sobre JsNode.
 * @copyright miloter
 * @license MIT
 * @since 2025-07-05
 * @version 0.4.0 2025-07-06
 */
class JsNodeDialog102 extends JsNode {
    // Para generar un identificador común en todas las instancias, se toman
    // los últimos 12 caracteres hexadecimales
    static #uid = 'u' + crypto.randomUUID().substring(24);

    static #template = this.#buildTemplate();

    #options;    
    
    constructor(selector, options = {}) {
        // Agregamos la plantilla en la selección y hacemos que this sea una
        // referencia al elemento HTML/DIALOG
        super(JsNode.select(selector).append(JsNodeDialog102.#template).children(-1));
        this.#options = {            
            title: 'Título del mensaje',
            content: 'Contenido del mensaje',
            onCancel: console.log,
        };
        this.#initialize(options);
    }

    // Contruye la plantilla
    static #buildTemplate() {        
        const uid = this.#uid; // Para acortar los nombres

        return /*html*/`
            <dialog class="${uid}-dialog">
                <h2 class="${uid}-dialog-title"></h2>
                <div class="${uid}-dialog-content"></div>
            </dialog>
        `;
    }

    #initialize(options = {}) {        
        // Actualizamos las opciones
        this.#_updateOptions(options);

        // Evento que controla que no se pueda cerrar pulsando Escape
        this.on('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault();
            }
        });

        // Actualiza los estilos
        this.#updateStyles();
    }

    #_updateOptions(options) {
        const uid = JsNodeDialog102.#uid; // Para acortar los nombres

        Object.assign(this.#options, options);
        this.select(`.${uid}-dialog-title`).html(this.#options.title);
        this.select(`.${uid}-dialog-content`).html(this.#options.content);
    }

    #updateStyles() {
        const uid = JsNodeDialog102.#uid; // Para acortar los nombres

        // Le asigna estilos si aun no existen
        if (JsNode.select(`head > style[${uid}]`).length) return;

        JsNode.select('head').append(/*html*/`
            <style ${uid}>
                .${uid}-dialog {
                    background-color: yellowgreen;
                    max-width: 50%;
                }                                    

                .${uid}-dialog-title {
                    text-align: center;
                }                                    

                .${uid}-dialog-content {
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
        this.nodes[0].showModal();
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
        this.nodes[0].close();
    }
}