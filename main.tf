provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "main-vpc"
  }
}

# Public Subnets - ensure each is in a different AZ
resource "aws_subnet" "public" {
  count = 3
  vpc_id = aws_vpc.main.id
  cidr_block = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone = element(["us-east-2a", "us-east-2b", "us-east-2c"], count.index)
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}"
  }
}

# Private Subnets - ensure each is in a different AZ
resource "aws_subnet" "private" {
  count = 3
  vpc_id = aws_vpc.main.id
  cidr_block = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index + 100)
  availability_zone = element(["us-east-2a", "us-east-2b", "us-east-2c"], count.index)

  tags = {
    Name = "private-subnet-${count.index + 1}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main-igw"
  }
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "public-route-table"
  }
}

# Associate Route Table with Public Subnets
resource "aws_route_table_association" "a" {
  count = 3
  subnet_id = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Group
resource "aws_security_group" "ecs_sg" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ecs-security-group"
  }
}

# Load Balancer
resource "aws_lb" "frontend" {
  name               = "frontend-alb-unique-2"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.ecs_sg.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "frontend-lb-unique-2"
  }
}

resource "aws_lb" "backend" {
  name               = "backend-alb-unique-2"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.ecs_sg.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "backend-lb-unique-2"
  }
}

# Target Groups
resource "aws_lb_target_group" "frontend" {
  name       = "frontend-tg-unique-2"
  port       = 80
  protocol   = "HTTP"
  vpc_id     = aws_vpc.main.id
  target_type = "ip"  # Set target type to IP

  health_check {
    path                = "/"
    port                = "80"
    protocol            = "HTTP"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name = "frontend-tg-unique-2"
  }
}

resource "aws_lb_target_group" "backend" {
  name       = "backend-tg-unique-2"
  port       = 5000
  protocol   = "HTTP"
  vpc_id     = aws_vpc.main.id
  target_type = "ip"  # Set target type to IP

  health_check {
    path                = "/health"
    port                = "5000"
    protocol            = "HTTP"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name = "backend-tg-unique-2"
  }
}

# Listeners
resource "aws_lb_listener" "frontend" {
  load_balancer_arn = aws_lb.frontend.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

resource "aws_lb_listener" "backend" {
  load_balancer_arn = aws_lb.backend.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "cluster" {
  name = "my-ecs-cluster"

  tags = {
    Name = "ecs-cluster"
  }
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ecsTaskExecutionRole-unique-2"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "ecs-task-execution-role-unique-2"
  }
}

resource "aws_iam_policy" "ecs_task_execution_policy" {
  name = "ecsTaskExecutionPolicy-unique-2"
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "ecs:StartTelemetrySession",
          "ecs:CreateCluster",
          "ecs:DeregisterContainerInstance",
          "ecs:RegisterContainerInstance",
          "ecs:Submit*",
          "ecs:Poll",
          "ecs:UpdateContainerInstancesState",
          "ecs:SubmitContainerStateChange",
          "ecs:DiscoverPollEndpoint"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:Describe*",
          "ec2:AttachNetworkInterface",
          "ec2:CreateNetworkInterface",
          "ec2:DeleteNetworkInterface",
          "ec2:DetachNetworkInterface",
          "ec2:ModifyNetworkInterfaceAttribute",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = aws_iam_policy.ecs_task_execution_policy.arn
}

resource "aws_cloudwatch_log_group" "frontend_log_group" {
  name = "/ecs/frontend"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "backend_log_group" {
  name = "/ecs/backend"
  retention_in_days = 7
}

# ECR Repository
resource "aws_ecr_repository" "frontend_repo" {
  name = "frontend"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "frontend-repo"
  }
}

resource "aws_ecr_repository" "backend_repo" {
  name = "backend"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "backend-repo"
  }
}

data "template_file" "container_definitions" {
  template = file("${path.module}/container-definitions.json.tpl")

  vars = {
    REACT_APP_API_SERVICE_URL = "http://${aws_lb.frontend.dns_name}"
    AWS_ACCOUNT_ID = var.aws_account_id
    AWS_REGION = var.aws_region
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "task" {
  family = "my-ecs-task"
  container_definitions = data.template_file.container_definitions.rendered
  requires_compatibilities = ["FARGATE"]
  network_mode = "awsvpc"
  cpu = "512"  # Increase task CPU
  memory = "1024"  # Increase task memory
  execution_role_arn = aws_iam_role.ecs_task_execution_role.arn
}

# ECS Service
resource "aws_ecs_service" "service" {
  name = "my-ecs-service"
  cluster = aws_ecs_cluster.cluster.id
  task_definition = aws_ecs_task_definition.task.arn
  desired_count = 2
  launch_type = "FARGATE"  # Ensure Fargate launch type

  network_configuration {
    subnets = aws_subnet.private[*].id
    security_groups = [aws_security_group.ecs_sg.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name = "frontend"
    container_port = 80
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name = "backend"
    container_port = 5000
  }
}

output "REACT_APP_API_SERVICE_URL" {
  value = aws_lb.frontend.dns_name
}
