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

//expendables
router.get('/expendables', function (req, res, next){
    if(req.session.user){
        let sql = 'SELECT * FROM expendables WHERE userid = ?;'
        let val = [req.session.idn]
        connection.query(sql, val, function (err, results, fields) {
            if(err) throw err;
            else{
                res.render('main/finance/expendables', {csrfToken:req.csrfToken(),result:results, name:req.session.user});
            }
        });
    }else{
        res.redirect('login')
    }
});
router.post('/expendablepurchase', function (req, res, next){
    if(req.session.user){
        req.session.expendableitemid = req.body.id
        let title = req.body.title
        let cost = req.body.cost
        res.render('main/finance/expendablepurchase', {title, cost,csrfToken:req.csrfToken(), setting:req.session.setting, name:req.session.user});
    }else{
        res.redirect('login')
    }
});
router.post('/expendablepurchaseadd', function (req, res, next){
    if(req.session.user){
        let rb = req.body
        let cost = rb.cost.replace(/,/g, '')
        let datetime = rb.date
        let sql = "INSERT INTO finance.account(title, cost, detail, time, alligner, subord, userid)VALUES(?,?,?,?,?,?,?);"
        let params = [rb.title, cost, rb.details, rb.date, rb.alligner, rb.subord, req.session.idn];
        connection.query(sql,params,function (err) { if(err) console.log(err);});
        sql = "UPDATE expendables SET `cost` = ?, `lastbought` = ? WHERE (`id` = ?);"
        params = [cost, datetime, req.session.expendableitemid];
        connection.query(sql,params,function (err) { if(err) console.log(err);});
        res.redirect('/latestdata');
    }else{
        res.redirect('login')
    }
})
router.post('/expendableedit', function (req, res){
    if(req.session.user){
        req.session.expendableitemid = req.body.id
        let title = req.body.title
        let description = req.body.description
        let link = req.body.link
        res.render('main/finance/expendableedit', {csrfToken:req.csrfToken(),title, description, link, name:req.session.user});
    }else{
        res.redirect('login')
    }
})
router.post('/expendableeditapply', function (req, res, next){
    if(req.session.user){
        let rb = req.body
        let title = rb.title
        let description = rb.description
        let link = rb.link
        sql = "UPDATE expendables SET `title` = ?, `description` = ?, `link` = ? WHERE (`id` = ?);"
        params = [title, description, link, req.session.expendableitemid];
        connection.query(sql,params,function (err) { if(err) console.log(err);});
        res.redirect('/expendables');
    }else{
        res.redirect('login')
    }
})
router.get('/expendableadd', function(req, res, next) {
    if(req.session.user){
        res.render('main/finance/expendableadd',{csrfToken:req.csrfToken(),setting:req.session.setting, name:req.session.user});
    }else{
        res.redirect('login')
    }
});
router.post('/expendableadd', function(req, res, next) {
    let rb = req.body;
    let cost = rb.cost.replace(',', '')
    if(req.session.user){
        let sql = "INSERT INTO expendables (userid, title, cost, link, description) VALUES (?, ?, ?, ?, ?);"
        let params = [req.session.idn, rb.title, cost, rb.link, rb.description];
        connection.query(sql,params,function (err, results, fields) {if(err){console.log(err);}});
        res.redirect('/expendables');
    }else{
        res.redirect('login')
    }
});

module.exports = router;