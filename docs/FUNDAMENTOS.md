# Fundamentos: de una imagen a los gradientes

**Objetivo:** que puedas explicar cada tensor y cada derivada que aparece en `src/neural_network.py`, y construir el mismo cálculo en el notebook.

## 1. Clasificación binaria supervisada

Tenemos un conjunto `D = {(x_i, y_i)}` de imágenes `x_i` y etiquetas `y_i ∈ {0,1}`. La clase 0 corresponde a una **carita dibujada triste**, y la clase 1 a una **carita dibujada feliz**. El modelo aprende a aproximar una función de los píxeles a una salida numérica, **no** a interpretar emociones de personas.

Una imagen normalizada es una matriz de 28 × 28. Usamos orden de filas (*row-major*) para aplanarla a un vector `x` de longitud 784. Un batch de `B` imágenes forma una matriz `X` de tamaño `(B,784)`.

## 2. Neurona y producto punto

Para un vector `x` y pesos `w`, la suma ponderada es `z = x·w + b = Σ_j x_j w_j + b`. Si `x=[0.2,0.8,0.5]`, `w=[0.4,-0.3,0.9]` y `b=0.1`, entonces `z=0.39`. Esta es la base computacional del perceptrón, aunque nuestro algoritmo de entrenamiento y arquitectura multicapa son posteriores.

**Fuente histórica:** Rosenblatt (1958), DOI `10.1037/h0042519`.

## 3. Multiplicación matricial y capas

Las muestras son filas. Para la capa 1, `Z1 = X @ W1 + b1`:

| Variable | Forma |
|---|---|
| `X` | `(B,784)` |
| `W1`, `b1` | `(784,32)`, `(1,32)` |
| `Z1`, `A1` | `(B,32)` |
| `W2`, `b2` | `(32,16)`, `(1,16)` |
| `Z2`, `A2` | `(B,16)` |
| `W3`, `b3` | `(16,1)`, `(1,1)` |
| `Z3`, `P` | `(B,1)` |

`b` se propaga sobre las filas por *broadcasting*. La matriz completa permite calcular un batch sin bucles de Python para cada pixel.

## 4. Activaciones

- `ReLU(z) = max(0,z)`: `dReLU/dz` vale 1 para `z>0` y 0 para `z<0` (elegimos 0 en el punto 0).
- `σ(z) = 1/(1+exp(-z))`: `dσ/dz = σ(z)(1-σ(z))`.

La activación no lineal permite que la composición de capas represente funciones que no son solamente una transformación lineal.

**Fuente:** Glorot & Bengio (2010); para inicialización específica de ReLU, He et al. (2015).

## 5. Forward pass completo

```text
Z1 = X  @ W1 + b1    A1 = ReLU(Z1)
Z2 = A1 @ W2 + b2    A2 = ReLU(Z2)
Z3 = A2 @ W3 + b3    P  = sigmoid(Z3)
```

El número `P` es una salida de la red en `(0,1)`. **No está calibrada como probabilidad estadística**; se usa como puntuación para decidir la clase.

## 6. Pérdida y regla de la cadena

Para la etiqueta `y` y predicción `p`, la Binary Cross-Entropy es `L = -mean[y·ln(p)+(1-y)·ln(1-p)]`. Para evitar problemas de precisión numérica, el código calcula desde logits `z`: `mean(logaddexp(0,z)-y·z)`.

Gracias a la composición `sigmoide + BCE`, la derivada respecto al último logit es:

`dZ3 = (P-y)/B`.

Las matrices de gradiente son:

```text
dW3 = A2.T @ dZ3        db3 = sum_rows(dZ3)
dZ2 = (dZ3 @ W3.T) * (Z2 > 0)
dW2 = A1.T @ dZ2        db2 = sum_rows(dZ2)
dZ1 = (dZ2 @ W2.T) * (Z1 > 0)
dW1 = X.T @ dZ1         db1 = sum_rows(dZ1)
```

Finalmente se actualiza cada parámetro, por ejemplo `W1 -= learning_rate*dW1`.

**Fuente conceptual:** Rumelhart, Hinton & Williams (1986), DOI `10.1038/323533a0`.

## 7. Descenso por mini-batches

Se mezclan las 1800 imágenes del conjunto de entrenamiento con una semilla fija, se subdividen en batches y se aplican actualizaciones. Una *epoch* es un recorrido de todo `train`. Los datos de validación se evalúan sin aprender de ellos. Guardamos los pesos de menor pérdida de validación y **solo entonces** evaluamos el test reservado.

El entrenamiento es reproducible con:

```bash
python -m src.train --epochs 45 --lr 0.25 --batch-size 64 --seed 42
python -m src.evaluate
python -m src.export_model
```

## 8. Gradient checking

Para probar el cálculo de gradientes, alteramos un parámetro `θ` con `ε` y calculamos:

`g_num = (L(θ+ε) - L(θ-ε)) / (2ε)`.

Debería ser cercano al gradiente analítico. Usamos una red pequeña, `float64` y un subconjunto de parámetros para no convertir el chequeo en un proceso costoso.

## 9. Limitación de las redes densas en visión

El MLP recibe píxeles aplanados; no incorpora explícitamente estructura local 2D como una CNN. Para expandir el taller hacia redes convolucionales, consulta LeCun et al. (1998), DOI `10.1109/5.726791`.
