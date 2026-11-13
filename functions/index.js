const {onRequest}=require('firebase-functions/v2/https');
const {defineSecret}=require('firebase-functions/params');
const nodemailer=require('nodemailer');
const password=defineSecret('GMAIL_APP_PASSWORD');
const mailbox='contact.lorentrix@gmail.com';
exports.sendEnquiry=onRequest({region:'asia-south1',secrets:[password],maxInstances:3},async(req,res)=>{
  if(req.method!=='POST') return res.set('Allow','POST').sendStatus(405);
  if(!req.is('application/json')) return res.sendStatus(415);
  const fields={};
  for(const [key,limit] of Object.entries({name:150,email:254,company:250,service:200,requirements:10000})) {
    const value=req.body?.[key];
    if(typeof value!=='string'||!value.trim()||value.length>limit) return res.sendStatus(400);
    if(key!=='requirements'&&Array.from(value).some(c=>c.charCodeAt(0)<32)) return res.sendStatus(400);
    fields[key]=value.trim();
  }
  if(!/^[^ @<>,;“”"]+@[^ @<>,;“”"]+[.][^ @<>,;“”"]+$/.test(fields.email)) return res.sendStatus(400);
  try {
    const transport=nodemailer.createTransport({service:'gmail',auth:{user:mailbox,pass:password.value()}});
    await transport.sendMail({from:mailbox,to:mailbox,replyTo:{name:fields.name,address:fields.email},subject:'New Lorentrix enquiry - '+fields.service,text:['Full name: '+fields.name,'Work email: '+fields.email,'Company: '+fields.company,'Service: '+fields.service,'','Project requirements:',fields.requirements].join(String.fromCharCode(10))});
    return res.json({sent:true});
  } catch { return res.sendStatus(502); }
});
