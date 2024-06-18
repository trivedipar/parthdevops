# Use the official MongoDB image from Docker Hub
FROM mongo:latest

# Set environment variables for MongoDB
# ENV MONGO_INITDB_ROOT_USERNAME=admin
# ENV MONGO_INITDB_ROOT_PASSWORD=password

# Copy the MongoDB configuration file (optional)
# COPY mongod.conf /etc/mongo/mongod.conf

# Remember to map external port to the container's 
# port 27017
EXPOSE 27017

# Command to run MongoDB
CMD ["mongod"]