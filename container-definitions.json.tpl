[
  {
    "name": "frontend",
    "image": "frontend:latest",
    "memory": 512,
    "cpu": 256,
    "essential": true,
    "portMappings": [
      {
        "containerPort": 80,
        "hostPort": 80
      }
    ],
    "environment": [
      {
        "name": "REACT_APP_API_SERVICE_URL",
        "value": "${REACT_APP_API_SERVICE_URL}"
      }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/frontend",
        "awslogs-region": "us-east-2",
        "awslogs-stream-prefix": "ecs"
      }
    }
  },
  {
    "name": "backend",
    "image": "backend:latest",
    "memory": 512,
    "cpu": 256,
    "essential": true,
    "portMappings": [
      {
        "containerPort": 5000,
        "hostPort": 5000
      }
    ],
    "environment": [
      {
        "name": "REDIS_HOST",
        "value": "redis-19369.c11.us-east-1-3.ec2.redns.redis-cloud.com"
      },
      {
        "name": "REDIS_PORT",
        "value": "19369"
      },
      {
        "name": "REDIS_PASSWORD",
        "value": "iwIGMW4rywGlc4sNNA95UQcUBuC6auwW"
      }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/backend",
        "awslogs-region": "us-east-2",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }
]
