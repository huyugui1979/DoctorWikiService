var express = require('express');
var router = express.Router();
var fs = require('fs');
var mongoose = require('mongoose');
var multiparty = require('multiparty');

mongoose.connect('mongodb://huyugui.f3322.org/medicalWiki');
var nodejieba = require("nodejieba");
//nodejieba.load({
//    userDict: '../dict/user.dict'
//});
nodejieba.load({
    userDict:'../dict/sougou.dict'
});
require('../model/Comments');
require('../model/Doctors');
require('../model/Questions');
require('../model/Categories');
require('../model/Doctors');
var Doctor = mongoose.model('Doctor');
var Question = mongoose.model('Question');
var Category = mongoose.model('Category');
var Comment = mongoose.model('Comment');
//

//
router.get('/doctor/login', function (req, res, next) {
    //
    Doctor.find(req.query, function (err, result) {
        //未命名文件夹 2
        if (err) next(err);
        if(result.length == 0)
            throw new Error("错误的手机号码或密码")
        else
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


    //
})
router.post('/vcode/forget',function(req,res,next){
    //
    if(req.session.phone == req.body.phone && req.session.vcode == req.body.vcode){
        //
        Doctor.findOneAndUpdate({phone:req.body.phone},{ password: req.body.password },null, function (error, result) {
            if (error){
                throw new Error(error.message);
            }
            res.jsonp(result);
        })
        //
    }else
    {
        throw new Error('请输入正确的手机号或验证码');
    }
    //
});
router.get('/vcode/register',function(req,res,next){
    //
    if(req.session.phone == req.query.phone && req.session.vcode == req.query.vcode){
        //
        Doctor.create(req.query, function (error, result) {
            if (error){
                throw new Error(error.message);
            }
            res.jsonp(result);
        })
        //
    }else
    {
        throw new Error('请输入正确的手机号或验证码');
    }
    //
});
router.get('/questions/search',function(req,res,next){
    //
    var searchs = req.query.search.split(' ');
    Question.find({$and:[{tags:{$all:searchs}},{doctor: {$ne: null}}]},function(err,doc){
        //
        if (err) next(err);
        res.jsonp(doc);
        //
    });
    //
})
router.get('/vcode/forget',function(req,res,next){

    Doctor.count({phone: req.query.phone}, function (err, count) {
        if (err) next(err);
        if (count == 0) {
            throw new Error('此号码没有注册');
        }else
        {
            var http = require('http');

            var crypto = require('crypto');

            function randomValueHex(len) {
                return crypto.randomBytes(Math.ceil(len / 2))
                    .toString('hex') // convert to hexadecimal format
                    .slice(0, len);   // return required number of characters
            }
            var rest = require('restler');
            var phone = req.query.phone;
            var time = Math.floor(Date.now() / 1000);
            var vcode = randomValueHex(4);
            var signature = (crypto.createHash('md5').update(phone + ":" + vcode + ":" + time + ":" + "IIYI4N5UA3").digest('hex')).substring(0, 16);
            var url = 'http://iapi.iiyi.com/v1/other/sms/?mobile=' + phone + '&message=' + vcode + '&timestamp=' + time + '&signature=' + signature;
            rest.get(url).on('complete', function (data) {
                var po = JSON.parse(data);
                if(po.code == "400")
                {
                    throw new Error(po.msg);
                }else {
                    req.session.phone = phone;
                    req.session.vcode = vcode;
                    res.jsonp('ok'); // auto convert to object
                }
            });
        }
    })


});
router.post('/vcode/register',function(req,res,next){
        Doctor.count({phone: req.body.phone}, function (err, count) {
            if (err) next(err);
            if (count > 0) {
                throw new Error('此号码已经注册');
            }else
            {
                var http = require('http');

                var crypto = require('crypto');

                function randomValueHex(len) {
                    return crypto.randomBytes(Math.ceil(len / 2))
                        .toString('hex') // convert to hexadecimal format
                        .slice(0, len);   // return required number of characters
                }
                var rest = require('restler');
                var phone = req.body.phone;
                var time = Math.floor(Date.now() / 1000);
                var vcode = randomValueHex(4);
                var signature = (crypto.createHash('md5').update(phone + ":" + vcode + ":" + time + ":" + "IIYI4N5UA3").digest('hex')).substring(0, 16);
                var url = 'http://iapi.iiyi.com/v1/other/sms/?mobile=' + phone + '&message=' + vcode + '&timestamp=' + time + '&signature=' + signature;
                rest.get(url).on('complete', function (data) {
                    var po = JSON.parse(data);
                    if(po.code == "400")
                    {
                        throw new Error(po.msg);
                    }
                    else {
                        req.session.phone = phone;
                        req.session.vcode = vcode;
                        res.jsonp('ok'); // auto convert to object
                    }
                });
            }

        })
});
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
    Question.count({category: req.query.category}, function (err, count) {
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
router.get('/questions/ids', function (req, res, next) {


    Question.find().where('_id').in(req.query.ids==null?[]:req.query.ids).populate('doctor').exec(function(error, doc){
        if (error) next(error);
        res.jsonp(doc);
    });
    //Question.find({},function(err,result){
    //   var j=2;
    //});
});
router.post('/doctor/changepassword',function(req,res,next){
    //
    Doctor.findOneAndUpdate({$and:[{_id:req.body._id},{password:req.body.data.oldPassword}]},{password:req.body.data.newPassword},function(error,doc){
        if(error) next(error);
        if(doc == null)
        throw new Error('请输入正确的原始密码');
        res.jsonp(doc);
    })
    //
});

router.get('/questions/unanswered', function (req, res, next) {

    Question.findRandom(
        {$and: [{doctor: null}, {category: {$in: req.query.categorys == null ? [] : req.query.categorys}}]}, {}, {limit: 10}, function (err, results) {
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
        {category: req.query.category},
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
});
router.get('/questions/answered', function (req, res, next) {
    Question.findRandom({$and: [{doctor: {$ne: null}}, {category: {$in: req.query.categorys == null ? [] : req.query.categorys}}]}).populate('doctor').limit(10).exec(function (err, doc) {
        if (err) next(err);
        res.jsonp(doc);
    });
    Question.syncRandom(function (err, result) {
        console.log(result.updated);
    });
});
router.get('/questions/doctor', function (req, res, next) {
    Question.findRandom({$and: [{doctor: req.query.doctor}, {category: {$in: req.query.categorys == null ? [] : req.query.categorys}}]}).populate('doctor').limit(10).exec(function (err, doc) {
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
});
router.post('/questions', function (req, res, next) {
    req.body.forEach(function(e,i,a){
        //
        var tags = nodejieba.extract(e.question,100);
        var new_tags=[];
        tags.forEach(function(e1,i1,a1){
          new_tags.push(e1.substring(0, e1.lastIndexOf(':')));
        });
        e.tags = new_tags;

        //
    });
    Question.create(req.body, function (error, result) {

        if (error) next(error);
        res.jsonp(result.length);
    });
});
//

//
module.exports = router;
