/**
 * @summary Componente de diálogo no modal con botón de cierre, título y
 * contenido que se ejecuta sobre JsNode.
 * @copyright miloter
 * @license MIT
 * @since 2025-07-16
 * @version 0.3.0 2025-07-16
 */
class JsNodeDialogClose extends JsNode {
    // Para generar un identificador común en todas las instancias, se toman
    // los últimos 12 caracteres hexadecimales
    static #uid = 'u' + crypto.randomUUID().substring(24);

    static #template = /*html*/`
        <dialog class="${this.#uid}-dialog">
            <button class="${this.#uid}-dialog-close" title="Cerrar">X</button>
            <h3 class="${this.#uid}-dialog-title"></h3>
            <div class="${this.#uid}-dialog-content"></div>
        </dialog>
    `;

    #options;    
    
    constructor(selector, options = {}) {
        // Agregamos la plantilla en la selección y hacemos que this sea una
        // referencia al elemento HTML/DIALOG
        super(JsNode.select(selector).append(JsNodeDialogClose.#template).children(-1));
        this.#options = {  
            scrollTop: true,          
            title: '',
            content: '',
            type: 'success' // success | warning | danger
        };
        this.#initialize(options);
    }

    #initialize(options = {}) {        
        // Actualizamos las opciones
        this.#_updateOptions(options);

        // Cierra el cuadro si se pulsa el botón de cerrar
        this.select(`.${JsNodeDialogClose.#uid}-dialog-close`).on('click', () => this.close());
    }
    
    #_updateOptions(options) {
        const uid = JsNodeDialogClose.#uid; // Para acortar los nombres
        
        Object.assign(this.#options, options);
        this.select(`.${uid}-dialog-title`).html(this.#options.title);
        this.select(`.${uid}-dialog-content`).html(this.#options.content);
        // Actualiza los estilos
        this.#updateStyles();
    }

    #updateStyles() {
        const uid = JsNodeDialogClose.#uid; // Para acortar los nombres
        const type = this.#options.type;

        // Elimina los estilos si existen y los asigna
        const styles = JsNode.select(`head > style[${uid}]`);
        if (styles.length) {
            styles.remove();
        }

        JsNode.select('head').append(/*html*/`
            <style ${uid}>
                .${uid}-dialog {                    
                    max-width: 50%;
                    position: relative;
                    color: ${
                        type === 'success' ? 'white' :
                            (type === 'warning' ? 'black' : 'white')
                    };
                    background-color: ${
                        type === 'success' ? 'green' :
                            (type === 'warning' ? 'orange' : 'tomato')
                    };
                    font-weight: bold;
                    border: 1px solid black;
                    margin: 0.25rem auto;
                }                                    

                .${uid}-dialog-close {
                    position: absolute;
                    right: 0;
                    top: 0;                    
                }                     

                .${uid}-dialog-close:hover {
                    background: red;
                    color: white;
                }

                .${uid}-dialog-title {
                    text-align: center;
                    margin: 0.25rem;
                }                                    

                .${uid}-dialog-content {
                    margin: 0.25rem;
                    text-align: justify;                    
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
    show(options = {}) {
        this.#_updateOptions(options);
        this.nodes[0].show();
        if (this.#options.scrollTop) {
            window.scrollTo(0, 0);
        }
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