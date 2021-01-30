'use strict'


var TaosRestful = require('../renderer/taosrestful.js')

var tr = new TaosRestful("121.36.56.117","6041","root","msl110918")

tr.disTable('anode_8','ele_ana').then(a =>
    console.log(a)
)
