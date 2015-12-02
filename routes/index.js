var express = require('express');
var router = express.Router();
var fs = require('fs');
var mongoose = require('mongoose');
var multiparty = require('multiparty');
var async = require('async');
var simhash = require('simhash')('md5');
var utf8 = require('utf8');

var db = mongoose.connect('mongodb://user1:hyg&1qaz2wsx@113.31.89.205/medicalWiki');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host: 'http://113.31.89.205:9200',
    log: 'trace'
});

//var nodejieba = require("nodejieba");
////nodejieba.load({
////    userDict: '../dict/user.dict'
////});
////var elasticsearch = require('elasticsearch');
////var client = new elasticsearch.Client({
////    host: 'huyugui.ddns.net:9200',
////    log: 'trace'
////});
//
//nodejieba.load({
//    userDict: '../dict/sougou.dict'
//});
require('../model/Comments');
require('../model/Doctors');
require('../model/Questions');
require('../model/Categories');
require('../model/Doctors');
require('../model/Versions');
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
            throw new Error("错误的手机号码或密码");
        else if (result[0].enable == "no") {
            throw new Error('你已经被禁止登录,请联系管理员');
        }
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
});
router.post('/versions/', function (req, res, next) {
    var v = new Version(req.query.version);
    v.save(function (error, doc) {
        if (err) next(err);
        res.jsonp(doc);
    })
});
router.get('/doctors/count', function (req, res, next) {
    Doctor.count({}, function (err, count) {
        if (err) next(err);
        res.jsonp(count);
    })
});

router.get('/doctors/id', function (req, res, next) {
    //

    Doctor.findOne({_id: req.query._id}, function (error, doc) {
        if (error) {
            throw new Error(error.message);
        }

        else if (doc == null) {
            throw  new Error('错误的医生id');
        }
        else if (doc.enable == "no") {
            throw new Error('你已经被禁止登录,请联系管理员');
        }
        res.jsonp(doc);


    });


    //
});
router.post('/vcode/forget', function (req, res, next) {
    //
    if (req.session.phone == req.body.phone && req.session.vcode == req.body.vcode) {
        //
        Doctor.findOneAndUpdate({phone: req.body.phone}, {password: req.body.password}, null, function (error, result) {
            if (error) {
                throw new Error(error.message);
            }
            res.jsonp(result);
        });
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
        });
        //
    } else {
        throw new Error('请输入正确的手机号或验证码');
    }
    //
});
router.get('/questions/search', function (req, res, next) {
    //
    var queryString;
    if (req.query.doctor != null)
        queryString = 'question:' + req.query.search +" and doctor:"+req.query.doctor ;
    else
        queryString = 'question:' + req.query.search;

    client.search({
        index: 'medicalwiki',
        type:'questions',
        q: queryString,
        size: 30
    }).then(function (resp) {
        var hits = resp;
        var doc = [];

        resp.hits.hits.forEach(function (e, i, a) {
            doc.push(mongoose.Types.ObjectId(e._id));
        });
        if (req.query.doctor == null) {
            Question.find({$and: [{"_id": {$in: doc}}, {doctor: {$ne: null}}]}).populate("doctor").exec(function (err, doc1) {
              var doc2=[];
              doc.forEach(function(e,i,a){
                  doc1.forEach(function(e1,i1,a1)
                      {
                          if(e1._doc._id.equals(e))
                          {
                              doc2.push(e1._doc);
                          }
                      }
                  )
              });
                res.jsonp(doc2);
            });
        } else {
            if (req.query.modifyType == 0) {
                Question.find({$and: [{"_id": {$in: doc}}, {doctor: mongoose.Types.ObjectId(req.query.doctor)},{numberOfModify:0}]}).populate("doctor").exec(function (err, doc1) {
                    var doc2=[];
                    doc.forEach(function(e,i,a){
                        doc1.forEach(function(e1,i1,a1)
                            {
                                if(e1._doc._id.equals(e))
                                {
                                    doc2.push(e1._doc);
                                }
                            }
                        )
                    });
                    res.jsonp(doc2);
                });
            } else {
                Question.find({$and: [{"_id": {$in: doc}}, {doctor: mongoose.Types.ObjectId(req.query.doctor)}, {numberOfModify: {$gt: 0}}]}).populate("doctor").exec(function (err, doc1) {
                    var doc2=[];
                    doc.forEach(function(e,i,a){
                        doc1.forEach(function(e1,i1,a1)
                            {
                                if(e1._doc._id.equals(e))
                                {
                                    doc2.push(e1._doc);
                                }
                            }
                        )
                    });
                    res.jsonp(doc2);
                });
            }
        }


    }, function (err) {
        if (err) next(err);
        //    res.jsonp(doc);
    });
    //var tags = nodejieba.extract(req.query.search, 100);
    //var new_tags = [];
    //tags.forEach(function (e1, i1, a1) {
    //    new_tags.push(e1.substring(0, e1.lastIndexOf(':')));
    //});
    ////
    //var hash = simhash(new_tags);
    //var o = {};
    ////
    //o.map = function () {
    //    var compareHash = function (r1, r2) {
    //        var result3 = [];
    //        r1.forEach(function (e, i, r) {
    //            result3.push(e ^ r2[i]);
    //        });
    //        var total = 0;
    //        result3.forEach(function (e, i, r) {
    //            total = total + e;
    //        });
    //        return total;
    //    }
    //    if (this.doctor != null) {
    //        var s = compareHash(hash, this.simhash);
    //        emit(this._id, s);
    //    }
    //}
    //o.reduce = function (key, values) {
    //    //
    //    return values[0];
    //    //
    //}
    ////o.limit = 10;
    //o.out = {replace: 'results'};
    //o.scope = {hash: hash};
    //
    //Question.mapReduce(o, function (err, model) {
    //
    //
    //    model.find().sort({value: 1}).limit(10).exec(function (err, data) {
    //        var ids = [];
    //        data.forEach(function (e, i, r) {
    //            //
    //            ids.push(e._id);
    //            //
    //        });
    //        Question.find({_id: {$in: ids}}).populate('doctor', 'name image').exec(function (err, result) {
    //            var temp = [];
    //            ids.forEach(function (e, i, a) {
    //                for (i = 0; i < result.length; i++) {
    //                    if (result[i]._id.equals(e)) {
    //                        temp.push(result[i]);
    //                        continue;
    //                    }
    //                }
    //            })
    //            res.jsonp(temp);
    //        });
    //
    //    });
    //});
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

            var rest = require('restler');
            var phone = req.query.phone;
            var time = Math.floor(Date.now() / 1000);
            var numbers = new Array(6);
            for (var i = 0; i < numbers.length; i++) {
                numbers[i] = randomIntInc(1, 10)
            }
            var vcode = utf8.encode("您的验证码:" + numbers + ",用于智能知识库重置密码");
            var signature = (crypto.createHash('md5').update(phone + ":" + vcode + ":" + time + ":" + "IIYI4N5UA3").digest('hex')).substring(0, 16);
            var url = 'http://iapi.iiyi.com/v1/other/sms/?mobile=' + phone + '&message=' + vcode + '&timestamp=' + time + '&signature=' + signature;
            rest.get(url).on('complete', function (data) {
                var po = JSON.parse(data);
                if (po.code == "400") {
                    throw new Error(po.msg);
                } else {
                    req.session.phone = phone;
                    req.session.vcode = numbers;
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

            function randomIntInc(low, high) {
                return Math.floor(Math.random() * (high - low + 1) + low);
            }

            var rest = require('restler');
            var phone = req.body.phone;
            var time = Math.floor(Date.now() / 1000);
            var numbers = "";
            for (var i = 0; i < 6; i++) {
                numbers = numbers + randomIntInc(1, 10)
            }

            var vcode = utf8.encode("您的验证码:" + numbers + ",用于智能知识库注册");
            var signature = (crypto.createHash('md5').update(phone + ":" + vcode + ":" + time + ":" + "IIYI4N5UA3").digest('hex')).substring(0, 16);
            var url = 'http://iapi.iiyi.com/v1/other/sms/?mobile=' + phone + '&message=' + vcode + '&timestamp=' + time + '&signature=' + signature;
            rest.get(url).on('complete', function (data) {
                var po = JSON.parse(data);
                if (po.code == "400") {
                    throw new Error(po.msg);
                }
                else {
                    req.session.phone = phone;
                    req.session.vcode = numbers;
                    res.jsonp('ok'); // auto convert to object
                }
            });
        }

    })
});
router.get('/questions/detail', function (req, res, next) {
    Question.findOne({_id: mongoose.Types.ObjectId(req.query._id)}, function (error1, doc1) {
        //
        var doc = "<p>" + doc1._doc.question + "</p>" + "<p>" + doc1._doc.answer + "</p>" + "<pr>";
        Doctor.populate(doc1._doc.comments, {path: 'doctor'}, function (error2, doc2) {
            //
            doc2.forEach(function (e, i, a) {
                doc += "<p>医生:" + e._doc.doctor._doc.name + "</p>" + "<p>时间" + e._doc.commentTime + '</p>' + '<p>评论内容' + e._doc.content + '</p>';


            });
            res.jsonp(doc);
            //
        });
        //
    }).populate('comments');
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
});
//router.get('/doctors/acceptcount',function(req,res,next){
//    //
//
//    Question.aggregate([{$match:{$and:[{answerTime:{$gte:new Date(req.query.beginDate)}},{answerTime:{$lte:new Date(req.query.endDate)}}]}},{$group:{_id:"$doctor",total:{$sum:1}}},{$sort:{registerTime:}}]
//    , function (err, doc) {
//        //
//            res.jsonp(doc);
//        //
//    })
//    //
//})
//router.get('/doctors/commentCount',function(req,res,next){
//
//})
router.get('/doctor/beenComment', function (req, res, next) {
    //
    Question.find(
        {
            $and: [{doctor: mongoose.Types.ObjectId(req.query.doctor)}, {
                answerTime: {
                    $gte: new Date(req.query.beginTime)
                }
            },
                {
                    answerTime: {
                        $lte: new Date(req.query.endTime)
                    }
                }]
        }).populate('comments').exec(function (err, doc) {
            //
            var result = [];
            doc.forEach(function (e, i, a) {
                e.comments.forEach(function (e1, i1, a1) {
                    result.push({
                        question: e.question,
                        answer: e.answer,
                        content: e1.content,
                        commentTime: e1.commentTime
                    })
                })
            });
            res.jsonp(result);
        });

});
//if (req.query.beginTime != null && req.query.endTime != null) {
//    Comment.find(
//        {
//            $and: [{doctor: mongoose.Types.ObjectId(req.query.doctor)}, {
//                commentTime: {
//                    $gte: new Date(req.query.beginTime),
//                    $lte: new Date(req.query.endTime)
//                }
//            }]
//        }).populate('question').sort({commentTime: 1}).exec(
//        function (err, doc) {
//            if (err) next(err);
//            res.jsonp(doc);
//
//        });
//} else {
//    Comment.find(
//        {doctor: mongoose.Types.ObjectId(req.query.doctor)}).populate('question').
//        sort({commentTime: 1}).exec(
//        function (err, doc) {
//            if (err) next(err);
//            res.jsonp(doc);
//
//        });
//}

//
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
            var asyncTasks = [];
            //
            result.forEach(function (e) {
                //
                asyncTasks.push(function (callback) {
                    async.parallel([
                        function (callback) {
                            Question.count({$and: [{doctor: e._id}, {answerTime: {$gte: new Date(req.query.beginAnswerTime)}}, {answerTime: {$lte: new Date(req.query.endAnswerTime)}}]}, function (err, doc) {
                                e._doc.acceptCount = doc;
                                callback();
                            })
                        },
                        function (callback) {

                            //Question.find({$and:[{doctor: e._id},{answerTime:{$gte:new Date(req.query.beginBeenCommentTime)}},{answerTime:{$lte:new Date(req.query.endBeenCommentTime)}}]}, function (err, doc) {
                            //
                            //    doc.forEach(function(ee,i,a){
                            //         e._doc.beenCommentCount += ee.comments.length ;
                            //     });
                            //    console.log("fininshed");
                            //    callback();
                            //})
                            Question.aggregate({
                                    $project: {
                                        doctor: 1,
                                        answerTime: 1,
                                        commentNumber: {$size: {"$ifNull": [ "$comments", [] ] }}
                                    }
                                }, {$match: {$and: [{doctor: mongoose.Types.ObjectId(e._id)}, {answerTime: {$gte: new Date(req.query.beginBeenCommentTime)}}, {answerTime: {$lte: new Date(req.query.endBeenCommentTime)}}]}}, {
                                    $group: {
                                        _id: "$doctor",
                                        total: {$sum: "$commentNumber"}
                                    }
                                }

                                , function (error, doc) {
                                    e._doc.beenCommentCount = 0;
                                    if (doc.length > 0)
                                        e._doc.beenCommentCount = doc[0].total;
                                    callback();
                                })

                        },
                        function (callback) {
                            Comment.count({$and: [{doctor: e._id}, {commentTime: {$gte: new Date(req.query.beginCommentTime)}}, {commentTime: {$lte: new Date(req.query.endCommentTime)}}]}, function (err, doc) {
                                e._doc.commentCount = doc;
                                callback();
                            })
                        }], function () {
                        callback();
                    });
                });
            });
            async.parallel(asyncTasks, function () {
                if (error) next(error);
                res.jsonp(result);
            })

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
router.get('/doctor/comment', function (req, res, next) {

    Comment.find(
        {
            $and: [{doctor: mongoose.Types.ObjectId(req.query.doctor)}, {
                commentTime: {
                    $gte: new Date(req.query.beginTime)
                }
            },
                {
                    commentTime: {
                        $lte: new Date(req.query.endTime)
                    }
                }]
        }).populate('question').sort({commentTime: 1}).exec(
        function (err, doc) {
            if (err) next(err);
            res.jsonp(doc);

        });

});
router.get('/doctor/count', function (req, res, next) {
    if (req.query.beginTime != null && req.query.endTime != null) {
        Question.find(
            {
                $and: [{doctor: mongoose.Types.ObjectId(req.query.doctor)}, {
                    answerTime: {
                        $gte: new Date(req.query.beginTime),
                        $lte: new Date(req.query.endTime)
                    }
                }]
            }).exec(
            function (err, doc) {
                if (err) next(err);
                res.jsonp(doc);

            });
    } else {
        Question.find(
            {doctor: mongoose.Types.ObjectId(req.query.doctor)})
            .exec(
            function (err, doc) {
                if (err) next(err);
                res.jsonp(doc);

            });
    }
});

router.get('/category/admin', function (req, res, next) {

    Category.find({}, function (err, result) {

        var asyncTasks = [];
        //
        result.forEach(function (e) {
            //
            asyncTasks.push(function (callback) {
                //
                e._doc.count = [];
                var asyncTasks1 = [];
                e.child_depart.forEach(function (e1) {

                    // We don't actually execute the async action here
                    // We add a function containing it to an array of "tasks"
                    asyncTasks1.push(function (callback2) {
                        //
                        var obj = {category: e1, unacceptCount: 0, acceptCount: 0};
                        //
                        async.parallel([
                            function (callback3) {

                                Question.count({$and: [{category: e1}, {doctor: {$ne: null}}]}, function (err, count) {
                                    if (err) callback2(err);
                                    obj.acceptCount = count;

                                    callback3();
                                })
                            },
                            function (callback4) {

                                Question.count({$and: [{category: e1}, {doctor: null}]}, function (err, count) {
                                    if (err) callback3(err);
                                    obj.unacceptCount = count;

                                    callback4();
                                })
                            }], function (err) {
                            e._doc.count.push(obj);
                            // console.log(JSON.stringify(e._doc));
                            callback2(err);
                        });
                    });
                });
                async.parallel(asyncTasks1, function () {
                    callback();
                })
            })
        });
        async.parallel(asyncTasks, function () {
            if (err) next(err);
            res.jsonp(result);
        })

    });
});
router.get('/questions/statics', function (req, res, next) {
    var doc = {questionCount: 0, commentCount: 0};
    async.parallel([function (callback) {
        Question.count({doctor: mongoose.Types.ObjectId(req.query.docotor)}).exec(function (err, res) {
            doc.questionCount = res;
            callback();
        })
    }, function (callback) {
        Comment.count({doctor: mongoose.Types.ObjectId(req.query.docotor)}).exec(function (err, res) {
            doc.commentCount = res;
            callback();
        })
    },function(callback){
        Question.aggregate({$match:{doctor:mongoose.Types.ObjectId(req.query.docotor)}},{$group:{_id:{month:{$month:"$answerTime"},year:{$year:"$answerTime"}},total:{$sum:1}}},function(err,doc1){
            //
            var TodayDate = new Date();
            var d = TodayDate.getDay();
            var m = TodayDate.getMonth();
            var y = TodayDate.getFullYear();
            doc1.forEach(function(e,i,a){

                if(e._id.month == m && e._id.year == y)
                {
                    doc.monthQuesetionCount = e.total;
                    callback();
                }

            });
            //
        })
    },function(callback){
        Comment.aggregate({$match:{doctor:mongoose.Types.ObjectId(req.query.docotor)}},{$group:{_id:{month:{$month:"$commentTime"},year:{$year:"$commentTime"}},total:{$sum:1}}},function(err,doc1){
            var TodayDate = new Date();
            var d = TodayDate.getDay();
            var m = TodayDate.getMonth();
            var y = TodayDate.getFullYear();
            doc1.forEach(function(e,i,a){

                if(e._id.month == m && e._id.year == y)
                {
                    doc.monthCommentCount = e.total;
                    callback();
                }

            });
        })
    }], function () {
        res.jsonp(doc);
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
    if (req.query.doctor != "") {
        Doctor.findOne({trueName: req.query.doctor}, function (err, doc) {
            Question.count({doctor: doc._doc._id}, function (err, count) {
                if (err) next(err);
                res.jsonp(count);
            })
        });
    } else {
        Question.count({category: {$in: req.query.categorys == null ? [] : req.query.categorys}}, function (err, count) {
            if (err) next(err);
            res.jsonp(count);
        })
    }
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
    });
    //
});
router.get('/questions/id', function (req, res, next) {
    Question.findOne({_id: req.query._id}).populate('doctor').exec(function (err, doc) {
        if (err) next(err);
        res.jsonp(doc);
    });
});
router.get('/questions/unanswered', function (req, res, next) {


    Question.find(
        {
            $and: [{doctor: null}, {
                random: {
                    $near: [Math.random(), Math.random()],
                    $maxDistance: 0.1
                }
            }, {category: {$in: req.query.categorys == null ? [] : req.query.categorys}}]
        }).limit(10).exec(function (err, results) {
            if (err) next(err);
            res.jsonp(results);

        });
});
router.get('/questions/', function (req, res, next) {
    //
    if (req.query.doctor != "") {
        Doctor.findOne({trueName: req.query.doctor}, function (err, doc) {
            Question.paginate(
                {doctor: doc._doc._id},
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

                    res.jsonp(result);

                }
            );
        });

    } else
        Question.paginate(
            {category: {$in: req.query.categorys == null ? [] : req.query.categorys}},
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

    if (req.query.startDate != null || req.query.endDate != null) {
        Question.find({
            $and: [{doctor: {$ne: null}}, {
                answerTime: {
                    $gt: req.query.startDate == null ? '1900-01-01' : req.query.startDate
                }
            }, {answerTime: {$lt: req.query.endDate == null ? '9999-12-30' : req.query.endDate}}, {category: {$in: req.query.categorys == null ? [] : req.query.categorys}}]
        }).populate('doctor').limit(50).exec(function (err, doc) {
            if (err) next(err);
            res.jsonp(doc);
        });
    }
    else {
        Question.find({
            $and: [{doctor: {$ne: null}}, {
                random: {
                    $near: [Math.random(), Math.random()],
                    $maxDistance: 0.1
                }
            }, {category: {$in: req.query.categorys == null ? [] : req.query.categorys}}]
        }).populate('doctor').limit(10).exec(function (err, doc) {
            if (err) next(err);
            res.jsonp(doc);
        });
    }

});
router.get('/questions/doctor/accept', function (req, res, next) {


    if (req.query.startDate != null || req.query.endDate != null) {

        Question.find({
            $and: [{doctor: req.query.doctor}, {
                answerTime: {
                    $gt: req.query.startDate == null ? '1900-01-01' : req.query.startDate
                }
            }, {answerTime: {$lt: req.query.endDate == null ? '9999-12-30' : req.query.endDate}}, {numberOfModify: {$eq: 0}}]
        }).populate('doctor').sort({
            unReadCommentNumber: -1,
            answerTime: -1
        }).limit(30).exec(function (err, doc) {
            if (err) next(err);
            res.jsonp(doc);

        });

    } else {
        Question.find({
            $and: [{doctor: req.query.doctor}, {numberOfModify:0}]
        }).populate('doctor').sort({
            unReadCommentNumber: -1,
            answerTime: -1
        }).sort({answerTime: -1}).limit(30).exec(function (err, doc) {
            if (err) next(err);
            res.jsonp(doc);

        });
    }

});
router.get('/questions/doctor/modify', function (req, res, next) {


    if (req.query.startDate != null || req.query.endDate != null) {

        Question.find({
            $and: [{doctor: req.query.doctor}, {
                modifyTime: {
                    $gt: req.query.startDate == null ? '1900-01-01' : req.query.startDate
                }
            }, {modifyTime: {$lt: req.query.endDate == null ? '9999-12-30' : req.query.endDate}}, {numberOfModify: {$gt: 0}}]
        }).populate('doctor').sort({
            unReadCommentNumber: -1,
            modifyTime: -1
        }).limit(30).exec(function (err, doc) {
            if (err) next(err);
            res.jsonp(doc);
        });

    } else {
        Question.find({
            $and: [{doctor: req.query.doctor}, {numberOfModify: {$gt: 0}}]
        }).populate('doctor').sort({
            unReadCommentNumber: -1,
            modifyTime: -1
        }).sort({modifyTime: -1}).limit(30).exec(function (err, doc) {
            if (err) next(err);
            res.jsonp(doc);

        });
    }

});
router.get('/questions/doctor', function (req, res, next) {


    if (req.query.minAnswerTime == null && req.query.maxAnswerTime == null) {

        Question.find({$and: [{doctor: req.query.doctor}]}).populate('doctor').sort({answerTime: -1}).limit(10).exec(function (err, doc) {
            if (err) next(err);
            res.jsonp(doc);

        });
    } else if ((req.query.minAnswerTime != null)) {
        Question.find({
            $and: [{doctor: req.query.doctor}, {answerTime: {$lt: req.query.minAnswerTime}}
            ]
        }).
            populate('doctor').sort({answerTime: -1}).limit(10).exec(function (err, doc) {
                if (err) next(err);
                res.jsonp(doc);

            });
    }
    else if ((req.query.maxAnswerTime != null)) {
        Question.find({
            $and: [{doctor: req.query.doctor}, {answerTime: {$gt: req.query.maxAnswerTime}}
            ]
        }).
            populate('doctor').sort({answerTime: -1}).limit(10).exec(function (err, doc) {
                if (err) next(err);
                res.jsonp(doc);

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

                        }
                    }
                });
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

                        }
                    }
                });
                res.jsonp(temp);
            });
            //
            //
            //
        });
    }
});
router.post('/questions/compare',function(req,res,next){
    //
    var questions=[];
    var asyncTasks = [];
    //
    req.body.forEach(function (e) {
        //
        asyncTasks.push(function (callback) {
            Question.findOne({question: e.question}).exec(function(err,doc){
                if(doc == null)
                {
                    //
                    console.log("create");
                    Question.create(e, function (error, result) {
                        callback();

                    });
                    //
                }else
                {
                    console.log("finish");
                    callback();
                }

            });
        });

    });
    async.parallel(asyncTasks, function (error) {
        if (error) next(error);
        console.log("we finished");
        res.jsonp("finish");
    });


    //
});
router.get('/comments/question', function (req, res, next) {

    Comment.find({question: req.query.question}).populate('question').populate('doctor').sort({commentTime: 1}).exec(function (err, doc) {
        if (err) next(err);
        res.jsonp(doc);

    });
});

router.post('/comments', function (req, res, next) {
    Comment.create(req.body, function (error, comment) {
        if (error) next(error);
        Question.findOneAndUpdate({_id: comment.question}, {
            $push: {comments: {_id: comment._id}},
            $inc: {unReadCommentNumber: 1}
        }, function (error, doc) {

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
    //req.body.forEach(function (e, i, a) {
    //    //
    //    var tags = nodejieba.extract(e.question, 100);
    //    var new_tags = [];
    //    tags.forEach(function (e1, i1, a1) {
    //        new_tags.push(e1.substring(0, e1.lastIndexOf(':')));
    //    });
    //    //e.tags = new_tags;
    //    e.simhash = simhash(new_tags);
    //    //
    //});
    Question.create(req.body, function (error, result) {

        if (error) next(error);
        res.jsonp(result.length);
    });
});
//
module.exports = router;
