const express = require('express');
const router = express.Router();
const knex = require('./config/knex.js');

router.route('/personal_info')
    .get(function(req, res){
        console.log(req.session.idn)
        knex.select('*')
            .from('finance.personal_info')
            .where('userid', req.session.idn)
            .then((result)=>{
                if(result.length == 0){
                    knex('personal_info').insert({'userid':req.session.idn})
                        .then((result)=>{console.log(result)                        })
                        .catch((err)=>{console.log(err)})
                }
                res.status(200).json(result)
            })
            .catch((err)=>{
                console.log(err)
                res.status(500).json(err)
            })
    })
    .post(function(req, res){
        knex('finance.personal_info').update({
            'default_method':req.body.default_method,
            'default_usage':req.body.default_usage,
            'default_alligner':req.body.default_alligner
        })
            .then((result)=>{
                console.log(result)
            })
            .catch((err)=>console.log(err))
    })

module.exports = router;