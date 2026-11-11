"""Validación estática del README como presentación del taller."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
s=(ROOT/'README.md').read_text(encoding='utf-8')
c=json.loads((ROOT/'presentation.config.json').read_text(encoding='utf-8'))
slides=len(re.findall(r'^---$',s,re.M))+len(re.findall(r'^--$',s,re.M))+1
assert slides==43, f'Se esperaban 43 slides, hay {slides}'
assert c['presentation']['title']=='Mi Primera Red Neuronal'
assert c['presenter']['name']=='Jorge Jesús Quispe Villaverde'
assert len(re.findall(r'^```mermaid\s*$',s,re.M))>=5
assert len(re.findall(r'^```(?:python|javascript|bash|json)',s,re.M))>=5
assert re.search(r'^--$',s,re.M), 'Falta slide vertical'
assert 'Note:' in s and 'Rumelhart' in s
for path in ['data/caritas_dataset.npz','data/caritas_images.zip','data/labels.csv','models/weights.npz',
             'models/test_report.json','demo/model.json','demo/index.html','notebooks/01_mi_primera_red_neuronal.ipynb']:
    assert (ROOT/path).exists(),f'No encontrado: {path}'
for loc in re.findall(r'(?:src|href)="((?:assets|demo|data)/[^"?#]+)"',s):
    assert (ROOT/loc).exists(),f'Recurso local faltante: {loc}'
print(f'OK: {slides} slides, enlaces, Mermaid, dataset, modelo y app')
