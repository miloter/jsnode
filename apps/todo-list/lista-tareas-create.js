'use strict';

$('#createTaskForm').on('submit', async function (event) {
    event.preventDefault();

    const title = this.select('.task-title').val().trim();
    const description = this.select('.task-description').val().trim();

    if (!title) return showMessage('El título es obligatorio', 'danger');
    if (!description) return showMessage('La descripción es obligatoria', 'danger');

    // Obtiene el siguiente ID disponible
    const id = dt.options.rows.reduce((prev, curr) => curr.id > prev ? curr.id : prev, 0) + 1;

    // Establece los controladores de evento iniciales
    const actions = /*html*/`
            <button type="button" data-id="${id}" onclick="updateTaskButton(event)"
                class="update-task btn btn-warning">
                Actualizar
            </button>
            <button type="button" data-id="${id}" onclick="deleteTaskButton(event)"
                class="delete-task btn btn-danger">
                Eliminar
            </button>
        `;
    const task = { id, title, description, actions };

    // Se agrega a la BBDD
    await idb.put(id, task);
    
    // Se almacena en el datatable
    dt.addRow({ id, title, description, actions });
    
    // Muestra un mensaje y activa la ficha
    showMessage(`Tarea con ID: ${id} y título '${title}' creada con éxito`, 'success');

    // Mostramos la lista
    tabs.activeTab('list');
});