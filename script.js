// Variables de comunicacion
let puerto;
let lector;
let conectado = false;
let escribiendo = false;

// Actividad 6: Variable para contar cuántas veces se enciende el LED
let contadorEncendidos = 0;

// Elementos HTML
const btnConectar = document.getElementById("btnConectar");
const btnEncender = document.getElementById("btnEncender");
const btnApagar = document.getElementById("btnApagar");

// Nuevos botones de las actividades 5 y 4
const btnParpadear = document.getElementById("btnParpadear");
const btnAmbos = document.getElementById("btnAmbos");

// Nuevo control deslizante de la actividad 7
const brilloRange = document.getElementById("brilloRange");

// Nuevo contador de la actividad 6
const numEncendidos = document.getElementById("numEncendidos");

const estadoConexion = document.getElementById("estadoConexion");
const estadoLed = document.getElementById("estadoLed");
const bombilla = document.getElementById("bombilla");
const mensaje = document.getElementById("mensaje");


// CONECTAR ARDUINO
btnConectar.addEventListener("click", conectar);

async function conectar() {
    try {
        if (!("serial" in navigator)) {
            alert("Utiliza Google Chrome o Microsoft Edge");
            return;
        }

        // Seleccionar puerto
        puerto = await navigator.serial.requestPort();

        // Abrir comunicacion
        await puerto.open({ baudRate: 9600 });

        conectado = true;

        estadoConexion.textContent = "Arduino conectado";
        mensaje.textContent = "Ya puedes controlar el LED";

        btnConectar.disabled = true;

        // Activamos todos los botones al conectar
        btnEncender.disabled = false;
        btnApagar.disabled = false;
        btnParpadear.disabled = false;
        btnAmbos.disabled = false;
        brilloRange.disabled = false;

        // Preparar lector de datos
        const decoder = new TextDecoderStream();
        puerto.readable.pipeTo(decoder.writable)
            .catch(error => console.log(error));

        lector = decoder.readable.getReader();
        leerArduino();

    } catch (error) {
        console.error(error);
        mensaje.textContent = "Error al conectar Arduino";
    }
}


// LEER RESPUESTAS DE ARDUINO
async function leerArduino() {
    let texto = "";
    try {
        while (conectado) {
            const { value, done } = await lector.read();
            if (done) break;

            texto += value;
            const lineas = texto.split("\n");
            texto = lineas.pop();

            for (const linea of lineas) {
                const respuesta = linea.trim();

                if (respuesta === "ENCENDIDO") {
                    mostrarEstado(true);
                }
                if (respuesta === "APAGADO") {
                    mostrarEstado(false);
                }
                if (respuesta === "PARPADEO_OK") {
                    estadoLed.textContent = "MODO PARPADEO ACTIVADO";
                    bombilla.classList.remove("apagado");
                    bombilla.classList.add("encendido");
                    mensaje.textContent = "Arduino está parpadeando el LED";
                }
                if (respuesta === "AMBOS_ENCENDIDOS") {
                    estadoLed.textContent = "AMBOS LEDS ENCENDIDOS";
                    bombilla.classList.remove("apagado");
                    bombilla.classList.add("encendido");
                    mensaje.textContent = "Arduino encendió ambos LEDs";
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
}


// ENVIAR ORDEN A ARDUINO (Tu función original exacta)
async function enviarOrden(orden) {
    if (!conectado || escribiendo) return;
    escribiendo = true;

    try {
        const writer = puerto.writable.getWriter();
        await writer.write(
            new TextEncoder().encode(orden + "\n")
        );
        writer.releaseLock();
    } catch (error) {
        console.error(error);
        mensaje.textContent = "Error enviando la orden";
    } finally {
        escribiendo = false;
    }
}


// ACCIONES DE LOS BOTONES

// Botón ENCENDER
btnEncender.addEventListener("click", function() {
    enviarOrden("ON");
    contadorEncendidos++;
    numEncendidos.textContent = contadorEncendidos;
});

// Botón APAGAR
btnApagar.addEventListener("click", function() {
    enviarOrden("OFF");
});

// Actividad 5: Botón PARPADEAR
btnParpadear.addEventListener("click", function() {
    enviarOrden("BLINK");
});

// Actividad 4: Botón ENCENDER AMBOS
btnAmbos.addEventListener("click", function() {
    enviarOrden("AMBOS_ON");
    contadorEncendidos++;
    numEncendidos.textContent = contadorEncendidos;
});

// Actividad 7: Control Deslizante (PWM)
brilloRange.addEventListener("input", function(e) {
    const valorBrillo = e.target.value;
    enviarOrden("BRIGHT:" + valorBrillo);
});


// ACTUALIZAR INTERFAZ
function mostrarEstado(encendido) {
    if (encendido) {
        estadoLed.textContent = "LED ENCENDIDO";
        bombilla.classList.remove("apagado");
        bombilla.classList.add("encendido");
        mensaje.textContent = "Arduino ha encendido el LED";
    } else {
        estadoLed.textContent = "LED APAGADO";
        bombilla.classList.remove("encendido");
        bombilla.classList.add("apagado");
        mensaje.textContent = "Arduino ha apagado el LED";
    }
}
