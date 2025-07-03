# 🪣 BucketBoard

**BucketBoard** is a modern, open-source web application for managing AWS S3 buckets through a clean, drag-and-drop UI — no AWS Console or CLI required.

![BucketBoard](./docs/images/BucketBoard.png) 

---

## 🚀 Features

- ✅ Browse files and folders (S3 object prefix emulation)
- ✅ Upload files with drag-and-drop
- ✅ Delete and preview files (images, PDFs)
- ✅ Search and filter by file type
- ✅ Create folders
- ✅ Responsive UI with dark mode
- ✅ Dockerized deployment
- 🔐 (Optional) User authentication (JWT or token)

---

## 🛠 Tech Stack

| Layer        | Tech                                     |
|--------------|------------------------------------------|
| Frontend     | [Next.js](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) |
| Backend      | Node.js (Express), AWS SDK (S3)          |
| Storage      | AWS S3 or compatible (MinIO, Wasabi, etc) |
| Dev Tools    | Docker, Docker Compose, pnpm             |

---

## 📦 Project Structure

```
bucketboard/
├── frontend/          # Next.js app
│   └── ...            # UI components, pages, styles
├── backend/           # Node.js Express API
│   └── ...            # API routes for S3
├── docker/            # Docker-related config (optional)
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yogeshkoli/bucketboard.git
cd bucketboard
```

### 2. Create `.env` file

Create `.env` at the root of the project and add your AWS credentials:

```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
AWS_BUCKET_NAME=your-bucket
```

### 3. Install Dependencies (if not using Docker)

```bash
cd backend && pnpm install
cd ../frontend && pnpm install
```

### 4. Run Locally with Docker

```bash
docker-compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:5000](http://localhost:5000)

---

## 📄 API Endpoints (WIP)

| Method | Endpoint         | Description             |
|--------|------------------|-------------------------|
| GET    | `/api/files`     | List files in bucket    |
| POST   | `/api/upload`    | Upload file to S3       |
| DELETE | `/api/delete`    | Delete file from S3     |

---

## 📈 Roadmap

- [ ] Auth via JWT or Cognito
- [ ] File sharing (pre-signed URLs)
- [ ] Folder rename / move
- [ ] Role-based access control
- [ ] Support multiple buckets
- [ ] Multi-tenant mode

---

## 🤝 Contributing

Pull requests welcome! Please open an issue first for feature requests or bug reports.

---

## 📄 License

[MIT](LICENSE)

---

## 🙏 Acknowledgements

- [shadcn/ui](https://ui.shadcn.com/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/)
- [Recharts](https://recharts.org/)