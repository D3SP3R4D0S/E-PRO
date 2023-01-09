const express = require('express');
const router = express.Router();
const knex = require('./config/knex.js');

// to but list ( wish list ) // knex raw
router.get('/wishlist', function(req, res, next) {
    if(req.session.user){
        let sql = `SELECT * FROM wishlist where userid = ? order by priority asc;
         SELECT sum(if(stat = 1, cost, 0)) as req_total, sum(if(stat = 1 and Priority>2, cost, 0)) as high_total 
         FROM wishlist where userid = ?;`
        let val = [req.session.idn, req.session.idn]
        knex.raw(sql, val)
            .then((result)=>{
                let results = result[0]
                res.render('main/wishlist/wishlist', {
                    result:results[0],
                    summary:results[1][0],
                    csrfToken:req.csrfToken(),
                    name:req.session.user
                });
            })
            .catch((err)=>{
                console.log(err)
            })
    }else{
        res.redirect('login')
    }
});
// add wish page
router.route('/addwish')
    // add wish item
    .post(function (req, res){
    if(req.session.user){
        let rb = req.body
        let cost = rb.cost.replace(/,/g, '')
        knex.insert({
            title:rb.title,
            cost:cost,
            link:rb.link,
            duedate:rb.duedate,
            priority:rb.priority,
            detail:rb.detail,
            userid:req.session.idn
        })
            .into('wishlist')
            .then((result)=>{
                console.log(result)
                res.redirect('wishlist');
            })
            .catch((err)=>{
                console.log(err)
            })
    }else{
        res.redirect('login')
    }
});
// edit page // only render
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
// wish item edit apply // knex
router.post('/wishitemeditapply', function (req, res){
    if(req.session.user){
        let rb = req.body
        let cost = rb.cost.replace(',', '')
        knex('wishlist').update({
                title:rb.title,
                cost:cost,
                link:rb.link,
                duedate:rb.duedate,
                priority:rb.priority,
                detail:rb.detail,
                stat:rb.stat
            })
            .where('id', req.session.wishid)
            .then((results)=>{res.redirect('wishlist');})
            .catch((err)=>{console.log(err)})
    }else{
        res.redirect('login')
    }
});
// remove wish // knex
router.get('/removewish', function(req, res, next){
    if(req.session.user){
        let sql = 'DELETE FROM `wishlist` WHERE `id` = ?;'
        knex.delete()
            .from('wishlist')
            .where('id', req.session.wishid)
            .then((results)=>{
                res.redirect('wishlist')
            })
            .catch((err)=>{console.log(err)})
    }else{
        res.redirect('login')
    }
});
// purchase page // only render
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
// purchase apply // knex raw
router.post('/wishitempurchaseapply', function (req, res){
    if(req.session.user){
        let rb = req.body
        let cost = rb.cost.replace(/,/g, '')
        let datetime = rb.date
        let sql = "INSERT INTO finance.account(title, cost, detail, time, alligner, subord, userid)VALUES(?,?,?,?,?,?,?);"
        let params = [rb.title, cost, rb.details, datetime, rb.alligner, rb.subord, req.session.idn];
        knex.raw(sql, params)
            .catch((err)=>{console.log(err)})
        sql = "UPDATE wishlist SET cost = ?, stat = '3', completed = ? WHERE (id = ?);"
        params = [cost, datetime, req.session.wishid];
        knex.raw(sql, params)
            .then((results)=>{res.redirect('wishlist')})
            .catch((err)=>{console.log(err)})
    }else{
        res.redirect('login')
    }
});

module.exports = router;