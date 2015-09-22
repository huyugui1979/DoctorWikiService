/**
 * Created by yuguihu on 15/9/20.
 */
var mongoose = require('mongoose');

var  VersionSchema = new mongoose.Schema(
    {
       currentVersion:String,
        androidUpdateUrl:String,
        iosUpdateUrl:String
    });
mongoose.model('Version', VersionSchema);