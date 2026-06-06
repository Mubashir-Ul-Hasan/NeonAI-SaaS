# NeonAI SaaS

NeonAI is a full-stack AI SaaS platform that provides a collection of AI-powered productivity tools for content creation, image generation, image editing, and resume review. The project is built with a modern React frontend, serverless Netlify Functions, Clerk authentication, Neon PostgreSQL, Drizzle ORM, and third-party AI services.

> This project is designed as a production-style SaaS application with authentication, usage tracking, premium/free tool separation, admin analytics, database persistence, and cloud media handling.

---

## Live Demo

Netlify Link: https://neonai-saas.netlify.app/

```txt

```

---

## Features

### AI Tools

- **AI Article Generator**  
  Generate long-form articles based on a prompt, tone, length, and optional keywords.

- **AI Blog Title Generator**  
  Generate catchy blog title ideas based on topic, category, and style.

- **AI Image Generator**  
  Generate images from text prompts using AI image generation.

- **Background Remover**  
  Upload an image and remove its background.

- **Object Remover**  
  Remove selected objects from images using AI cleanup features.

- **Resume Reviewer**  
  Upload a resume and receive structured AI feedback.

### User Dashboard

- Tool-based dashboard navigation
- Creation history
- Creation details page
- Delete saved creations
- User usage summary
- Plan and billing information
- Settings page

### Admin Dashboard

- Admin overview
- User management table
- Revenue analytics
- Usage analytics
- Creations monitoring

### Authentication and User Management

- Clerk-based authentication
- Sign in and sign up pages
- Protected dashboard routes
- User profile sync through Clerk webhook
- Role-based admin protection

### Backend and Data

- Netlify serverless functions
- Neon PostgreSQL database
- Drizzle ORM schema
- AI usage logging
- Webhook event tracking
- Cloudinary media storage
- API health check endpoint

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Clerk React SDK

### Backend

- Netlify Functions
- TypeScript
- Clerk server SDK
- Svix webhook verification

### Database

- Neon PostgreSQL
- Drizzle ORM

### AI and Media Services

- Google Gemini
- Clipdrop
- Cloudinary

### Deployment

- Netlify
- GitHub

---

## Project Structure

```txt
neonai-saas/
├── netlify/
│   └── functions/              # Serverless API functions
├── server/
│   ├── auth/                   # Auth and access control helpers
│   ├── db/                     # Database schema and connection
│   ├── services/               # AI, media, billing, and business logic
│   ├── utils/                  # Validators, errors, response helpers
│   ├── env.ts                  # Environment variable validation
│   └── types.ts                # Shared backend types
├── src/
│   ├── components/             # Reusable UI components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Constants, routes, utility helpers
│   ├── routes/                 # App pages and route screens
│   ├── App.tsx                 # Main app routing
│   └── main.tsx                # React entry point
├── drizzle/                    # Drizzle migrations
├── public/                     # Static assets
├── package.json
├── netlify.toml
├── drizzle.config.ts
├── vite.config.ts
└── README.md
```

---

## Main API Endpoints

The backend is powered by Netlify Functions. In development or production, these functions are available under the `/api` path.

| Endpoint                     | Purpose                             |
| ---------------------------- | ----------------------------------- |
| `/api/generate-article`      | Generate AI articles                |
| `/api/generate-titles`       | Generate blog title ideas           |
| `/api/generate-image`        | Generate AI images                  |
| `/api/remove-background`     | Remove image backgrounds            |
| `/api/remove-object`         | Remove selected objects from images |
| `/api/review-resume`         | Review uploaded resumes             |
| `/api/get-creations`         | Fetch user creations                |
| `/api/delete-creation`       | Delete a creation                   |
| `/api/get-user-summary`      | Fetch plan and usage summary        |
| `/api/admin-stats`           | Fetch admin analytics               |
| `/api/create-checkout`       | Create checkout session/link        |
| `/api/create-billing-portal` | Open billing portal                 |
| `/api/clerk-webhook`         | Handle Clerk webhook events         |
| `/api/health`                | Check service health                |

---

## Environment Variables

Create a `.env.local` file in the project root for local development.

> Never commit `.env`, `.env.local`, or real secret keys to GitHub.

```env
# App
VITE_APP_URL=http://localhost:5173

# Clerk Frontend
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Clerk Backend
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Database
DATABASE_URL=your_neon_database_url

# Gemini
GEMINI_API_KEY=your_gemini_api_key

# Clipdrop
CLIPDROP_API_KEY=your_clipdrop_api_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Optional Admin Settings
ADMIN_EMAILS=admin@example.com

# Upload Settings
MAX_UPLOAD_SIZE_MB=10
```

You can also create a safe `.env.example` file using the same variable names without real values.

---

## Installation

Clone the repository:

```bash


git clone https://github.com/Mubashir-Ul-Hasan/NeonAI-SaaS

cd neonai-saas
```

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env.local
```

Then fill in the required environment variables.

---

## Database Setup

This project uses Drizzle ORM with Neon PostgreSQL.

Generate migrations if needed:

```bash
npm run db:generate
```

Push schema changes to the database:

```bash
npm run db:push
```

Open Drizzle Studio:

```bash
npm run db:studio
```

> Script names may vary depending on your `package.json`. Check your available scripts before running commands.

---

## Local Development

Start the development server:

```bash
npm run dev
```

For Netlify Functions locally, use Netlify CLI:

```bash
netlify dev
```

This allows the frontend and serverless functions to run together in a local Netlify-like environment.

---

## Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## Deployment on Netlify

Recommended deployment workflow:

1. Push the project to GitHub.
2. Create a new site on Netlify.
3. Import the GitHub repository.
4. Add all required environment variables in Netlify.
5. Deploy the site.
6. Test authentication, AI tools, image uploads, database writes, and admin pages.

### Netlify Build Settings

Use these typical settings:

```txt
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

---

## Security Notes

- Do not commit real API keys or secrets.
- Keep `.env.local` private.
- Use `.env.example` for public documentation.
- Rotate exposed keys immediately if a secret is accidentally pushed to GitHub.
- Protect admin routes both on the frontend and backend.
- Keep webhook secrets secure.
- Validate file uploads and limit upload sizes.

---

## Roadmap Ideas

Possible future improvements:

- Full Stripe or Clerk billing webhook automation
- Better subscription lifecycle management
- Improved admin authentication flow
- Advanced image editing mask tool
- More AI tool categories
- Team/workspace support
- Usage-based billing
- Public share links for creations
- Export generated content

---

## Author

Developed by **Md. Mubashir Ul Hasan**.

---

## License

This project is currently private/proprietary.  
Add a license file if you plan to make it open source.
