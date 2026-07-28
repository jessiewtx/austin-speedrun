#!/usr/bin/env bash
# Deploy the Austin Speedrun static site to an AWS S3 website bucket.
#
# Usage:
#   ./deploy.sh
#   BUCKET=my-bucket REGION=us-east-1 ./deploy.sh
#
# Requires: awscli v2, configured credentials with S3 permissions.
set -euo pipefail

BUCKET="${BUCKET:-austin-speedrun-site}"
REGION="${REGION:-us-east-1}"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Deploying '$SRC_DIR' to s3://$BUCKET ($REGION)"

# 1. Create the bucket if it doesn't exist.
if ! aws s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  echo "==> Creating bucket $BUCKET"
  if [ "$REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION"
  else
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \
      --create-bucket-configuration LocationConstraint="$REGION"
  fi
fi

# 2. Allow public access (static website hosting needs public reads).
echo "==> Configuring public access"
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration \
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

aws s3api put-bucket-policy --bucket "$BUCKET" --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Sid\": \"PublicReadGetObject\",
    \"Effect\": \"Allow\",
    \"Principal\": \"*\",
    \"Action\": \"s3:GetObject\",
    \"Resource\": \"arn:aws:s3:::$BUCKET/*\"
  }]
}"

# 3. Enable static website hosting.
echo "==> Enabling static website hosting"
aws s3 website "s3://$BUCKET/" --index-document index.html --error-document index.html

# 4. Upload. Long cache for assets, short for HTML.
echo "==> Uploading assets"
aws s3 sync "$SRC_DIR/assets" "s3://$BUCKET/assets" \
  --delete --cache-control "public,max-age=31536000,immutable"

echo "==> Uploading HTML"
aws s3 sync "$SRC_DIR" "s3://$BUCKET" \
  --exclude "*" --include "*.html" \
  --cache-control "public,max-age=300" --content-type "text/html; charset=utf-8"

# 5. Done.
if [ "$REGION" = "us-east-1" ]; then
  URL="http://$BUCKET.s3-website-us-east-1.amazonaws.com"
else
  URL="http://$BUCKET.s3-website.$REGION.amazonaws.com"
fi
echo ""
echo "==> Deployed: $URL"
