// ═══════════════════════════════════════════════════
//  CROCHET CRAFT — BACKEND SERVER
//  Node.js + Express  |  File: server.js
// ═══════════════════════════════════════════════════
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs         = require('fs');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ──────────────────────────────────
app.use(cors({ origin: function(origin, cb){ cb(null, true); }, methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.options('*', cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── DATA FILES ──────────────────────────────────
const DATA_DIR      = path.join(__dirname, 'data');
const ORDERS_FILE   = path.join(DATA_DIR, 'orders.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(ORDERS_FILE))   fs.writeFileSync(ORDERS_FILE,   '[]');
if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, '[]');

// Default products — loaded first time only
const DEFAULT_PRODUCTS = [
  { id:'prod-1', name:'Blush Flower Studs',      price:280,  category:'earrings',    image:'images/flower stud.png',         tag:'Best Seller', description:'Soft blush pink crochet flower with pearl centre.' },
  { id:'prod-2', name:'Hot Pink Flower Studs',   price:300,  category:'earrings',    image:'images/hot pink stud.png',       tag:'Bold Look',   description:'Bold hot pink crochet flower studs with pearl.' },
  { id:'prod-3', name:'Crochet Bow Dangles',      price:200,  category:'earrings',    image:'images/bow earings.png',         tag:'Trending',    description:'Hot pink crocheted bow dangle earrings.' },
  { id:'prod-4', name:'Red Heart Studs',          price:260,  category:'earrings',    image:'images/heart studs.png',         tag:'Gift Idea',   description:'Crocheted red heart stud earrings.' },
  { id:'prod-5', name:'Floral Crochet Hair Pins', price:200,  category:'hairpins',    image:'images/hair pin.webp',           tag:'Set of 6',    description:'Beautiful handmade hair pins.' },
  { id:'prod-6', name:'Crochet Scrunchie Set',    price:1000, category:'scrunchies',  image:'images/scrunchiess.webp',        tag:'Best Seller', description:'Fluffy crochet scrunchies in 5 shades.' },
  { id:'prod-7', name:'Boho Crochet Headband',    price:420,  category:'headbands',   image:'images/headband.webp',           tag:'Top Pick',    description:'Wide boho headband in sage green.' },
  { id:'prod-8', name:'Daisy Chain Bracelet',     price:250,  category:'bracelets',   image:'images/bracelet.webp',           tag:'Best Seller', description:'Dainty daisy crochet bracelet.' },
  { id:'prod-9', name:'Rose Gajra Set',           price:1000, category:'gajray',      image:'images/gajray.png',              tag:'Bridal',      description:'Set of 2 crochet rose gajra bun wraps.' },
  { id:'prod-10',name:'Flower Bookmark',          price:180,  category:'bookmarks',   image:'images/bookmark.webp',           tag:'Gift Idea',   description:'Crochet flower bookmark with tassel.' },
  { id:'prod-11',name:'Mehndi Paranda',           price:450,  category:'paranda',     image:'images/rose paranda.png',        tag:'Festive',     description:'Multicolour paranda for celebrations.' },
  { id:'prod-12',name:'Cute Sunflower Keychain',  price:450,  category:'keychains',   image:'images/sunflower keychain.webp', tag:'Trending',    description:'Adorable crocheted bag charm.' },
];
if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(DEFAULT_PRODUCTS, null, 2));

// ─── EMAIL CONFIG ────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'craftcrochet605@gmail.com',
    pass: process.env.EMAIL_PASS || 'ocjf rcwf vscv hxsn'
  }
});

// ─── PAYMENT DETAILS ─────────────────────────────
const PAYMENT_DETAILS = {
  easypaisa: { number: 'YOUR_EASYPAISA_NUMBER_HERE', name: 'YOUR_NAME_HERE' },
  bank: { bankName: 'Allied Bank Limited (ABL)', accountNumber: 'YOUR_BANK_ACCOUNT_NUMBER_HERE', accountTitle: 'YOUR_ACCOUNT_TITLE_HERE', iban: 'YOUR_IBAN_HERE' }
};

// ─── HELPERS ─────────────────────────────────────
function readJSON(f) { try { return JSON.parse(fs.readFileSync(f,'utf-8')); } catch { return []; } }
function writeJSON(f,d) { fs.writeFileSync(f, JSON.stringify(d,null,2)); }

// ══════════════════════════════════════════════════
//  PRODUCTS API
// ══════════════════════════════════════════════════

// GET all products
app.get('/api/products', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  res.json({ success: true, products });
});

// GET products by category
app.get('/api/products/category/:cat', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const filtered = products.filter(p => p.category === req.params.cat);
  res.json({ success: true, products: filtered });
});

// POST — add new product
app.post('/api/products', (req, res) => {
  const { name, price, category, image, tag, description } = req.body;
  if (!name || !price || !category || !image) {
    return res.status(400).json({ success: false, message: 'Name, price, category and image are required.' });
  }
  const products = readJSON(PRODUCTS_FILE);
  const newProduct = {
    id:          'prod-' + Date.now(),
    name, price: Number(price), category,
    image:       image.startsWith('images/') ? image : 'images/' + image,
    tag:         tag || '',
    description: description || ''
  };
  products.push(newProduct);
  writeJSON(PRODUCTS_FILE, products);
  console.log('✅ Product added:', newProduct.name);
  res.json({ success: true, message: 'Product added!', product: newProduct });
});

// PUT — edit product
app.put('/api/products/:id', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Product not found.' });
  const { name, price, category, image, tag, description } = req.body;
  products[idx] = {
    ...products[idx],
    name:        name        || products[idx].name,
    price:       price       ? Number(price) : products[idx].price,
    category:    category    || products[idx].category,
    image:       image       ? (image.startsWith('images/') ? image : 'images/' + image) : products[idx].image,
    tag:         tag         !== undefined ? tag : products[idx].tag,
    description: description !== undefined ? description : products[idx].description,
    updatedAt:   new Date().toISOString()
  };
  writeJSON(PRODUCTS_FILE, products);
  console.log('✅ Product updated:', products[idx].name);
  res.json({ success: true, message: 'Product updated!', product: products[idx] });
});

// DELETE one product
app.delete('/api/products/:id', (req, res) => {
  const products = readJSON(PRODUCTS_FILE);
  const newList  = products.filter(p => p.id !== req.params.id);
  if (products.length === newList.length) return res.status(404).json({ success: false, message: 'Product not found.' });
  writeJSON(PRODUCTS_FILE, newList);
  res.json({ success: true, message: 'Product deleted.' });
});

// ══════════════════════════════════════════════════
//  ORDERS API
// ══════════════════════════════════════════════════
app.post('/api/orders', async (req, res) => {
  try {
    const { name, phone, email, address, city, notes, paymentMethod, cartItems, totalAmount } = req.body;
    if (!name || !phone || !address || !city || !cartItems || cartItems.length === 0)
      return res.status(400).json({ success: false, message: 'Required fields missing.' });

    const order = { id:'ORD-'+Date.now(), createdAt:new Date().toISOString(), status:'pending', customer:{name,phone,email,address,city,notes}, paymentMethod, cartItems, totalAmount };
    const orders = readJSON(ORDERS_FILE); orders.push(order); writeJSON(ORDERS_FILE, orders);

    const itemsList = cartItems.map(i=>`• ${i.name} x${i.qty} — PKR ${(i.priceNum*i.qty).toLocaleString()}`).join('\n');
    let payInfo = paymentMethod==='easypaisa'
      ? `EasyPaisa/JazzCash\nSend: PKR ${totalAmount.toLocaleString()}\nTo: ${PAYMENT_DETAILS.easypaisa.number}\nName: ${PAYMENT_DETAILS.easypaisa.name}`
      : `Allied Bank Transfer\nSend: PKR ${totalAmount.toLocaleString()}\nAccount: ${PAYMENT_DETAILS.bank.accountNumber}\nTitle: ${PAYMENT_DETAILS.bank.accountTitle}`;

    const adminMail = {
      from: process.env.EMAIL_USER, to: process.env.EMAIL_USER,
      subject: `🛒 New Order! ${order.id} — PKR ${totalAmount.toLocaleString()}`,
      text: `NEW ORDER\n\nOrder ID: ${order.id}\nDate: ${new Date().toLocaleString('en-PK',{timeZone:'Asia/Karachi'})}\n\nCustomer: ${name}\nPhone: ${phone}\nEmail: ${email||'N/A'}\nCity: ${city}\nAddress: ${address}\nNotes: ${notes||'None'}\n\nItems:\n${itemsList}\n\nPayment:\n${payInfo}\n\n⚠️ Verify payment before shipping!\nWhatsApp customer: ${phone}`
    };
    if (email) {
      let payReminder = paymentMethod==='easypaisa'
        ? `Send PKR ${totalAmount.toLocaleString()} to EasyPaisa: ${PAYMENT_DETAILS.easypaisa.number}`
        : `Transfer PKR ${totalAmount.toLocaleString()} to Allied Bank: ${PAYMENT_DETAILS.bank.accountNumber}`;
      await transporter.sendMail({ from:process.env.EMAIL_USER, to:email, subject:'✅ Order Received — Crochet Craft',
        html:`<div style="font-family:sans-serif;max-width:500px;padding:20px;background:#faf6ef;border-radius:12px;">
          <h2 style="color:#7d9b76;">🧶 Crochet Craft</h2>
          <h3>Thank you, ${name}! ❤️</h3>
          <p>Your order has been received. We will contact you within <strong>24 hours</strong>.</p>
          <div style="background:#fff;border-radius:8px;padding:15px;margin:15px 0;border:1px solid #ddeadb;">
            <strong>Order ID:</strong> <span style="color:#7d9b76;">${order.id}</span><br>
            <strong>Total:</strong> PKR ${totalAmount.toLocaleString()}<br>
            <strong>Payment:</strong> ${paymentMethod}
          </div>
          <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:12px;font-size:14px;color:#7a6318;">
            💳 <strong>Payment Reminder:</strong> ${payReminder}<br>
            Share your Order ID <strong>${order.id}</strong> when we contact you.
          </div>
          <p style="color:#7a6a5a;font-size:13px;margin-top:15px;">📞 03235963246 &nbsp;|&nbsp; 📧 craftcrochet605@gmail.com</p>
          <p style="color:#b5c9b0;font-size:12px;">— Crochet Craft Team 🌿</p>
        </div>`
      }).catch(e=>console.error('Customer email error:',e));
    }
    await transporter.sendMail(adminMail).catch(e=>console.error('Admin email error:',e));
    console.log('✅ Order saved:', order.id);
    res.json({ success:true, message:'Order placed!', orderId:order.id });
  } catch(e) { console.error('Order error:',e); res.status(500).json({success:false,message:'Server error.'}); }
});

app.get('/api/orders', (req,res) => res.json({success:true, orders:readJSON(ORDERS_FILE).reverse()}));
app.put('/api/orders/:id', (req,res) => {
  const valid = ['pending','confirmed','shipped','delivered','cancelled'];
  if (!valid.includes(req.body.status)) return res.status(400).json({success:false,message:'Invalid status.'});
  const orders = readJSON(ORDERS_FILE), idx = orders.findIndex(o=>o.id===req.params.id);
  if (idx===-1) return res.status(404).json({success:false,message:'Order not found.'});
  orders[idx].status = req.body.status; orders[idx].updatedAt = new Date().toISOString();
  writeJSON(ORDERS_FILE, orders);
  res.json({success:true, message:`Status updated to ${req.body.status}.`});
});
app.delete('/api/orders/:id', (req,res) => {
  const orders = readJSON(ORDERS_FILE), filtered = orders.filter(o=>o.id!==req.params.id);
  if (orders.length===filtered.length) return res.status(404).json({success:false,message:'Not found.'});
  writeJSON(ORDERS_FILE,filtered); res.json({success:true,message:'Order deleted.'});
});
app.delete('/api/orders', (req,res) => { writeJSON(ORDERS_FILE,[]); res.json({success:true,message:'All orders deleted.'}); });

// ══════════════════════════════════════════════════
//  CONTACT API
// ══════════════════════════════════════════════════
app.post('/api/contact', async (req,res) => {
  try {
    const {name,phone,email,message} = req.body;
    if (!name||!email||!message) return res.status(400).json({success:false,message:'Name, email and message required.'});
    const msgs = readJSON(MESSAGES_FILE);
    msgs.push({id:'MSG-'+Date.now(),createdAt:new Date().toISOString(),name,phone,email,message});
    writeJSON(MESSAGES_FILE,msgs);
    await transporter.sendMail({from:process.env.EMAIL_USER,to:process.env.EMAIL_USER,subject:`💌 New Message — ${name}`,text:`Name: ${name}\nPhone: ${phone||'N/A'}\nEmail: ${email}\n\nMessage:\n${message}`}).catch(e=>console.error(e));
    res.json({success:true,message:'Message sent!'});
  } catch(e) { res.status(500).json({success:false,message:'Server error.'}); }
});
app.get('/api/messages', (req,res) => res.json({success:true, messages:readJSON(MESSAGES_FILE).reverse()}));
app.delete('/api/messages/:id', (req,res) => {
  const msgs=readJSON(MESSAGES_FILE), filtered=msgs.filter(m=>m.id!==req.params.id);
  if (msgs.length===filtered.length) return res.status(404).json({success:false,message:'Not found.'});
  writeJSON(MESSAGES_FILE,filtered); res.json({success:true,message:'Message deleted.'});
});
app.delete('/api/messages', (req,res) => { writeJSON(MESSAGES_FILE,[]); res.json({success:true,message:'All messages deleted.'}); });

// ══════════════════════════════════════════════════
//  HEALTH + ROOT
// ══════════════════════════════════════════════════
app.get('/api/health', (req,res) => res.json({success:true, message:'🌿 Server is running!', time:new Date().toLocaleString('en-PK',{timeZone:'Asia/Karachi'})}));
app.get('/', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));

app.listen(PORT, () => {
  console.log(`
🧶 ══════════════════════════════════════
   CROCHET CRAFT SERVER RUNNING!
   Website    : http://localhost:${PORT}
   Admin Panel: http://localhost:${PORT}/admin.html
   Products   : data/products.json
══════════════════════════════════════ 🧶`);
});