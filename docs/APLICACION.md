# Aplicación web: cámara, archivo o dibujo

La aplicación está en `demo/` y funciona con JavaScript y el archivo `model.json` exportado desde pesos NumPy. No necesita backend ni servidores para ejecutar inferencias.

## Abrir en GitHub Pages

Tras activar Pages en el repositorio nuevo: `https://jorgektch.github.io/tu-primera-red-neuronal/demo/`.

**HTTPS es necesario para usar la cámara**, según [MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia). `localhost` también es un contexto seguro habitual.

Para probar localmente desde la raíz:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000/demo/`. No abras directamente `file://demo/index.html`: el navegador necesita recuperar `model.json` mediante HTTP.

## Cómo usarla

1. Selecciona **Cámara**, **Subir imagen** o **Dibujar aquí**.
2. En cámara, permite el acceso después de pulsar *Activar cámara*, coloca el dibujo de papel dentro del recuadro y pulsa *Capturar y clasificar*.
3. Mira la vista de 28×28 que recibió el MLP, la salida sigmoide y la predicción.
4. Si la imagen está vacía, el sistema pide otro dibujo. Si el score cae entre 0.35 y 0.65, informa *Resultado incierto*.
5. Utiliza papel blanco, marcador negro y una carita completa. No envíes selfies: **no se clasifican emociones humanas**.

Las capturas se procesan localmente y no se envían a un servidor. Se solicita permiso de cámara; al salir de la pestaña se detiene la pista multimedia.

## Lo que sucede técnicamente

1. `getUserMedia()` obtiene vídeo con autorización.
2. Canvas recorta el cuadrado central y genera una imagen 96×96.
3. `preprocess.mjs` extrae tinta y centra un vector de 784 píxeles, imitando el contrato Python.
4. `inference.mjs` calcula `x @ W + b`, ReLU y sigmoide para cada capa utilizando los pesos de `demo/model.json`.
5. `app.mjs` visualiza el resultado y permite nuevas capturas.

## Cómo verificar que el navegador utiliza los mismos pesos

```bash
python -m src.train
python -m src.export_model
node --test tests/browser_model.test.mjs
```

La prueba compara las salidas numéricas con muestras de referencia calculadas en Python. **Si vuelves a entrenar y exportar un modelo nuevo, vuelve a generar las fixtures de prueba** o utiliza `tests/test_workshop.py` para verificar el nuevo entrenamiento; de otro modo las fixtures son del modelo original.

## Limitaciones prácticas

- Contraste y encuadre son importantes; el modelo se entrenó con dibujos sintéticos.
- La puntuación no es una probabilidad calibrada y un score extremo no implica acierto.
- Pueden aparecer salidas demasiado seguras para imágenes fuera del dominio.
- No reemplaza un detector de cara, OCR ni clasificador de expresiones humanas.
- La cámara puede estar bloqueada por permisos del navegador o por políticas institucionales. Se incluyen las alternativas subir/dibujar.
