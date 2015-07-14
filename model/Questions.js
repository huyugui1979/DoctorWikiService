/**
 * Created by yuguihu on 15/7/5.
 */
var mongoose = require('mongoose');

var QuestionSchema = new mongoose.Schema(
    {
        tag:[String],
        title: String,
        category:String,
        answer:String,
        doctor: {type: mongoose.Schema.Types.ObjectId, ref: 'Doctor'},
        answertime:{ type: Date, default: Date.now }
    });
mongoose.model('Question', QuestionSchema);
