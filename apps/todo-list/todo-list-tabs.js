JsNode.domLoaded().then(() => {
    new JsNodeTabs('#tabs', {
        tabs: [{
            id: 'list',
            text: 'Lista de tareas',
            content: /*html*/`                
                <ul id="listTodos"></ul>
            `
        }, {
            id: 'newTodo',
            text: 'Nueva tarea',
            content: /*html*/`
                <form id="createTodo" class="fb-column-center">
                    <div>
                        <label>Título: <input type="text" class="todo-title"></label>
                    </div>
                    <div>
                        <label>Descripción: <textarea class="todo-description"
                            rows="8", cols="32"></textarea></label>
                    </div>
                    <button type="submit" class="btn btn-success">Crear</button>
                </form>
            `
        }],
        activeTabId: 'list',
        onActiveTab     
    });
});
