/**
 * @summary Componente de diálogo con formulario sencillo que se ejecuta sobre JsNode.
 * @copyright miloter
 * @license MIT
 * @since 2025-07-05
 * @version 0.3.0 2025-07-05
 */
class JsNodeDialog101 extends JsNode {
    static #styleUid = 'data-' + crypto.randomUUID();

    static #template = /*html*/`                        
        <dialog>
            <form>
                <div class="mb">
                    <label class="form-label">
                        Nombre
                        <input type="text" name="name" class="form-control">
                    </label>
                </div>
                <div class="mb">
                    <label class="form-label">
                        Ocupación
                        <select name="work" class="form-control">
                            <option value="estudent">Estudiante</option>
                            <option value="teacher">Profesor</option>
                            <option value="engineer">Ingeniero</option>
                        </select>
                    </label>
                </div>
                <div class="mb">
                    <label class="form-check-label">
                        <input type="checkbox" name="isAvailable" class="form-check-control">
                        Disponible
                    </label>
                </div>
                <div class="d-flex justify-content-center align-items-center gap-1">
                    <button type="submit" class="submit btn btn-primary">
                        Enviar
                    </button>
                    <button type="button" class="cancel btn btn-danger">
                        Cancelar
                    </button>
                </div>
            </form>
        </dialog>
    `;

    #options;
    // Referencia al cuadro de diálogo de la instancia
    #dialog;
    // Indica si se ha enviado el formulario o se ha pulsado el botón cancelar
    #isSubmitOrCancelButton;

    constructor(selector, options = {}) {
        super(selector).addClass(JsNodeDialog101.#styleUid);

        // super(selector).addClass(JsNodeDialog101.#styleUid);
        this.#options = {
            onSubmit: console.log,
            onCancel: console.log,
        };
        this.#initialize(options);
    }

    #initialize(options = {}) {        
        this.#options = Object.assign(this.#options, options);

        // Agregamos la plantilla en la selección actual
        this.#dialog = this.append(JsNodeDialog101.#template).children('dialog').nodes[0];

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
        // Le asigna estilos si aun no existen
        if (JsNode.select(`head > style[${JsNodeDialog101.#styleUid}]`).length) return;

        JsNode.select('head').append(/*html*/`
            <style ${JsNodeDialog101.#styleUid}>
                .${JsNodeDialog101.#styleUid} dialog {
                    background-color: yellowgreen;
                }    
                
                .${JsNodeDialog101.#styleUid} .btn {
                    padding: 0.5rem;
                    font-size: 105%;                         
                }

                .${JsNodeDialog101.#styleUid} .btn:hover {
                    outline: 2px solid orange;
                }

                .${JsNodeDialog101.#styleUid} .btn-primary {
                    background-color: blue;
                    color: white;
                }

                .${JsNodeDialog101.#styleUid} .btn-danger {
                    background-color: red;
                    color: white;
                }

                .${JsNodeDialog101.#styleUid} .mb {
                    margin-bottom: 0.50rem;
                }                

                .${JsNodeDialog101.#styleUid} .form-control {
                    display: block;
                }

                .${JsNodeDialog101.#styleUid} .form-check-control {
                    
                }
                
                .${JsNodeDialog101.#styleUid} .form-label {
                    
                }

                .${JsNodeDialog101.#styleUid} .form-check-label {
                    
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
        this.#dialog.close();
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
        this.#dialog.close();
    }

    /**
     * Muestra el cuadro de diálogo.
     */
    showModal() {        
        this.#dialog.showModal();
    }

    /**
     * Cierra el cuadro de diálogo.
     */
    close() {
        this.#dialog.close();
    }
}