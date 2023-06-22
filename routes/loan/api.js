const express = require('express');
const router = express.Router();
const knex = require('../config/knex.js');

router.get('/api/loan/summary', function(req, res, next) {
    if(req.session.user){
        knex.raw(`SELECT sum(if(type = 1, cost, -cost)) as total FROM finance.loan_data where user_id = ${req.session.idn};`)
            .then((result)=>{
                res.status(200).json(result[0])
            })
            .catch((err)=>{
                res.status(500).json(err)
            })
    }else{
        res.redirect('login')
    }
});


router.get('/api/loan/datas', function(req, res, next) {
    if(req.session.user){
        knex.select("*")
            .join('loan_user', 'loan_user_id', 'loan_user.id')
            .from("loan_data")
            .where("user_id", req.session.idn)
            .then((result)=>{
                res.status(200).json(result)
            })
            .catch((err)=>{
                res.status(500).json(err)
            })
    }else{
        res.redirect('login')
    }
});

router.get('/api/loan/users', function(req, res, next) {
    if(req.session.user){
        knex.raw(`SELECT name, interest_rate, interest, last_update,datediff(now(), last_update) as datediff,
            sum(if(type=1, cost, -cost)) as total FROM finance.loan_data
            join finance.loan_user on loan_data.loan_user_id = loan_user.id 
            where user_id = ${req.session.idn} group by loan_user.id;`)
            .then((result)=>{
                res.status(200).json(result[0])
            })
            .catch((err)=>{
                res.status(500).json(err)
            })
    }else{
        res.redirect('login')
    }
});

module.exports = router;