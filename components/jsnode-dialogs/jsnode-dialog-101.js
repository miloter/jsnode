/**
 * @summary Componente de diálogo con formulario sencillo que se ejecuta sobre JsNode.
 * @copyright miloter
 * @license MIT
 * @since 2025-07-05
 * @version 0.4.0 2025-07-06
 */
class JsNodeDialog101 extends JsNode {
    // Para generar un identificador común en todas las instancias, se toman
    // los últimos 12 caracteres hexadecimales
    static #uid = 'u' + crypto.randomUUID().substring(24);
    
    static #template = /*html*/`
        <dialog class="${this.#uid}-dialog">
            <form>
                <div class="${this.#uid}-mb">
                    <label class="${this.#uid}-form-label">
                        Nombre
                        <input type="text" name="name" class="${this.#uid}-form-control">
                    </label>
                </div>
                <div class="${this.#uid}-mb">
                    <label class="${this.#uid}-form-label">
                        Ocupación
                        <select name="work" class="${this.#uid}-form-control">
                            <option value="estudent">Estudiante</option>
                            <option value="teacher">Profesor</option>
                            <option value="engineer">Ingeniero</option>
                        </select>
                    </label>
                </div>
                <div class="${this.#uid}-mb">
                    <label class="${this.#uid}-form-check-label">
                        <input type="checkbox" name="isAvailable" class="${this.#uid}-form-check-control">
                        Disponible
                    </label>
                </div>
                <div class="">
                    <button type="submit" class="submit ${this.#uid}-btn ${this.#uid}-btn-primary">
                        Enviar
                    </button>
                    <button type="button" class="cancel ${this.#uid}-btn ${this.#uid}-btn-danger">
                        Cancelar
                    </button>
                </div>
            </form>
        </dialog>
    `;

    #options;

    // Indica si se ha enviado el formulario o se ha pulsado el botón cancelar
    #isSubmitOrCancelButton;

    constructor(selector, options = {}) {
        // Esto hará que this apunte al elemento JsNodeDialog101
        super(JsNode.select(selector).append(JsNodeDialog101.#template).children(-1));

        this.#options = {
            onSubmit: console.log,
            onCancel: console.log,
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
        this.#options = Object.assign(this.#options, options);        

        // Inicialmente ni se ha enviado el formulario, ni se ha pulsado en cancelar
        this.#isSubmitOrCancelButton = false;

        // Evento de cierre del diálogo
        this.select('dialog').on('close', () => this.#onModalClose());

        // Evento que controla el botón Enviar
        this.select('button.submit').on('click', event => this.#onModalSubmitButton(event));

        // Evento que controla el botón Cancelar
        this.select('button.cancel').on('click', () => this.#onModalCancelButton());

        // Actualiza los estilos
        this.#updateStyles();
    }

    #updateStyles() {
        // Para acortar los nombres
        const uid = JsNodeDialog101.#uid;

        // Le asigna estilos si aun no existen
        if (JsNode.select(`head > style[${uid}]`).length) return;

        JsNode.select('head').append(/*html*/`
            <style ${uid}>                
                .${uid}-dialog {
                    background-color: yellowgreen;
                }    
                
                .${uid}-btn {
                    padding: 0.5rem;
                    font-size: 105%;                         
                }

                .${uid}-btn:hover {
                    outline: 2px solid orange;
                }

                .${uid}-btn-primary {
                    background-color: blue;
                    color: white;
                }

                .${uid}-btn-danger {
                    background-color: red;
                    color: white;
                }

                .${uid}-mb {
                    margin-bottom: 0.50rem;
                }                

                .${uid}-form-control {
                    display: block;
                }

                .${uid}-form-check-control {
                    
                }
                
                .${uid}-form-label {
                    
                }

                .${uid}-form-check-label {
                    
                }
            </style>
        `);
    }

    #emitOnCancel() {
        if (typeof (this.#options.onCancel) !== 'function') return;
        
        this.#options.onCancel('Formulario Cancelado');        
    }

    #emitOnSubmit(data) {
        if (typeof (this.#options.onSubmit) !== 'function') return;
        
        this.#options.onSubmit(data);        
    }

    #onModalSubmitButton(event) {
        // Para no recargar la página
        event.preventDefault();

        // Esto nos permitirá distiguir entre un cierre por envío del
        // formulario y uno por cancelación
        this.#isSubmitOrCancelButton = true;        

        // Comprueba los datos
        const name = this.select('[name="name"]').val();
        if (!name.trim()) return alert('El nombre es obligatorio');

        const work = this.select('[name="work"]').val();
        if (!work.trim()) return alert('El trabajo es obligatorio');

        const isAvailable = this.select('[name="isAvailable"]').prop('checked');

        // Avisa de que se envía el formulario
        this.#emitOnSubmit({ name, work, isAvailable });

        // Hay que cerrarlo (el submit no lo cierra)
        this.nodes[0].close();
    }

    #onModalClose() {
        
        if (!this.#isSubmitOrCancelButton) {
            this.#emitOnCancel();
        }        
        // Para controlar enviar/cancelar la próxima vez que se abra
        this.#isSubmitOrCancelButton = false;
    }

    #onModalCancelButton() {
        this.#isSubmitOrCancelButton = true;
        this.#emitOnCancel();        
        this.nodes[0].close();
    }

    /**
     * Muestra el cuadro de diálogo.
     */
    showModal() {        
        this.nodes[0].showModal();
    }

    /**
     * Cierra el cuadro de diálogo.
     */
    close() {
        this.nodes[0].close();
    }
}