const express = require("express");
const authController = require("../controllers/auth");
const prevention = require("sqlstring");
const mysql = require("mysql2");
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
  multipleStatements: true
});
const router = express.Router();

// GET ROUTES-------------------------------------------------------------------

router.get("/signup", function(req, res) {
  res.render("signup");
});

router.get("/login", function(req, res) {
  res.render("login");
});

router.get("/successSignUp", function(req, res) {
  res.render("successSignUp");
});

router.get("/emailError", function(req, res) {
  res.render("emailError");
});

router.get("/passwordError", function(req, res) {
  res.render("passwordError");
});

router.get("/wrongCredentials", function(req, res) {
  res.render("wrongCredentials");
});

router.get("/posts", authController.isLogedIn, function(req, res) {

  const user = req.user;

  db.query(`SELECT DISTINCT *
    FROM users
    INNER JOIN blog_post ON users.id = blog_post.postedBy;
    SELECT DISTINCT *
    FROM users
    INNER JOIN question_post ON users.id = question_post.postedBy;`, function(err, blogs) {
    if (err) {
      console.log(err);
    } else {
      res.render("posts", {blogs, user});
      // res.json(blogs);
    }
  })
});

router.get("/profile", authController.isLogedIn, function(req, res) {

  if (req.user) {
    res.render("profile", {user: req.user});
  } else {
    res.redirect("/login");
  }

});

router.get("/postBlog", function(req, res) {
  res.redirect("posts");
});

router.get("/postQuestion", function(req, res) {
  res.redirect("posts");
});

router.get("/blogComments/:id/:userID", function(req, res) {
  const id = req.params.id;
  const userID = req.params.userID;
  const img = "Asquery.png"

  db.query(`SELECT * FROM blog_post WHERE blog_id = ?;
    SELECT * FROM users WHERE id = ?;
    SELECT * FROM blog_reply WHERE blog_id = ?;`, [id, userID, id], function(err, blogPost, img) {
    if (err) {
      console.log(err);
    } else {
      res.render("blogComments", {blogPost, img});
      // res.json(blogPost[1]);
    }
  })
})

router.get("/questionComments/:id/:userID", function(req, res) {
  const id = req.params.id;
  const userID = req.params.userID;

  db.query(`SELECT * FROM question_post WHERE question_id = ?;
    SELECT * FROM users WHERE id = ?;
    SELECT * FROM question_reply WHERE question_id = ?;`, [id, userID, id], function(err, questionPost) {
    if (err) {
      console.log(err);
    } else {
      res.render("questionComments", {questionPost});
      // res.json(questionPost);
    }
  })
})

router.get("/myPosts", authController.isLogedIn, function(req, res) {
  const user = req.user;

  db.query(`SELECT * FROM blog_post WHERE postedBy = ?;
    SELECT * FROM question_post WHERE postedBy = ?;`, [user.id, user.id], function(err, myPosts) {
      if (err) {
        console.log(err);
      } else {
        res.render("myPosts", {myPosts, user});
        // res.json(myPosts);
      }
    })
})

// -----------------------------------------------------------------------------

// POST ROUTES------------------------------------------------------------------

router.post("/postBlog", authController.isLogedIn, (req, res) => {

  const post = req.body;
  const user = req.user;

  // console.log(post);
  // console.log(user.id);

  db.query(
    `INSERT INTO blog_post(blogTitle, blogContent, postedBy)
    VALUES (${prevention.escape(post.blogTitle)},
    ${prevention.escape(post.blogContent)},
    ${prevention.escape(user.id)});
    SELECT * FROM users WHERE id = 1;`, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Blog Posted!");
        res.redirect("/posts");
        // res.json(result);
      }
    })

});

router.post("/postQuestion", authController.isLogedIn, (req, res) => {
  const post = req.body;
  const user = req.user;

  console.log(post);
  console.log(user.id);

  db.query(`INSERT INTO question_post(question, postedBy)
  VALUES (${prevention.escape(post.question)},
  ${prevention.escape(user.id)});`, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Question Posted!");
      res.redirect("/posts");
    }
  })
})

router.post("/questionReply/:question_id", authController.isLogedIn, function(req, res) {

  const post = req.body;
  const user = req.user;
  const question_id = req.params.question_id;

  // console.log(post);
  // console.log(question_id);
  // console.log(userID);

  db.query(`INSERT INTO question_reply(question_reply, question_id, postedBy, fName, lName)
  VALUES (${prevention.escape(post.reply)},
  ${prevention.escape(question_id)},
  ${prevention.escape(user.id)},
  ${prevention.escape(user.fName)},
  ${prevention.escape(user.lName)});`, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Reply Posted!");
      res.redirect("/posts");
    }
  })

})

router.post("/blogReply/:blog_id", authController.isLogedIn, function(req, res) {

  const post = req.body;
  const user = req.user;
  const blog_id = req.params.blog_id;

  console.log(post);
  console.log(blog_id);
  // console.log(userID);

  db.query(`INSERT INTO blog_reply(blog_reply, blog_id, postedBy, fName, lName)
  VALUES (${prevention.escape(post.reply)},
  ${prevention.escape(blog_id)},
  ${prevention.escape(user.id)},
  ${prevention.escape(user.fName)},
  ${prevention.escape(user.lName)});`, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Reply Posted!");
      res.redirect("/posts");
    }
  })

})

router.post("/postReply", authController.isLogedIn, (req, res) => {
  const post = req.body;
  const user = req.user;

  // console.log("post");
  // console.log(user.id);

  db.query(`INSERT INTO reply_post(reply, postedBy)
  VALUES (${prevention.escape(post.reply)},
  ${prevention.escape(user.id)});`, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Reply Posted!");
      res.redirect("/posts");
    }
  })
})

// -----------------------------------------------------------------------------



module.exports = router;
