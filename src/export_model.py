"""Exporta los pesos entrenados a JSON para demo/app.js (sin inferencia simulada)."""
import json
from pathlib import Path
from .train import load_model


def export(path='demo/model.json', weights='models/weights.npz', metrics='models/metrics.json'):
    net=load_model(weights)
    layers=[]
    for i,(W,b) in enumerate(zip(net.W,net.b)):
        layers.append({'input':int(W.shape[0]),'output':int(W.shape[1]),
                       'activation':'sigmoid' if i==len(net.W)-1 else 'relu',
                       'weights':[round(float(x),7) for x in W.ravel(order='C')],
                       'bias':[round(float(x),7) for x in b.ravel()]})
    stats=json.loads(Path(metrics).read_text(encoding='utf-8'))
    model={'format':'readme-to-slides-numpy-mlp-v1','classes':['triste','feliz'],
           'imageSize':[28,28], 'inputSize':784,'layers':layers,
           'thresholds':{'triste':0.35,'feliz':0.65},
           'training':stats,
           'disclaimer':'Clasifica dibujos sintéticos; no interpreta emociones humanas.'}
    target=Path(path);target.parent.mkdir(exist_ok=True,parents=True)
    target.write_text(json.dumps(model,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    return target

if __name__=='__main__':
    print(export())
