const express = require('express');
const router = express.Router();
const knex = require('./config/knex.js');

//expendables
router.get('/expendables', function (req, res, next){
    if(req.session.user){
        knex.select('*')
            .from('expendables')
            .where('userid', req.session.idn)
            .then((result)=>{
                res.render('main/finance/expendables', {csrfToken:req.csrfToken(), result, name:req.session.user});
            })
            .catch((err)=>{console.log(err)})
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
        knex.insert({
                title:rb.title,
                cost:cost,
                detail:rb.details,
                time:rb.date,
                alligner:rb.alligner,
                subord:rb.subord,
                userid:req.session.idn
            })
            .into('account')
            .then((result)=>{console.log(result)})
            .catch((err)=>{console.log(err)})
        knex('expendables').update({
                cost:cost,
                lastbought:datetime,
            })
            .where('id', req.session.expendableitemid)
            .then((result)=>{console.log(result)})
            .catch((err)=>{console.log(err)})
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
        knex('expendables').update({
                title:rb.title,
                description:rb.description,
                link:rb.link,
            })
            .where('id', req.session.expendableitemid)
            .then((result)=>{console.log(result)})
            .catch((err)=>{console.log(err)})
        res.redirect('/expendables');
    }else{
        res.redirect('login')
    }
})
router.post('/expendableadd', function(req, res, next) {
    if(req.session.user){
        knex.insert({
                userid:req.session.idn,
                title:req.body.title,
                cost:req.body.cost.replace(',', ''),
                link:req.body.link,
                description:req.body.description
            })
            .into('expendables')
            .then((result)=>{console.log(result)})
            .catch((err)=>{console.log(err)})
        res.redirect('/expendables');
    }else{
        res.redirect('login')
    }
});

module.exports = router;