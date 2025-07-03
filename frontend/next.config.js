/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          // This allows images from any S3 bucket in your specified region.
          // The hostname is constructed from your bucket name and region.
          // Example: your-bucket-name.s3.us-east-1.amazonaws.com
          hostname: `${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`,
        },
      ],
    },
  };
  
  module.exports = nextConfig;  