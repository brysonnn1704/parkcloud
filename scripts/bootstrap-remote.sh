#!/bin/bash
set -e
exec > >(tee -a /var/log/parkcloud-bootstrap.log) 2>&1
echo "=== Starting ParkCloud Bootstrap via SSM ==="

AWS_REGION="ap-south-1"
DB_HOST=$(aws ssm get-parameter --name "/parkcloud/demo/db/host" --region $AWS_REGION --query "Parameter.Value" --output text)
DB_PORT=$(aws ssm get-parameter --name "/parkcloud/demo/db/port" --region $AWS_REGION --query "Parameter.Value" --output text)
DB_NAME=$(aws ssm get-parameter --name "/parkcloud/demo/db/name" --region $AWS_REGION --query "Parameter.Value" --output text)
DB_USER=$(aws ssm get-parameter --name "/parkcloud/demo/db/user" --region $AWS_REGION --query "Parameter.Value" --output text)
DB_PASSWORD=$(aws ssm get-parameter --name "/parkcloud/demo/db/password" --with-decryption --region $AWS_REGION --query "Parameter.Value" --output text)
JWT_SECRET=$(aws ssm get-parameter --name "/parkcloud/demo/jwt/secret" --with-decryption --region $AWS_REGION --query "Parameter.Value" --output text)
S3_BUCKET=$(aws ssm get-parameter --name "/parkcloud/demo/s3/bucket" --region $AWS_REGION --query "Parameter.Value" --output text)

echo "Resolved DB Host: $DB_HOST"
echo "Resolved S3 Bucket: $S3_BUCKET"

mkdir -p /opt/parkcloud
cat <<EOT > /opt/parkcloud/.env
PORT=5000
NODE_ENV=production
AWS_REGION=$AWS_REGION
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_SSL=true
JWT_SECRET=$JWT_SECRET
S3_BUCKET_NAME=$S3_BUCKET
ENABLE_CLOUDWATCH_METRICS=true
EOT

chmod 600 /opt/parkcloud/.env

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    dnf install -y nodejs unzip postgresql15
fi

# Download backend bundle from S3
echo "Fetching deployment bundle from s3://$S3_BUCKET/deploy/backend.zip..."
aws s3 cp "s3://$S3_BUCKET/deploy/backend.zip" /tmp/backend.zip --region $AWS_REGION
unzip -q -o /tmp/backend.zip -d /opt/parkcloud
cd /opt/parkcloud
npm install --omit=dev

# Run migrations and seed
echo "Running database migrations..."
node src/database/migrate.js
echo "Running database seed..."
node src/database/seed.js

chown -R ec2-user:ec2-user /opt/parkcloud

# Create systemd service
cat <<EOT > /etc/systemd/system/parkcloud.service
[Unit]
Description=ParkCloud Smart Parking REST API Service
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/parkcloud
EnvironmentFile=/opt/parkcloud/.env
ExecStart=/usr/bin/node /opt/parkcloud/src/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOT

systemctl daemon-reload
systemctl enable parkcloud.service
systemctl restart parkcloud.service

echo "=== ParkCloud Service Started Successfully ==="
sleep 2
systemctl status parkcloud.service --no-pager
