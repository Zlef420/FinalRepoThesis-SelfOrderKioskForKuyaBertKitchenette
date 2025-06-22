# Self-Order Kiosk

This project is a self-ordering kiosk system built with React, Vite, Tailwind CSS, and Supabase.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js and npm
- A Supabase account

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Zlef420/FinalRepoThesis-SelfOrderKioskForKuyaBertKitchenette.git
   cd self-order-kiosk/frontend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up your Supabase environment variables:**

   Create a new file named `.env` in the `frontend` directory.

4. **Add your Supabase credentials to the `.env` file:**

   You can find your Project URL and anon key in your Supabase project's API settings.

   - Go to your Supabase project.
   - In the left sidebar, click the **Settings** icon (the gear icon).
   - Click on **API**.
   - Under **Project API keys**, you will find your `anon` `public` key.
   - Under **Configuration**, you will find your Project **URL**.

   Your `.env` file should look like this:

   ```
   VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
   VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
   ```

   Replace `"YOUR_SUPABASE_PROJECT_URL"` and `"YOUR_SUPABASE_ANON_KEY"` with your actual Supabase credentials.

5. **Run the development server:**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Database Setup

After setting up your Supabase project, you'll need to create the necessary tables. You can do this by running the following SQL queries in the Supabase SQL Editor:

### `account_table`

```sql
CREATE TABLE account_table (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### `product_details`

```sql
CREATE TABLE product_details (
  id SERIAL PRIMARY KEY,
  prod_name TEXT NOT NULL,
  prod_price NUMERIC NOT NULL,
  prod_description TEXT,
  prod_img TEXT,
  prod_category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### `trans_table`

```sql
CREATE TABLE trans_table (
  id SERIAL PRIMARY KEY,
  trans_id TEXT NOT NULL,
  trans_date DATE NOT NULL,
  trans_time TIME NOT NULL,
  trans_type TEXT NOT NULL,
  trans_status TEXT NOT NULL,
  trans_total_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### `trans_items_table`

```sql
CREATE TABLE trans_items_table (
  id SERIAL PRIMARY KEY,
  trans_id TEXT NOT NULL,
  prod_id INTEGER REFERENCES product_details(id),
  prod_quantity INTEGER NOT NULL,
  prod_total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### `payment_table`

```sql
CREATE TABLE payment_table (
  id SERIAL PRIMARY KEY,
  trans_id TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  payment_amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### `intro_advertisements`

```sql
CREATE TABLE intro_advertisements (
  id SERIAL PRIMARY KEY,
  ad_name TEXT NOT NULL,
  ad_img_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
