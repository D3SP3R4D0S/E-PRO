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

// projects // mysql
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
                res.render('main/projects/projectmgmt', {csrfToken:req.csrfToken(), result1: results, name: req.session.user, id:idnum});
            }
        });
    }else{
        res.redirect('login')
    }
});

// add project
router.route('/projectadd')
    // projectadd // mysql
    .post(function(req, res, next) {
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
// projectdetail // mysql
router.get('/projectdetail', function(req, res, next) {
    req.session.pid = req.query.pid
    let pid = req.session.pid
    if (req.session.user) {
        let sql = 'SELECT * FROM finance.project_member where projectid = ? and memberid = ?'
        connection.query(sql, [req.session.pid, req.session.idn] ,function (error, results) {
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
                                name: req.session.user,
                                id: req.session.idn,
                                csrfToken: req.csrfToken()
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

// #########################################################
// ADD MEMBER ( SEARCH & ADD )
// #########################################################

// add member
router.route('/projectaddmember')
    .get(function(req, res, next) {
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
    })
    .post(function(req, res, next) {
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
    })

// #########################################################
// TASK REQUEST PART
// #########################################################


// project/taskdetail // knex raw
router.route('/projecttaskdetail')
    .get(function(req, res,next){
        let tid = req.query.tid
        req.session.tid = tid
        let pid = req.session.pid
        if(req.session.user){
            knex.select("*")
                .from("project_task")
                .where('taskid', tid)
                .andWhere('projectid', pid)
                .then((results)=>{
                    if(results[0]) {
                        let sql = `SELECT * FROM finance.project_task where taskid = ?;
                                   SELECT project_member.memberid as idnum, account.id as userid, account.name as name FROM finance.project_member JOIN nodedb.account 
                                ON project_member.memberid = account.number where projectid = ?;
                                SELECT * FROM project_task_comment WHERE taskid = ?`
                        knex.raw(sql, [tid, pid, tid])
                            .then((rawres) => {
                                let results = rawres[0]
                                res.render('main/projects/task/projecttaskdetail', {
                                    tid:tid,
                                    task: results[0][0],
                                    pmember: results[1],
                                    csrfToken: req.csrfToken(),
                                    comments: results[2],
                                    name: req.session.user,
                                    id: req.session.idn
                                });
                            })
                            .catch((err) => {
                                console.log(err)
                                res.render('main/compara/defender')
                            })
                    }else{
                        res.render('main/compara/defender')
                    }
                })
                .catch((err)=>{
                    console.log(err)
                    res.render('main/compara/defender')
                })
        }else{res.redirect('login')}
    })

router.route('/projectaddtask')
    .post(function(req, res, next) {
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
    })

// project / task / commentadd // knex
router.post('/taskaddcomment', function(req, res, next) {
    let rb = req.body
    if(req.session.user){
        if(rb.status!=''){
            knex('project_task').update({
                status:rb.status
            })
                .where('taskid', req.session.tid)
                .catch((err)=>{
                    console.log(err)
                })
            knex('project_task_comment').insert({
                taskid:req.session.tid,
                userid:req.session.idn,
                comment:rb.comment,
                status:rb.status
            })
                .then((result)=>{console.log(result)})
                .catch((err)=>{console.log(err)})
        }else{
            knex('project_task_comment').insert({
                taskid:req.session.tid,
                userid:req.session.idn,
                comment:rb.comment
            })
                .then((result)=>{console.log(result)})
                .catch((err)=>{console.log(err)})
        }
        res.redirect('/projecttaskdetail?tid='+req.session.tid);
    }else{
        res.redirect('login')
    }
});

router.post('/taskeditcomment', function(req, res, next) {
    let rb = req.body
    if(req.session.user){
        knex('project_task_comment').update({
            comment:rb.eidt_comment
        })
            .where('commentid', rb.c_id)
            .catch((err)=>{
                console.log(err)
            })
        res.redirect('/projecttaskdetail?tid='+req.session.tid);
    }else{
        res.redirect('login')
    }
});

router.post('/taskdeletecomment', function(req,  res) {
    let rb = req.body;
    console.log(typeof(rb.comment_id));
    if(typeof(rb.comment_id) === "string") {
        rb.comment_id = Array(rb.comment_id);
    }
    if(req.session.user){
        console.log(rb.comment_id);
        for (i in rb.comment_id) {
            console.log(rb.comment_id[i]);
            let sql = "DELETE FROM finance.project_task_comment WHERE commentid = ?;"
            connection.query(sql, [rb.comment_id[i]],function (err, results, fields) {
                if(err){
                    console.log(err);
                }
            });
        }
        res.json({success : "Updated Successfully", status : 200});
    }else{
        res.redirect('login')
    }
});

//projectaddtask // knex
router.post('/projectaddtask', function(req, res, next) {
    let rb = req.body
    if(req.session.user){
        knex('project_task').insert({
            projectid:req.session.pid,
            tasktitle:rb.tasktitle,
            creator:req.session.idn,
            duedate:rb.duedate,
            detail:rb.detail
        })
            .then((results)=>{console.log(results)})
            .catch((err)=>{console.log(err)})
        res.redirect('/projectdetail?pid='+req.session.pid);
    }else{
        res.redirect('login')
    }
});

//@todo add modify task detail option
//projectedittask
router.route('/projecttaskedit')
    .get(function(req, res){
        let tid = req.query.tid
        if(req.session.user){
            knex.select("*")
                .from("project_task")
                .where('taskid', tid)
                .andWhere('creator', req.session.idn)
                .then((results)=>{
                    if(results[0]) {
                        res.render('main/projects/task/projecttaskedit', {
                            tid:tid,
                            task: results[0],
                            csrfToken: req.csrfToken(),
                            name: req.session.user,
                            id: req.session.idn
                        });
                    }else{
                        res.render('main/compara/defender')
                    }
                })
                .catch((err)=>{
                    console.log(err)
                    res.render('main/compara/defender')
                })
        }else{res.redirect('login')}
    })
    .post(function(req, res){
        let tid = req.body.tid
        let rb = req.body
        if(req.session.user){
            knex('project_task').update({
                tasktitle:rb.tasktitle,
                duedate:rb.duedate,
                detail:rb.detail
            })
                .where('taskid', tid)
                .then((results)=>{
                    res.redirect('/projecttaskdetail?tid='+req.session.tid);
                })
                .catch((err)=>{console.log(err)})
        }else{
            res.redirect('login')
        }
    })
router.route('/projecttaskremove')
    .post(function(req, res){
        let tid = req.body.tid
        if(req.session.user) {
            knex.delete()
                .from('project_task')
                .where('taskid', tid)
                .then((results) => {
                    res.redirect('/projecttaskdetail?tid=' + req.session.tid);
                })
                .catch((err) => {
                    console.log(err)
                })
        }else{
            res.redirect('login')
        }
    })

// #########################################################
// FUND REQUEST PART
// #########################################################

//fund detail // mysql
router.get('/projectfunddetail', function(req, res, next){
    let fid = req.query.fundid
    req.session.fid = fid
    let pid = req.session.pid
    if(req.session.user){
        knex.select("*")
            .from("project_fundreq")
            .where('id', fid)
            .andWhere('projectid', pid)
            .then((results)=>{
                if(results[0]) {
                    let sql = `SELECT * FROM finance.project_fundreq where id = ?;
                               SELECT project_member.memberid as idnum, account.id as userid, account.name as name FROM finance.project_member JOIN nodedb.account 
                            ON project_member.memberid = account.number where projectid = ?;
                            SELECT * FROM project_fund_comment WHERE fundid = ?`
                    connection.query(sql, [fid, pid, fid], function (err, results, fields) {
                        res.render('main/projects/fund/projectfunddetail', {
                            fund: results[0][0], pmember: results[1],
                            csrfToken: req.csrfToken(), comments: results[2], name: req.session.user
                        });
                    })
                }else{res.render('main/compara/defender')}
            })
            .catch((err)=>{
                console.log(err)
                res.render('main/compara/defender')
            })
    }else{res.redirect('login')}
});

// add fund request
router.route('/projectaddfundreq')
    .post(function(req, res, next) {
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
    })

//fund comment add // mysql
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

// #########################################################
// UNDER CONSTRUCTION
// #########################################################

router.get('/analysis', function (req, res,next){
    if(req.session.user){
        res.render('main/compara/underconstruction',{name:req.session.user});
    }else{
        res.redirect('login')
    }
})

module.exports = router;