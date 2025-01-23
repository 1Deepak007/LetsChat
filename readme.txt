npm init -y
npm install express mongoose jsonwebtoken bcryptjs redis socket.io dotenv



brew install redis
 -> brew services start redis
 Start Redis -> redis-server
 Redis is running -> redis-cli ping          (If you see "PONG", Redis is running fine)


-------------------------
npx kill-port 5000  # Kill any process using port 5000
redis-cli FLUSHALL   # Clear any invalid Redis sessions
node server.js       # Start your Node.js server
-------------------------

express → Web framework
mongoose → MongoDB ORM
dotenv → Loads environment variables
bcryptjs → Password hashing
jsonwebtoken (JWT) → Authentication
cors → Cross-Origin Resource Sharing
socket.io → Real-time messaging
multer, gridfs-stream, multer-gridfs-storage → File uploads (profile pictures & attachments)
redis, ioredis → Caching(session management)        # redis is in-memory data store (redis uses RAM to store data)
            brew install redis       brew services start redis  
            check running port of redis ->   redis-cli INFO | grep tcp_port

                                                           user's id
# check active session -> redis-cli GET "session : 678f5019119504720de3cce4"


normal -> browser <----> server <----> hard drive 
using redis -> browser <--> server <--> redis (if don't have required data)  =>   server<--->hard drive

# Caching User Data (After Successful Login):
    Store User Sessions: After a successful login, store the user's session data (e.g., user ID, authentication token) in Redis.   
    Retrieve Sessions from Cache: On subsequent requests, check if the session exists in Redis. If it does, retrieve the session data from Redis instead of querying the database, significantly reducing response times.
    Invalidation: Invalidate the cached session data when a user logs out or the session expires.

# Benefits of Using Redis for Caching:
    Reduced Database Load: By caching frequently accessed data, you reduce the number of database queries, which offloads the database and improves overall system performance.   
    Faster Response Times: Retrieving data from Redis is much faster than querying a database, resulting in quicker responses to user requests.   
    Improved Scalability: Caching can help your application handle increased traffic more efficiently.   
