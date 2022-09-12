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

router.get('/fixedexpense', function(req, res, next) {
    if(req.session.user){
        let sql = `SELECT * FROM finance.fixedexpense where userid = ?; 
        SELECT sum(payment_num * cost) as totalbill, sum(payment_num * cost/12) as divbill,
        sum(if(payment_num=12, cost, 0)) as monthbill, sum(if(payment_num=1, cost, 0)) as yearbill
        FROM finance.fixedexpense where userid = ?;`
        connection.query(sql, [req.session.idn, req.session.idn] , function (error, results) {
            res.render('main/finance/fixedexpense', {csrfToken:req.csrfToken(),result:results[0], sum:results[1], name:req.session.user});
        });
    }else{
        res.redirect('login')
    }
});
router.get('/fixedexpenseadd', function(req, res, next) {
    if(req.session.user){
        res.render('main/finance/fixedexpenseadd', {csrfToken:req.csrfToken(),name:req.session.user});
    }else{
        res.redirect('login')
    }
});
router.post('/fixedexpenseadd', function(req, res, next) {
    let rb = req.body
    if(req.session.user){
        let sql = "INSERT INTO finance.fixedexpense(title, category, comment, payment_num, cost, link, userid)VALUES(?,?,?,?,?,?,?);"
        let params = [rb.title, rb.category, rb.comment, rb.payment_num, rb.price, rb.link, req.session.idn];
        connection.query(sql,params,function (err, results, fields) {
            if(err){
                console.log(err);
            }else{
                console.log(results.insertId);
            }
        });
        res.redirect('/fixedexpense');
    }else{
        res.redirect('login')
    }
});
router.post('/fixedexpensepurchase', function (req, res, next){
    if(req.session.user){
        req.session.fixedexpenseid = req.body.id
        let title = req.body.title
        let cost = req.body.cost
        let method = req.body.method
        res.render('main/finance/fixedexpensepurchase', {title, cost, method,csrfToken:req.csrfToken(), setting:req.session.setting, name:req.session.user});
    }else{
        res.redirect('login')
    }
});
router.post('/fixedexpensepurchaseadd', function (req, res, next){
    if(req.session.user){
        let rb = req.body
        let cost = rb.cost.replace(/,/g, '')
        let datetime = rb.date
        let paymethod = rb.title +','+ rb.subord +','+ rb.alligner
        // add on account
        let sql = "INSERT INTO finance.account(title, cost, detail, time, alligner, subord, userid)VALUES(?,?,?,?,?,?,?);"
        let params = [rb.title, cost, rb.details, rb.date, rb.alligner, rb.subord, req.session.idn];
        connection.query(sql,params,function (err) { if(err) console.log(err);});
        // update paid date and
        sql = "UPDATE fixedexpense SET cost = ?, lastpaid = ?, paymethod = ? WHERE (id = ?);"

        params = [cost, datetime, paymethod, req.session.fixedexpenseid];
        console.log(params)
        connection.query(sql,params,function (err) { if(err) console.log(err);});
        res.redirect('/fixedexpense');
    }else{
        res.redirect('login')
    }
});
router.post('/fixedexpenseedit', function(req, res, next) {
    if(req.session.user){
        req.session.fixedexpenseid = req.body.id
        res.render('main/finance/fixedexpenseedit', {csrfToken:req.csrfToken(),rb:req.body, name:req.session.user});
    }else{
        res.redirect('login')
    }
});
router.post('/fixedexpenseeditapply', function(req, res, next) {
    if(req.session.user){
        let rb = req.body
        let sql = "UPDATE fixedexpense SET title = ?, category = ?, comment = ?, payment_num = ?, cost = ?, link = ? WHERE (id = ?);"
        let params = [rb.title, rb.category, rb.comment, rb.payment_num, rb.cost, rb.link, req.session.fixedexpenseid];
        connection.query(sql,params,function (err) {if(err){console.log(err);}});
        res.redirect('/fixedexpense');
    }else{
        res.redirect('login')
    }
});
router.get('/fixedexpenseremove', function(req, res, next) {
    if(req.session.user){
        let sql = "DELETE FROM fixedexpense WHERE (`id` = ?);"
        let params = req.session.fixedexpenseid;
        connection.query(sql,params,function (err) {if(err) console.log(err);});
        res.redirect('/fixedexpense');
    }else{
        res.redirect('login')
    }
});

module.exports = router;