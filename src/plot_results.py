"""Genera figuras reproducibles para el README a partir de datos y métricas reales."""
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from .preprocess import load_datasets

BG='#0B1020';FG='#F5F7FF';MUTED='#AAB9D0';ACCENT='#36E0C4';SECOND='#F5B465';GRID='#30435B'

def style(fig,ax):
    fig.patch.set_facecolor(BG);ax.set_facecolor(BG)
    ax.tick_params(colors=MUTED,labelsize=9)
    for spine in ax.spines.values():spine.set_color(GRID)
    ax.xaxis.label.set_color(MUTED);ax.yaxis.label.set_color(MUTED);ax.title.set_color(FG)
    ax.grid(alpha=.18,color=GRID)

def generate(output='assets/images'):
    path=Path(output);path.mkdir(exist_ok=True,parents=True)
    d=load_datasets()
    fig,axes=plt.subplots(2,5,figsize=(11,4.7))
    fig.patch.set_facecolor(BG)
    rng=np.random.default_rng(13)
    for row,label in enumerate((1,0)):
        idx=np.where(d['y_test'].ravel()==label)[0]
        for col,index in enumerate(rng.choice(idx,5,replace=False)):
            ax=axes[row,col];ax.imshow(d['X_test'][index].reshape(28,28),cmap='gray',vmin=0,vmax=1)
            ax.axis('off');ax.set_title('Feliz' if label==1 else 'Triste',color=ACCENT if label else SECOND,fontsize=12)
    fig.suptitle('Dataset sintético: ejemplos reservados de TEST',color=FG,fontsize=16,y=.99)
    fig.tight_layout(rect=(0,0,1,.94));fig.savefig(path/'ejemplos_dataset.png',dpi=160,facecolor=BG);plt.close(fig)

    history=json.loads(Path('models/history.json').read_text())
    fig,ax=plt.subplots(figsize=(10,4.3));style(fig,ax)
    ax.plot([h['epoch'] for h in history],[h['train_loss'] for h in history],label='Entrenamiento',color=ACCENT,linewidth=2.5)
    ax.plot([h['epoch'] for h in history],[h['val_loss'] for h in history],label='Validación',color=SECOND,linewidth=2.5)
    ax.set(xlabel='Época',ylabel='Binary cross entropy',title='Pérdida durante el entrenamiento')
    ax.legend(facecolor=BG,edgecolor=GRID,labelcolor=FG,fontsize=10)
    fig.tight_layout();fig.savefig(path/'curva_entrenamiento.png',dpi=170,facecolor=BG);plt.close(fig)

    report=json.loads(Path('models/test_report.json').read_text())
    cm=np.array(report['confusion_matrix_rows_true_cols_pred'])
    fig,ax=plt.subplots(figsize=(5,4.7));style(fig,ax)
    ax.imshow(cm,cmap='Blues')
    ax.set_xticks([0,1],['Triste','Feliz']);ax.set_yticks([0,1],['Triste','Feliz']);
    ax.set(xlabel='Predicción',ylabel='Etiqueta real',title='Matriz de confusión · test sintético')
    for i in range(2):
        for j in range(2):ax.text(j,i,str(cm[i,j]),ha='center',va='center',color='black',fontsize=17,weight='bold')
    ax.grid(False);fig.tight_layout();fig.savefig(path/'matriz_confusion.png',dpi=160,facecolor=BG);plt.close(fig)

    x=np.linspace(-5,5,300)
    fig,ax=plt.subplots(figsize=(9.5,4.5));style(fig,ax)
    ax.plot(x,np.maximum(x,0),label='ReLU',color=ACCENT,linewidth=2.7)
    ax.plot(x,1/(1+np.exp(-x)),label='Sigmoide',color=SECOND,linewidth=2.7)
    ax.set(xlabel='z',ylabel='Activación',title='Funciones de activación: ReLU y sigmoide')
    ax.legend(facecolor=BG,edgecolor=GRID,labelcolor=FG)
    fig.tight_layout();fig.savefig(path/'activaciones.png',dpi=160,facecolor=BG);plt.close(fig)
    print('Figuras guardadas en',output)
if __name__=='__main__':generate()
