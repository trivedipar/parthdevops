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
    ]
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
        "name": "DATABASE_URL",
        "value": "${database_url}"
      }
    ]
  }
]
