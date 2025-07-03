# 🪣 BucketBoard

**BucketBoard** is a modern, open-source web application for managing AWS S3 buckets through a clean, drag-and-drop UI — no AWS Console or CLI required.

![BucketBoard](./docs/images/BucketBoard.png) 

---

## 🚀 Features

- ✅ **Browse & Organize:** Create, rename, and move files and folders with an intuitive interface.
- ✅ **Drag & Drop:** Easily upload files or reorganize them by dragging them into folders.
- ✅ **Bulk Actions:** Select and delete multiple files at once to manage your bucket efficiently.
- ✅ **Secure Sharing:** Generate time-limited, secure links (pre-signed URLs) to share files externally.
- ✅ **Powerful Search:** Instantly find what you need with client-side search and filtering by name or type.
- ✅ **File Previews:** Preview common file types like images and PDFs directly in the browser.
- ✅ **Modern UI:** A clean, responsive interface with both light and dark modes.
- ✅ **Dockerized:** Get up and running in minutes with a simple `docker-compose up`.

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

- [ ] User Authentication (JWT or Cognito)
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