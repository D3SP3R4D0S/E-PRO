const express = require('express');
const router = express.Router();
const mysql      = require('./config/mysql.js')();
const knex = require('./config/knex.js');

//Finencial obligation
router.get('/financialobligation', function(req, res, next){
    if(req.session.user){
        knex.select('*')
            .from('financial_obligation')
            .where('userid',req.session.idn)
            .then((result)=>{
                res.render('main/obligation/financialobligation',{
                    csrfToken:req.csrfToken(),
                    result,
                    name:req.session.user
                });
            })
            .catch((err)=>{console.log(err)})
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
        let complete = null
        if(req.body.complete!=='')
            complete = req.body.complete
        let duedate = null
        if(req.body.duedate!=='')
            duedate = req.body.duedate
        knex('financial_obligation').update({
                title:req.body.title,
                cost:req.body.cost.replace(/,/g, ''),
                loaner:req.body.loaner,
                complete:complete,
                duedate:duedate
            })
            .where('id', req.session.financialobligationid)
            .then((result)=>{console.log(result)})
            .catch((err)=>console.log(err))
        res.redirect('/financialobligation');
    }else{
        res.redirect('login')
    }
});
router.post('/financialobligationadd', function (req, res, next){
    if(req.session.user){
        let duedate = null
        if(req.body.duedate!="")
            duedate = req.body.duedate
        knex.insert({
                title:req.body.title,
                cost:req.body.cost.replace(/,/g, ''),
                loaner:req.body.loaner,
                duedate:duedate,
                userid:req.session.idn,
            })
            .into('financial_obligation')
            .then((result)=>{console.log(result)})
            .catch((err)=>console.log(err))
        res.redirect('/financialobligation');
    }else{
        res.redirect('login')
    }
});
router.get('/financialobligationremove', function(req, res, next){
    if(req.session.user){
        knex.delete()
            .from('financial_obligation')
            .where('id', req.session.financialobligationid)
            .then((result)=>{console.log(result)})
            .catch((err)=>{console.log(err)})
        res.redirect('financialobligation');
    }else{
        res.redirect('login')
    }
});

module.exports = router;