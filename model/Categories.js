/**
 * Created by yuguihu on 15/7/14.
 */
var mongoose = require('mongoose');

var CategorySchema = new mongoose.Schema(
    {
        title: String,
        child_depart:[String]
    });
mongoose.model('Category', CategorySchema);