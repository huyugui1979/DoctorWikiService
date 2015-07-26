var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/medicalWiki');

require('../model/Comments');
require('../model/Doctors');
require('../model/Questions');
require('../model/Categories');
require('../model/Doctors');

var Doctor = mongoose.model('Doctor');
var Question = mongoose.model('Question');
var Category = mongoose.model('Category');
var Comment = mongoose.model('Comment');

router.get('/doctor', function (req, res, next) {
    //
    Doctor.find(req.query, function (err, result) {
        //未命名文件夹 2
        if (err) next(err);
        res.jsonp(result);
        //
    });
    //
});


//注册一个医生
router.post('/doctor', function (req, res, next) {
    //
    Doctor.create(req.body, function (error, result) {
        if (error) next(error);
        res.jsonp(result);
    })
    //
})


//获取类别
router.get('/category', function (req, res, next) {
    //
    Category.find({}, function (err, result) {
        if (err) next(err);
        res.jsonp(result);
    });
    //
});
router.get('/questions/count', function (req, res, next) {
    Question.count( {tag:req.query.tag}, function (err, count) {
        if (err) next(err);
        res.jsonp(count);
    })
});
router.get('/questions/unanswered', function (req,res,next) {
    Question.findRandom(
        {$and: [{doctor: null}, {tag: {$in: req.query.tags}}]}, {}, {limit: 10}, function (err, results) {
            if(err) next(err);
            res.jsonp(results);
        });
});
router.get('/questions/', function (req, res, next) {
    //
        Question.paginate(
            {tag:req.query.tag},
            {
                page: req.query.pageNo,
                limit: req.query.pageNumber,
                sortBy: {
                    questionTime: 1
                }
            },
            function (error, result) {
                if (error) next(error);
                console.log(result);
                res.jsonp(result);

            }
        );

});
router.put('/questions',function(req,res,next){
    //
    Question.findOneAndUpdate({_id:req.body._id},req.body,function(err,doc){
       if(err) next(err);
        res.jsonp(doc);
    });
    //
});
router.get('/questions/answered',function(req,res,next){
    Question.findRandom({$and: [{doctor:{ $ne: null }}, {tag: {$in: req.query.tags}}]}).populate('doctor').limit(10).exec(function(err,doc) {
            if(err) next(err);
            res.jsonp(doc);
        });
    Question.syncRandom(function (err, result) {
        console.log(result.updated);
    });
});
router.get('/questions/doctor',function(req,res,next){
    Question.findRandom({$and: [{doctor:req.query.doctor}, {tag: {$in: req.query.tags}}]}).populate('doctor').limit(10).exec(function(err,doc) {
        if(err) next(err);
        res.jsonp(doc);
    });
    Question.syncRandom(function (err, result) {
        console.log(result.updated);
    });
});
router.get('/comments/:question',function(req,res,next){
    Comment.find({question:req.params.question}).populate('question').populate('doctor').exec(function(err,doc){
        if(err) next(err);
        res.jsonp(doc);
    });
});

router.post('/comments',function(req,res,next){
    Comment.create(req.body,function(error,comment){
        if(error) next(error);
        Question.findOneAndUpdate({_id:comment.question},{'$push': { comments: { _id:comment._id}}},function(error,doc){
           if(error) next(error);
            res.jsonp(comment);
        });
        //
    })

});
router.post('/questions', function (req, res, next) {

    Question.create(req.body, function (error, result) {
        if (error) next(error);
        res.jsonp(result.length);
    });
});
module.exports = router;
