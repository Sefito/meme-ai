"""
Chat service for managing conversational sessions for meme generation.
Handles chat history, session management, and conversation context.
"""
import json
import uuid
from typing import List, Dict, Optional, Any
from datetime import datetime
from redis import Redis
import logging

logger = logging.getLogger(__name__)


class ChatMessage:
    """Represents a single chat message"""
    def __init__(self, content: str, role: str = "user", timestamp: Optional[datetime] = None):
        self.id = str(uuid.uuid4())
        self.content = content
        self.role = role  # "user" or "assistant"
        self.timestamp = timestamp or datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "content": self.content,
            "role": self.role,
            "timestamp": self.timestamp.isoformat()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ChatMessage':
        msg = cls(
            content=data["content"],
            role=data["role"],
            timestamp=datetime.fromisoformat(data["timestamp"])
        )
        msg.id = data["id"]
        return msg


class ChatSession:
    """Manages a conversation session with message history"""
    def __init__(self, session_id: Optional[str] = None):
        self.session_id = session_id or str(uuid.uuid4())
        self.messages: List[ChatMessage] = []
        self.created_at = datetime.now()
        self.updated_at = datetime.now()
        self.summary: Optional[str] = None
    
    def add_message(self, content: str, role: str = "user") -> ChatMessage:
        """Add a new message to the conversation"""
        message = ChatMessage(content=content, role=role)
        self.messages.append(message)
        self.updated_at = datetime.now()
        return message
    
    def get_conversation_context(self) -> str:
        """Get the full conversation as a formatted string for LLM context"""
        if not self.messages:
            return ""
        
        context_parts = []
        for msg in self.messages:
            role_prefix = "Usuario" if msg.role == "user" else "Asistente"
            context_parts.append(f"{role_prefix}: {msg.content}")
        
        return "\n".join(context_parts)
    
    def get_latest_user_intent(self) -> str:
        """Extract the latest user intent/request from the conversation"""
        # Get the last few messages to understand current intent
        recent_messages = self.messages[-3:] if len(self.messages) > 3 else self.messages
        
        user_messages = [msg.content for msg in recent_messages if msg.role == "user"]
        if not user_messages:
            return ""
        
        # For now, return the last user message, but this could be enhanced
        # to analyze the conversation and extract a more refined intent
        return user_messages[-1]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "messages": [msg.to_dict() for msg in self.messages],
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "summary": self.summary
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ChatSession':
        session = cls(session_id=data["session_id"])
        session.messages = [ChatMessage.from_dict(msg_data) for msg_data in data["messages"]]
        session.created_at = datetime.fromisoformat(data["created_at"])
        session.updated_at = datetime.fromisoformat(data["updated_at"])
        session.summary = data.get("summary")
        return session


class ChatService:
    """Service for managing chat sessions and Redis storage"""
    
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.session_prefix = "chat_session:"
        self.session_ttl = 86400  # 24 hours in seconds
    
    def create_session(self) -> ChatSession:
        """Create a new chat session"""
        session = ChatSession()
        self._save_session(session)
        logger.info(f"Created new chat session: {session.session_id}")
        return session
    
    def get_session(self, session_id: str) -> Optional[ChatSession]:
        """Retrieve a chat session by ID"""
        try:
            session_key = f"{self.session_prefix}{session_id}"
            session_data = self.redis.get(session_key)
            
            if not session_data:
                logger.warning(f"Chat session not found: {session_id}")
                return None
            
            session_dict = json.loads(session_data)
            session = ChatSession.from_dict(session_dict)
            logger.info(f"Retrieved chat session: {session_id} with {len(session.messages)} messages")
            return session
            
        except Exception as e:
            logger.error(f"Error retrieving chat session {session_id}: {e}")
            return None
    
    def save_session(self, session: ChatSession) -> bool:
        """Save a chat session to Redis"""
        return self._save_session(session)
    
    def _save_session(self, session: ChatSession) -> bool:
        """Internal method to save session to Redis"""
        try:
            session_key = f"{self.session_prefix}{session.session_id}"
            session_data = json.dumps(session.to_dict())
            
            # Save with TTL
            self.redis.setex(session_key, self.session_ttl, session_data)
            logger.debug(f"Saved chat session: {session.session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving chat session {session.session_id}: {e}")
            return False
    
    def add_message_to_session(self, session_id: str, content: str, role: str = "user") -> Optional[ChatMessage]:
        """Add a message to an existing session"""
        session = self.get_session(session_id)
        if not session:
            logger.error(f"Cannot add message to non-existent session: {session_id}")
            return None
        
        message = session.add_message(content, role)
        
        if self._save_session(session):
            logger.info(f"Added {role} message to session {session_id}")
            return message
        else:
            logger.error(f"Failed to save session after adding message: {session_id}")
            return None
    
    def delete_session(self, session_id: str) -> bool:
        """Delete a chat session"""
        try:
            session_key = f"{self.session_prefix}{session_id}"
            result = self.redis.delete(session_key)
            logger.info(f"Deleted chat session: {session_id}")
            return result > 0
            
        except Exception as e:
            logger.error(f"Error deleting chat session {session_id}: {e}")
            return False
    
    def get_session_summary(self, session_id: str) -> Optional[str]:
        """Get a summary of the conversation for meme generation context"""
        session = self.get_session(session_id)
        if not session:
            return None
        
        # If we have a cached summary, return it
        if session.summary:
            return session.summary
        
        # Otherwise, generate a summary from the conversation
        if not session.messages:
            return None
        
        # Simple summary generation - could be enhanced with LLM summarization
        user_messages = [msg.content for msg in session.messages if msg.role == "user"]
        if user_messages:
            # For now, combine the user messages as the summary
            session.summary = " | ".join(user_messages[-3:])  # Last 3 user messages
            self._save_session(session)
            return session.summary
        
        return None