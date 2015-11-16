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
        trueName:String,
        phone:String,
        age:Number,
        password:String,
        sex:String,
        selected:[String],
        registerTime:Date,
        collections:[{type: mongoose.Schema.Types.ObjectId, ref: 'Question'}],
        image:String,
        enable:String,

    });
DoctorSchema.plugin(mongoosePaginate);
mongoose.model('Doctor', DoctorSchema);