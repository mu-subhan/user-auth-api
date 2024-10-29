
require('dotenv').config();
const express =require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const app = express();

// connect to monodb

const uri = process.env.MONGODB_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Schema for user collection

const userSchema = new mongoose.Schema({
    username:String,
    email:String,
    password:String,
})
// create user model based on schema
const User = mongoose.model('User',userSchema);

// Middleware to parse JSON bodies
app.use(express.json());



// midleware for JWT verification
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    jwt.verify(token, 'secret', (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      req.user = decoded;
      next();
    });
  };

// Route to register a new user
app.post('/api/register',async (req,res) =>{
  try{
    // check if email alreade exits
    const existingUser = await User.findOne({email:req.body.email});
    if(existingUser){
        return res.status(400).json({error:"Email already exits"});
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password,10);

    // create new user
    const newUser = new User({
        username:req.body.username,
        email:req.body.email,
        password:hashedPassword
    });

    await newUser.save();
    res.status(201).json({mesage:"User registered successfuly"});
    console.log(newUser);
  }
  catch(error){
    res.status(500).json({error:"Internal server issue"});
    
  }
});

// Route to authenticate and login user

app.post('/api/login',async (req,res) =>{
    try {
        // check if the email is exit
        const user = await User.findOne({email:req.body.email});
        if(!user){
            return res.status(401).json({error:"Invalid credentials"});
        }
        // compare password
        const passwordMatch = await bcrypt.compare(req.body.password,user.password)
        if(!passwordMatch){
            return res.status(401).json({error:"Invalid Credential"})
        }
        // Genrate JWT token
        const token = jwt.sign({email:user.email},'secret');
        res.status(200).json({token});
    } catch (error) {
        res.status(500).json({error: "Server error"});
    }
});

// protected route to get user details
app.get('api/user',verifyToken,async (req,res) =>{
  try{
    // fetch user detail using decoded token 
    const user = await User.findOne({email:req.user.email});
    if(!user){
      return res.status(404).json({error:"user not found"});
    }
    res.status(200).json({username:username,email:user.email})
  } catch(error){
    res.status(500).json({error:"Internal server error"});
  }
});
// Default route
app.get('/',(req,res)=>{
  res.send("Welcome to user rehistration and login api");
});

app.listen(5000,()=>{
  console.log("server is running");
  
})