var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/medicalWiki');

require('../model/Doctors');
require('../model/Questions');
require('../model/Categories');
require('../model/Answers');
require('../model/Doctors');
require('../model/Audits');
var Doctor = mongoose.model('Doctor');
var Question = mongoose.model('Question');
var Category = mongoose.model('Category');
var Answer = mongoose.model('Answer');
var Audit  = mongoose.model('Audit');

//Question.create(
//{"question":"支气管扩张最有意义的体征是",tag:["普通内科"]},
//{"question":"肺结核最严重的类型是",tag:["普通内科"]},
//{"question":"肺结核最常见的类型是",tag:["普通内科"]},
//{"question":"慢性阻塞性肺气肿最早的功能改变是",tag:["普通内科"]},
//{"question":"支气管哮喘重症最可能的",tag:["普通内科"]},
//{"question":"预防及治疗支气管哮喘最有效的要药物是",tag:["普通内科"]},
//{"question":"预防过敏性支气管哮喘的首选药物是",tag:["普通内科"]},
//{"question":"肺心病的首要死因：肺性脑病。最常见的酸碱失衡是",tag:["普通内科"]},
//{"question":"急性呼衰最基本，最重要的治疗措施是",tag:["普通内科"]},
//{"question":"心衰最常用的药物是",tag:["普通内科"]},
//{"question":"慢性左心衰最早出现",tag:["普通内科"]},
//{"question":"心衰诱发因素最常见为",tag:["普通内科"]},
//{"question":"洋地黄最多见的心律失常是室早二联律。最早表现",tag:["普通内科"]},
//{"question":"临床上最常见的心律失常是",tag:["普通内科"]},
//{"question":"终止房扑最好的方法是",tag:["普通内科"]},
//{"question":"下壁心梗最易发生",tag:["普通内科"]},
//{"question":"急性心梗引发的心律失常最多见为",tag:["普通内科"]},
//{"question":"室性心动过速无动力学障碍首选",tag:["普通内科"]},
//{"question":"二尖瓣狭窄检查最可靠的方法",tag:["普通内科"]},
//{"question":"二尖瓣关闭不全检查最可靠的方法",tag:["普通内科"]},function (err, jellybean, snickers) {
//      j=2;
//    });
//var t = new Test({content:[{title:"abc",type:"abc",file:"abc"},{title:"cde",type:"cde",file:"cde"}]});
//t.save(function(err,res){
//  j=2;
//});
//
//Answer.remove();
//Question.find().exec(function (err,result) {
//  result.forEach(function(e,i,r){
//        Doctor.find().exec(function(err1,result1){
//          result1.forEach(function(e1,i1,r1){
//            var an= new Answer({doctor:e1._id,question:e._id,status:"未知"});
//            console.log(an);
//            an.save();
//          });
//        })
//  });
//});
//
//获取医生
router.get('/doctor',function(req,res,next){
  //
  Doctor.find(req.query,function(err,result){
    //未命名文件夹 2
    if(err) next(err);
    res.jsonp(result);
    //
  });
  //
});
router.post('/audit',function(req,res,next){
  //
  var audio = new Audit(req.body);
  audio.save(function(error,result){
    //
    if(error) next(error);
      res.jsonp(result);

    //
  });
  //
});
router.get('/history',function(req,res,next){
  if(req.query.maxDate != null)
  {
    Answer.find().where('doctor').equals(req.query.doctor).where('answerTime').gt(req.query.maxDate).populate('doctor').populate('question').sort({'answerTime':-1}).limit(1).exec(function(err,result){
      //
      if(err) next(err);
      res.jsonp(result);
      //
    });
  }
  //else if(req.query.maxDate == null)
  //{
  //  Answer.find().where('_id').nin(ids).populate('doctor').populate('question').sort({'answerTime':-1}).limit(1).exec(function (error, answers) {
  //    console.log("answers:"+answers);
  //    res.jsonp(answers);
  //  })
  //}
  else if(req.query.minDate != null)
  {
    //
    Answer.find().where('doctor').equals(req.query.doctor).where('answerTime').lt(req.query.minDate).populate('question').populate('doctor').sort({'answerTime':-1}).limit(1).exec(function(err,result){
      //
      if(err) next(err);
      res.jsonp(result);
      //
    });
    //
  }else
  {
    Answer.find().where('doctor').equals(req.query.doctor).populate('doctor').populate('question').sort({'answerTime':-1}).limit(1).exec(function(err,result){
      //
      if(err) next(err);
      res.jsonp(result);
      //
    });
  }

});
//注册一个医生
router.post('/doctor',function(req,res,next){
  //
  Doctor.create(req.body,function(error,result){
    if(error) next(error);
    res.jsonp(result);
  })
  //
})
//获取医生曾经回答过的问题
router.get('/answer',function(req,res,next){
  //

  //
})
//增加一条审核
router.post('/audit',function(req,res,next){
  //
  var audit = new Audit(req.body);
  audit.save(function(error,result){
    //
    if(error) next(error);
    res.jsonp(result);
    //
  })
  //
});
router.get('/audit',function(req,res,next){
    Audit.find().where('doctor').equals(req.query.doctor).select('answer').exec(function(error,result){
    var ids = [];
    result.forEach(function(e,i,r){
      ids.push(e.answer);
    })
      console.log("ids:"+ids);
    if(req.query.maxDate != null) {
      Answer.find().where('_id').nin(ids).where('answerTime').gt(req.query.maxDate).where('status').equals('审核中').populate('doctor').populate('question').sort({'answerTime':-1}).limit(1).exec(function (error, answers) {
        console.log("answers1:"+answers);
        res.jsonp(answers);
      })
    }
    //else if(req.query.maxDate == null)
    //{
    //  Answer.find().where('_id').nin(ids).where('status').equals('审核中').populate('doctor').populate('question').sort({'answerTime':-1}).limit(1).exec(function (error, answers) {
    //    console.log("answers2:"+answers);
    //    res.jsonp(answers);
    //  })
    //}
    else if(req.query.minDate != null)
    {
      //
      Answer.find().where('_id').nin(ids).where('answerTime').lt(req.query.minDate).where('status').equals('审核中').populate('question').populate('doctor').sort({'answerTime':-1}).limit(1).exec(function(err,result){
        //
        if(err) next(err);
        res.jsonp(result);
        //
      });
      //
    }else
    {
      Answer.find().where('_id').nin(ids).where('status').equals('审核中').populate('doctor').populate('question').sort({'answerTime':-1}).limit(1).exec(function(err,result){
        //
        if(err) next(err);
        res.jsonp(result);
        //
      });
    }

  })

});
//增加一条回答
router.post('/answer', function (req,res,next) {
  //
  var a = new Answer(req.body);
  a.save(function(err,result){
    if(err) next(err);
    res.jsonp(result);
  });
  //
});

//获取类别
router.get('/category',function(req,res,next){
  //
  Category.find({},function(err,result){
    if(err) next(err);
    res.jsonp(result);
  });
  //
});

router.get('/questions',function(req,res,next){
  //

  //随机取末回答的最多20条记录,但要进行查询是否已经回答，否则跳过
  //
  Answer.find({}).where('doctor').equals(req.query.doctor).select('question')
      .exec(function(err,result){
        console.log(result);
        if(err) next(err);
       var ids = [];
        result.forEach(function(e,i,r){
          ids.push(e.question);
        })
       Question.find().where('_id').nin(ids).where('tag').in(req.query.tag).limit(1).exec(function(err,questions) {
         console.log(result);
         if (err) next(err)
         res.jsonp(questions);
       });
    //
  });

});
router.post('/questions',function(req,res,next){
  var q = new Question(req.body);
  q.save();
});
module.exports = router;
