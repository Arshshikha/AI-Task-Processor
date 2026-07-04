import os
import time
import sys
import signal
from datetime import datetime
from bson.objectid import ObjectId
import redis
import pymongo
from dotenv import load_dotenv

# Load env files
load_dotenv()

# Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/ai_tasks")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
QUEUE_NAME = "task_queue"

print("Starting Python worker...")

# Database Connections
try:
    mongo_client = pymongo.MongoClient(MONGO_URI)
    db = mongo_client.get_default_database()
    tasks_collection = db["tasks"]
    print("Connected to MongoDB successfully.")
except Exception as e:
    print(f"Failed to connect to MongoDB: {e}")
    sys.exit(1)

try:
    redis_client = redis.Redis.from_url(REDIS_URL)
    # Ping Redis to test connection
    redis_client.ping()
    print("Connected to Redis successfully.")
except Exception as e:
    print(f"Failed to connect to Redis: {e}")
    sys.exit(1)

# Graceful shutdown handler
running = True

def signal_handler(signum, frame):
    global running
    print(f"\nReceived signal {signum}. Shutting down worker gracefully...")
    running = False

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def log_message(task_id, message):
    timestamp = datetime.utcnow().isoformat() + "Z"
    formatted_msg = f"[{timestamp}] {message}\n"
    print(f"Task {task_id}: {message}")
    
    # Append log to MongoDB
    tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$push": {"logs": formatted_msg}}  # Wait, in Node.js schema logs is String. Let's append to string using $concat or read-modify-write.
    )

def log_message_to_string(task_id, message):
    timestamp = datetime.utcnow().isoformat() + "Z"
    formatted_msg = f"[{timestamp}] {message}\n"
    print(f"Task {task_id}: {message}")
    
    # Append log to MongoDB String field
    tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        {"$set": {"updatedAt": datetime.utcnow()}, "$concat": {"logs": formatted_msg}} # Wait, MongoDB doesn't support $concat directly in update operator without aggregation pipeline.
    )
    # Using aggregation pipeline update:
    # tasks_collection.update_one({"_id": ObjectId(task_id)}, [{"$set": {"logs": {"$concat": ["$logs", formatted_msg]}}}])
    # Or just use the aggregation pipeline syntax which is very clean and standard!
    # Yes! Let's do that. It is supported in MongoDB 4.2+

def update_task_logs(task_id, new_log):
    timestamp = datetime.utcnow().isoformat() + "Z"
    formatted_msg = f"[{timestamp}] {new_log}\n"
    print(f"Task {task_id}: {new_log}")
    tasks_collection.update_one(
        {"_id": ObjectId(task_id)},
        [{"$set": {"logs": {"$concat": [{"$ifNull": ["$logs", ""]}, formatted_msg]}, "updatedAt": datetime.utcnow()}}]
    )

def process_task(task_id_str):
    try:
        task_id = ObjectId(task_id_str)
    except Exception as e:
        print(f"Invalid task ID received from queue: {task_id_str}. Error: {e}")
        return

    task = tasks_collection.find_one({"_id": task_id})
    if not task:
        print(f"Task {task_id_str} not found in database.")
        return

    update_task_logs(task_id_str, "Worker fetched task from Redis queue. Beginning execution...")

    # Update status to Running
    tasks_collection.update_one(
        {"_id": task_id},
        {"$set": {"status": "running", "updatedAt": datetime.utcnow()}}
    )
    update_task_logs(task_id_str, "Status updated to: Running")

    input_text = task.get("inputText", "")
    operation = task.get("operation", "")

    update_task_logs(task_id_str, f"Operation: {operation}")
    update_task_logs(task_id_str, f"Input Length: {len(input_text)} characters")

    # Simulate processing time for realistic async tracking
    time.sleep(2)

    result = None
    success = True
    error_msg = ""

    try:
        if operation == "uppercase":
            result = input_text.upper()
        elif operation == "lowercase":
            result = input_text.lower()
        elif operation == "reverse":
            result = input_text[::-1]
        elif operation == "word_count":
            # Strip whitespace and split by space
            words = input_text.strip().split()
            result = len(words)
        else:
            success = False
            error_msg = f"Unknown operation: {operation}"
    except Exception as e:
        success = False
        error_msg = f"Execution error: {str(e)}"

    if success:
        update_task_logs(task_id_str, f"Operation execution completed. Result generated.")
        tasks_collection.update_one(
            {"_id": task_id},
            {
                "$set": {
                    "status": "success",
                    "result": result,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        update_task_logs(task_id_str, "Status updated to: Success")
    else:
        update_task_logs(task_id_str, f"Operation failed. Reason: {error_msg}")
        tasks_collection.update_one(
            {"_id": task_id},
            {
                "$set": {
                    "status": "failed",
                    "result": None,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        update_task_logs(task_id_str, "Status updated to: Failed")

# Main Worker Loop
print("Worker is listening for tasks...")
while running:
    try:
        # Blocking pop with 1 second timeout to allow check of 'running' flag
        task_data = redis_client.brpop(QUEUE_NAME, timeout=1)
        if task_data:
            _, task_id_bytes = task_data
            task_id_str = task_id_bytes.decode("utf-8")
            print(f"Received Task ID: {task_id_str}")
            process_task(task_id_str)
    except redis.exceptions.ConnectionError:
        print("Redis connection lost. Retrying in 5 seconds...")
        time.sleep(5)
    except Exception as e:
        print(f"Unexpected error in worker loop: {e}")
        time.sleep(2)

print("Worker shut down successfully.")
