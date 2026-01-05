/**
 * @summary Componente de diálogo modal con un mensaje de notificación
 * que no se puede cerrar manualmente, pero sí mediante código o
 * al finalizar un temporizador.
 * @copyright miloter
 * @license MIT
 * @since 2025-07-05
 * @version 0.5.0 2026-01-05
 */
class JsNodeDialogNoClose extends JsNode {
    // Para generar un identificador común en todas las instancias, se toman
    // los últimos 12 caracteres hexadecimales
    static #uid = 'u' + crypto.randomUUID().substring(24);

    static #template = /*html*/`
        <dialog class="${this.#uid}-dialog">
            <h2 class="${this.#uid}-dialog-title"></h2>
            <div class="${this.#uid}-dialog-content"></div>
        </dialog>
    `;

    #options;    
    
    constructor(selector, options = {}) {
        // Agregamos la plantilla en la selección y hacemos que this sea una
        // referencia al elemento HTML/DIALOG
        super(JsNode.select(selector).append(JsNodeDialogNoClose.#template).children(-1));
        this.#options = {            
            title: 'Título del mensaje',
            content: 'Contenido del mensaje',
            type: 'success', // success | warning | danger
            timeout: -1
        };
        this.#initialize(options);
    }

    #initialize(options = {}) {                
        // Evento que controla que no se pueda cerrar pulsando Escape
        this.on('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault();
            }
        });        

        // Actualizamos las opciones
        this.#_updateOptions(options);
    }

    #_updateOptions(options) {
        const uid = JsNodeDialogNoClose.#uid; // Para acortar los nombres

        Object.assign(this.#options, options);
        this.select(`.${uid}-dialog-title`).html(this.#options.title);
        this.select(`.${uid}-dialog-content`).html(this.#options.content);
        if (this.#options.timeout >= 0) {
            setTimeout(() => this.close(), this.#options.timeout);
        }

        // Actualiza los estilos
        this.#updateStyles();
    }

    #updateStyles() {
        const uid = JsNodeDialogNoClose.#uid; // Para acortar los nombres
        const type = this.#options.type;

        // Le asigna estilos si aun no existen
        if (JsNode.select(`head > style[${uid}]`).length) return;

        JsNode.select('head').append(/*html*/`
            <style ${uid}>
                .${uid}-dialog {
                    background-color: yellowgreen;
                    max-width: 50%;
                    color: ${
                        type === 'success' ? 'white' :
                            (type === 'warning' ? 'black' : 'white')
                    };
                    background-color: ${
                        type === 'success' ? 'green' :
                            (type === 'warning' ? 'orange' : 'tomato')
                    };
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