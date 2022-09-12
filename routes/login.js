const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const knex = require('./config/knex.js');


// Login
// login page
router.route('/login')
    //login page // only render
    .get(function(req, res, next) {
        res.render('main/login/login', {csrfToken:req.csrfToken()});
    })
    // login // knex
    .post(function(req, res, next) {
        let rb = req.body
        let inpw = rb.pw
        knex.select('*')
            .from('nodedb.account')
            .where('id', rb.id)
            .then((results)=>{
                if(results[0]) {
                    crypto.pbkdf2(inpw, results[0].salt, 100000, 64, 'sha512', (err, key) => {
                        if (key.toString('base64') === results[0].password && results[0].permission >= 1) {
                            req.session.idname = rb.id;
                            req.session.idn = results[0].number;
                            req.session.user = results[0].name;
                            req.session.permission = results[0].permission;
                            req.session.setting = JSON.parse(results[0].settings);
                            req.session.save();
                            res.redirect('/index');
                        } else {
                            res.redirect('/login');
                        }
                    });
                }else{
                    res.redirect('/login');
                }
            })
            .catch((err)=>{console.log(err)})
    })
// logout // only session destroy
router.get('/logout', function(req, res, next){
    if (req.session.user) {
        console.log('로그아웃');
        req.session.destroy(
            function (err) {
                if (err) {
                    console.log('세션 삭제 에러');
                    return;
                }
                res.redirect('/index');
            }
        );
    } else {
        console.log('Not Loged in');
        res.redirect('/Login');
    }
})

// account // only render
router.get('/account', function(req, res, next){
    if(req.session.user){
        res.render('main/login/account', {name:req.session.user, id:req.session.idname, permission:req.session.permission});
    }else{
        res.redirect('login')
    }
});
// register
router.route('/register')
    // reguster page render
    .get(function(req, res, next) {
        res.render('main/login/register', {csrfToken:req.csrfToken()});
    })
    // request register
    .post(function(req, res, next){
        let rb = req.body
        let inpw = rb.pw
        crypto.randomBytes(32, function(err, buf) {
            crypto.pbkdf2(inpw, buf.toString('base64'), 100000, 64, 'sha512', (err, key) => {
                let setting = `{\"method\": [], \"paidfor\": [], \"alligner\": []}`
                // const sql = 'INSERT into nodedb.account(id, password, name, salt, settings)VALUES(?, ?, ?, ?, ?)'
                knex('nodedb.account').insert({
                        id:rb.id,
                        password:key.toString('base64'),
                        name:rb.name,
                        salt:buf.toString('base64'),
                        settings:setting
                    })
                    .then((result)=>{
                        res.redirect('/index')
                    })
                    .catch((err)=>{console.log(err)})
            });
        });
});

module.exports = router;