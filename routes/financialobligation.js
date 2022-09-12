const express = require('express');
const router = express.Router();
const mysql      = require('./config/mysql.js')();
const connection = mysql.init();
const knex = require('./config/knex.js');
connection.connect(function(err){
    if(err) {                                     // or restarting (takes a while sometimes).
        console.log('error when connecting to db:', err);
        setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }
});
connection.close

//Finencial obligation
router.get('/financialobligation', function(req, res, next){
    if(req.session.user){
        let sql = 'SELECT * FROM financial_obligation WHERE userid = ?;'
        let val = [req.session.idn]
        connection.query(sql, val, function (err, results) {
            if(err) throw err;
            else{
                res.render('main/obligation/financialobligation',{csrfToken:req.csrfToken(),result:results, name:req.session.user});
            }
        });
    }else{
        res.redirect('login')
    }
});
router.post('/financialobligationedit', function (req, res){
    if(req.session.user){
        req.session.financialobligationid = req.body.id
        let rb = req.body
        let duedate = rb.duedate
        res.render('main/obligation/financialobligationedit', {rb, duedate,csrfToken:req.csrfToken(), name:req.session.user});
    }else{
        res.redirect('login')
    }
});
router.post('/financialobligationapply', function (req, res, next){
    if(req.session.user){
        let rb = req.body
        let cost = rb.cost.replace(/,/g, '')
        let duedate = rb.duedate
        let complete = null
        if(rb.complete!=='')
            complete = rb.complete
        let sql
        let params
        if(duedate) {
            sql = "UPDATE financial_obligation SET `title` = ?, `cost` = ?, `loaner` = ?, `duedate` = ?, `complete`= ?  WHERE (`id` = ?);"
            params = [rb.title, cost, rb.loaner, duedate, complete, req.session.financialobligationid];
        }else{
            sql = "UPDATE financial_obligation SET `title` = ?, `cost` = ?, `loaner` = ?, `complete`= ?  WHERE (`id` = ?);"
            params = [rb.title, cost, rb.loaner, complete, req.session.financialobligationid];
        }
        connection.query(sql,params,function (err) { if(err) console.log(err);});
        res.redirect('/financialobligation');
    }else{
        res.redirect('login')
    }
});
router.get('/financialobligationadd', function(req, res, next) {
    if(req.session.user){
        res.render('main/obligation/financialobligationadd',{setting:req.session.setting,csrfToken:req.csrfToken(), name:req.session.user});
    }else{
        res.redirect('login')
    }
});
router.post('/financialobligationadd', function (req, res, next){
    if(req.session.user){
        let rb = req.body
        let title = rb.title
        let cost = rb.cost.replace(/,/g, '')
        let loaner = rb.loaner
        let duedate = rb.duedate
        let sql
        let params
        if(duedate !== '') {
            sql = "INSERT INTO financial_obligation(title, cost, loaner, duedate, userid)VALUES(?,?,?,?,?);"
            params = [title, cost, loaner, duedate, req.session.idn];
        }else{
            sql = "INSERT INTO financial_obligation(title, cost, loaner, userid)VALUES(?,?,?,?);"
            params = [title, cost, loaner, req.session.idn];
        }
        connection.query(sql,params,function (err) { if(err) console.log(err);});
        res.redirect('/financialobligation');
    }else{
        res.redirect('login')
    }
});
router.get('/financialobligationremove', function(req, res, next){
    if(req.session.user){
        let sql = 'DELETE FROM financial_obligation WHERE `id` = ?;'
        connection.query(sql, req.session.financialobligationid , function (err) {if(err)throw err;});
        res.redirect('financialobligation');
    }else{
        res.redirect('login')
    }
});

module.exports = router;