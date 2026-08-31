const express=require('express');
const {requireAuth,requireMfa,verifyCsrf}=require('../../middleware/security');
const controller=require('./invoicing.composition');
const router=express.Router();
router.use(requireAuth,requireMfa);
router.post('/',verifyCsrf,controller.create);
router.get('/',controller.list);
router.post('/:id/refresh',verifyCsrf,controller.refresh);
module.exports=router;
