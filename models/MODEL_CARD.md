# Ficha del modelo — MLP 784→32→16→1

## Propósito

Demostrar la construcción de una red neuronal básica con NumPy para clasificar **dibujos sintéticos** de caritas felices y tristes. No pretende interpretar emociones humanas ni analizar imágenes de rostros reales.

## Arquitectura

- Entrada: 28×28 en escala de intensidad de tinta, aplanada en 784 floats.
- Capas ocultas: 32 y 16 neuronas con ReLU.
- Salida: 1 neurona sigmoide.
- Pérdida: Binary Cross-Entropy estable desde logits.
- Optimizador: descenso de gradiente mini-batch implementado desde cero en NumPy.
- Inicialización: varianza escalada para capas ReLU, basada en He et al. (2015).

## Datos

Dataset original sintético incluido en el repositorio. Semilla dataset `2026` y semilla entrenamiento `42`. 1800 imágenes de entrenamiento, 320 de validación y 320 de test (dos clases equilibradas). Los conjuntos se generaron independientemente; no provienen de fotografías reales.

## Entrenamiento y métricas

- 45 épocas, learning rate 0.25, batch size 64.
- Se seleccionaron los pesos con menor pérdida en validación.
- Resultado registrado: **100 % de exactitud en 320 ejemplos sintéticos de test** (ver `models/test_report.json`).
- La exactitud en fotos reales **no fue medida**. La cifra anterior no debe extrapolarse.

## Limitaciones conocidas

- Sesgo hacia contornos, grosores y curvaturas del generador sintético.
- Sensibilidad a luz, perspectiva, posición, fondos complejos y estilos de dibujo desconocidos.
- Salida sigmoide sin calibración estadística; la banda [0.35,0.65] solo comunica incertidumbre heurística y no detecta confiablemente entradas fuera del dominio.
- No identifica si una imagen contiene realmente una carita.
- **No apto** para usos clínicos, vigilancia, evaluación psicológica o decisiones sobre personas.

## Archivos verificables

- `models/weights.npz`: parámetros binarios NumPy.
- `demo/model.json`: mismos pesos exportados en orden row-major para el navegador.
- `models/history.json`: métricas por época.
- `models/metrics.json`: parámetros y métricas de la selección de validación.
- `models/test_report.json`: evaluación final en test sintético.
- `tests/browser_model.test.mjs`: compara las predicciones con Python y prueba imágenes PNG de muestra.

## Referencias

Rumelhart et al. (1986), Glorot & Bengio (2010), He et al. (2015). Enlaces completos en [`docs/REFERENCIAS.md`](../docs/REFERENCIAS.md).
