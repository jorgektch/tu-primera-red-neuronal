# Dataset incluido en el repositorio

Este conjunto contiene **2440 dibujos sintéticos originales de caritas**; ninguna foto humana.

- `caritas_images.zip`: PNGs en `train/feliz`, `train/triste`, `val/...` y `test/...`, etiquetados por sus carpetas.
- `caritas_dataset.npz`: matrices NumPy `X_train`, `y_train`, `X_val`, `y_val`, `X_test`, `y_test` listas para entrenamiento. No hay que descargar datos de Internet.
- `labels.csv`: inventario imagen por imagen, etiqueta `0` triste y `1` feliz.
- `samples/`: 16 imágenes PNG que se pueden abrir directamente desde GitHub.
- `dataset_info.json`: semilla y procedencia.

## Inspeccionar con Python

```python
import numpy as np
with np.load('data/caritas_dataset.npz') as data:
    print({k:v.shape for k,v in data.items()})
```

## Extraer el dataset PNG

```bash
python -m zipfile -e data/caritas_images.zip data/images
```

Para regenerarlo: `python -m src.generate_dataset --seed 2026` desde la raíz del proyecto. Ver [protocolo de datos](../docs/DATASET.md).

**Aviso:** las imágenes son sintéticas; no garantizan funcionamiento con caritas sobre papel. No sirven para inferir emociones humanas.
