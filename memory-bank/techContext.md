# FlowFin Technical Context

## Technologies Used

### Frontend

1. **Core Framework**

   - Next.js 14
   - React 18
   - TypeScript 5
   - Tailwind CSS

2. **UI Components**

   - Shadcn/ui
   - Radix UI
   - Framer Motion
   - Chart.js

3. **State Management**
   - React Query
   - React Context
   - Zustand

### Backend

1. **Database & API**

   - Supabase
   - PostgreSQL
   - GraphQL
   - REST APIs

2. **Authentication**

   - Supabase Auth
   - JWT
   - OAuth providers

3. **Storage**
   - Supabase Storage
   - Cloud storage
   - Local storage

### AI/ML

1. **OCR**

   - Tesseract.js
   - Image processing
   - Text extraction

2. **Machine Learning**
   - TensorFlow.js
   - Custom models
   - Pre-trained models

### Testing

1. **Unit Testing**

   - Jest
   - React Testing Library
   - MSW

2. **E2E Testing**
   - Cypress
   - Playwright
   - TestCafe

## Development Setup

### Prerequisites

1. **System Requirements**

   - Node.js 18+
   - npm 9+
   - Git
   - VS Code (recommended)

2. **Development Tools**
   - ESLint
   - Prettier
   - TypeScript
   - Git hooks

### Environment Setup

1. **Local Development**

   ```bash
   # Install dependencies
   npm install

   # Set up environment variables
   cp .env.example .env.local

   # Start development server
   npm run dev
   ```

2. **Database Setup**

   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Link project
   supabase link --project-ref <project-ref>

   # Apply migrations
   supabase db push
   ```

### Development Workflow

1. **Code Style**

   - ESLint for linting
   - Prettier for formatting
   - TypeScript for type checking
   - Git hooks for pre-commit checks

2. **Version Control**

   - Feature branches
   - Pull requests
   - Semantic versioning
   - Conventional commits

3. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests
   - Test coverage

## Technical Constraints

### Performance

1. **Frontend**

   - First load < 2s
   - Time to interactive < 3s
   - Lighthouse score > 90
   - Bundle size < 200KB

2. **Backend**
   - API response < 200ms
   - Database queries < 100ms
   - Real-time updates < 50ms
   - 99.9% uptime

### Security

1. **Authentication**

   - JWT expiration
   - Refresh tokens
   - Rate limiting
   - CSRF protection

2. **Data Protection**
   - Encryption at rest
   - Encryption in transit
   - Input validation
   - XSS prevention

### Scalability

1. **Infrastructure**

   - Horizontal scaling
   - Load balancing
   - Caching
   - CDN

2. **Database**
   - Indexing
   - Query optimization
   - Connection pooling
   - Backup strategy

## Dependencies

### Production Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.0.0",
    "tesseract.js": "^4.0.0",
    "@tensorflow/tfjs": "^4.0.0",
    "chart.js": "^4.0.0",
    "react-query": "^4.0.0",
    "zustand": "^4.0.0"
  }
}
```

### Development Dependencies

```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "jest": "^29.0.0",
    "cypress": "^13.0.0",
    "@testing-library/react": "^14.0.0"
  }
}
```
