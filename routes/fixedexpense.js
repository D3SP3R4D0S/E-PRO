const express = require('express');
const router = express.Router();
const knex = require('./config/knex.js');

router.get('/fixedexpense', function(req, res, next) {
    if(req.session.user){
        let sql = `SELECT * FROM finance.fixedexpense where userid = ?; 
        SELECT sum(payment_num * cost) as totalbill, sum(payment_num * cost/12) as divbill,
        sum(if(payment_num=12, cost, 0)) as monthbill, sum(if(payment_num=1, cost, 0)) as yearbill
        FROM finance.fixedexpense where userid = ?;`
        knex.raw(sql, [req.session.idn, req.session.idn])
            .then((result)=>{
                let results =result[0]
                res.render('main/finance/fixedexpense', {csrfToken:req.csrfToken(),result:results[0], sum:results[1], name:req.session.user});
            })
            .catch((err)=>{console.log(err)})
    }else{
        res.redirect('login')
    }
});
router.post('/fixedexpenseadd', function(req, res, next) {
    if(req.session.user){
        knex.insert({
                title:req.body.title,
                category:req.body.category,
                comment:req.body.comment,
                payment_num:req.body.payment_num,
                cost:req.body.price,
                link:req.body.link,
                userid:req.session.idn
            }).into('fixedexpense')
            .then((result)=>{console.log(result)})
            .catch((err)=>{console.log(err)})
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
        let cost = req.body.cost.replace(/,/g, '')
        let paymethod = req.body.title +','+ req.body.subord +','+ req.body.alligner
        // add on account
        knex.insert({
            title:req.body.title,
            cost:cost,
            detail:req.body.details,
            time:req.body.date,
            alligner:req.body.alligner,
            subord:req.body.subord,
            userid:req.session.idn,
        })
            .into('account')
            .then((result)=>{console.log(result)})
            .catch((err)=>{console.log(err)})
        // update paid date and
        knex('fixedexpense').update({
            cost:cost,
            lastpaid:req.body.date,
            paymethod:paymethod,
        })
            .where('id', req.session.fixedexpenseid)
            .then((result)=>{console.log(result)})
            .catch((err)=>{console.log(err)})
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
        knex('fixedexpense').update({
            title:req.body.title,
            category:req.body.category,
            comment:req.body.comment,
            payment_num:req.body.payment_num,
            cost:req.body.cost,
            link:req.body.link,
        }).where('id',req.session.fixedexpenseid)
            .then((result)=>{console.log(result)})
            .catch((err)=>{console.log(err)})
        res.redirect('/fixedexpense');
    }else{
        res.redirect('login')
    }
});
router.get('/fixedexpenseremove', function(req, res, next) {
    if(req.session.user){
        knex.delete()
            .from('fixedexpense')
            .where('id', req.session.fixedexpenseid)
            .then((result)=>{console.log(result)})
            .catch((err)=>{console.log(err)})
        res.redirect('/fixedexpense');
    }else{
        res.redirect('login')
    }
});

module.exports = router;