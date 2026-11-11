"""Preprocesamiento común para los dibujos: tinta sobre fondo blanco -> 28×28.

El archivo demo/preprocess.js implementa el mismo contrato, en navegador.
No pretende detectar rostros humanos; está diseñado para dibujos centrados.
"""
from __future__ import annotations

import numpy as np
from PIL import Image

IMAGE_SIZE = 28
CONTENT_SIZE = 24


def preprocess_image(image: Image.Image | np.ndarray) -> np.ndarray:
    """Convierte un dibujo a un vector float32 de 784 intensidades de tinta.

    Pasos: grises -> fondo estimado (percentil 95) -> tinta relativa ->
    umbral para bbox -> ajuste de aspecto -> interpolación bilineal -> 28×28.
    Una hoja blanca da 0; tinta negra se acerca a 1.
    """
    if isinstance(image, Image.Image):
        gray = np.asarray(image.convert('L'), dtype=np.float32)
    else:
        gray = np.asarray(image, dtype=np.float32)
        if gray.ndim == 3:
            gray = 0.299 * gray[..., 0] + 0.587 * gray[..., 1] + 0.114 * gray[..., 2]
        if gray.ndim != 2:
            raise ValueError('Se espera una imagen 2D o RGB')
    if gray.shape[0] < 8 or gray.shape[1] < 8:
        raise ValueError('Imagen demasiado pequeña')

    bg = float(np.percentile(gray, 95))
    ink = np.clip((bg - gray) / max(bg * 0.75, 20.0), 0.0, 1.0)
    ink[ink < 0.10] = 0.0
    ys, xs = np.where(ink > 0.22)
    result = np.zeros((IMAGE_SIZE, IMAGE_SIZE), dtype=np.float32)
    if len(xs) < 14:
        return result.reshape(-1)

    x0, x1 = int(xs.min()), int(xs.max()) + 1
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    padding = max(1, int(round(max(x1 - x0, y1 - y0) * 0.06)))
    x0, x1 = max(0, x0 - padding), min(gray.shape[1], x1 + padding)
    y0, y1 = max(0, y0 - padding), min(gray.shape[0], y1 + padding)
    crop = ink[y0:y1, x0:x1]
    height, width = crop.shape
    factor = CONTENT_SIZE / max(height, width)
    new_w = max(1, min(CONTENT_SIZE, int(round(width * factor))))
    new_h = max(1, min(CONTENT_SIZE, int(round(height * factor))))
    img = Image.fromarray(np.uint8(np.round(crop * 255)), mode='L')
    img = img.resize((new_w, new_h), Image.Resampling.BILINEAR)
    top, left = (IMAGE_SIZE - new_h) // 2, (IMAGE_SIZE - new_w) // 2
    result[top:top + new_h, left:left + new_w] = np.asarray(img, dtype=np.float32) / 255.0
    return result.reshape(-1)


def load_datasets(path: str = 'data/caritas_dataset.npz') -> dict[str, np.ndarray]:
    with np.load(path, allow_pickle=False) as data:
        keys = ('X_train', 'y_train', 'X_val', 'y_val', 'X_test', 'y_test')
        if not all(key in data for key in keys):
            raise ValueError('Faltan arrays esperados en el dataset')
        return {k: data[k] for k in keys}
