class JsNodeMenu {
    static #styleUid = 'data-' + crypto.randomUUID();

    #el;
    #options;

    constructor(selector, options = {}) {
        this.#el = JsNode.select(selector).addClass(JsNodeMenu.#styleUid);
        this.#options = {
            menu: /*html*/`
                
            `
        };
        this.#updateAll(options);
    }

    #updateAll(options = {}) {
        this.#options = Object.assign(this.#options, options);

        // Inyecta el menu
        this.#el.html(this.#options.menu);

        // Ocultar los submenús inicialmente
        JsNode.select('#multi-level-menu ul ul').hide();            

        JsNode.select('#multi-level-menu li').on('mouseenter', function () {
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
                        background-color: #333;
                        color: #fff;
                    }

                    .${JsNodeMenu.#styleUid} ul {
                        list-style: none;
                        padding: 0;
                        margin: 0;
                    }

                    .${JsNodeMenu.#styleUid} li {
                        display: inline-block;
                        position: relative;
                        padding: 0.5rem 1rem;
                    }

                    .${JsNodeMenu.#styleUid} > ul > li > a {
                        color: white;
                    }

                    .${JsNodeMenu.#styleUid} li:hover {
                        background-color: #555;
                    }

                    .${JsNodeMenu.#styleUid} > ul > ul {
                        left: 0;
                    }

                    .${JsNodeMenu.#styleUid} ul ul ul {
                        left: 100%;
                    }

                    .${JsNodeMenu.#styleUid} ul ul {
                        position: absolute;
                        top: 100%;        
                        background-color: #444;
                        z-index: 1;
                    }

                    .${JsNodeMenu.#styleUid} ul ul ul {
                        top: 0;
                    }

                    .${JsNodeMenu.#styleUid} ul ul li {
                        display: block;
                        min-width: 150px;
                    }

                    .${JsNodeMenu.#styleUid} ul ul li a {
                        color: #fff;
                        padding: 10px;
                        text-decoration: none;
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