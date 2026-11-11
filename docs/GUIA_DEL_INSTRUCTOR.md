# Guía de facilitación

**Público:** estudiantes de programación con nociones básicas de variables, bucles y funciones. Álgebra lineal y cálculo se explican desde una intuición concreta.

**Resultado final:** un MLP 784→32→16→1 escrito en NumPy, entrenado con 2440 imágenes sintéticas distribuidas entre train/val/test, exportado a JavaScript y usado desde cámara en GitHub Pages.

## Sesión 1: píxeles y matrices (80–90 min)

Slides 1–11. Motivación y cronología (15 min), imágenes como matrices y vectores (25 min), producto punto a mano (20 min), ejecución de NumPy (20 min), preguntas (10 min). **Entrega:** captura del resultado `0.39` y dimensiones 28×28 → 784.

## Sesión 2: arquitectura y aprendizaje (80–90 min)

Slides 12–25. Neurona, activación y XOR (20 min), red multicapa y forward (25 min), BCE y gradientes (25 min), gradient checking conceptual (15 min). **Entrega:** un `forward` ejecutable y explicación de formas `W` y `b`.

## Sesión 3: dataset y entrenamiento (80–90 min)

Slides 26–38. Generar y visualizar datos (20 min), splits y fuga de información (15 min), implementar entrenamiento en notebook (30 min), curva y matriz de confusión (20 min). **Entrega:** notebook con pérdidas, exactitud de validación y resultados de test reservado.

## Sesión 4: despliegue y prueba real (75–90 min)

Slides 39–43. Exportar pesos (15 min), ver igualdad conceptual de inferencia Python/JS (20 min), activar Pages (10 min), usar cámara/dibujo (20 min), evaluar límites y errores (20 min). **Entrega:** enlace a app funcionando, foto de dibujo y registro de resultados (sin fotos de personas).

## Preparación antes de la clase

1. Activa GitHub Pages (`main`, raíz) y comprueba `demo/` por HTTPS.
2. Ejecuta `python -m unittest discover -s tests -p 'test_*.py'` y `node --test tests/browser_model.test.mjs`.
3. Abre `README.md` como slides y verifica diagramas Mermaid.
4. Lleva hojas blancas y rotuladores oscuros. Evita prometer una precisión sobre fotos reales.
5. Ten la opción de **Subir imagen** o **Dibujar aquí** si se bloquea la cámara.

## Preguntas clave para el público

- ¿Por qué una imagen se transforma a un vector de 784 elementos?
- ¿Por qué la salida de una capa usa `(B,784) @ (784,32)`?
- ¿Qué aporta ReLU?
- ¿Qué diferencia hay entre `train_loss` y `val_loss`?
- ¿Qué pasa si las fotos reales tienen sombras que el generador no simula?
- ¿Cómo se prueba que el navegador ejecuta el mismo modelo?

## Notas de rigor

Se utilizan diagramas propios con referencias primarias en `REFERENCIAS.md`. El resultado 100% en test sintético es **una medición de un problema sintético diseñado para enseñar**. No debe generalizarse a imágenes reales ni a evaluación de sentimientos o emociones. Es válido mostrar errores de cámara y discutir por qué ocurren: forma parte del aprendizaje.
