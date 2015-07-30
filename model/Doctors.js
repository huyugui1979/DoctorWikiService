/**
 * Created by yuguihu on 15/7/5.
 */
/**
 * Created by yuguihu on 15/7/5.
 */
var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var DoctorSchema = new mongoose.Schema(
    {
        name: String,
        phone:String,
        password:String,
        sex:String,
        selected:[String],
        registerTime:Date,
        image:String
    });
DoctorSchema.plugin(mongoosePaginate);
mongoose.model('Doctor', DoctorSchema);