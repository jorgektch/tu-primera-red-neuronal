"""Genera un dataset de dibujos originales: feliz=1, triste=0.

No usa imágenes de terceros. Mantiene separaciones train/val/test independientes.
Ejemplo: python -m src.generate_dataset --seed 2026
"""
from __future__ import annotations

import argparse
import csv
import io
import json
from pathlib import Path
import zipfile

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from .preprocess import preprocess_image

CANVAS = 96
SPLITS = {'train': 900, 'val': 160, 'test': 160}  # por clase
LABELS = {0: 'triste', 1: 'feliz'}


def make_smiley(label: int, rng: np.random.Generator) -> Image.Image:
    """Dibujo sintético variado, tinta oscura en papel claro; label=1 feliz."""
    s = 3
    img = Image.new('L', (CANVAS * s, CANVAS * s), 255)
    d = ImageDraw.Draw(img)
    cx = float(rng.uniform(44, 52))
    cy = float(rng.uniform(44, 52))
    rx = float(rng.uniform(29, 39))
    ry = float(rng.uniform(29, 39))
    thickness = float(rng.uniform(2.6, 4.6))
    color = int(rng.integers(3, 85))
    def scale_box(box): return tuple(round(v * s) for v in box)
    # Circular outline; an occasional broken contour improves robustness.
    oval = (cx - rx, cy - ry, cx + rx, cy + ry)
    if rng.random() < 0.12:
        d.arc(scale_box(oval), start=int(rng.uniform(10, 35)), end=int(rng.uniform(320, 348)), fill=color, width=round(thickness * s))
    else:
        d.ellipse(scale_box(oval), outline=color, width=round(thickness * s))
    eye_y = cy - ry * rng.uniform(.27, .37)
    eye_dx = rx * rng.uniform(.32, .40)
    for direction in (-1, 1):
        ex = cx + direction * eye_dx + rng.uniform(-1.3, 1.3)
        ey = eye_y + rng.uniform(-1.2, 1.2)
        e_size = float(rng.uniform(2.3, 4.2))
        if rng.random() < 0.2:
            d.arc(scale_box((ex - e_size, ey - e_size, ex + e_size, ey + e_size)), 205, 340, fill=color, width=round(2 * s))
        else:
            d.ellipse(scale_box((ex - e_size, ey - e_size, ex + e_size, ey + e_size)), fill=color)

    # Quadratic Bezier. Happy: endpoints higher than mid, sad: lower than mid.
    mouth_center_y = cy + ry * rng.uniform(.30, .36)
    width = rx * rng.uniform(.53, .70)
    curvature = ry * rng.uniform(.26, .51)
    endpoint_y = mouth_center_y + (-curvature * .40 if label == 1 else curvature * .40)
    middle_y = mouth_center_y + (curvature * .62 if label == 1 else -curvature * .62)
    pts = []
    for t in np.linspace(0, 1, 35):
        x = (1 - t) * (cx - width) + t * (cx + width)
        y = (1 - t) ** 2 * endpoint_y + 2 * (1 - t) * t * middle_y + t * t * endpoint_y
        pts.append((round(x * s), round(y * s)))
    d.line(pts, fill=color, width=round(thickness * s), joint='curve')
    img = img.rotate(float(rng.uniform(-14, 14)), resample=Image.Resampling.BICUBIC, expand=False, fillcolor=255)
    img = img.resize((CANVAS, CANVAS), Image.Resampling.LANCZOS)
    pixels = np.array(img, dtype=np.float32)
    # Smooth, camera-like paper illumination variation + light sensor noise.
    yy, xx = np.mgrid[0:CANVAS, 0:CANVAS]
    gradient = ((xx - CANVAS / 2) / CANVAS * rng.uniform(-20, 20)
                + (yy - CANVAS / 2) / CANVAS * rng.uniform(-20, 20))
    pixels = np.clip(pixels + gradient + rng.normal(0, rng.uniform(0, 4), pixels.shape), 0, 255)
    return Image.fromarray(pixels.astype(np.uint8), mode='L')


def generate(output: Path, seed: int = 2026, counts: dict | None = None) -> dict:
    output.mkdir(parents=True, exist_ok=True)
    counts = counts or SPLITS
    rng = np.random.default_rng(seed)
    arrays = {}
    examples = []
    metadata = []
    archive_path = output / 'caritas_images.zip'
    with zipfile.ZipFile(archive_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for split, per_class in counts.items():
            records = []
            for label in (0, 1):
                for idx in range(per_class):
                    img = make_smiley(label, rng)
                    feature = preprocess_image(img)
                    name = f'{split}/{LABELS[label]}/{LABELS[label]}_{idx:04d}.png'
                    buf = io.BytesIO()
                    img.save(buf, format='PNG', optimize=True)
                    archive.writestr(name, buf.getvalue())
                    records.append((feature, label))
                    metadata.append({'split':split, 'label':label, 'class':LABELS[label], 'path':name})
                    if idx < 8:
                        examples.append((split, label, idx, img))
            rng.shuffle(records)
            arrays[f'X_{split}'] = np.stack([a for a, _ in records]).astype(np.float32)
            arrays[f'y_{split}'] = np.asarray([y for _, y in records], dtype=np.float32).reshape(-1, 1)
    np.savez_compressed(output / 'caritas_dataset.npz', **arrays)
    with (output / 'labels.csv').open('w', encoding='utf-8', newline='') as fp:
        writer = csv.DictWriter(fp, fieldnames=['split','label','class','path'])
        writer.writeheader()
        writer.writerows(metadata)
    examples_dir = output / 'samples'
    examples_dir.mkdir(exist_ok=True)
    for split,label,idx,img in examples:
        if split == 'test': img.save(examples_dir / f'{split}_{LABELS[label]}_{idx:02d}.png')
    info = {
        'name': 'Dibujos sintéticos de caritas felices y tristes',
        'creator': 'Generados para este taller con src/generate_dataset.py y Pillow',
        'seed': seed, 'counts_per_class': counts, 'classes': {'0':'triste','1':'feliz'},
        'image_size_original': [CANVAS,CANVAS], 'model_input_size': [28,28],
        'preprocessing': 'ver src/preprocess.py y demo/preprocess.js',
        'limitations': 'Dataset sintético; no representa fotografías de rostros reales ni asegura precisión con dibujos sobre papel.'
    }
    (output / 'dataset_info.json').write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n', encoding='utf-8')
    return {k:tuple(v.shape) for k,v in arrays.items()}

if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--seed',type=int,default=2026)
    parser.add_argument('--output',type=Path,default=Path('data'))
    args=parser.parse_args()
    print(generate(args.output,args.seed))
