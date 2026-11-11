"""Entrena el MLP y guarda artefactos reproducibles.

python -m src.train --epochs 45 --lr 0.25 --seed 42
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import numpy as np
from .preprocess import load_datasets
from .neural_network import MLP, gradient_check


def accuracy(model: MLP, X, y) -> float:
    return float(np.mean(model.predict(X) == y.reshape(-1)))


def train(data_path='data/caritas_dataset.npz', epochs=45, lr=.25,
          batch_size=64, seed=42, output_dir='models'):
    d=load_datasets(data_path)
    model=MLP(seed=seed)
    rng=np.random.default_rng(seed+1)
    history=[]
    best_val=float('inf')
    best_weights=None
    for epoch in range(1,epochs+1):
        for ids in np.array_split(rng.permutation(len(d['X_train'])),
                                  max(1,int(np.ceil(len(d['X_train'])/batch_size)))):
            model.train_batch(d['X_train'][ids], d['y_train'][ids],lr)
        row={'epoch':epoch,'train_loss':model.loss(d['X_train'],d['y_train']),
             'val_loss':model.loss(d['X_val'],d['y_val']),
             'train_accuracy':accuracy(model,d['X_train'],d['y_train']),
             'val_accuracy':accuracy(model,d['X_val'],d['y_val'])}
        history.append(row)
        if row['val_loss'] < best_val:
            best_val=row['val_loss']
            best_weights=([w.copy() for w in model.W],[b.copy() for b in model.b])
        if epoch == 1 or epoch % 5 == 0 or epoch == epochs:
            print(f"Época {epoch:02d}/{epochs} | train loss {row['train_loss']:.4f} | val loss {row['val_loss']:.4f} | val acc {row['val_accuracy']:.3f}")
    model.W,model.b=best_weights
    out=Path(output_dir);out.mkdir(exist_ok=True,parents=True)
    np.savez_compressed(out/'weights.npz', **{f'W{i+1}':w for i,w in enumerate(model.W)},
                        **{f'b{i+1}':b for i,b in enumerate(model.b)})
    metrics={'seed':seed,'epochs':epochs,'learning_rate':lr,'batch_size':batch_size,
             'best_val_loss':best_val,'test_loss':model.loss(d['X_test'],d['y_test']),
             'test_accuracy':accuracy(model,d['X_test'],d['y_test']),
             'test_n':len(d['y_test'])}
    (out/'metrics.json').write_text(json.dumps(metrics,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    (out/'history.json').write_text(json.dumps(history,indent=2)+'\n',encoding='utf-8')
    print('Evaluación de test sintético:',metrics)
    return model,metrics,history


def load_model(path='models/weights.npz'):
    weights=np.load(path,allow_pickle=False)
    model=MLP()
    for i in range(len(model.W)):
        model.W[i]=weights[f'W{i+1}'].astype(np.float32)
        model.b[i]=weights[f'b{i+1}'].astype(np.float32)
    return model

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--epochs',type=int,default=45)
    p.add_argument('--lr',type=float,default=.25)
    p.add_argument('--batch-size',type=int,default=64)
    p.add_argument('--seed',type=int,default=42)
    args=p.parse_args()
    train(epochs=args.epochs,lr=args.lr,batch_size=args.batch_size,seed=args.seed)
