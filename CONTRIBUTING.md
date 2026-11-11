# Contribuir a Mi Primera Red Neuronal

Las contribuciones pueden mejorar la claridad pedagógica, el dataset, el preprocesamiento, las pruebas o la app web. Prioriza cambios reproducibles y explicaciones fundamentadas.

1. Crea un Issue para describir la mejora.
2. Abre una rama `feat/...`, `fix/...` o `docs/...`.
3. Ejecuta `python -m unittest discover -s tests -p 'test_*.py'`, `node --test tests/browser_model.test.mjs` y `python tests/check_deck.py`.
4. Si modificas matemáticas o diagramas, incluye referencias primarias y separa ideas originales de resultados del paper.
5. Si cambias el dataset, documenta procedencia, semilla, splits y cualquier posible fuga.
6. Abre un PR con reproducción, resultados y limitaciones.

No subas fotos de personas ni información personal. Este es un proyecto de clasificación de **dibujos**, no de emociones humanas.
