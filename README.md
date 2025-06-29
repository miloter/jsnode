# JsNode: Librería DOM y utilidades.
JsNode es similar a un jQuery reducido usando solo ES6+ y  el sistema de promises/async/await donde es necesario.

## Ejemplo
```html
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Desarrollo de componente JsNodeDataTable</title>
    <script src="../jsnode.js"></script>
    <script src="jsnode-datatable.js"></script>
    <script>
        JsNode.domLoaded().then(() => {
            const t1 = new JsNodeDataTable('#t1', {
                columns: [
                    { key: 'name', text: 'Nombre', inputFilterSize: 7 },
                    { key: 'age', text: 'Edad', inputFilterSize: 3 },
                ],
                rows: [
                    { name: 'Marco', age: 54 },
                    { name: 'Laura', age: 54 },
                    { name: 'Shakira', age: 29 },
                    { name: 'Lady Gaga', age: 23 },
                    { name: 'Laura', age: 37 },
                    { name: 'Alejandro', age: 32 },
                    { name: 'Marco', age: 18 },
                ],
                maxRowsPerPage: 5,
                maxRowsPerPageList: [2, 5, 10, 20],
            });
        });
    </script>
</head>

<body>
    <div id="t1"></div>
</body>

</html>
```
