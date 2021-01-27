'use strict'


var TaosRestful = require('../renderer/taosrestful.js')

var tr = new TaosRestful("121.36.56.117","6041","root","msl110918")

tr.alterDatabase('nodeadd2',1200,0).then(a =>
    console.log(a)
)
