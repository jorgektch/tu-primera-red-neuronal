"""MLP binario, implementación matemática en NumPy sin frameworks de deep learning.

Arquitectura 784 -> 32 (ReLU) -> 16 (ReLU) -> 1 (sigmoide).
En las ecuaciones usamos muestras por filas: X @ W + b.
"""
from __future__ import annotations
import numpy as np


def sigmoid(x: np.ndarray) -> np.ndarray:
    x = np.clip(x, -40, 40)
    return 1 / (1 + np.exp(-x))


def relu(x: np.ndarray) -> np.ndarray:
    return np.maximum(x, 0)


class MLP:
    def __init__(self, layers=(784, 32, 16, 1), seed=42, dtype=np.float32):
        self.layers = tuple(layers)
        self.dtype = dtype
        rng = np.random.default_rng(seed)
        self.W = []
        self.b = []
        for i, (nin, nout) in enumerate(zip(layers[:-1], layers[1:])):
            # He initialization: useful for ReLU hidden layers.
            std = np.sqrt(2 / nin) if i < len(layers) - 2 else np.sqrt(1 / nin)
            self.W.append((rng.standard_normal((nin, nout))*std).astype(dtype))
            self.b.append(np.zeros((1, nout), dtype=dtype))

    def forward(self, X: np.ndarray) -> tuple[np.ndarray, list, list]:
        X = np.asarray(X, dtype=self.dtype)
        activations = [X]
        preactivations = []
        a = X
        for i, (w,b) in enumerate(zip(self.W,self.b)):
            z = a @ w + b
            preactivations.append(z)
            a = sigmoid(z) if i == len(self.W) - 1 else relu(z)
            activations.append(a)
        return a, activations, preactivations

    def loss(self, X: np.ndarray, y: np.ndarray) -> float:
        _, _, zs = self.forward(X)
        logits = zs[-1]
        y = np.asarray(y, dtype=self.dtype).reshape(-1,1)
        return float(np.mean(np.logaddexp(0, logits) - y * logits))

    def gradients(self, X: np.ndarray, y: np.ndarray):
        y = np.asarray(y,dtype=self.dtype).reshape(-1, 1)
        pred, activations, preactivations = self.forward(X)
        batch = len(y)
        delta = (pred - y) / batch  # sigmoid + BCE derivative
        gw, gb = [None]*len(self.W), [None]*len(self.W)
        for i in range(len(self.W)-1,-1,-1):
            gw[i] = activations[i].T @ delta
            gb[i] = np.sum(delta,axis=0,keepdims=True)
            if i:
                delta = (delta @ self.W[i].T) * (preactivations[i-1] > 0)
        return gw,gb

    def train_batch(self, X: np.ndarray, y: np.ndarray, learning_rate: float):
        gw,gb = self.gradients(X,y)
        for i in range(len(self.W)):
            self.W[i] -= learning_rate*gw[i]
            self.b[i] -= learning_rate*gb[i]

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        return self.forward(X)[0].ravel()

    def predict(self, X: np.ndarray, threshold=.5) -> np.ndarray:
        return (self.predict_proba(X)>=threshold).astype(np.int32)


def gradient_check(model: MLP, X: np.ndarray, y: np.ndarray, epsilon=1e-5, checks=20, seed=10):
    """Compara derivadas analíticas y numéricas sobre algunos parámetros."""
    rng=np.random.default_rng(seed)
    gw,gb=model.gradients(X,y)
    relatives=[]
    for weights, analytic in ((model.W,gw),(model.b,gb)):
        for tensor,gradient in zip(weights,analytic):
            for _ in range(checks//(2*len(model.W))+1):
                idx=tuple(int(rng.integers(0,n)) for n in tensor.shape)
                old=float(tensor[idx])
                tensor[idx]=old+epsilon
                plus=model.loss(X,y)
                tensor[idx]=old-epsilon
                minus=model.loss(X,y)
                tensor[idx]=old
                numerical=(plus-minus)/(2*epsilon)
                actual=float(gradient[idx])
                relatives.append(abs(actual-numerical)/max(1e-8,abs(actual)+abs(numerical)))
    return max(relatives)
