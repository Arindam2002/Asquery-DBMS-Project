const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {promisify} = require("util");

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
  multipleStatements: true
});

exports.signup = function (req, res) {
    // console.log(req.body);


    // const fName = req.body.fName;
    // const lName = req.body.lName;
    // const contactNumber = req.body.contactNumber;
    // const email = req.body.email;
    // const password = req.body.password;
    // const confirmPassword = req.body.confirmPassword;

    // Substitute for above set of statements is the one below
    const { fName, lName, contactNumber, email, password, confirmPassword } = req.body;

    db.query("SELECT email FROM users WHERE email = ?", [email], async function (error, results) {
        if (error) {
          console.log(error);
        }
        if (results.length > 0) {
          return res.redirect("/emailError")
        }
        else if (password !== confirmPassword) {
          return res.redirect("/passwordError")
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        // res.send("testing");

        db.query("INSERT INTO users SET ?", {
          fName: fName,
          lName: lName,
          contactNumber: contactNumber,
          email: email,
          password: hashedPassword
        }, function(err, results) {
          if (err) {
            console.log(err);
          } else {
            console.log(results);
            console.log("Successfully signed up!");
            res.redirect("/successSignUp");
          }
        });
      })
    }

exports.login = async function (req, res) {
      try {
        const { email, password } = req.body;

        if ( !email || !password ) {
          return res.status(400).send("Please provide an email/password!")
        }

        db.query("SELECT * FROM users WHERE email = ?", [email], async function (error, results) {
          // console.log(results);
          if ( !results || !(await bcrypt.compare(password, results[0].password))) {
            return res.status(401).redirect("/wrongCredentials")
          } else {
            const id = results[0].id;
            const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
              expiresIn: process.env.JWT_EXPIRES_IN
            });

            console.log("The token is: " + token);

            const cookieOptions = {
              expires: new Date(
                Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 *60 * 60 * 1000
              ),
              httpOnly: true
            }

            res.cookie("jwt", token, cookieOptions);
            res.status(200).redirect("/posts");
          }
        })

      } catch (error) {
        console.log(error);
      }
    }

exports.isLogedIn = async function (req, res, next) {
  // console.log(req.cookies);
  if (req.cookies.jwt) {
    try {
      // Verify the token
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
      // console.log(decoded);

      // Check if the user exists
      db.query("SELECT * FROM users WHERE id = ?", [decoded.id], function(error, result) {
        // console.log(result);

        if (!result) {
          return next();
        }

        req.user = result[0];
        return next();
      })
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    next();
  }
}

exports.logout = async function (req, res) {
  res.cookie("jwt", "logout", {
    expires: new Date(Date.now() + 2*1000),
    httpOnly: true
  });

  res.status(200).redirect("/login");
}
