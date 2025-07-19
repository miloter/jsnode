/**
 * @summary Componente que muestra un spinner centrado en su contenedor, siempre
 * que este tenga la propiedad CSS <position: relative>, o bien se centra con
 * respecto al body. Permite configurar el tamaño y el color del spinner.
 * @copyright miloter
 * @license MIT
 * @since 2025-07-19
 * @version 0.3.0 2025-07-19
 */
class JsNodeSpinner extends JsNode {    
    // Para generar un identificador de clase, se toman los últimos 12 caracteres hexadecimales
    static #cid = 'c' + crypto.randomUUID().substring(24);

    // Identificador único para cada instancia
    #iid;

    // Opciones de configuración de instancia
    #options;    
    
    constructor(selector, options = {}) {
        // El propio elemento contendrá el spinner
        super(JsNode.select(selector));
        
        // Se toman los últimos 12 caracteres hexadecimales (longitud 36)
        this.#iid = 'i' + crypto.randomUUID().substring(24);        
        this.#options = {  
            size: 128, // Tamaño en píxeles por defecto            
            color: 'rgba(3, 109, 47, 0.795)' // Color por defecto
        };
        this.#initialize(options);
    }

    #initialize(options = {}) {                
        Object.assign(this.#options, options);            
        this.#setStyles();
    }
    
    static #setCommonStyles() {
        const cid = JsNodeSpinner.#cid;

        // Si ya existen no hace nada
        if (JsNode.select(`head > style[${cid}]`).length) return;

        JsNode.select('head').append(/*html*/`
            <style ${cid}>
                @keyframes spinner { 
                    0% { 
                        transform: rotate(0deg); 
                    } 
                    100% { 
                        transform: rotate(360deg); 
                    } 
                } 

                .${cid}-spinner {                    
                    box-sizing: border-box;                    
                    position: absolute;                    
                    border-radius: 50%;
                    animation: spinner 1s linear infinite;
                }                               
            </style>
        `);
    }

    #setStyles() {                
        JsNodeSpinner.#setCommonStyles();        

        JsNode.select('head').append(/*html*/`
            <style ${this.#iid}>
                .${this.#iid}-spinner {                    
                    width: ${this.#options.size}px; 
                    height: ${this.#options.size}px;
                    border: 5px solid ${this.#options.color};     
                    border-left-color: transparent;
                    left: calc(50% - ${this.#options.size / 2}px);
                    top: calc(50% - ${this.#options.size / 2}px);
                }                               
            </style>
        `);
    }

    /**
     * Muestra el spinner.
     */
    show() {
        this.addClass(`${JsNodeSpinner.#cid}-spinner ${this.#iid}-spinner`);        
    }

    /**
     * Oculta el spinner.
     */
    hide() {
        this.removeClass(`${JsNodeSpinner.#cid}-spinner ${this.#iid}-spinner`);
    }    
}