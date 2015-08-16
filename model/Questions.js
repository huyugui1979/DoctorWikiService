/**
 * Created by yuguihu on 15/7/5.
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var random = require('mongoose-random');
var QuestionSchema = new mongoose.Schema(
    {
        category:String,
        question: String,
        createTime:{ type: Date, default: Date.now },
        answerTime:  Date,
        tags: [String],
        answer:String,
        comments:[{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}],
        doctor:{type: mongoose.Schema.Types.ObjectId, ref: 'Doctor'},
        likeNumber:{ type: Number, default: 0 },
        simhash:[Number]

    });
QuestionSchema.plugin(mongoosePaginate);
QuestionSchema.plugin(random, { path: 'r' }); // by default `path` is `random`. It's used internally to store a random value on each doc.
mongoose.model('Question', QuestionSchema);
