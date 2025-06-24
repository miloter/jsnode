JsNode.use$().domLoaded().then(() => {
    new JsNodeTabs('#tabs1', {
        tabs: [{
            id: 'tab11',
            text: 'Ficha 11',
            content: /*html*/`
                <p>¡El contenido de la Ficha 11 va aquí!</p>
                <ul>
                    <li><a href="#">Uno</a></li>
                    <li><a href="#">Dos</a></li>
                    <li><a href="#">Tres</a></li>
                    <li><a href="#">Cuatro</a></li>
                    <li><a href="#">Cinco</a></li>
                    <li><a href="#">Seis</a></li>
                    <li><a href="#">Siete</a></li>
                </ul>
            `
        }, {
            id: 'tab12',
            text: 'Ficha 12',
            content: /*html*/`
                <p>¡El contenido de la Ficha 12 va aquí!</p>
            `
        }, {
            id: 'tab13',
            text: 'Ficha 13',
            content: /*html*/`
                <p>¡El contenido de la Ficha 13 va aquí!</p>
            `
        }, {
            id: 'tab14',
            text: 'Ficha 14',
            content: /*html*/`
                <p>¡El contenido de la Ficha 14 va aquí!</p>
            `
        }],
        activeTabId: 'tab11'
    });
});