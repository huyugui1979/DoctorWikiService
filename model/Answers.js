/**
 * Created by yuguihu on 15/7/14.
 */
var mongoose = require('mongoose');

var  AnswerSchema = new mongoose.Schema(
    {
        doctor: {type: mongoose.Schema.Types.ObjectId, ref: 'Doctor'},
        question:{type: mongoose.Schema.Types.ObjectId, ref: 'Question'},
        answer:String,
        status:String,
        answerTime:{ type: Date, default: Date.now }
    });
mongoose.model('Answer', AnswerSchema);