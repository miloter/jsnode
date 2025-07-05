/**
 * @summary Componente JsNode para centrar cualquier elemento DOM.
 * @copyright miloter
 * @license MIT
 * @since 2025-07-05
 * @version 0.3.0 2025-07-05
 */
class JsNodeCenterElement extends JsNode {
    #options;

    constructor(selector, options = {}) {
        super(selector);

        this.#options = {
            x: 'center' /* center|left|right */,
            y: 'center' /* center|top|bottom */,
            useMargin: true /* La anchura/altura del elemento no incluirá el margen */,
            zIndex: 0 /* Indica el z-index del elemento */
        };

        this.#initialize(options);
    }

    #initialize(options = {}) {                
        if (!this.length) return;

        this.#options = Object.assign(this.#options, options);

        this.#onResize();

        $(window).on('resize', () => this.#onResize());
    }

    #onResize() {
        const x = this.#options.x, y = this.#options.y,
            useMargin = this.#options.useMargin, zIndex = this.#options.zIndex;

        this.each(function () {            
            if (this.visible()) {
                // Ponemos posición absoluta antes de evaluar anchura y altura
                this.css('position', 'absolute');

                let left, top;
                if (x === 'left') {
                    left = 0;
                } else if (x === 'right') {
                    left = (window.innerWidth - this.outerWidth(useMargin)) + 'px';
                } else { // Supone 'center'
                    left = 0.5 * (window.innerWidth - this.outerWidth(useMargin)) + 'px';
                }

                if (y === 'top') {
                    top = 0;
                } else if (y === 'bottom') {
                    top = (window.innerHeight - this.outerHeight(useMargin)) + 'px';
                } else { // Supone 'center'
                    top = 0.5 * (window.innerHeight - this.outerHeight(useMargin)) + 'px'
                }

                this.css({ left, top, zIndex });
            }
        });
    }
}