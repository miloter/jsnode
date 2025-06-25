'use strict';

JsNode.use$();

const idb = new StoreIndexedDB('todo-list-idb');
let todos = [];

function onActiveTab(id) {
    if (id === 'list') return showList();
}

function showList() {
    const listTodos = $('#listTodos');

    for (const todo of todos) {
        listTodos.append(`
            <li>
                <div><b>ID:</b> <span>${todo.id}</span></div>
                <div><b>Título:</b> <span>${todo.title}</span></div>
                <div><b>Descripción:</b> <span>${todo.description}</span></div>
            </li>
        `);
    }
}

async function initializeApp() {
    // Abre la conexión con la base de datos
    await idb.open();

    // Carga la lista de tareas
    todos = (await idb.getAll());

    // Cargamos las librerías necesarias y lanzamos la aplicación
    $$.loadLibs([
        'todo-list-utils.js',
        'todo-list-tabs.js'
    ]).then(run);
}

function run() {
    $('#createTodo').on('submit', async function (event) {
        event.preventDefault();

        const title = this.select('.todo-title').val().trim();
        const description = this.select('.todo-description').val().trim();

        if (!title) return showMessage('El título es obligatorio', 'danger');
        if (!description) return showMessage('La descripción es obligatoria', 'danger');

        const id = todos.reduce((prev, curr) =>
            curr.id > prev ? curr.id : prev, 0) + 1;
        const todo = { id, title, description };

        // Se agrega a la BBDD
        await idb.put(id, todo);
        // Se almacena en el array
        todos.push({ id, title, description });

        showMessage(`Tarea con ID: ${id} y título '${title}' creada con éxito`, 'success');
    });
}

initializeApp();