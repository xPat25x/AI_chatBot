from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Literal, Union, Optional, Dict, Any, cast
from openai import OpenAI  # type: ignore
import os
from dotenv import load_dotenv
import logging
import traceback
import json
import sqlite3
from sqlite3 import Connection
from contextlib import contextmanager
import uuid
from datetime import datetime
from utils.web_utils import extract_website_content as extract_content, extract_website_with_subpages
import time
import tempfile

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI()

# Configure CORS with dynamic origins from env
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure OpenAI
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    logger.error("OpenAI API key not found in environment variables")
    raise ValueError("OpenAI API key not found in environment variables")

# Initialize OpenAI client with better error handling
try:
    # Create the client with only the required parameters
    client = OpenAI(api_key=api_key)
    logger.info("OpenAI client initialized successfully")
except Exception as e:
    logger.error(f"Error initializing OpenAI client: {str(e)}")
    raise

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./custom_models.db")

# Initialize SQLite database
def init_db():
    db_path = DATABASE_URL.replace("sqlite:///", "")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create custom_models table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS custom_models (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        model_type TEXT NOT NULL,
        assistant_id TEXT,
        vector_store_id TEXT,
        config TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    ''')
    
    # Create files table if it doesn't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS model_files (
        id TEXT PRIMARY KEY,
        model_id TEXT NOT NULL,
        file_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (model_id) REFERENCES custom_models (id)
    )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

# Initialize database at startup
init_db()

@contextmanager
def get_db():
    db_path = DATABASE_URL.replace("sqlite:///", "")
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    purpose: str
    model_id: Optional[str] = None

class CustomModelBase(BaseModel):
    name: str
    description: str
    model_type: Literal["gpt", "assistant", "fine-tuned"]
    instructions: str
    
class CustomModelCreate(CustomModelBase):
    website_url: Optional[str] = None
    website_content: Optional[str] = None
    
class CustomModelResponse(CustomModelBase):
    id: str
    created_at: str
    updated_at: str

def convert_to_openai_message(message: ChatMessage) -> dict:
    try:
        return {
            "role": message.role,
            "content": message.content
        }
    except Exception as e:
        logger.error(f"Error converting message: {str(e)}")
        raise

def safely_extract_assistant_text(content_array) -> str:
    """Safely extract text from assistant message content, handling potential type errors"""
    try:
        if not content_array:
            return "No content received from assistant"
        
        content_item = content_array[0]
        # Check if it's a text content type
        if hasattr(content_item, "text") and hasattr(content_item.text, "value"):
            return content_item.text.value
        # Fall back if it's a dictionary-like object with a text field
        elif isinstance(content_item, dict) and "text" in content_item:
            text_obj = content_item["text"]
            if isinstance(text_obj, dict) and "value" in text_obj:
                return text_obj["value"]
            return str(text_obj)
        # Handle other content types as needed
        else:
            return f"Content received (type: {type(content_item).__name__}) but couldn't extract text"
    except Exception as e:
        logger.error(f"Error extracting text from assistant content: {str(e)}")
        return "Error extracting response content"

@app.get("/")
async def root():
    return JSONResponse({
        "status": "ok",
        "message": "AI Chat API is running",
        "endpoints": {
            "chat": "/api/chat",
            "custom_models": "/api/custom_models",
            "health": "/api/health"
        }
    })

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        logger.info(f"Received chat request with purpose: {request.purpose}")
        logger.info(f"Messages: {json.dumps([msg.model_dump() for msg in request.messages], indent=2)}")
        
        if not request.messages:
            raise ValueError("No messages provided in the request")
        
        # Check if a custom model is specified
        if request.model_id:
            return await chat_with_custom_model(request)
        
        # Create system message based on purpose
        system_message = {
            "role": "system",
            "content": f"You are a helpful AI assistant specialized in {request.purpose}. "
                      f"Provide relevant and focused responses within this domain."
        }
        
        # Convert messages to OpenAI format
        messages = [system_message] + [convert_to_openai_message(msg) for msg in request.messages]
        logger.info(f"Converted messages: {json.dumps(messages, indent=2)}")
        
        logger.info("Calling OpenAI API...")
        try:
            # Use the new client.chat.completions.create method
            # Type annotations are suppressed for messages parameter due to OpenAI API typing issues
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,  # type: ignore
                temperature=0.7,
                max_tokens=500,
                response_format={"type": "text"}
            )
            logger.info("Received response from OpenAI")
            
            if not response.choices:
                raise ValueError("No response choices received from OpenAI")
                
            return {
                "message": response.choices[0].message.content,
                "role": "assistant"
            }
        except Exception as e:
            logger.error(f"Error during OpenAI API call: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error during OpenAI API call: {str(e)}")
    
    except ValueError as e:
        logger.error(f"Validation Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

async def chat_with_custom_model(request: ChatRequest):
    """Chat with a custom model based on its configuration"""
    try:
        model_id = request.model_id
        if not model_id:
            raise HTTPException(status_code=400, detail="Model ID is required")
        
        # Get the model from the database
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM custom_models WHERE id = ?", (model_id,))
            model = cursor.fetchone()
            
            if not model:
                raise HTTPException(status_code=404, detail=f"Custom model with id {model_id} not found")
            
            model_type = model["model_type"]
            model_config = json.loads(model["config"])
            assistant_id = model["assistant_id"]
        
        # Handle different model types
        if model_type == "assistant" and assistant_id:
            # For assistant models, use OpenAI Assistants API
            try:
                # Create a thread if needed
                thread = client.beta.threads.create()
                
                # Add messages to the thread
                for message in request.messages:
                    if message.role == "user":
                        client.beta.threads.messages.create(
                            thread_id=thread.id,
                            role="user",
                            content=message.content
                        )
                
                # Run the assistant
                run = client.beta.threads.runs.create(
                    thread_id=thread.id,
                    assistant_id=assistant_id
                )
                
                # Wait for the run to complete (with timeout)
                max_wait_time = 60  # seconds
                wait_time = 0
                sleep_interval = 2
                
                while wait_time < max_wait_time:
                    run_status = client.beta.threads.runs.retrieve(
                        thread_id=thread.id,
                        run_id=run.id
                    )
                    
                    if run_status.status == "completed":
                        break
                    elif run_status.status in ["failed", "cancelled", "expired"]:
                        raise HTTPException(
                            status_code=500, 
                            detail=f"Assistant run failed with status: {run_status.status}"
                        )
                    
                    time.sleep(sleep_interval)
                    wait_time += sleep_interval
                
                if wait_time >= max_wait_time:
                    # Cancel the run if it's taking too long
                    client.beta.threads.runs.cancel(
                        thread_id=thread.id,
                        run_id=run.id
                    )
                    raise HTTPException(
                        status_code=500, 
                        detail="Assistant run timed out after 60 seconds"
                    )
                
                # Get messages from the thread
                messages = client.beta.threads.messages.list(
                    thread_id=thread.id
                )
                
                # Find the most recent assistant message
                assistant_messages = [
                    m for m in messages.data 
                    if m.role == "assistant"
                ]
                
                if not assistant_messages:
                    return {"message": "No response from the assistant"}
                
                # Get the latest message content
                latest_message = assistant_messages[0]
                response_text = safely_extract_assistant_text(latest_message.content)
                
                return {"message": response_text}
                
            except Exception as e:
                logger.error(f"Error using assistant API: {str(e)}")
                logger.error(traceback.format_exc())
                raise HTTPException(status_code=500, detail=f"Error with assistant model: {str(e)}")
        
        else:
            # For GPT models, use chat completions API
            try:
                # Prepare messages with system prompt from model config
                system_content = model_config.get("instructions", "")
                
                # Add context from website content if available
                website_content = model_config.get("website_content", "")
                if website_content:
                    system_content += f"\n\nRefer to this website content when relevant:\n{website_content}"
                
                # Create properly typed messages for the API
                from openai.types.chat import ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam
                from typing import List, cast, Union
                
                # Start with a properly typed list
                messages_for_api: List[Union[ChatCompletionSystemMessageParam, ChatCompletionUserMessageParam]] = []
                
                # Add system message
                messages_for_api.append(ChatCompletionSystemMessageParam(
                    role="system", 
                    content=system_content
                ))
                
                # Add user messages
                for message in request.messages:
                    messages_for_api.append(ChatCompletionUserMessageParam(
                        role="user",
                        content=message.content
                    ))
                
                # Make the API call
                response = client.chat.completions.create(
                    model="gpt-4o-mini",  # Default model
                    messages=messages_for_api,
                    temperature=0.7,
                )
                
                return {"message": response.choices[0].message.content}
                
            except Exception as e:
                logger.error(f"Error using GPT model: {str(e)}")
                logger.error(traceback.format_exc())
                raise HTTPException(status_code=500, detail=f"Error with GPT model: {str(e)}")
    
    except Exception as e:
        logger.error(f"Error in chat_with_custom_model: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/custom_models", response_model=CustomModelResponse)
async def create_custom_model(model: CustomModelCreate) -> CustomModelResponse:
    """Create a custom model based on the provided configuration"""
    logger.info(f"Creating custom model: {model.name} ({model.model_type})")
    
    model_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    
    # Prepare config JSON
    config = {
        "instructions": model.instructions,
        "website_content": model.website_content or ""
    }
    
    # For assistant type, create an assistant via the API
    assistant_id = None
    vector_store_id = None
    
    if model.model_type == "assistant":
        try:
            logger.info("Creating assistant via OpenAI API")
            
            # Create assistant
            assistant = client.beta.assistants.create(
                name=model.name,
                instructions=model.instructions,
                model=os.getenv("OPENAI_ASSISTANT_MODEL", "gpt-4o"),
                description=model.description,
                tools=[{"type": "retrieval"}]
            )
            
            assistant_id = assistant.id
            logger.info(f"Created assistant with ID: {assistant_id}")
            
            # If website content is provided, create a file for the assistant
            if model.website_content:
                # We don't use vector_stores in the current OpenAI API version
                # Instead, we'll upload the content as a file for the assistant
                try:
                    # Create a temporary file with the website content
                    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as temp:
                        temp.write(model.website_content)
                        temp_path = temp.name
                    
                    # Upload the file to OpenAI
                    with open(temp_path, 'rb') as file:
                        file_upload = client.files.create(
                            file=file,
                            purpose="assistants"
                        )
                    
                    # Attach the file to the assistant
                    client.beta.assistants.files.create(
                        assistant_id=assistant_id,
                        file_id=file_upload.id
                    )
                    
                    # Clean up temporary file
                    os.unlink(temp_path)
                    
                    logger.info(f"Uploaded website content to assistant as file: {file_upload.id}")
                except Exception as e:
                    logger.error(f"Error uploading website content: {str(e)}")
                    logger.error(traceback.format_exc())
                
        except Exception as e:
            logger.error(f"Error creating assistant: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Error creating assistant: {str(e)}")
    
    # Store model in database
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            '''
            INSERT INTO custom_models (id, name, description, model_type, assistant_id, vector_store_id, config, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                model_id, 
                model.name, 
                model.description, 
                model.model_type,
                assistant_id,
                vector_store_id,
                json.dumps(config),
                now,
                now
            )
        )
        conn.commit()
    
    return CustomModelResponse(
        id=model_id,
        name=model.name,
        description=model.description,
        model_type=model.model_type,
        instructions=model.instructions,
        created_at=now,
        updated_at=now
    )

@app.get("/api/custom_models", response_model=List[CustomModelResponse])
async def list_custom_models():
    """List all custom models"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM custom_models")
            models = cursor.fetchall()
            
        return [
            {
                "id": model["id"],
                "name": model["name"],
                "description": model["description"],
                "model_type": model["model_type"],
                "instructions": json.loads(model["config"]).get("instructions", ""),
                "created_at": model["created_at"],
                "updated_at": model["updated_at"]
            }
            for model in models
        ]
        
    except Exception as e:
        logger.error(f"Error listing custom models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/custom_models/{model_id}", response_model=CustomModelResponse)
async def get_custom_model(model_id: str):
    """Get a specific custom model"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM custom_models WHERE id = ?", (model_id,))
            model = cursor.fetchone()
            
            if not model:
                raise HTTPException(status_code=404, detail=f"Custom model with id {model_id} not found")
            
            config = json.loads(model["config"])
            
            return {
                "id": model["id"],
                "name": model["name"],
                "description": model["description"],
                "model_type": model["model_type"],
                "instructions": config.get("instructions", ""),
                "created_at": model["created_at"],
                "updated_at": model["updated_at"]
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving custom model: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/custom_models/{model_id}/files")
async def upload_file_to_model(
    model_id: str,
    file: UploadFile = File(...),
):
    """Upload a file to an assistant model"""
    temp_file_path = None
    try:
        # Check if model exists and is assistant type
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM custom_models WHERE id = ?", (model_id,))
            model = cursor.fetchone()
            
            if not model:
                raise HTTPException(status_code=404, detail=f"Custom model with id {model_id} not found")
            
            if model["model_type"] != "assistant":
                raise HTTPException(status_code=400, detail="File uploads are only supported for assistant models")
            
            assistant_id = model["assistant_id"]
            if not assistant_id:
                raise HTTPException(status_code=400, detail="Model does not have an associated assistant")
        
        # Check file size limit (10MB)
        content = await file.read()
        file_size = len(content)
        max_size = 10 * 1024 * 1024  # 10MB
        
        if file_size > max_size:
            raise HTTPException(
                status_code=400, 
                detail=f"File size exceeds maximum allowed size of 10MB"
            )
        
        # Create a temporary file
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ""
        temp_file_fd, temp_file_path = tempfile.mkstemp(prefix="upload_", suffix=file_extension)
        
        # Write the file content
        with os.fdopen(temp_file_fd, "wb") as temp_file:
            temp_file.write(content)
        
        # Reset file position for future reads
        await file.seek(0)
        
        # Upload file to OpenAI
        with open(temp_file_path, "rb") as f:
            openai_file = client.files.create(
                file=f,
                purpose="assistants"
            )
        
        # Associate the file with the assistant
        client.beta.assistants.files.create(
            assistant_id=assistant_id,
            file_id=openai_file.id
        )
        
        # Store the file association in the database
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO model_files (model_id, file_id, file_name) VALUES (?, ?, ?)",
                (model_id, openai_file.id, file.filename)
            )
            conn.commit()
        
        return {"file_id": openai_file.id, "filename": file.filename}
    
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")
    
    finally:
        # Clean up the temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as e:
                logger.error(f"Failed to remove temporary file: {str(e)}")

@app.delete("/api/custom_models/{model_id}")
async def delete_custom_model(model_id: str):
    """Delete a custom model and its associated resources"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM custom_models WHERE id = ?", (model_id,))
            model = cursor.fetchone()
            
            if not model:
                raise HTTPException(status_code=404, detail=f"Custom model with id {model_id} not found")
            
            assistant_id = model["assistant_id"]
            vector_store_id = model["vector_store_id"]

            # If it's an assistant model, delete the assistant from OpenAI
            if model["model_type"] == "assistant":
                if assistant_id:
                    try:
                        client.beta.assistants.delete(assistant_id=assistant_id)
                        logger.info(f"Deleted Assistant {assistant_id} from OpenAI.")
                    except Exception as e:
                        # Log error but continue cleanup
                        logger.error(f"Error deleting assistant {assistant_id} from OpenAI: {str(e)}")
                
                # Vector store handling is no longer needed in the new OpenAI API
                if vector_store_id:
                    logger.info(f"Vector store ID {vector_store_id} noted but no deletion necessary - feature removed from OpenAI API")

            # Delete any associated files from OpenAI
            cursor.execute("SELECT * FROM model_files WHERE model_id = ?", (model_id,))
            files = cursor.fetchall()
            
            for file in files:
                try:
                    client.files.delete(file_id=file["file_id"])
                except Exception as e:
                    logger.error(f"Error deleting file from OpenAI: {str(e)}")
            
            # Delete from database
            cursor.execute("DELETE FROM model_files WHERE model_id = ?", (model_id,))
            cursor.execute("DELETE FROM custom_models WHERE id = ?", (model_id,))
            conn.commit()
        
        return {"message": f"Custom model with id {model_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting custom model: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/custom_models/{model_id}/extract_website_content")
async def extract_website_content(model_id: str, data: Dict[str, str]):
    """Extract content from a website URL and add it to a custom model"""
    try:
        url = data.get("url")
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        # Get the model from the database
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM custom_models WHERE id = ?", (model_id,))
            model_data = cursor.fetchone()
            
            if not model_data:
                raise HTTPException(status_code=404, detail="Model not found")
            
            model_type = model_data["model_type"]
            assistant_id = model_data["assistant_id"]
            config = json.loads(model_data["config"])
        
        # Extract content from the website
        logger.info(f"Extracting content from {url}")
        content = extract_content(url)
        
        # For more comprehensive extraction with subpages
        try:
            # Replace with direct call to extract content with subpages
            subpages_content = extract_website_with_subpages(url, max_pages=5)
            if subpages_content and len(subpages_content) > len(content):
                content = subpages_content
        except Exception as e:
            logger.warning(f"Error in comprehensive extraction: {str(e)}. Falling back to basic extraction.")
        
        # Update the model configuration
        config["website_content"] = content
        config["website_url"] = url
        
        # If it's an assistant model, update the assistant with the new content
        if model_type == "assistant" and assistant_id:
            try:
                # Create a temporary file with the website content
                with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as temp:
                    temp.write(content)
                    temp_path = temp.name
                
                # Upload the file to OpenAI
                with open(temp_path, 'rb') as file:
                    file_upload = client.files.create(
                        file=file,
                        purpose="assistants"
                    )
                
                # Attach the file to the assistant
                client.beta.assistants.files.create(
                    assistant_id=assistant_id,
                    file_id=file_upload.id
                )
                
                # Clean up temporary file
                os.unlink(temp_path)
                
                logger.info(f"Uploaded website content to assistant as file: {file_upload.id}")
            except Exception as e:
                logger.error(f"Error updating assistant with website content: {str(e)}")
                logger.error(traceback.format_exc())
        
        # Update the model in the database
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE custom_models SET config = ?, updated_at = ? WHERE id = ?",
                (json.dumps(config), datetime.now().isoformat(), model_id)
            )
            conn.commit()
        
        return {"status": "success", "message": "Website content extracted successfully"}
    except Exception as e:
        logger.error(f"Error extracting website content: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """
    Health check endpoint to verify the API is running
    Returns more detailed information about backend status
    """
    try:
        # Test database connection
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
        
        # Simple OpenAI API check
        api_status = "available" if api_key and not api_key.startswith("sk-dummy") else "unavailable"
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "database": "connected",
            "openai_api": api_status,
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/api/models")
async def get_available_models():
    """Get a list of available GPT models"""
    try:
        # Get models from OpenAI API
        models = client.models.list()
        
        # Filter for GPT models only
        gpt_models = [
            {"id": model.id, "name": model.id}
            for model in models.data
            if any(prefix in model.id for prefix in ["gpt-", "text-"])
        ]
        
        return {"models": gpt_models}
    except Exception as e:
        logger.error(f"Error getting models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Add this code at the end of the file
if __name__ == "__main__":
    import uvicorn
    print("Starting server directly...")
    uvicorn.run(app, host="0.0.0.0", port=8000) 