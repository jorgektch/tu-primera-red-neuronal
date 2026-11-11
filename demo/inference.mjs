/** Inferencia del MISMO MLP entrenado con NumPy (pesos row-major en model.json). */
export function validateModel(model) {
  if (model?.format !== 'readme-to-slides-numpy-mlp-v1' || model.inputSize !== 784) {
    throw new Error('Formato de modelo no compatible');
  }
  let inSize = 784;
  for (const layer of model.layers ?? []) {
    if (layer.input !== inSize || !Number.isInteger(layer.output) || layer.output < 1 ||
        layer.weights?.length !== layer.input * layer.output || layer.bias?.length !== layer.output) {
      throw new Error('Dimensiones incompatibles del modelo');
    }
    inSize = layer.output;
  }
  if (inSize !== 1) throw new Error('La salida debe tener una neurona');
  return model;
}
export function predictProbability(input, model) {
  if (input.length !== model.inputSize) throw new Error(`Se esperan ${model.inputSize} píxeles`);
  let current = input;
  for (const layer of model.layers) {
    const next = new Float32Array(layer.output);
    const W = layer.weights;
    for (let j = 0; j < layer.output; j++) {
      let z = layer.bias[j];
      for (let i = 0; i < layer.input; i++) z += current[i] * W[i * layer.output + j];
      next[j] = layer.activation === 'relu' ? Math.max(0, z) :
        1 / (1 + Math.exp(-Math.max(-40, Math.min(40, z))));
    }
    current = next;
  }
  return current[0];
}
export function predictLabel(p, model) {
  if (p < model.thresholds.triste) return {label:'Carita triste',emoji:'☹️',state:'sad'};
  if (p > model.thresholds.feliz) return {label:'Carita feliz',emoji:'🙂',state:'happy'};
  return {label:'Resultado incierto',emoji:'🤔',state:'uncertain'};
}
