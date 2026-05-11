$BUCKET = "workout-tracker-849415223859-eu-west-2-an"
$DIST_ID = "E14316R5J7BO7W"

# Sync everything except index.html (these are cache-safe, content-hashed filenames)
aws s3 sync frontend/workout-tracker/build/ s3://$BUCKET --delete --exclude "index.html"

# Upload index.html with no-cache so CloudFront always fetches fresh
aws s3 cp frontend/workout-tracker/build/index.html s3://$BUCKET/index.html `
--cache-control "no-cache, no-store, must-revalidate" `
--content-type "text/html"

# Invalidate only index.html (everything else has new filenames anyway)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/index.html"