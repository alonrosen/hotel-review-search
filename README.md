A web tool that fetches Google Maps and TripAdvisor reviews for preset hotels and lets users search within them by keyword and date range, returning direct links to matching reviews.

## Setup Instructions

### Prerequisites
1. [Node.js](https://nodejs.org/en/) installed locally.
2. A free [RapidAPI](https://rapidapi.com/) account (provides generous free tiers, no phone number required). You will need to subscribe to the `Local Business Data` API by Lundehund, and `Tripadvisor16` API by belchiorarkad.
3. A PostgreSQL database. For a free tier, you can use [Neon Postgres](https://neon.tech/) (free: 0.5GB).

### Local Setup
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment Variables:
   Create a `.env` file in the root based on `.env.example`:
   ```env
   RAPIDAPI_KEY=your_rapidapi_key_here
   DATABASE_URL=postgresql://user:password@host/dbname?schema=public
   ADMIN_SECRET=change_me_to_a_random_string
   ```

3. Initialize the Database (Prisma):
   Run migrations to set up the schema:
   ```bash
   npx prisma db push
   ```

4. Start the Application:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the tool.

### Admin Backoffice
The tool includes an Admin interface to configure hotels and fetch their reviews manually.
Navigate to `/admin` (or click "Admin" in the top bar) and use your `ADMIN_SECRET` to gain access.
You can add hotels by name, and automatically search for their Google Place IDs and TripAdvisor URLs.

## Deployment to Vercel
1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and create a new project from your repository.
3. In the Vercel project settings, add the Environment Variables (`RAPIDAPI_KEY`, `DATABASE_URL`, `ADMIN_SECRET`).
   *If using Vercel Storage for Neon Postgres, you can add the Postgres integration.*
4. Deploy! The project's `package.json` includes a `postinstall` script to automatically run `prisma generate`.

## Tech Stack
- Next.js 16 (App Router)
- React 19
- Prisma 7 (with `@prisma/adapter-pg`)
- Vanilla CSS (Glassmorphism, dark mode)
- RapidAPI for scraping Google/TripAdvisor
