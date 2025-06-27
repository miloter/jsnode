'use strict';

async function updateTaskButton(event) {
    tabs.activeTab('updateTask');
    
    const form = $('#updateTaskForm');
    const task = await idb.get(parseInt($(event.target).prop('dataset').id));

    form.select('.task-id').val(task.id);
    form.select('.task-title').val(task.title);
    form.select('.task-description').val(task.description);    
}

$('#updateTaskForm').on('submit', async function (event) {
    event.preventDefault();

    // El ID es un número en BBDD
    const id = parseInt(this.select('.task-id').val().trim());
    const title = this.select('.task-title').val().trim();
    const description = this.select('.task-description').val().trim();

    if (!title) return showMessage('El título es obligatorio', 'danger');
    if (!description) return showMessage('La descripción es obligatoria', 'danger');
        
    const data = { title, description };

    // Se actualiza en la BBDD
    const task = await idb.get(id);
    Object.assign(task, data);
    await idb.put(id, task);

    // Se actualiza en el datatable
    dt.updateRow('id', id, { title, description });

    // Muestra un mensaje y activa la ficha
    showMessage(`Tarea con ID: ${id} y título '${title}' actualizada con éxito`, 'success');

    // Muestra la lista actual
    tabs.activeTab('list');
});