# Mapa de archivos del taller

La plantilla `README to Slides` administra el visor de presentaciones. El taller añade componentes de aprendizaje y una aplicación real.

| Ruta | Uso |
|---|---|
| `README.md` | Fuente única de las 43 diapositivas y documentación visible en GitHub |
| `presentation.config.json` | Título, autor, temas y navegación |
| `notebooks/01_mi_primera_red_neuronal.ipynb` | Aprendizaje por etapas, cálculos y entrenamiento manual |
| `src/generate_dataset.py` | Generador determinista de 2440 dibujos sintéticos |
| `src/preprocess.py` | Transformación de imágenes a vector 28×28 |
| `src/neural_network.py` | MLP, forward, backward y gradient check |
| `src/train.py`, `evaluate.py`, `export_model.py` | Entrenamiento, métricas y exportación a JavaScript |
| `src/plot_results.py` | Gráficos originales basados en datos medidos |
| `data/` | Dataset completo incluido, inventario y muestras |
| `models/` | Pesos, historial, métricas y ficha del modelo |
| `demo/` | Aplicación estática de cámara, carga y dibujo con inferencia JavaScript |
| `tests/` | Pruebas Python, equivalencia JS/Python y tests de Reveal.js |
| `docs/` | Fundamentos, protocolo, ejercicios, instructor, bibliografía, aplicación |

## ¿Qué NO modificar para seguir usando la plantilla?

Conserva `assets/js/` del motor, `index.html`, `assets/theme.css` y las pruebas del motor no incluidas en el diferencial. Para introducir el contenido del taller no hace falta editar el framework Reveal.js.
