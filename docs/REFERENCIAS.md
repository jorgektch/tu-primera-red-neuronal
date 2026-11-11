# Bibliografía científica y tecnológica

El taller distingue **evidencia histórica o científica** de **decisiones de implementación**. Los esquemas Mermaid y las figuras de resultados son originales del repositorio y no copias de ilustraciones de los artículos.

## Artículos fundacionales

1. McCulloch, W. S., & Pitts, W. (1943). *A logical calculus of the ideas immanent in nervous activity*. Bulletin of Mathematical Biophysics, 5, 115–133. https://doi.org/10.1007/BF02478259  
   **Uso:** motivación histórica de modelos lógicos y unidades de cómputo similares a neuronas. **No:** equivalente directo del MLP moderno.

2. Rosenblatt, F. (1958). *The perceptron: A probabilistic model for information storage and organization in the brain*. Psychological Review, 65(6), 386–408. https://doi.org/10.1037/h0042519  
   **Uso:** introducción histórica al perceptrón y aprendizaje de reconocimiento de patrones.

3. Rumelhart, D. E., Hinton, G. E., & Williams, R. J. (1986). *Learning representations by back-propagating errors*. Nature, 323, 533–536. https://doi.org/10.1038/323533a0  
   **Uso:** aprendizaje de representaciones en capas ocultas y retropropagación del error.

4. LeCun, Y., Bottou, L., Bengio, Y., & Haffner, P. (1998). *Gradient-based learning applied to document recognition*. Proceedings of the IEEE, 86(11), 2278–2324. https://doi.org/10.1109/5.726791  
   **Uso:** extensión conceptual hacia arquitecturas de visión y reconocimiento de caracteres. **No:** el MLP de este taller reproduce las arquitecturas del paper.

5. Glorot, X., & Bengio, Y. (2010). *Understanding the difficulty of training deep feedforward neural networks*. Proceedings of Machine Learning Research, 9, 249–256. https://proceedings.mlr.press/v9/glorot10a.html  
   **Uso:** efectos de inicialización y activación sobre gradientes y entrenamiento.

6. He, K., Zhang, X., Ren, S., & Sun, J. (2015). *Delving deep into rectifiers: Surpassing human-level performance on ImageNet classification*. Proceedings of the IEEE International Conference on Computer Vision, 1026–1034. https://openaccess.thecvf.com/content_iccv_2015/html/He_Delving_Deep_into_ICCV_2015_paper.html  
   **Uso:** justificación específica del escalado `sqrt(2/n_entradas)` para inicializar capas con ReLU.

## Referencias técnicas

- NumPy, multiplicación matricial `matmul` / operador `@`: https://numpy.org/doc/stable/reference/generated/numpy.matmul.html
- NumPy, broadcasting: https://numpy.org/doc/stable/user/basics.broadcasting.html
- Python 3, venv: https://docs.python.org/3/library/venv.html
- Pillow, operaciones de imágenes: https://pillow.readthedocs.io/
- MDN, `getUserMedia` y permisos de cámara: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- MDN, Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- Reveal.js, Markdown plugin: https://revealjs.com/markdown/

## Procedencia de figuras y datos

- Todos los PNG en `assets/images/` están generados mediante `src/plot_results.py` con NumPy, Matplotlib y el dataset proporcionado.
- Los dibujos del dataset son creados algorítmicamente por `src/generate_dataset.py`; **no son imágenes recopiladas de usuarios ni extraídas de papers**.
- Los diagramas Mermaid del README son **adaptaciones didácticas originales**. Sus conceptos se relacionan con las fuentes indicadas bajo cada diagrama.
- Las cifras de entrenamiento en el README proceden de `models/metrics.json` y `models/test_report.json`, que se pueden regenerar.

## Precauciones al citar

Los resultados del clasificador se refieren a **dibujos sintéticos de dos clases**, no al reconocimiento de emociones humanas ni a ninguna investigación con sujetos reales. Un resultado de test sintético no constituye evidencia de rendimiento en fotos tomadas con cámara.
