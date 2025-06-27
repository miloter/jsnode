/**
 * @summary Aplicación de ejemplo para usar JsNode y los componentes
 * desarrollados a partir del mismo.
 * @copyright miloter
 * @license MIT
 * @since 2025-06-27
 * @version 0.3.0 2025-06-27
 */

'use strict';

JsNode.use$();

const idb = new StoreIndexedDB('tasks-list-idb');
let tabs; // JsNodeTabs
let dt; // JsNodeDataTable

function instanceComponents() {
    // Instancia el componente JsNodeTabs
    tabs = new JsNodeTabs('#tabs', {
        tabs: [{
            id: 'list',
            text: 'Lista de Tareas',
            content: /*html*/`                
                <div id="listTasks"></div>
            `
        }, {
            id: 'createTask',
            text: 'Crear Tarea',
            content: /*html*/`
                <form id="createTaskForm" class="fb-column-center">
                    <div>
                        <label>Título: <input type="text" class="task-title"></label>
                    </div>
                    <div>
                        <label>Descripción: <textarea class="task-description"
                            rows="8", cols="32"></textarea></label>
                    </div>
                    <button type="submit" class="btn btn-success">Crear</button>
                </form>
            `
        }, {
            id: 'updateTask',
            text: 'Actualizar Tarea',
            content: /*html*/`
                <form id="updateTaskForm" class="fb-column-center">                    
                    <div>
                        <label>ID: <input type="text" size="5" disabled class="task-id"></label>
                    </div>
                    <div>
                        <label>Título: <input type="text" class="task-title"></label>
                    </div>
                    <div>
                        <label>Descripción: <textarea class="task-description"
                            rows="8", cols="32"></textarea></label>
                    </div>
                    <button type="submit" class="btn btn-warning">Actualizar</button>
                </form>
            `,
            activateOnlyByCode: true
        }, {
            id: 'deleteTask',
            text: 'Eliminar Tarea',
            content: /*html*/`
                <form id="deleteTaskForm" class="fb-column-center">                    
                    <div>
                        <label>ID: <input type="text" size="5" disabled class="task-id"></label>
                    </div>
                    <div>
                        <label>Título: <input type="text" disabled class="task-title"></label>
                    </div>
                    <div>
                        <label>Descripción: <textarea class="task-description"
                            rows="8", cols="32" disabled></textarea></label>
                    </div>
                    <button type="submit" class="btn btn-danger">Eliminar</button>
                </form>
            `,
            activateOnlyByCode: true
        }],
        activeTabId: 'list',
        onActiveTab: undefined
    });

    // Instancia el DataTable
    dt = new JsNodeDataTable('#listTasks', {
        columns: [
            { key: 'id', text: 'ID', inputFilterSize: 5 },
            { key: 'title', text: 'Título', inputFilterSize: 8 },
            { key: 'description', text: 'Descripción', inputFilterSize: 16 },
            { key: 'actions', text: 'Acciones', noCsv: true },
        ],
        rows: [],
        maxRowsPerPage: 10,
        maxRowsPerPageList: [2, 5, 10, 20],
    });
}

async function run() {    
    instanceComponents();

    // Abre la conexión con la base de datos
    await idb.open();    

    // Carga la lista de tareas inicial
    dt.setRows(await idb.getAll());

    // Carga librerías dependientes de la carga de los componentes
    $$.loadLibs([
        'lista-tareas-create.js',
        'lista-tareas-update.js',
        'lista-tareas-delete.js'
    ]);    
}

$$.domLoaded().then(run);