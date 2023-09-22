const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User");
const AddBlogPost = require("./models/AddBlogPost");
const bcrypt = require("bcryptjs");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser"); 
const multer = require("multer");
const uploadMiddleware = multer({ dest: "uploads/" });
const fs = require("fs");
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));

const salt = bcrypt.genSaltSync(10);
const secret = "asdfe45we45w345wegw345werjktjwertkj";
 
// ?sign up endpoints
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  //  const userDoc = await User.create({
  //    username,
  //    password: bcrypt.hashSync(password, salt),
  //  });
  //  res.json(userDoc);

  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
    });
    res.json(userDoc);
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});
//? log in endpoints
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  const passOk = bcrypt.compareSync(password, userDoc.password);
  //   res.json(passOk);
  if (passOk) {
    // logged in
    jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
      if (err) throw err;
      //   res.json(token);
      res.cookie("token", token).json({
        id: userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json("wrong credentials");
  }
});
//? profile endpoint
app.get("/profile", (req, res) => {
  // res.json(req.cookies)
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) throw err;
    res.json(info);
  });
});
// ! log out endpoint
app.post("/logout", (req, res) => {
  res.cookie("token", "").json("ok");
});

// ? addBlogpost endpoint

app.post("/addBlogPost", uploadMiddleware.single("file"), async (req, res) => {
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  const newPath = path + "." + ext;
  fs.renameSync(path, newPath);
  res.json(ext);
  // const { title, summary, content } = req.body;
  //  const postDoc = await AddBlogPost.create({
  //    title,
  //    summary,
  //    content,
  //    cover: newPath,
  // //    author: info.id,
  //  });
  // res.json({ postDoc });
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;
    const { title, summary, content } = req.body;
    const postDoc = await AddBlogPost.create({
      title,
      summary,
      content,
      cover: newPath,
      author: info.id,
    });
    res.json(postDoc);
  });
});


app.put(
  "/updateBlogPost",
  uploadMiddleware.single("file"),
  async (req, res) => {
    let newPath = null;
    if (req.file) {
      const { originalname, path } = req.file;
      const parts = originalname.split(".");
      const ext = parts[parts.length - 1];
      newPath = path + "." + ext;
      fs.renameSync(path, newPath);
    }

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) throw err;
      const { id, title, summary, content } = req.body;
      const postDoc = await AddBlogPost.findById(id);
      const isAuthor =
        JSON.stringify(postDoc.author) === JSON.stringify(info.id);
      if (!isAuthor) {
        return res.status(400).json("you are not the author");
      }
      await postDoc.update({
        title,
        summary,
        content,
        cover: newPath ? newPath : postDoc.cover,
      });

      res.json(postDoc);
    });
  }
);
// ?e getblog post endpoint
app.get("/getBlogPost", async (req, res) => {
  res.json(
    await AddBlogPost.find()
      .populate("author", ["username"])
      .sort({ createdAt: -1 })
      .limit(12)
  );
});

// ? blog endpoint to read the detail of the post
app.get("/getDetailBlogPost/:id", async (req, res) => {
  const { id } = req.params;
  const postDoc = await AddBlogPost.findById(id).populate("author", [
    "username",
  ]);
  res.json(postDoc);
});
// ? update endpoint

const port = 4444;
const hostName = "localhost";
app.listen(port, (err) => {
  if (err) {
    console.log(`error found: ${err}`);
  } else {
    console.log(`connected at ${port}:http://${hostName}:${port}`);
  }
});
// mongodb+srv://mistirblog:XYgIdLQLt3GOQpf7@cluster0.jtgl97z.mongodb.net/
