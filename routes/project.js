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
        let sql = `SELECT project.id as pid, title, description, creator FROM project_member join project on project_member.projectid = project.id
                    WHERE memberid = ?;`
        connection.query(sql, idnum, function (error, results) {
            if(error){
                console.log(error)
            }
            else {
                res.render('main/projects/projectmgmt', {result1: results, name: req.session.user, id:idnum});
            }
        });
    }else{
        res.redirect('login')
    }
});

router.get('/projectdetail', function(req, res, next) {
    let idnum = req.session.idn
    req.session.pid = req.query.pid
    let pid = req.session.pid
    if(req.session.user){
        let sql = `SELECT * FROM finance.project where id = ?;
                SELECT * FROM finance.project_task where projectid = ?;
                SELECT project_member.memberid as idnum, account.id as userid, account.name as name FROM finance.project_member JOIN nodedb.account 
                ON project_member.memberid = account.number where projectid = ?;`
        connection.query(sql, [pid, pid, pid] ,function (error, results) {
            if(error){
                console.log(error)
            }
            else {
                console.log(results)
                res.render('main/projects/projectdetail', {project: results[0][0], tasks:results[1], pmember: results[2], name: req.session.user, id: idnum});
            }
        });
    }else{
        res.redirect('login')
    }
});

router.get('/projectaddtask', function(req, res, next) {
    if(req.session.user){
        res.render('main/projects/projectaddtask',{name:req.session.user});
    }else{
        res.redirect('login')
    }
});
router.post('/projectaddtask', function(req, res, next) {
    let rb = req.body
    if(req.session.user){
        let sql = "INSERT INTO finance.project_task(projectid, tasktitle, creator, duedate, detail)VALUES(?,?,?,?,?);"
        let params = [req.session.pid, rb.tasktitle, req.session.idn, rb.duedate, rb.detail];
        console.log(params);
        connection.query(sql,params,function (err, results, fields) {
            if(err){
                console.log(err);
            }else{
                res.redirect('/projectdetail?pid='+req.session.pid);
            }
        });
    }else{
        res.redirect('login')
    }
});


router.get('/projectadd', function (req, res,next){
    if(req.session.user){
        res.render('main/compara/underconstruction',{name:req.session.user});
    }else{
        res.redirect('login')
    }
})


router.get('/analysis', function (req, res,next){
    if(req.session.user){
        res.render('main/compara/underconstruction',{name:req.session.user});
    }else{
        res.redirect('login')
    }
})


module.exports = router;