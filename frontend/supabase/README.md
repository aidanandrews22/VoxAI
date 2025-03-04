# Supabase Database Functions

This directory contains SQL functions and migrations for the Supabase database.

## Deploying the Functions

To deploy the functions to your Supabase project, you can use the Supabase CLI:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

Alternatively, you can run the SQL directly in the Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of the SQL files in the `migrations` directory
4. Paste and run the SQL in the editor

## Functions

### delete_chat_session

This function handles the deletion of a chat session and moves its messages to the `deleted_chat_messages` table before deleting them from the `chat_messages` table.

**Usage:**

```sql
SELECT delete_chat_session('session-uuid-here');
```

**Parameters:**

- `session_id` (UUID): The UUID of the chat session to delete

**Security:**

- The function is defined as `SECURITY DEFINER` which means it runs with the privileges of the user who created it
- Only authenticated users can execute this function due to the `GRANT EXECUTE` statement
