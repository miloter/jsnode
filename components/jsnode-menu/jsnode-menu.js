/**
 * @summary Menú sencillo que se ejecuta sobre JsNode.
 * @copyright miloter
 * @license MIT
 * @since 2025-05-07
 * @version 4.3.0 2025-07-06
 */
class JsNodeMenu extends JsNode {
    // Para generar un identificador común en todas las instancias, se toman
    // los últimos 12 caracteres hexadecimales
    static #uid = 'u' + crypto.randomUUID().substring(24);
    
    // Plantilla para el menú
    static #template = /*html*/`
        <div class="${this.#uid}-menu"></div>
    `;    

    #options;

    constructor(selector, options = {}) {
        // this va a referenciar al menú
        super(JsNode.select(selector).append(JsNodeMenu.#template).children(-1));
        this.#options = {
            menu: /*html*/`
                <ul>
                    <li><a href="#">Home</a></li>
                    <li><a href="#">About Us ></a>
                        <ul>
                            <li><a href="#">History</a></li>
                            <li><a href="#">Team</a></li>
                            <li><a href="#">Mission</a></li>
                        </ul>
                    </li>
                    <li><a href="#">Services ></a>
                        <ul>
                            <li><a href="#">Web Design</a></li>
                            <li><a href="#">Development</a></li>
                            <li><a href="#">SEO</a></li>
                        </ul>
                    </li>
                    <li><a href="#">Portfolio</a></li>
                    <li><a href="#">Contact</a>
                        <ul>
                            <li><a href="#">Alicante ></a>
                                <ul>
                                    <li><a href="#">Capital</a></li>
                                    <li><a href="#">Elche</a></li>
                                    <li><a href="#">Alcoy ></a>
                                        <ul>
                                            <li><a href="#">Centro</a></li>
                                            <li><a href="#">Norte</a></li>
                                        </ul>
                                    </li>
                                </ul>
                            </li>
                            <li><a href="#">Valencia</a></li>
                            <li><a href="#">Castellón ></a>
                                <ul>
                                    <li><a href="#">Norte</a></li>
                                    <li><a href="#">Centro</a></li>
                                    <li><a href="#">Sur</a></li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                </ul>
            `,
            orientation: 'horizontal', // o 'vertical'
        };
        this.#updateAll(options);
    }

    #updateAll(options = {}) {        
        this.#options = Object.assign(this.#options, options);

        // Inyecta el menú
        this.append(this.#options.menu);

        // Ocultar los submenús inicialmente        
        this.select('ul ul').hide();            

        this.select('li').on('mouseenter', function () {
            const ul = this.select('ul').one();
            
            if (!ul.length) return;
            
            ul.show().select('ul').one().hide();                
        }).on('mouseleave', function () {
            this.select('ul').one().hide();
        });

        // Actualiza los estilos
        this.#updateStyles();
    }

    #updateStyles() {
        const uid = JsNodeMenu.#uid;

        // Le asigna estilos si aun no existen
        if (!JsNode.select(`head > style[${uid}]`).length) {
            JsNode.select('head').append(/*html*/`
                <style ${uid}>
                    .${uid}-menu {
                        ${this.#options.orientation === 'horizontal' ? '': 'display: inline-block;'}
                        background-color: #333;
                        color: #fff;
                    }                    
                    
                    .${uid}-menu ul {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }

                    .${uid}-menu ul li {
                        display: ${this.#options.orientation === 'horizontal' ? 'inline-block' : 'block'};
                        position: relative;
                        padding: 0.5rem 1rem;
                    }

                    .${uid}-menu ul li a {
                        color: white;
                        text-decoration: none;
                    }

                    .${uid}-menu ul li:hover {
                        background-color: #555;
                    }                    

                    .${uid}-menu ul ul {
                        position: absolute;                        
                        left: ${this.#options.orientation === 'horizontal' ? '0' : '100'}%;                        
                        top: ${this.#options.orientation === 'horizontal' ? '100' : '0'}%;                        
                        background-color: #444;
                        z-index: 1;
                    }

                    .${uid}-menu ul ul ul {
                        left: 100%;
                        top: 0;
                    }

                    .${uid}-menu ul ul li {
                        display: block;
                        min-width: 150px;
                    }

                    .${uid}-menu ul ul li a {                        
                        padding: 10px;
                        display: block;
                    }

                    .${uid}-menu ul ul li:hover {
                        background-color: #666;
                    }                    
                </style>
            `);
        }        
    }
}