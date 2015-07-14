/**
 * Created by yuguihu on 15/7/5.
 */
/**
 * Created by yuguihu on 15/7/5.
 */
var mongoose = require('mongoose');

var DoctorSchema = new mongoose.Schema(
    {
        title: String,
        phone:String,
        password:String
    });
mongoose.model('Doctor', DoctorSchema);