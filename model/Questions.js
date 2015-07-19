/**
 * Created by yuguihu on 15/7/5.
 */
var mongoose = require('mongoose');

var QuestionSchema = new mongoose.Schema(
    {
        tag:[String],
        question: String,
        questionTime:{ type: Date, default: Date.now },
        status:String
    });
mongoose.model('Question', QuestionSchema);
