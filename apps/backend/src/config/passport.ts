import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { env } from './env';
import { UserModel } from '../models/User.model';

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: `/api/auth/google/callback`,
      scope: ['profile', 'email'],
    },
    async (_accessToken: string, _refreshToken: string, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const photo = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error('No email returned from Google'), undefined);
        }

        const user = await UserModel.findOneAndUpdate(
          { googleId: profile.id },
          {
            $setOnInsert: {
              googleId: profile.id,
              email,
              name: profile.displayName,
              photo: photo ?? '',
              isOnboarded: false,
            },
          },
          { upsert: true, new: true }
        );

        return done(null, user as any);
      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);

export default passport;
