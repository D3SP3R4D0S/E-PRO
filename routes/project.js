const express = require('express');
const router = express.Router();
const mysql      = require('./config/mysql.js')();
const connection = mysql.init();

connection.connect(function(err){
    if(err) {                                     // or restarting (takes a while sometimes).
        console.log('error when connecting to db:', err);
        setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }
});
connection.close

router.get('/projects', function(req, res, next) {
    let idnum = req.session.idn
    if(req.session.user){
        let sql = `SELECT title, description FROM project_member join project on project_member.projectid = project.id
                    WHERE memberid = ?;`
        connection.query(sql, idnum, function (error, results) {
            if(error){
                console.log(error)
            }
            else {
                res.render('main/projects/projectmgmt', {result1: results, name: req.session.user});
            }
        });
    }else{
        res.redirect('login')
    }
});

router.get('/projects', function(req, res, next) {
    let idnum = req.session.idn
    if(req.session.user){
        let sql = `SELECT title, description FROM project_member join project on project_member.projectid = project.id
                    WHERE memberid = ?;`
        connection.query(sql, idnum, function (error, results) {
            if(error){
                console.log(error)
            }
            else {
                res.render('main/projects/projectmgmt', {result1: results, name: req.session.user});
            }
        });
    }else{
        res.redirect('test')
    }
});

router.get('/analysis', function (req, res,next){
    if(req.session.user){
        res.render('main/compara/underconstruction',{name:req.session.user});
    }else{
        res.redirect('login')
    }
})


module.exports = router;