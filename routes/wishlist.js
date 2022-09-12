const express = require('express');
const router = express.Router();
const mysql      = require('./config/mysql.js')();
const connection = mysql.init();
const request = require('request');
const knex = require('./config/knex.js');
// const bodyParser = require('body-parser')
// app.use(bodyParser.json());
connection.connect(function(err){
    if(err) {                                     // or restarting (takes a while sometimes).
        console.log('error when connecting to db:', err);
        setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    }
});
connection.close

// to but list ( wish list )
router.get('/wishlist', function(req, res, next) {
    if(req.session.user){
        let sql = `SELECT * FROM wishlist where userid = ? order by priority asc;
         SELECT sum(if(stat = 1, cost, 0)) as req_total, sum(if(stat = 1 and Priority>2, cost, 0)) as high_total 
         FROM wishlist where userid = ?;`
        let val = [req.session.idn, req.session.idn]
        connection.query(sql, val, function (err, results, fields) {
            if(err) throw err;
            else{
                res.render('main/wishlist/wishlist', {result:results[0], summary:results[1][0], csrfToken:req.csrfToken(),name:req.session.user});
            }
        });
    }else{
        res.redirect('login')
    }
});
router.get('/addwish', function (req, res,next){
    if(req.session.user){
        res.render('main/wishlist/addwish',{csrfToken:req.csrfToken(),name:req.session.user});
    }else{
        res.redirect('login')
    }
})
router.post('/addwish', function (req, res){
    if(req.session.user){
        let rb = req.body
        let cost = rb.cost.replace(/,/g, '')
        let sql = "INSERT INTO wishlist (title, cost, link, duedate, priority, detail, userid) VALUES (?, ?, ?, ?, ?, ?, ?);"
        let params = [rb.title, cost, rb.link, rb.duedate, rb.priority, rb.detail, req.session.idn];
        connection.query(sql,params,function (err) {
            if(err) console.log(err);
        });
        res.redirect('wishlist');
    }else{
        res.redirect('login')
    }
});
router.post('/wishitemedit', function (req, res,next){
    if(req.session.user){
        req.session.wishid = req.body.id
        let title = req.body.title
        let cost = req.body.cost.replace(/,/g, '')
        let link = req.body.link
        let duedate = req.body.duedate
        let detail = req.body.detail
        let priority = req.body.priority
        let stat = req.body.stat
        res.render('main/wishlist/wishitemedit',{title, cost, link, duedate, detail, priority, stat, csrfToken:req.csrfToken(), name:req.session.user});
    }else{
        res.redirect('login')
    }
})
router.post('/wishitemeditapply', function (req, res){
    if(req.session.user){
        let rb = req.body
        let cost = rb.cost.replace(',', '')
        let sql = "UPDATE wishlist SET title = ?, cost = ?, link = ?, duedate = ?, priority = ?, detail = ?, stat = ? WHERE (id = ?);"
        let params = [rb.title, cost, rb.link, rb.duedate, rb.priority, rb.detail, rb.stat, req.session.wishid];
        connection.query(sql,params,function (err) {
            if(err) console.log(err);
        });
        res.redirect('wishlist');
    }else{
        res.redirect('login')
    }
});
router.get('/removewish', function(req, res, next){
    if(req.session.user){
        let sql = 'DELETE FROM `wishlist` WHERE `id` = ?;'
        connection.query(sql, req.session.wishid , function (error, results, fields) {
            res.redirect('wishlist');
        });
    }else{
        res.redirect('login')
    }
});
router.post('/wishitempurchase', function (req, res,next){
    if(req.session.user){
        req.session.wishid = req.body.id
        let title = req.body.title
        let cost = req.body.cost.replace(/,/g, '')
        res.render('main/wishlist/wishitempurchase',{title, cost, csrfToken:req.csrfToken(),setting:req.session.setting, name:req.session.user});
    }else{
        res.redirect('login')
    }
})
router.post('/wishitempurchaseapply', function (req, res){
    if(req.session.user){
        let rb = req.body
        let cost = rb.cost.replace(/,/g, '')
        let datetime = rb.date
        let sql = "INSERT INTO finance.account(title, cost, detail, time, alligner, subord, userid)VALUES(?,?,?,?,?,?,?);"
        let params = [rb.title, cost, rb.details, datetime, rb.alligner, rb.subord, req.session.idn];
        connection.query(sql,params,function (err) { if(err) console.log(err);});
        sql = "UPDATE wishlist SET cost = ?, stat = '3', completed = ? WHERE (id = ?);"
        params = [cost, datetime, req.session.wishid];
        connection.query(sql,params,function (err) { if(err) console.log(err);});
        res.redirect('wishlist');
    }else{
        res.redirect('login')
    }
});

module.exports = router;