'use strict';

async function deleteTaskButton(event) {    
    tabs.activeTab('deleteTask');
    
    const form = $('#deleteTaskForm');
    const task = await idb.get(parseInt($(event.target).prop('dataset').id));

    form.select('.task-id').val(task.id);
    form.select('.task-title').val(task.title);
    form.select('.task-description').val(task.description);    
}

$('#deleteTaskForm').on('submit', async function (event) {
    event.preventDefault();

    // El ID es un número en BBDD
    const id = parseInt(this.select('.task-id').val().trim());

    // Se elimina en la BBDD
    await idb.delete(id);

    // Se actualiza en el datatable
    dt.deleteRow('id', id);

    // Muestra un mensaje y activa la ficha
    showMessage(`Tarea con ID: ${id} eliminada con éxito`, 'success');

    // Muestra la lista actual
    tabs.activeTab('list');
});