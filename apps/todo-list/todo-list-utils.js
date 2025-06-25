// Para mostrar mensajes
function showMessage(text, type) {
    $('#msg').css({
        position: 'absolute',
        left: '50%',
        top: '10%',
        transform: 'translate(-50%, -50%)',
        width: 'auto',     
        height: 'auto',    
        textAlign: 'center',        
        padding: '1rem',
        margin: '1rem auto',
        border: '2px solid black',
        color: 'white',        
        backgroundColor: (
            type === 'success' ?
                'green' :
                (type === 'warning' ? 'orange' : 'red')
        ),
        fontSize: '1.10rem',
        fontWeight: 'bold'
    }).hide().text(text).show(600, 0, 'opacity', function () {
        this.hide(600, 3000, 'opacity');
    });

    window.scrollTo(0, 0);
}
