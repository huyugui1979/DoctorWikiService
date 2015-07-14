var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/medicalWiki');
require('../model/Doctors');
require('../model/Questions');
var Doctor = mongoose.model('Doctor');
var Question = mongoose.model('Question');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });

});
router.get('/questions',function(req,res,next){
  //
  Question.find({tag:{ "$in" : req.query.tag}},function(err,result){

    if(err) next(err);
    res.jsonp(result);
    //
  });
  //
});

router.post('/questions',function(req,res,next){
  var q = new Question(req.body);
  q.save();
});
module.exports = router;
