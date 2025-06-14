import express from "express";
import User from "../models/User.js";
import Joi from "joi";
import bcrypt from "bcrypt";
import sendResponse from "../helpers/sendResponse.js";
import "dotenv/config";
import jwt from "jsonwebtoken";
const router = express.Router();

const registerSchema = Joi.object({

  email: Joi.string().email({
    minDomainSegments: 2,
    tlds: { allow: ["com", "net"] },
  }),

  password: Joi.string().min(6).required(),

  fullname: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      "string.base": "Name must be a string",
      "string.empty": "Name is required",
      "string.alphanum": "Name must only contain letters and numbers",
      "string.min": "Name must be at least 3 characters long",
      "string.max": "Name must be at most 30 characters long",
      "any.required": "Name is sdsd required",
    }),

  // fullname: Joi.string().alphanum().min(3,'minimun 3 char').max(30).required("name is req"),
});

const loginSchema = Joi.object({

  email: Joi.string().email({

    minDomainSegments: 2,

    tlds: { allow: ["com", "net"] },
  }).required("Email is req"),

  password: Joi.string().min(6).required(),
});

router.post("/register", async (req, res) => {

  const { error, value } = registerSchema.validate(req.body);

  console.log(value , "value=======")

  if (error) return sendResponse(res, 400, null, true, error.message);

  const user = await User.findOne({ email: value.email });

  if (user)
    return sendResponse( res, 403, null, true, "User with this email already register" );

  // const hashedPassword = await bcrypt.hash(value.passowrd, 10);
  const hashedPassword = await bcrypt.hash(value.password, Number(process.env.SaltRounds));

  value.password = hashedPassword;

  let newUser = new User({ ...value });

  newUser = await newUser.save();

  sendResponse(res, 201, newUser, false, "User Reqistered Sucessfully");
});

router.post("/login", async (req, res) => {

  const { error, value } = loginSchema.validate(req.body);

  if (error) return sendResponse(res, 400, null, true, error.message);

  const user = await User.findOne({ email: value.email }).lean();

  if (!user) return sendResponse(res, 403, null, true, "User is not register");

  // const hashedPassword = await bcrypt.hash(value.passowrd, 10);
  const isPasswordValid = await bcrypt.compare(value.password, user.password);

  if(!isPasswordValid) return sendResponse(res, 403, null, true, "Invalid Credentails");

  var token = jwt.sign(user, process.env.AUTH_SECRET);

  sendResponse(res, 200, {user, token}, false, "User Login Sucessfully");
});

export default router;
