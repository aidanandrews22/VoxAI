-- Function to delete a chat session and move its messages to deleted_chat_messages
CREATE OR REPLACE FUNCTION public.delete_chat_session(session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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