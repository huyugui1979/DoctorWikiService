var express = require('express');
var router = express.Router();
var fs = require('fs');
var mongoose = require('mongoose');
var multiparty = require('multiparty');
var util = require('util');

mongoose.connect('mongodb://huyugui.f3322.org/medicalWiki');

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
//
router.post('/portrait', function (req, res, next) {
    //生成multiparty对象，并配置下载目标路径
    var form = new multiparty.Form({uploadDir: '../public/images/'});
    //下载后处理
    form.parse(req, function (err, fields, files) {
        var filesTmp = JSON.stringify(files, null, 2);

        if (err) {
            console.log('parse error: ' + err);
        } else {
            console.log('parse files: ' + filesTmp);
            var inputFile = files.file[0];
            var uploadedPath = inputFile.path;
            var dstPath = '../public/images/' + inputFile.originalFilename;
            //重命名为真实文件名
            fs.rename(uploadedPath, dstPath, function (err) {
                if (err) {
                    console.log('rename error: ' + err);
                } else {
                    console.log('rename ok');
                }
            });
        }
        res.jsonp({fileName:inputFile.originalFilename});
    });
});
//
router.get('/doctors/count', function (req, res, next) {
    Doctor.count({}, function (err, count) {
        if (err) next(err);
        res.jsonp(count);
    })
});
//注册一个医生
router.post('/doctors', function (req, res, next) {
    //

    Doctor.create(req.body, function (error, result) {
        if (error) next(error);
        res.jsonp(result);
    })
    //
})
router.delete('/doctors', function (req, res, next) {
    Doctor.findOneAndRemove({_id: req.query._id}, function (error, result) {
        if (error) next(error);
        res.jsonp(result);
    });
});
router.put('/doctors', function (req, res, next) {
    Doctor.findOneAndUpdate({_id: req.body._id}, req.body, function (error, result) {
        if (error) next(error);

        res.jsonp(result);

    });
})
router.delete('/doctors', function (req, res, next) {
    //
    Doctor.findOneAndRemove({_id: req.body._id}, function (error, result) {
        if (error) next(error);

        res.jsonp(result);

    });
    //
})
router.get('/doctors', function (req, res, next) {
    //
    Doctor.paginate(
        {},
        {
            page: req.query.pageNo,
            limit: req.query.pageNumber,
            sortBy: {
                registerTime: 1
            }
        },
        function (error, result) {
            if (error) next(error);
            console.log(result);
            res.jsonp(result);

        }
    );
    //
});

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
    Question.count({tag: req.query.tag}, function (err, count) {
        if (err) next(err);
        res.jsonp(count);
    })
});
router.delete('/comments', function (req, res, next) {
    Question.update({_id: req.query.question._id}, {'$pull': {comments: req.query._id}})
        .exec(function (err) {
            if (err) next(err);
            Comment.remove({_id: req.query._id}, function (err, numberRemoved) {

                if (err) next(err);
                res.jsonp(numberRemoved);
            });
        });
});
router.get('/questions/unanswered', function (req, res, next) {

    Question.findRandom(
        {$and: [{doctor: null}, {tag: {$in: req.query.tags == null ? [] : req.query.tags}}]}, {}, {limit: 10}, function (err, results) {
            if (err) next(err);
            res.jsonp(results);
        });
    Question.syncRandom(function (err, result) {
        console.log(result.updated);
    });
    //Question.find({},function(err,result){
    //   var j=2;
    //});
});
router.get('/questions/', function (req, res, next) {
    //
    Question.paginate(
        {tag: req.query.tag},
        {
            page: req.query.pageNo,
            limit: req.query.pageNumber,
            populate: 'doctor',
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
router.put('/questions', function (req, res, next) {
    //
    Question.findOneAndUpdate({_id: req.body._id}, req.body, function (err, doc) {
        if (err) next(err);
        res.jsonp(doc);
    });
    //
});
router.get('/questions/answered', function (req, res, next) {
    Question.findRandom({$and: [{doctor: {$ne: null}}, {tag: {$in: req.query.tags == null ? [] : req.query.tags}}]}).populate('doctor').limit(10).exec(function (err, doc) {
        if (err) next(err);
        res.jsonp(doc);
    });
    Question.syncRandom(function (err, result) {
        console.log(result.updated);
    });
});
router.get('/questions/doctor', function (req, res, next) {
    Question.findRandom({$and: [{doctor: req.query.doctor}, {tag: {$in: req.query.tags == null ? [] : req.query.tags}}]}).populate('doctor').limit(10).exec(function (err, doc) {
        if (err) next(err);
        res.jsonp(doc);
    });
    Question.syncRandom(function (err, result) {
        console.log(result.updated);
    });
});
router.get('/comments/question', function (req, res, next) {
    Comment.find({question: req.query.question}).populate('question').populate('doctor').exec(function (err, doc) {
        if (err) next(err);
        res.jsonp(doc);
    });
});

router.post('/comments', function (req, res, next) {
    Comment.create(req.body, function (error, comment) {
        if (error) next(error);
        Question.findOneAndUpdate({_id: comment.question}, {'$push': {comments: {_id: comment._id}}}, function (error, doc) {
            if (error) next(error);
            res.jsonp(comment);
        });
        //
    })
});
router.delete('/questions', function (req, res, next) {
    //
    Question.remove({_id: req.query._id})
        .exec(function (err, numberRemoved) {
            if (err) next(err);

            Comment.remove({question: req.query._id}, function (err, numberRemoved) {

                if (err) next(err);
                res.jsonp(numberRemoved);
            });
        });
    //
});
router.post('/questions', function (req, res, next) {

    Question.create(req.body, function (error, result) {
        if (error) next(error);
        res.jsonp(result.length);
    });
});
module.exports = router;
