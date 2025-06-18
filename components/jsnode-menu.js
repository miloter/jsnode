class JsNodeMenu {
    static #styleUid = 'data-' + crypto.randomUUID();

    #el;
    #options;

    constructor(selector, options = {}) {
        this.#el = JsNode.select(selector).addClass(JsNodeMenu.#styleUid);
        this.#options = {
            menu: /*html*/`
                
            `,
            orientation: 'horizontal', // o 'vertical'
        };
        this.#updateAll(options);
    }

    #updateAll(options = {}) {
        this.#options = Object.assign(this.#options, options);

        // Inyecta el menu
        this.#el.html(this.#options.menu);

        // Ocultar los submenús inicialmente        
        JsNode.select(`.${JsNodeMenu.#styleUid} ul ul`).hide();            

        JsNode.select(`.${JsNodeMenu.#styleUid} li`).on('mouseenter', function () {
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
        // Le asigna estilos si aun no existen
        if (!JsNode.select(`head > style[${JsNodeMenu.#styleUid}]`).length) {
            JsNode.select('head').append(/*html*/`
                <style ${JsNodeMenu.#styleUid}>
                    .${JsNodeMenu.#styleUid} {
                        ${this.#options.orientation === 'horizontal' ? '': 'display: inline-block;'}
                        background-color: #333;
                        color: #fff;
                    }                    
                    
                    .${JsNodeMenu.#styleUid} ul {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }

                    .${JsNodeMenu.#styleUid} li {
                        display: ${this.#options.orientation === 'horizontal' ? 'inline-block' : 'block'};
                        position: relative;
                        padding: 0.5rem 1rem;
                    }

                    .${JsNodeMenu.#styleUid} ul li a {
                        color: white;
                        text-decoration: none;
                    }

                    .${JsNodeMenu.#styleUid} li:hover {
                        background-color: #555;
                    }                    

                    .${JsNodeMenu.#styleUid} ul ul {
                        position: absolute;                        
                        left: ${this.#options.orientation === 'horizontal' ? '0' : '100'}%;                        
                        top: ${this.#options.orientation === 'horizontal' ? '100' : '0'}%;                        
                        background-color: #444;
                        z-index: 1;
                    }

                    .${JsNodeMenu.#styleUid} ul ul ul {
                        left: 100%;
                        top: 0;
                    }

                    .${JsNodeMenu.#styleUid} ul ul li {
                        display: block;
                        min-width: 150px;
                    }

                    .${JsNodeMenu.#styleUid} ul ul li a {                        
                        padding: 10px;
                        display: block;
                    }

                    .${JsNodeMenu.#styleUid} ul ul li:hover {
                        background-color: #666;
                    }                    
                </style>
            `);
        }        
    }
}