/**
 * Created by yuguihu on 15/7/14.
 */
var mongoose = require('mongoose');

var AuditSchema = new mongoose.Schema(
    {
        doctor: {type: mongoose.Schema.Types.ObjectId, ref: 'Doctor'},
        answer: {type: mongoose.Schema.Types.ObjectId, ref: 'Answer'},
        auditTime:{ type: Date, default: Date.now },
        status:String
    });
mongoose.model('Audit', AuditSchema);