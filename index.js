const port = 4000;
const express = require('express');
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { type } = require('os');
app.use(express.json());
app.use(cors());

//connect
mongoose.connect("mongodb+srv://hngo34048:HoaNgo1234@webbanhang.rah0xrk.mongodb.net/webbantruyen2");

//API create
app.get("/",(req, res)=>{
    res.send("Express app is running");
})
// Image Storage Engine

const storage = multer.diskStorage({
    destination: './upload/images',
    filename:(req, file, cb)=>{
        return cb(null, `${file.filename}_${Date.now()}${path.extname(file.originalname)}`);
    }
})

const upload = multer({storage:storage})
// Upload anh
app.use('/images', express.static('upload/images'));
app.post("/upload", upload.single('product'),(req,res)=>{
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    })
})
// Schema for creating Product
const Product = mongoose.model("Product",{
    id: {
        type: Number,
        require: true,
    },
    name:{
        type: String,
        require: true,
    },
    image:{
        type: String,
        require: true,
    },
    category:{
        type:String,
        require: true,
    },
    new_price:{
        type: Number,
        require: true,
    },
    old_price:{
        type: Number,
        require: true,
    },
    date:{
        type: Date,
        default: Date.now(),
    },
    available:{
        type: Boolean,
        default: true,
    }
})
app.post('/addproduct',async(req, res)=>{
    let products = await Product.find({});
    let id;
    if(products.length> 0){
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1;
    }
    else{
        id = 1;
    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category,
        new_price: req.body.new_price,
        old_price: req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("save");
    res.json({
        success: true,
        name: req.body.name,
    })
})
// schema user
const Users = mongoose.model('User',{
    name:{
        type: String,
        
    },
    email:{
        type: String,
        unique: true,
    },
    password:{
        type: String,

    },
    cartData:{
        type:Object
    },
    date:{
        type: Date,
        default: Date.now
    }
})
app.post('/signup', async(req, res)=>{
    let check = await Users.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({success:false, error:"email da ton tai"});

    }
    let cart = {};
    for (let index = 0; index < 300; index++) {
        cart[index] = 0;
    }
    const user = new Users({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        cartData: cart
    })
    await user.save();
    const data = {
        user:{
            id: user.id
        }
    }
    const token = jwt.sign(data,'secret_ecom');
    res.json({
        success: true,
        token
    })
})
// create middleware
const fetchUser = async (req, res, next)=>{
    const token = req.header('auth-token');
    if(!token){
        res.status(401).send({
            error:"Please dang nhap"
        })
    }
    else{
        try {
            const data = jwt.verify(token,'secret_ecom');
            req.user = data.user;
            next();
        } catch (error) {
            res.status(401).send({
                error:"please dang nhap"
            })
        }
    }
}
//creat api for addtocart
app.post('/addtocart',fetchUser ,async(req, res)=>{
        let userData = await Users.findOne({_id: req.user.id});
        userData.cartData[req.body.id] += 1 ;
        await Users.findOneAndUpdate({_id:req.user.id}, {cartData: userData.cartData})
        res.send("Added")
})
// creating endpoint for user login
app.post('/login', async (req, res)=>{
    let user = await Users.findOne({email: req.body.email});
    if(!user){
        return res.status(400).json({success:false, message:"NOTFOUND"})
    }
    else{
        const passcompare = req.body.password === user.password;
        if(passcompare){
            const data = {
                user:{
                    id: user.id
                }
            }
            const token = jwt.sign(data, 'secret_ecom');
            res.json({
                success: true,
                token
            })
        }
        else{
            res.json({
                success:false,
                errors:"Wrong password"
            })
        }
    }

})
//Creating API for deleting product
app.post('/removeproduct', async (req, res)=>{
    await Product.findOneAndDelete({id: req.body.id});
    console.log("remove");
    res.json({
        success: true,
        name: req.body.name,
    })
})
//creating related product
app.get('/newcolection', async(req, res)=>{
    let product = await Product.find({});
    let newcollection = product.slice(1).slice(-8);
    console.log("newcollection");
    res.send(newcollection);
})
//creating API for getting all products
app.get('/allproduct', async(req, res)=>{
    let products = await Product.find({});
    console.log("all product");
    res.send(products);
})
app.listen(port,(error)=>{
    if(!error){
        console.log("Server Running on port"+port);
    }else{
        console.log("Error");
    }
})