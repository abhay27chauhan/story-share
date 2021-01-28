const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User')

module.exports = function(passport){
    passport.use(new GoogleStrategy(
        {
            clientID: "712568666779-s2aq8b0hv6msfpo7bfd75e8i18dde3a0.apps.googleusercontent.com",
            clientSecret: "UDLg3yJWpgBWgRmlmEPTSQgQ",
            callbackURL: "/auth/google/callback"
        },
        async (accessToken, refreshToken, profile, done) => {
            const newUser = {
                googleId: profile.id,
                displayName: profile.displayName,
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                image: profile.photos[0].value,
            }

            try{
                let user = await User.findOne({ googleId: profile.id })

                if (user) {
                    done(null, user)
                } else {
                    user = await User.create(newUser)
                    done(null, user)
                }
            }catch(err){
                console.log(err.message)
            }
        }
    ))

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
}