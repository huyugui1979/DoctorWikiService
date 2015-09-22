/**
 * Created by yuguihu on 15/7/5.
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
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
        simhash:[Number],
        random:[Number],
        collectionNumber:{ type: Number, default: 0 }
    });
QuestionSchema.plugin(mongoosePaginate);
mongoose.model('Question', QuestionSchema);
