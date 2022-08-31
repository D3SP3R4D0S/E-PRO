const express = require('express');
const router = express.Router();
const mysql      = require('./config/mysql.js')();
const connection = mysql.init();
const knex = require('./config/knex.js');
const request = require('request')

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
        let sql = `SELECT project.id as pid, title, description, created, creator FROM project_member join project on project_member.projectid = project.id
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
router.get('/projectadd', function(req, res, next) {
    if(req.session.user){
        res.render('main/projects/projectadd',{csrfToken:req.csrfToken(),name:req.session.user});
    }else{
        res.redirect('login')
    }
});

router.post('/projectadd', function(req, res, next) {
    let rb = req.body
    if(req.session.user){
        let sql = "INSERT INTO finance.project(title, description, creator)VALUES(?,?,?);"
        let params = [rb.title, rb.description, req.session.idn];
        connection.query(sql,params,function (err, results, fields) {
            if(err){
                console.log(err);
            }else{
                connection.query("SELECT LAST_INSERT_ID() as id;", function (err, results, fields){
                    if(err){
                        console.log(err);
                    }else{
                        let pid = results[0].id
                        let sql = "INSERT INTO finance.project_member (projectid, memberid) VALUES (?,?);"
                        connection.query(sql,[pid,req.session.idn], function (err, results, fields) {
                            if(err){
                                console.log(err);
                            }else{
                                res.redirect('/projects');
                            }
                        });
                    }
                })
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
    if (req.session.user) {
        let sql = 'SELECT * FROM finance.project_member where projectid = ? and memberid = ?'
        connection.query(sql, [pid, idnum] ,function (error, results) {
            if(error){
                console.log(error)
            }
            else {
                if(results[0]) {

                    let sql = `SELECT * FROM finance.project where id = ?;
                    SELECT * FROM finance.project_task where projectid = ?;
                    SELECT project_member.memberid as idnum, account.id as userid, account.name as name 
                    FROM finance.project_member JOIN nodedb.account 
                    ON project_member.memberid = account.number where projectid = ?;
                    SELECT * FROM finance.project_fundreq where projectid = ?;`
                    connection.query(sql, [pid, pid, pid, pid], function (error, results) {
                        if (error) {
                            console.log(error)
                        } else {
                            res.render('main/projects/projectdetail', {
                                project: results[0][0],
                                tasks: results[1],
                                pmember: results[2],
                                fundreq: results[3],
                                name: req.session.user, id: idnum
                            });
                        }
                    });

                }else{
                    res.redirect('/projects');
                }
            }
        });
    } else {
        res.redirect('login')
    }
});

router.get('/projectaddtask', function(req, res, next) {
    if(req.session.user){
        res.render('main/projects/projectaddtask',{csrfToken:req.csrfToken(),name:req.session.user});
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

router.get('/projecttaskdetail', function(req, res,next){
    let taskid = req.query.taskid
    req.session.tid = taskid
    let pid = req.session.pid
    if(req.session.user){
        let sql = `SELECT * FROM finance.project_task where taskid = ?;
                   SELECT project_member.memberid as idnum, account.id as userid, account.name as name FROM finance.project_member JOIN nodedb.account 
                ON project_member.memberid = account.number where projectid = ?;
                SELECT * FROM project_task_comment WHERE taskid = ?`
        knex.raw(sql,[taskid, pid, taskid])
            .then((rawres)=> {
                let results = rawres[0]
                res.render('main/projects/projecttaskdetail', {
                    task: results[0][0], pmember: results[1],
                    csrfToken: req.csrfToken(), comments: results[2], name: req.session.user
                });
            })
    }else{
        res.redirect('login')
    }
});
router.post('/taskaddcomment', function(req, res, next) {
    let rb = req.body
    if(req.session.user){
        if(rb.status!=''){
            let sql = "UPDATE `finance`.`project_task` SET `status` = ? WHERE (`taskid` = ?);\n;"
            connection.query(sql,[rb.status,req.session.tid] ,function (err, results, fields) {
                if(err){
                console.log(err);
                }
            });
        }
        let sql = "INSERT INTO finance.project_task_comment(taskid, userid, comment, status)VALUES(?,?,?,?);"
        let params = [req.session.tid, req.session.idn, rb.comment, rb.status];
        console.log(params);
        connection.query(sql,params,function (err, results, fields) {
            if(err){
                console.log(err);
            }else{
                res.redirect('/projecttaskdetail?taskid='+req.session.tid);
            }
        });
    }else{
        res.redirect('login')
    }
});
//@todo add modify task detail option
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

router.get('/projectaddfundreq', function(req, res, next) {
    if(req.session.user){
        res.render('main/projects/projectaddfundreq',{csrfToken:req.csrfToken(),name:req.session.user});
    }else{
        res.redirect('login')
    }
});
router.post('/projectaddfundreq', function(req, res, next) {
    let rb = req.body
    if(req.session.user){
        let sql = "INSERT INTO finance.project_fundreq(projectid, title, detail, cost, creator)VALUES(?,?,?,?,?);"
        let params = [req.session.pid, rb.title, rb.detail, rb.cost, req.session.idn];
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

//request fund here
router.get('/projectfunddetail', function(req, res, next){
    let fundid = req.query.fundid
    req.session.fid = fundid
    let pid = req.session.pid
    if(req.session.user){
        let sql = `SELECT * FROM finance.project_fundreq where id = ?;
                   SELECT project_member.memberid as idnum, account.id as userid, account.name as name FROM finance.project_member JOIN nodedb.account 
                ON project_member.memberid = account.number where projectid = ?;
                SELECT * FROM project_fund_comment WHERE fundid = ?`
        connection.query(sql, [fundid, pid, fundid], function (err,results, fields){
            res.render('main/projects/projectfunddetail',{
                fund: results[0][0], pmember: results[1],
                csrfToken:req.csrfToken(), comments:results[2], name:req.session.user
            });
        })
    }else{
        res.redirect('login')
    }
});
router.post('/fundaddcomment', function(req, res, next) {
    let rb = req.body
    if(req.session.user){
        if(rb.status!=''){
            let sql = "UPDATE `finance`.`project_fundreq` SET `status` = ?, `accepter` = ? WHERE (`id` = ?);\n;"
            connection.query(sql,[rb.status, req.session.idn, req.session.fid] ,function (err, results, fields) {
                if(err){
                    console.log(err);
                }
            });
        }
        let sql = "INSERT INTO finance.project_fund_comment(fundid, userid, comment, status)VALUES(?,?,?,?);"
        let params = [req.session.fid, req.session.idn, rb.comment, rb.status];
        console.log(params);
        connection.query(sql,params,function (err, results, fields) {
            if(err){
                console.log(err);
            }else{
                res.redirect('/projectfunddetail?fundid='+req.session.fid);
            }
        });
    }else{
        res.redirect('login')
    }
});

router.get('/projectaddmember', function(req, res, next) {
    if(req.session.user){
        let id = req.query.memberid
        if(!id) id = '';
        let sql = "SELECT number, id, name FROM nodedb.account where id = ?;"
        connection.query(sql,id,function (err, result, fields) {
            if (err) {console.log(err);
            } else {
                res.render('main/projects/projectaddmember', {id, result,csrfToken:req.csrfToken(), name: req.session.user});
            }
        });
    }else{
        res.redirect('login')
    }
});
router.post('/projectaddmember', function(req, res, next) {
    if(req.session.user){
        let rb = req.body
        let sql = "SELECT * FROM project_member WHERE projectid = ? AND memberid = ?"
        let params = [req.session.pid, rb.id]
        connection.query(sql,params,function (err, results, fields) {
            if(err) {
                throw err;
            }else if(results.length === 0){
                console.log(results.length)
                sql = "INSERT INTO project_member(projectid, memberid)VALUES(?,?);"
                params = [req.session.pid, rb.id];
                connection.query(sql,params,function (err, results, fields) {
                    if(err){
                        console.log(err);
                    }else{
                        res.redirect('/projectdetail?pid='+req.session.pid);
                    }
                });
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