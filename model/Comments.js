/**
 * Created by yuguihu on 15/7/21.
 */
var mongoose = require('mongoose');

var  CommentSchema = new mongoose.Schema(
    {
        doctor: {type: mongoose.Schema.Types.ObjectId, ref: 'Doctor'},
        question:{type: mongoose.Schema.Types.ObjectId, ref: 'Question'},
        content:String,
        commentTime:{ type: Date, default: Date.now }
    });
mongoose.model('Comment', CommentSchema);