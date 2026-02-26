# SIT Connect - Alumni & Student Network

A comprehensive alumni-student networking platform for Siddaganga Institute of Technology.

## 🎯 Product Vision

SIT Connect enables:
- **Student–Senior Mentorship** - Connect with alumni for guidance
- **Internship Guidance** - Access opportunities from alumni network
- **Placement Outreach** - Streamlined alumni engagement for placements
- **Real-time Communication** - Chat with alumni and students

## 🏗 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB |
| Authentication | JWT |
| Real-time Chat | Socket.io |
| Deployment | Vercel (Frontend) + Render (Backend) |

## 📁 Project Structure

```
alumininexus/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── socket/
│   ├── utils/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   └── public/
└── docs/
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Configure your .env file
npm run dev
```

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Student** | View profiles, chat, request mentorship |
| **Alumni** | All student permissions + post opportunities |
| **Placement Head** | All alumni permissions + analytics dashboard |
| **Admin** | Full system access |

## 📦 Core Modules

1. **Authentication** - JWT-based SIT-only access
2. **Profile System** - LinkedIn-style profiles
3. **Alumni Directory** - Search by batch, branch, company
4. **Chat System** - Real-time messaging with Socket.io
5. **Internship Board** - Alumni post opportunities
6. **Mentorship System** - Request 1:1 guidance

## 🗺 Development Roadmap

### Phase 1: Foundation (Week 1)
- [x] Project setup & configuration
- [x] Database models
- [x] Authentication system

### Phase 2: Backend Features (Week 2-3)
- [x] Profile APIs
- [x] Alumni directory & filtering
- [x] Internship/opportunity APIs

### Phase 3: Real-time Chat (Week 4)
- [x] Socket.io integration
- [x] Private messaging
- [x] Message persistence

### Phase 4: Frontend (Week 5-7)
- [x] Authentication pages
- [x] Profile pages
- [x] Alumni directory
- [x] Chat interface
- [x] Dashboard

### Phase 5: Polish (Week 8)
- [ ] Testing
- [ ] Security hardening
- [ ] Deployment

## 🔐 Security Features

- Email verification
- SIT email domain restriction (optional)
- Rate limiting
- Password hashing (bcrypt)
- Role-based middleware
- JWT token expiration

## 📈 Future Enhancements

- AI resume review
- Career recommendation engine
- Skill gap analysis
- Company alumni clustering
- Push notifications
- Mobile app (React Native)

## 📄 License

MIT License - Feel free to use for your institution!

## 👨‍💻 Author

Built with ❤️ for Siddaganga Institute of Technology
