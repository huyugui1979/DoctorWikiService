/**
 * Created by yuguihu on 15/7/5.
 */
var mongoose = require('mongoose');

var mongoosePaginate = require('mongoose-paginate');
var random = require('mongoose-random');
var QuestionSchema = new mongoose.Schema(
    {
        tag:String,
        question: String,
        createTime:{ type: Date, default: Date.now },
        answerTime:  Date,
        answer:String,
        comments:[{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}],
        doctor:{type: mongoose.Schema.Types.ObjectId, ref: 'Doctor'}
    });
QuestionSchema.plugin(mongoosePaginate);
QuestionSchema.plugin(random, { path: 'r' }); // by default `path` is `random`. It's used internally to store a random value on each doc.

mongoose.model('Question', QuestionSchema);
