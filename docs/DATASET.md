# Dataset y preprocesamiento: protocolo reproducible

## Procedencia y contenido

El dataset se genera desde cero con dibujos algorítmicos creados por el script `src/generate_dataset.py`, usando Pillow y NumPy. No utiliza fotos de personas ni conjuntos de datos externos. La licencia MIT del repositorio cubre el código original y los recursos generados incluidos, sin afectar los derechos de las fuentes científicas enlazadas.

| Elemento | Contenido |
|---|---|
| `data/caritas_images.zip` | 2440 dibujos PNG de 96×96, distribuidos en carpetas `train/val/test` y `feliz/triste` |
| `data/caritas_dataset.npz` | Vectores float32 de 784 posiciones y etiquetas, ya preprocesados |
| `data/labels.csv` | Ruta y etiqueta de cada PNG |
| `data/samples/` | Ejemplos PNG listos para inspeccionar en GitHub |
| `data/dataset_info.json` | Semilla, tamaños, clases y limitaciones |

Conteos: train 900 de cada clase (1800); validación 160 de cada clase (320); test 160 de cada clase (320).

## Reproducir desde cero

```bash
pip install -r requirements.txt
python -m src.generate_dataset --seed 2026 --output data
```

El generador dibuja un contorno ovalado, ojos y una boca curva. Aleatoriza posición, forma, rotación, grosor, color y ruido. **La dirección principal de la curvatura de la boca determina la etiqueta**. El split se genera por separado, sin reusar imágenes base entre particiones.

## Preprocesamiento en Python

`src/preprocess.py` transforma el dibujo a grises, estima el fondo con percentil 95, normaliza tinta, detecta la región de trazos, deja un margen, conserva proporciones y centra la imagen en 28×28. La salida es un vector de 784 intensidades en `[0,1]`. La versión web `demo/preprocess.mjs` implementa el mismo contrato; las interpolaciones de Pillow y JavaScript pueden producir leves diferencias numéricas.

**IMPORTANTE:** el modelo espera tinta oscura sobre fondo claro. No es un detector ni un segmentador de rostros reales.

## Evitar fuga de datos

- No se usa `test` para elegir épocas ni hiperparámetros.
- `train` actualiza pesos, `val` elige pesos, `test` estima el desempeño reservado.
- Si creas aumentos a partir de una misma imagen original, asigna esa imagen original a **un único split** antes de aumentarla.
- Para medir generalización real, reserva fotografías de dibujos nuevos, producidos por personas diferentes y en condiciones variadas.

## Evaluación real propuesta

Registra al menos 20 fotos de dibujos sobre papel: etiqueta real, predicción, iluminación, grosor y si se recortó correctamente. Reporta aciertos y fallos, sin mezclar esas fotos con el entrenamiento si forman parte del conjunto de prueba. La exactitud de test sintético empaquetada **no** predice el rendimiento en papel.
