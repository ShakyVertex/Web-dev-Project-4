import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import MyMongoDB from "../db/myMongoDB.js";

const secureUsersDB = MyMongoDB({
  dbName: "levelupDB",
  collectionName: "secureUsers",
});

export function configurePassport(passport) {
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await secureUsersDB.findOne({ email });

          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const { password: _pw, ...userWithoutPassword } = user;

          return done(null, userWithoutPassword);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );
}
