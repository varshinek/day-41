const express =require('express');
const User = require('../model/user');
const router =express.Router();
const bcrypt=require("bcryptjs")
const generateToken=require('../utils/toxen')//function to generate JWT token
const verifyToken=require('../middleware/auth')// Middleware to verify token
const nodemailer =require('nodemailer')


router.get("/test",(req,res)=>
    res.json({ message: "Api Testing Sucessful" })
);


router.post("/register",async (req,res)=>{
    try{
    const {email, password}=req.body;
    const user =await User.findOne({email});
    if(!user){
        const hashedPassword = await bcrypt.hash(password,10)
        const newUser =new User({email,password:hashedPassword})
        await newUser.save();
        return res.status(201).json({message:`User Created ${newUser}`})
        // return res.status(201).send(user)
    }
    else{
        return res.status(404).json({message: "User already Exists"})

    }
    }
    catch (error) {
        //res.status(404).json({message: "User already Exists"})
        return  res.status(401).send(error)
    }
})
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        const token = generateToken(user);
        res.json({ user, token }); // Sending user information along with the token
    } catch (error) {
        console.error('Login error:', error); // Debug log
        return res.status(500).json({ message: "Server error during login" });
    }
});

router.get('/data',verifyToken, (req,res)=>{
    res.json({message:`Welcome,${req.user.email}! This is protected data`})
   
})

router.get('/verify-token/:token', async (req, res) => {
    const { token } = req.params;
    console.log(`Received token: ${token}`);  // Log the received token
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
  
      if (!user) {
        console.log('Token not found or expired');  // Log if token is not found or expired
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
  
      res.json({ valid: true, message: 'Token is valid' });
    } catch (error) {
      console.error('Server error:', error);  // Log server error
      res.status(500).json({ message: 'Server error' });
    }
  });
  

router.post('/reset-password',async(req,res)=>{
    const { email } = req.body;

    const user = await User.findOne({email});
    if (!user){
        return res.status(404).json({message: "User not found"});
    }

    const token = Math.random().toString(36).slice(-8);

    user.resetPasswordToken =token;
    user.resetPasswordExpires=Date.now() + 3600000
    await user.save();

    const transporter =nodemailer.createTransport({
        service: "gmail",
        auth:{
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        }
    })
       const message = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: 'Password Reset Request',
        // text: `You requested a password reset. Please click the following link to reset your password: ${resetLink}. This link will expire in 1 hour.`,
        html: `<!DOCTYPE html>
                <html lang="en" >
                <head>
                <meta charset="UTF-8">
                <title>OTP Email Template</title>
                </head>
                <body>
                <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
                <div style="margin:50px auto;width:70%;padding:20px 0">
                    <div style="border-bottom:1px solid #eee">
                    <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Trendy</a>
                    </div>
                    <p style="font-size:1.1em">Hi,</p>
                    <p>Thank you for choosing Trendy. Use the following OTP to complete your Password Recovery Procedure. OTP is valid for 1 hour</p>
                    <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${token}</h2>
                    <p style="font-size:0.9em;">Regards,<br />Trendy</p>
                    <hr style="border:none;border-top:1px solid #eee" />
                    <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                    <p>Trendy Inc</p>
                    <p>Kumar Nagar,60 Feet Road</p>
                    <p>Tirupur</p>
                    </div>
                </div>
                </div>
                </body>
                </html>`,
    };



    transporter.sendMail(message, (err,info)=>{
        if(err){
            return res.status(404).json({message:"Something Went Wrong, Try again!!!"})
        }
        return res.status(200).json({message: "Password Reset Email Sent Successfully"})
    })
})

router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(404).json({ message: 'Invalid token or expired' });
        }

        const hashPassword = await bcrypt.hash(password, 10);
        user.password = hashPassword;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();
        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Server error:', error);  // Debug log
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports=router