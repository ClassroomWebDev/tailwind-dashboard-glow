# Classroom Ambassador Program

### Phase 1 Prompt: Theme, Auth Gate, Account Hold Security & 100% Profile Engine

**Design System & Theme:**

- Background Base: `#FAFAFA` (Off-white)

- Text & Card Surfaces: `#0F172A` (Slate/Charcoal)

- Accent / Primary Action: `#991B1B` (Deep Red / Crimson)

- Rule: Never overlay pure black and dark red directly on the same container.

- Mobile First: Fully responsive, collapsible mobile bottom navigation bar + desktop side navigation.

**1. Authentication & Hold Security Gate:**

- Email & Password Login / Signup / Forgot Password.

- On user login, query `profiles` table.

- **Account Hold Logic:** If `status === 'held'`, immediately kill the session and display a non-dismissible Fullscreen Modal with red accent: 

  "Your account has been temporarily placed on hold due to policy compliance. Please contact support."

  Show Support Manager contact card inside the modal.

**2. Profile Update Module:**

- Display a real-time Profile Completion Progress Bar (0% to 100%).

- Calculate % dynamically based on mandatory and optional fields.

- Mandatory Fields (marked with prominent red `*`):

  - Name* (Pre-filled, read-only)

  - Date of Birth*

  - Religion* (Select dropdown: Islam, Hinduism, Christianity, Buddhism, Others)

  - Address*

  - Home District* (Searchable select containing all 64 districts of Bangladesh)

  - Mobile Number* (Pre-filled from registration, strictly read-only)

  - Facebook Profile Link*

- Optional Fields: Fathers Name, Mothers Name, Alternative Mobile, WhatsApp Number, Blood Group (A+, A-, B+, B-, O+, O-, AB+, AB-), Institution, Hobby, Favourite Book, Favourite Place, Ultimate Goal in Life, Favourite Movies, Favourite Person, Idol, Favorite Teacher, Photo Upload.

**3. Support Hub Component:**

- Ambassador view: Displays assigned Coordinator card, Mentor card, and Support Manager card (Name, Phone, Designation).

- Coordinator view: Displays assigned Mentor card and Support Manager card.

- Mentor view: Displays Support Manager card.

- All dynamic data mapped from Supabase `profiles` hierarchy.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5eed2e83-e885-497b-8543-0f2e70218893).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
