const {validationResult} = require("express-validator");
const fs = require("fs");
const path = require("path");

const io = require("../socket");
const Post = require("../models/post");
const User = require("../models/user");

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  try{
    const totalItems = await Post.find().count();
    const posts = await Post.find()
      .populate('creator')
      .sort({createdAt: -1})
      .skip((currentPage-1)*perPage)
      .limit(perPage)

    res.status(200).json({
      message: "Fetched posts successfully", 
      posts: posts, 
      totalItems: totalItems});
  }
  catch(err){
    if(!err.statuscode)
    {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty())
  {
    const error = new Error("Validator failed, entered data is incorrect!");
    error.statusCode = 422;
    throw error;
  }
  if(!req.file)
  {
    const error = new Error("No image provided!");
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path;
  const title = req.body.title;
  const content = req.body.content;
  const post = new Post({
    title: title, 
    content: content,
    imageUrl: imageUrl,
    creator: req.userId
  })
  try{
    let result = await post.save();
    console.log(result);
    const user =  await User.findById(req.userId);
    const creator = user;
    user.posts.push(post);
    result =  await user.save();
    io.getIO().emit('posts', {
      action: 'create',
      post: {
        ...post._doc,
        creator: {_id: req.userId, name: user.name}
      }})
    res.status(201).json({
      message: 'Post created successfully!',
      post: post,
      creator: {_id: creator._id, name: creator.name}
    });
  }
  catch(err){
    if(!err.statusCode)
    {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if(!post)
    {
      const error = new Error("Cound not find post");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({message: "Post fetched", post: post});
  } 
  catch(err)
  {
    if(!err.statusCode)
    {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty())
  {
    const error = new Error("Validator failed, entered data is incorrect!");
    error.statusCode = 422;
    throw error;
  }
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if(req.file)
  {
    imageUrl = req.file.path;
  }
  try {
    const post = await Post.findById(postId).populate('creator');
    if(!post)
        {
          const error = new Error("Could not find post!");
          error.statusCode = 404;
          throw error;
        }
    if(post.creator._id.toString() !== req.userId)
    {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }
    if(imageUrl !== post.imageUrl)
    {
      clearImage(post.imageUrl);
    }
    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;
    const result = await post.save();
    io.getIO().emit("posts", { action: "update", post: result})
    res.status(200).json({message: "Post updated!", post: result});
  }
  catch(err) {
    if(!err.statusCode)
    {
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.deletePost = async (req, res, next) =>{
  const postId = req.params.postId;
  try{
    const post = await Post.findById(postId);
    if(!post)
    {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }
    if(post.creator.toString() !== req.userId)
    {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }
    clearImage(post.imageUrl);
    const result = await Post.deleteOne({_id: postId});
    console.log(result);
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();
    io.getIO().emit("posts", {action: "delete", post: postId})
    res.status(200).json({message: "Deleted post!"});
  }
  catch(err){
    if(!err.statusCode)
    {
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.getStatus = async (req, res, next) =>{
  try{
    const user = await User.findById(req.userId);
    if(!user)
    {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({status: user.status, message: "Get status succesfully"});
  }
  catch(err)
  {
    if(!err.statusCode)
    {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty())
  {
    const error = new Error("Validator failed, entered data is incorrect!");
    error.statusCode = 422;
    return next(error);
  }
  try{
    const user = await User.findById(req.userId);
    if(!user)
    {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    user.status = req.body.status;
    const result = await user.save();
    res.status(200).json({message: "Status updated!", status: result})
    console.log(result);
  }
  catch(err){
    if(!err.statusCode)
    {
      err.statusCode = 500;
    }
    next(err);
  }
}

const clearImage = filePath => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, err => console.log(err));
}
