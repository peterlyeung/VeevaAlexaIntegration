rm -fr lambda_upload.zip
zip -r lambda_upload.zip .
aws lambda update-function-code --function-name Salesforce_Skill --zip-file fileb://lambda_upload.zip

