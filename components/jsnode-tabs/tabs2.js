JsNode.use$().domLoaded().then(() => {
    new JsNodeTabs('#tabs2', {
        tabs: [{
            id: 'tab21',
            text: 'Ficha 21',
            content: /*html*/`
                <p>¡El contenido de la Ficha 21 va aquí!</p>
            `
        }, {
            id: 'tab22',
            text: 'Ficha 22',
            content: /*html*/`
                <p>¡El contenido de la Ficha 22 va aquí!</p>
            `
        }, {
            id: 'tab23',
            text: 'Ficha 23',
            content: /*html*/`
                <p>¡El contenido de la Ficha 23 va aquí!</p>
            `
        }, {
            id: 'tab24',
            text: 'Ficha 24',
            content: /*html*/`
                <p>¡El contenido de la Ficha 24 va aquí!</p>
            `
        }],
        activeTabId: 'tab24'
    });
});