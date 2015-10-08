var express = require('express');
var router = express.Router();
var fs = require('fs');
var mongoose = require('mongoose');
var multiparty = require('multiparty');
var async = require('async');
var simhash = require('simhash')('md5');


var db = mongoose.connect('mongodb://113.31.89.204/medicalWiki');
var nodejieba = require("nodejieba");
//nodejieba.load({
//    userDict: '../dict/user.dict'
//});


nodejieba.load({
    userDict: '../dict/sougou.dict'
});
require('../model/Comments');
require('../model/Doctors');
require('../model/Questions');
require('../model/Categories');
require('../model/Doctors');
require('../model/Versions')
var Doctor = mongoose.model('Doctor');
var Question = mongoose.model('Question');
var Category = mongoose.model('Category');
var Comment = mongoose.model('Comment');
var Version = mongoose.model('Version');
//

//
router.get('/doctor/login', function (req, res, next) {
    //
    Doctor.find(req.query, function (err, result) {
        //未命名文件夹 2
        if (err) next(err);
        if (result.length == 0)
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
        res.jsonp({fileName: inputFile.originalFilename});
    });
});
//
router.get('/versions', function (req, res, next) {
    Version.findOne({}, function (error, doc) {
        //
        if (error) next(error);
        res.jsonp(doc);
        //
    });
})
router.post('/versions/', function (req, res, next) {
    var v = new Version(req.query.version);
    v.save(function (error, doc) {
        if (err) next(err);
        res.jsonp(doc);
    })
})
router.get('/doctors/count', function (req, res, next) {
    Doctor.count({}, function (err, count) {
        if (err) next(err);
        res.jsonp(count);
    })
});
//注册一个医生
router.get('/doctors/id', function (req, res, next) {
    //
    Doctor.findOne({_id: req.query._id}, function (error, doc) {
        if (error) {
            throw new Error(error.message);
        }
        if (doc == null) {
            throw  new Error('错误的医生id');
        }
        res.jsonp(doc);
    })
    //
})
router.post('/vcode/forget', function (req, res, next) {
    //
    if (req.session.phone == req.body.phone && req.session.vcode == req.body.vcode) {
        //
        Doctor.findOneAndUpdate({phone: req.body.phone}, {password: req.body.password}, null, function (error, result) {
            if (error) {
                throw new Error(error.message);
            }
            res.jsonp(result);
        })
        //
    } else {
        throw new Error('请输入正确的手机号或验证码');
    }
    //
});

router.get('/vcode/register', function (req, res, next) {
    //
    if (req.session.phone == req.query.phone && req.session.vcode == req.query.vcode) {
        //
        Doctor.create(req.query, function (error, result) {
            if (error) {
                throw new Error(error.message);
            }
            res.jsonp(result);
        })
        //
    } else {
        throw new Error('请输入正确的手机号或验证码');
    }
    //
});
router.get('/questions/search', function (req, res, next) {
    //
    console.time("search");
    var tags = nodejieba.extract(req.query.search, 100);
    var new_tags = [];
    tags.forEach(function (e1, i1, a1) {
        new_tags.push(e1.substring(0, e1.lastIndexOf(':')));
    });
    //
    var hash = simhash(new_tags);
    var o = {};
    //
    o.map = function () {
        var compareHash = function (r1, r2) {
            var result3 = [];
            r1.forEach(function (e, i, r) {
                result3.push(e ^ r2[i]);
            });
            var total = 0;
            result3.forEach(function (e, i, r) {
                total = total + e;
            });
            return total;
        }
        if (this.doctor != null) {
            var s = compareHash(hash, this.simhash);
            emit(this._id, s);
        }
    }
    o.reduce = function (key, values) {
        //
        return values[0];
        //
    }
    //o.limit = 10;
    o.out = {replace: 'results'};
    o.scope = {hash: hash};

    Question.mapReduce(o, function (err, model) {

        console.timeEnd("search");
        model.find().sort({value: 1}).limit(10).exec(function (err, data) {
            var ids = [];
            data.forEach(function (e, i, r) {
                //
                ids.push(e._id);
                //
            });
            Question.find({_id: {$in: ids}}).populate('doctor', 'name image').exec(function (err, result) {
                var temp = [];
                ids.forEach(function (e, i, a) {
                    for (i = 0; i < result.length; i++) {
                        if (result[i]._id.equals(e)) {
                            temp.push(result[i]);
                            continue;
                        }
                    }
                })
                res.jsonp(temp);
            });

        });
    });
    //Question.find({$and: [{tags: {$all: new_tags}}, {doctor: {$ne: null}}]}, function (err, doc) {
    //    //
    //    if (err) next(err);
    //    res.jsonp(doc);
    //    //
    //});

});
router.get('/vcode/forget', function (req, res, next) {

    Doctor.count({phone: req.query.phone}, function (err, count) {
        if (err) next(err);
        if (count == 0) {
            throw new Error('此号码没有注册');
        } else {
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
                if (po.code == "400") {
                    throw new Error(po.msg);
                } else {
                    req.session.phone = phone;
                    req.session.vcode = vcode;
                    res.jsonp('ok'); // auto convert to object
                }
            });
        }
    })


});
router.get('/getkey', function (req, res, next) {
    var rest = require('restler');
    var url = 'https://openapi.baidu.com/oauth/2.0/token?grant_type=client_credentials&client_id=nfN1CjSx3BAHQYRu8hNqGKx4&client_secret=8f22940fe7887171868178936ad0da0c';
    rest.get(url).on('complete', function (data) {
        //
        res.jsonp(data);
        //
    });
});
router.post('/vcode/register', function (req, res, next) {
    Doctor.count({phone: req.body.phone}, function (err, count) {
        if (err) next(err);
        if (count > 0) {
            throw new Error('此号码已经注册');
        } else {
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
                if (po.code == "400") {
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
            //
            var asyncTasks=[];
            //
            result.forEach(function(e){
                //
                asyncTasks.push(function(callback) {
                    async.parallel([
                        function(callback) {
                            Question.count({doctor: e._id}, function (err, doc) {
                                e._doc.acceptCount = doc;
                                callback();
                            })
                        },
                        function(callback){
                            Comment.count({doctor: e._id}, function (err, doc) {
                                e._doc.commentCount = doc;
                                callback();
                            })
                        }],function() {
                            callback();
                    });
                });
            });
            async.parallel(asyncTasks,function(){
                if (error) next(error);
                res.jsonp(result);
            })
            //

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
router.get('/doctor/comment',function(req,res,next){
    if(req.query.beginTime != null && req.query.endTime != null) {
        Comment.find(
            {
                $and: [{doctor: mongoose.Types.ObjectId(req.query.doctor)}, {
                    commentTime: {
                        $gte: new Date(req.query.beginTime),
                        $lte: new Date(req.query.endTime)
                    }
                }]
            }).sort({commentTime:1}).exec(
            function (err, doc) {
                if (err) next(err);
                res.jsonp(doc);

            });
    }else
    {
        Comment.find(

            {doctor: mongoose.Types.ObjectId(req.query.doctor)}).
        sort({commentTime:1}).exec(
            function (err, doc) {
                if (err) next(err);
                res.jsonp(doc);

            });
    }
});
router.get('/doctor/count',function(req,res,next){
    if(req.query.beginTime != null && req.query.endTime != null) {
        Question.find(
            {
                $and: [{doctor: mongoose.Types.ObjectId(req.query.doctor)}, {
                    answerTime: {
                        $gte: new Date(req.query.beginTime),
                        $lte: new Date(req.query.endTime)
                    }
                }]
            }).sort({answerTime:1}).exec(
            function (err, doc) {
                if (err) next(err);
                res.jsonp(doc);

            });
    }else
    {
        Question.find(

            {doctor: mongoose.Types.ObjectId(req.query.doctor)}).
        sort({answerTime:1}).exec(
            function (err, doc) {
                if (err) next(err);
                res.jsonp(doc);

            });
    }
});

router.get('/category/admin', function (req, res, next) {
    console.log("category/amdin")
    Category.find({}, function (err, result) {

        var asyncTasks=[];
        //
        result.forEach(function(e){
            //
            asyncTasks.push(function(callback){
                //
                e._doc.count = [];
                var asyncTasks1=[];
                e.child_depart.forEach(function (e1) {

                    // We don't actually execute the async action here
                    // We add a function containing it to an array of "tasks"
                    asyncTasks1.push(function (callback2) {
                        //
                        var obj = {category: e1, unacceptCount: 0, acceptCount: 0};
                        //
                        async.parallel([
                            function (callback3) {
                                console.time("acceptCount");
                                Question.count({$and: [{category: e1}, {doctor: {$ne: null}}]}, function (err, count) {
                                    if (err) callback2(err);
                                    obj.acceptCount = count;
                                    console.timeEnd("acceptCount");
                                    callback3();
                                })
                            },
                            function (callback4) {
                                console.time("unacceptCount");
                                Question.count({$and: [{category: e1}, {doctor: null}]}, function (err, count) {
                                    if (err) callback3(err);
                                    obj.unacceptCount = count;
                                    console.timeEnd("unacceptCount");
                                    callback4();
                                })
                            }], function (err) {
                            e._doc.count.push(obj);
                           // console.log(JSON.stringify(e._doc));
                            callback2(err);
                        });
                    });
                });
                async.parallel(asyncTasks1,function(){
                    callback();
                })
            })
        });
        async.parallel(asyncTasks,function(){
            if (err) next(err);
            res.jsonp(result);
        })

    });
});
router.get('/questions/acceptCount', function (req, res, next) {
    Question.count({$and: [{category: req.query.category}, {doctor: {$ne: null}}]}, function (err, count) {
        if (err) next(err);
        res.jsonp(count);
    })
});
router.get('/questions/unacceptCount', function (req, res, next) {
    Question.count({$and: [{category: req.query.category}, {doctor: null}]}, function (err, count) {
        if (err) next(err);
        res.jsonp(count);
    })
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


    Question.find().where('_id').in(req.query.ids == null ? [] : req.query.ids).populate('doctor').exec(function (error, doc) {
        if (error) next(error);
        res.jsonp(doc);
    });
    //Question.find({},function(err,result){
    //   var j=2;
    //});
});
router.post('/doctor/changepassword', function (req, res, next) {
    //
    Doctor.findOneAndUpdate({$and: [{_id: req.body._id}, {password: req.body.data.oldPassword}]}, {password: req.body.data.newPassword}, function (error, doc) {
        if (error) next(error);
        if (doc == null)
            throw new Error('请输入正确的原始密码');
        res.jsonp(doc);
    })
    //
});
router.get('/questions/id', function (req, res, next) {
    Question.findOne({_id: req.query._id}).populate('doctor').exec(function (err, doc) {
        if (err) next(err);
        res.jsonp(doc);
    });
})
router.get('/questions/unanswered', function (req, res, next) {

    console.time("dbsave");

    Question.find(
        {$and: [{doctor: null}, {random: {$near: [Math.random(), Math.random()]}}, {category: {$in: req.query.categorys == null ? [] : req.query.categorys}}]}).limit(10).exec(function (err, results) {
            if (err) next(err);
            res.jsonp(results);
            console.timeEnd("dbsave");
        });
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

    Question.find({$and: [{doctor: {$ne: null}}, {random: {$near: [Math.random(), Math.random()]}}, {category: {$in: req.query.categorys == null ? [] : req.query.categorys}}]}).populate('doctor').limit(10).exec(function (err, doc) {
        if (err) next(err);
        res.jsonp(doc);
    });

});
router.get('/questions/doctor', function (req, res, next) {
    console.time("dbsave");

    if (req.query.minAnswerTime == null) {

        Question.find({$and: [{doctor: req.query.doctor}, {category: {$in: req.query.categorys == null ? [] : req.query.categorys}}]}).populate('doctor').sort({answerTime: -1}).limit(10).exec(function (err, doc) {
            if (err) next(err);
            res.jsonp(doc);
            console.endTime("dbsave");
        });
    } else {
        Question.find({
            $and: [{doctor: req.query.doctor}, {answerTime: {$lt: req.query.minAnswerTime}},
                {category: {$in: req.query.categorys == null ? [] : req.query.categorys}}]
        }).
            populate('doctor').sort({answerTime: -1}).limit(10).exec(function (err, doc) {
                if (err) next(err);
                res.jsonp(doc);
                console.endTime("dbsave");
            });
    }

});
router.get('/comments/doctor', function (req, res, next) {
    if (req.query.minCommentTime == null) {

        Comment.find({doctor: req.query.doctor}).sort({commentTime: -1}).limit(20).exec(function (err, doc) {
            if (err) next(err);
            //
            var ids = [];
            var time = [];
            doc.forEach(function (e, i, r) {
                //
                var find = false;
                for (k = 0; k < ids.length; k++) {
                    if (e.question.equals(ids[k])) {
                        find = true;
                        continue;
                    }
                }
                if (find == false) {
                    ids.push(e.question);
                    time.push(e.commentTime);
                }
                //
            });
            Question.find({_id: {$in: ids}}).populate('doctor', 'name image').exec(function (err, result) {
                var temp = [];
                ids.forEach(function (ee, k, a) {
                    for (i = 0; i < result.length; i++) {
                        if (result[i]._id.equals(ee)) {
                            result[i]._doc.commentTime = time[k];
                            temp.push(result[i]);
                            continue;
                        }
                    }
                })
                res.jsonp(temp);
            });
            //
            //
            //
        });
    } else {
        Comment.find({
            $and: [{doctor: req.query.doctor}, {commentTime: {$lt: req.query.minCommentTime}}]
        }).sort({commentTime: -1}).limit(20).exec(function (err, doc) {
            if (err) next(err);
            //
            var ids = [];
            var time = [];
            doc.forEach(function (e, i, r) {
                //
                var find = false;
                for (k = 0; k < ids.length; k++) {
                    if (e.question.equals(ids[k])) {
                        find = true;
                        continue;
                    }
                }
                if (find == false) {
                    ids.push(e.question);
                    time.push(e.commentTime);
                }
                //
            });
            Question.find({_id: {$in: ids}}).populate('doctor', 'name image').exec(function (err, result) {

                var temp = [];
                ids.forEach(function (ee, k, a) {
                    for (i = 0; i < result.length; i++) {
                        if (result[i]._id.equals(ee)) {
                            result[i]._doc.commentTime = time[k];
                            temp.push(result[i]);
                            continue;
                        }
                    }
                })
                res.jsonp(temp);
            });
            //
            //
            //
        });
    }
})
router.get('/comments/question', function (req, res, next) {
    console.time("comment");
    Comment.find({question: req.query.question}).populate('question').populate('doctor').sort({commentTime: 1}).exec(function (err, doc) {
        if (err) next(err);
        res.jsonp(doc);
        console.timeEnd("comment");
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
    req.body.forEach(function (e, i, a) {
        //
        var tags = nodejieba.extract(e.question, 100);
        var new_tags = [];
        tags.forEach(function (e1, i1, a1) {
            new_tags.push(e1.substring(0, e1.lastIndexOf(':')));
        });
        //e.tags = new_tags;
        e.simhash = simhash(new_tags);
        //
    });
    Question.create(req.body, function (error, result) {

        if (error) next(error);
        res.jsonp(result.length);
    });
});
//
module.exports = router;
