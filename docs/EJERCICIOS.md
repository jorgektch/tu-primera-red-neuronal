# Ejercicios por dificultad

## Nivel 1 — Entender el cálculo

1. Calcula `x·w+b` para `x=[0.1,0.9]`, `w=[-0.5,0.8]`, `b=0.2`. Verifica con NumPy.
2. Una imagen de 32×32 píxeles en gris, ¿cuántas entradas necesita un MLP sin reducción de dimensiones?
3. `X` tiene forma `(64,784)` y `W` forma `(784,32)`. ¿Cuál es la forma de `X @ W`? ¿Por qué?
4. Ejecuta `relu([-2,-1,0,1,2])`. ¿Por qué ReLU introduce no linealidad?

## Nivel 2 — Programar la neurona y el MLP

5. Implementa `sigmoid` estable usando `np.clip` y un test en valores grandes.
6. Comprueba que `forward` devuelve una matriz `(B,1)` para cualquier `B>=1`.
7. Completa las expresiones de `db3`, `db2` y `db1` en `backprop`.
8. Ejecuta `gradient_check` con una red pequeña de doble precisión y registra el error máximo.

## Nivel 3 — Entrenar y analizar

9. Entrena con `--lr 0.05`, `0.25` y `0.50`. Compara épocas necesarias y pérdida de validación.
10. Reduce `X_train` a 20% de ejemplos y compara validación y test sin reajustar con test.
11. Construye una matriz de confusión calculada a partir del conjunto test.
12. Cambia `32→16` a `16→8` y actualiza código, exportación y verificación de dimensiones.

## Nivel 4 — Visión y despliegue

13. Clasifica al menos 20 dibujos reales diferentes, con distintas luces y grosores. Registra precisión, fallos y casos inciertos.
14. Compara un dibujo centrado frente a otro parcialmente fuera del recuadro. ¿Se observa cambio en el vector 28×28?
15. Ejecuta el mismo caso desde Python y JavaScript. ¿Qué error numérico máximo observas?
16. Investiga una CNN sencilla y explica qué estructura espacial conserva en contraste con el MLP.

## Preguntas de análisis

- ¿Por qué una validación muy alta no asegura desempeño con fotografías?
- ¿Qué harías si la cámara ve una hoja con texto en lugar de una carita?
- ¿Es apropiado interpretar el output sigmoide como una probabilidad calibrada?
- ¿En qué se parecen y diferencian los pesos aprendidos de las reglas que tú escribiste en el generador de imágenes?

Consulta las implementaciones de referencia en `src/` solo después de intentar los ejercicios. Los notebooks contienen celdas ejecutables completas para el recorrido básico.
