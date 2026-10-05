# OAuth + crypto manual QA checklist

Run through in a normal browser against a fresh deploy before trusting it. Base app is `https://careerbloom-e5ne.onrender.com/auth`.

## 1. Google OAuth — new user

1. Go to `/auth`
2. Click "Continue with Google"
3. Approve the consent screen

- **Pass**: lands on `/onboarding`
- **Fail**: lands on `/dashboard`, errors out, or bounces back to `/auth`

## 2. Cookie check

1. Open devtools → Network while doing step 1
2. Select the request to `.../auth/oauth/google/callback`

- **Pass**: two separate `Set-Cookie` headers, one named `oauth_state` and one named `session`
- **Fail**: one of them missing, or a single cookie that clobbers the other

## 3. Google OAuth — existing user

1. Sign out
2. Sign in again with the same Google account

- **Pass**: lands on `/dashboard`
- **Fail**: lands on `/onboarding`, disconnects the account, or any error

## 4. Cross provider email conflict

1. Sign up with Google using email X
2. Sign out, then sign in with GitHub using the same email X

- **Pass**: redirects to `/auth?error=email_exists` with the conflict banner shown
- **Fail**: proceeds to login, shows an internal error, or no banner

## 5. GitHub OAuth — new user

Same as step 1 but via "Continue with GitHub"

- **Pass**: lands on `/onboarding`
- **Fail**: lands on `/dashboard`, errors out, or bounces back to `/auth`

## 6. GitHub OAuth — existing user

Same as step 3 but via GitHub

- **Pass**: lands on `/dashboard`
- **Fail**: lands on `/onboarding`, disconnects the account, or any error