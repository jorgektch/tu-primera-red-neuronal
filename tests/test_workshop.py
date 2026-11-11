import json
import unittest
from pathlib import Path
import numpy as np
from PIL import Image
from src.generate_dataset import make_smiley
from src.preprocess import preprocess_image,load_datasets
from src.neural_network import MLP,gradient_check
from src.train import load_model

ROOT=Path(__file__).resolve().parents[1]
class WorkshopTests(unittest.TestCase):
    def test_dimensions(self):
        d=load_datasets(str(ROOT/'data/caritas_dataset.npz'))
        for prefix in ('train','val','test'):
            self.assertEqual(d['X_'+prefix].shape[1],784)
            self.assertEqual(d['y_'+prefix].shape[1],1)
            self.assertTrue(np.isfinite(d['X_'+prefix]).all())
            self.assertTrue(((d['X_'+prefix]>=0)&(d['X_'+prefix]<=1)).all())
    def test_preprocess_empty(self):
        empty=preprocess_image(Image.new('L',(96,96),255))
        self.assertEqual(empty.shape,(784,))
        self.assertEqual(float(empty.sum()),0.)
    def test_generated_smiley(self):
        a=make_smiley(1,np.random.default_rng(5))
        b=make_smiley(0,np.random.default_rng(5))
        self.assertFalse(np.array_equal(np.asarray(a),np.asarray(b)))
        self.assertGreater(float(preprocess_image(a).sum()),20.)
    def test_gradient_check(self):
        net=MLP(layers=(4,5,3,1),seed=33,dtype=np.float64)
        X=np.random.default_rng(4).random((5,4));y=np.array([0,1,1,0,1]).reshape(-1,1)
        relative=gradient_check(net,X,y,epsilon=1e-5,checks=30)
        self.assertLess(relative,1e-4)
    def test_loss_decreases(self):
        net=MLP(layers=(4,8,1),seed=4)
        X=np.asarray([[0,0,0,0],[1,1,0,0],[0,0,1,1],[1,1,1,1]],dtype=np.float32)
        y=np.asarray([[0],[1],[0],[1]],dtype=np.float32)
        before=net.loss(X,y)
        for _ in range(130):net.train_batch(X,y,.2)
        self.assertLess(net.loss(X,y),before)
    def test_exported_predictions(self):
        model=load_model(str(ROOT/'models/weights.npz'))
        d=load_datasets(str(ROOT/'data/caritas_dataset.npz'))
        self.assertGreaterEqual(float((model.predict(d['X_test'])==d['y_test'].ravel()).mean()),.8)
        browser=json.loads((ROOT/'demo/model.json').read_text(encoding='utf-8'))
        self.assertEqual([l['output'] for l in browser['layers']],[32,16,1])
        for layer in browser['layers']:self.assertEqual(len(layer['weights']),layer['input']*layer['output'])
if __name__=='__main__':unittest.main()
