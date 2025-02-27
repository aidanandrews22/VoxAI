-- Add the delete_chat_session function
CREATE OR REPLACE FUNCTION public.delete_chat_session(session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First, copy messages to deleted_chat_messages table
  INSERT INTO deleted_chat_messages (
    chat_session_id,
    notebook_id,
    user_id,
    content,
    is_user,
    created_at
  )
  SELECT
    chat_session_id,
    notebook_id,
    user_id,
    content,
    is_user,
    created_at
  FROM
    chat_messages
  WHERE
    chat_session_id = session_id;
    
  -- Then delete the messages from chat_messages
  DELETE FROM chat_messages
  WHERE chat_session_id = session_id;
  
  -- Finally delete the chat session
  DELETE FROM chat_sessions
  WHERE id = session_id;
END;
$$;

-- Add RLS policy for the function
REVOKE ALL ON FUNCTION public.delete_chat_session(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_chat_session(UUID) TO authenticated; 