# Firebase Environment Variables Setup

## Overview
This project has been updated to use environment variables for Firebase configuration instead of storing sensitive credentials in JSON files. This improves security by preventing accidental commits of service account keys.

## Required Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
# Firebase Service Account Configuration
FIREBASE_PROJECT_ID=odyssey-test-db
FIREBASE_PRIVATE_KEY_ID=e4f0ac88e9cc2514e159d6652cd04d6d15159893
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCjuoxb5mxkE/5L\nHZ5sPbk8n4EaEt/+rwmD12XDFi+gkLC7n4LTuhboLWlKvFJCYP+BmguqJpHC88kh\nsLN7rVEl1oKMO8suwkSUU78CD1dKehhviK0xd6GqcVa5brbuc+TKdx8RT4lI7IOH\n8ewZCj+MsVyCYYqby/iabqkBCy9uzQLe5KtIsZDx7cQpGsXza14X2ZnUm3cFwL1g\n6qQrXNo1ja6smS2zTKKmJKdgSnS0aavbXKC14BP7pxfFiXyASs/sbTb32Qk4evCT\ndFsxjHcvDygP0J2nVPU/LkLaXHX+UmWm1gbHzW5b1DpnIp/kjT/kYfWFP4aihGZj\nRUJZQRErAgMBAAECggEALT0SIyJbuJs9nAunBklXsURxK38jnP9IJcGSQIEUz8yq\nyGyefVnhkm1ZtmiqYeTjNDAYIP9fLvqlDEYCkZ2l2kqW76Bl15md0U4CbNNITy/F\nKKwfDpf7d1ixmbLZoLEs+jRHxUSwrhGLljhl/9UxEfK/mNbSsZF+M014LO2mQXq6\nsn+u7ncrkz33kV++W704YY+c6zVcdCDIiV54LkWASMMt06RHlA0TOYHWaaL4ScFz\nbX2cWXgFrEPfdvHhWoYiUpr+bsfeS6lgEZJ+NkvEJOWTnJmedhABf+F2GxO7R08r\nBxXVyjHEYgcFGEi1zKCVdiyOn9dedr8pLL9kJ3CBAQKBgQDRPQLs65NYVBBxAVla\nPxM/MgIjkZYwTgKakNGv7vObL/ySgVnXTh7ne8/1386H8lyD7ZJOYdNvx26CA3hf\nvjixaCZvDgV1CHWA7YphUkbXP8JoYv0o7Ph/RyPWYJbL9OPWmV0KNToshri2DCg+\nITTZAv9Hw9Au7KqZoRinUIY1CwKBgQDIUdSamBHO1ba34SKFKLqvV7uMRrh8lqTK\n2Qvegq2xDN6L3v0hAfs+GQL6951RhOWN9ZRY5q1eFBQ6OJNl++2h++q0GI96Wd9h\nzu7JK/tXM97AqYdaflPCJI9X/0J+DgjLBRdQJwYvoFrr6FOWcsj2a7vYnVP/H7BL\nJetynh/oYQKBgBCEBVgYHDBLqmSRG7Fw6x8A3oRaOIWlkrUKm1KMxPPJ7ODPjvzc\nsLnK3xZkTRQUAFN1jCfdtufK0SE4DudXx3fRZb88Vxfuy/+aQGMAMJFK+hhtP9hc\nJB0/y0dfpmeA8/77agmlO+tJ0wijmwWUb2x1vRq4DRW3HpwzyBNk2sMTAoGBAJTi\nJPblkU6+DniqLqLze5T4yt7ebR3ERSSynpy5WWje3MTubgpLU7V6l3l58gX1lTum\nS6Srhi0HFWWUSREiZiLffjhujKzuARXL3DPOqZbNaYCeP4hlndEMpTFM+dmAis6B\nsSsUZged0hXF7eJC29QyjEHZ5OUYY0nnHBBrL+HhAoGAB9lMtzBXBbkjG4Vjhqtd\n8hWKQ3Cm2Xo+XAnHtWWVRs4fh58E5ptY3ng2J2REfGJwcx0kPUelhimzKdl7ChyM\nivcZYWagauxKJWAdssOAkDbwM2s+QP1XJOqRT5a0LSKsXTpsgifBSdb3TWW+mL1h\n3BOS+Ai5QhCQnev4sVhwY+c=\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@odyssey-test-db.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=112152293778062362841
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40odyssey-test-db.iam.gserviceaccount.com
FIREBASE_UNIVERSE_DOMAIN=googleapis.com

# Firebase Database URL
FIREBASE_DATABASE_URL=https://odyssey-test-db-default-rtdb.asia-southeast1.firebasedatabase.app
```

## Important Notes

1. **Never commit the `.env` file** - It's already in `.gitignore`
2. **Keep your service account keys secure** - Only share them with trusted team members
3. **Use different keys for different environments** (development, staging, production)
4. **Rotate keys regularly** for security best practices

## What Changed

- ✅ Removed sensitive Firebase credentials from the codebase
- ✅ Updated `lib/firebase/admin.ts` to use environment variables
- ✅ Added validation for required environment variables
- ✅ `.env` files are already excluded in `.gitignore`

## Troubleshooting

If you get an error about missing Firebase environment variables:
1. Check that your `.env` file exists in the project root
2. Verify all required variables are set
3. Restart your development server after creating/modifying the `.env` file
4. Ensure there are no extra spaces or quotes around the values

## Security Benefits

- 🔒 No more sensitive credentials in version control
- 🔒 Environment-specific configuration
- 🔒 Easier key rotation
- 🔒 Better team collaboration practices
