"""Métricas de test reservado; no usar para elegir hiperparámetros."""
import json
from pathlib import Path
import numpy as np
from .preprocess import load_datasets
from .train import load_model


def evaluate(data_path='data/caritas_dataset.npz', weights='models/weights.npz'):
    d=load_datasets(data_path)
    model=load_model(weights)
    true=d['y_test'].reshape(-1).astype(int)
    score=model.predict_proba(d['X_test'])
    pred=(score>=.5).astype(int)
    cm=np.zeros((2,2),dtype=int)
    for yhat,y in zip(pred,true): cm[y,yhat]+=1
    metrics={'test_accuracy':float((pred==true).mean()),
             'test_loss':model.loss(d['X_test'],d['y_test']),
             'confusion_matrix_rows_true_cols_pred':cm.tolist(),
             'n':int(len(true)),'class_names':['triste','feliz']}
    Path('models/test_report.json').write_text(json.dumps(metrics,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(json.dumps(metrics,indent=2,ensure_ascii=False))
    return metrics

if __name__=='__main__':evaluate()
